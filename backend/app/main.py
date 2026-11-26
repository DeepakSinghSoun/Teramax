"""Teramax master server: captive portal + agent API + admin dashboard API."""
import asyncio
import io
import json
import logging
import re
import secrets
import time
import zipfile
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from . import model
from .config import (ADMIN_PASSWORD, ADMIN_PERSON_ID, AGENT_DIR, AGENT_TIMEOUT, FRONTEND_DIST,
                     PORT, SESSION_HOURS, SIM)
from .db import conn, get_settings, init_db
from .features import analyze, build_features
from .firewall import Firewall, get_mac
from .security import RateLimiter, hash_password, new_token, sha256, verify_password

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(message)s")
log = logging.getLogger("teramax")
fw = Firewall()
login_limiter = RateLimiter(limit=5, window=300)
FLAG_LEVEL = {"sudo": 2, "nettool": 3, "danger": 4, "tamper": 4}


# ------------------------------------------------------------------ helpers
def client_ip(request: Request) -> str:
    if SIM and request.headers.get("x-teramax-sim-ip"):
        return request.headers["x-teramax-sim-ip"]
    return request.client.host if request.client else "0.0.0.0"


def server_ip(request: Request) -> str:
    return (request.scope.get("server") or ("127.0.0.1", PORT))[0]


def row(r):
    return dict(r) if r else None


def active_session(c, device_id, now):
    return c.execute("SELECT * FROM sessions WHERE device_id=? AND role='user' AND expires>? "
                     "ORDER BY created DESC LIMIT 1", (device_id, now)).fetchone()


def decide(c, dev, st, now):
    """Single source of truth: may this device reach the internet right now?"""
    if dev["blocked"]:
        return False, "blocked by administrator"
    if not dev["last_seen"] or now - dev["last_seen"] > AGENT_TIMEOUT:
        return False, "agent not running"
    sess = active_session(c, dev["id"], now)
    if st["require_login"] and not sess:
        return False, "not signed in"
    if sess:
        u = c.execute("SELECT blocked FROM users WHERE id=?", (sess["user_id"],)).fetchone()
        if u and u["blocked"]:
            return False, "user account blocked"
    if st["auto_block_untrusted"] and dev["category"] == "untrusted":
        return False, "auto-blocked: untrusted behaviour"
    if st["auto_block_suspicious"] and dev["category"] in ("suspicious", "untrusted"):
        return False, "auto-blocked: suspicious behaviour"
    return True, "ok"


def enforce_once():
    now = time.time()
    with conn() as c:
        c.execute("DELETE FROM sessions WHERE expires<?", (now,))
        st, allowed = get_settings(c), set()
        for dev in c.execute("SELECT * FROM devices").fetchall():
            ok, why = decide(c, dev, st, now)
            c.execute("UPDATE devices SET access=?, access_reason=? WHERE id=?", (int(ok), why, dev["id"]))
            if ok:
                allowed.add((dev["ip"], dev["mac"]))
    fw.sync(allowed)


async def enforcement_loop():
    while True:
        try:
            await asyncio.to_thread(enforce_once)
        except Exception:
            log.exception("enforcement failed")
        await asyncio.sleep(3)


def reclassify(c, dev_id, now=None):
    now = now or time.time()
    dev = c.execute("SELECT * FROM devices WHERE id=?", (dev_id,)).fetchone()
    sess = active_session(c, dev_id, now)
    uid = sess["user_id"] if sess else dev["user_id"]
    user = c.execute("SELECT * FROM users WHERE id=?", (uid,)).fetchone() if uid else None
    feats = build_features(c, dev, user, now)
    res = model.classify(feats)
    c.execute("""UPDATE devices SET category=?, level=?, risk=?, reasons=?, probs=?, features=?,
                 classified_at=? WHERE id=?""",
              (res["category"], res["level"], res["risk"], json.dumps(res["reasons"]),
               json.dumps(res["probs"]), json.dumps(feats), now, dev_id))
    if res["level"] > dev["level"] and res["level"] >= 2:
        who = f"{user['name']} ({user['person_id']})" if user else "no user signed in"
        c.execute("INSERT INTO alerts(ts,device_id,user_id,level,message) VALUES(?,?,?,?,?)",
                  (now, dev_id, uid, res["level"],
                   f"{dev['hostname'] or dev['ip']} [{who}] -> {res['category'].upper()}: "
                   f"{res['reasons'][0] if res['reasons'] else 'model decision'}"))
    if res["level"] >= 3 and uid:
        day = datetime.fromtimestamp(now, timezone.utc).strftime("%Y-%m-%d")
        c.execute("""INSERT INTO incidents VALUES(?,?,?) ON CONFLICT(user_id,day)
                     DO UPDATE SET level=MAX(level,excluded.level)""", (uid, day, res["level"]))


def bind_sessions(c, dev_id, ip, now):
    """Attach browser sign-ins (known by IP) to the agent's device record."""
    c.execute("UPDATE sessions SET device_id=? WHERE ip=? AND role='user' AND expires>? "
              "AND (device_id IS NULL OR device_id!=?)", (dev_id, ip, now, dev_id))
    s = active_session(c, dev_id, now)
    if s:
        c.execute("UPDATE devices SET user_id=? WHERE id=?", (s["user_id"], dev_id))


# ------------------------------------------------------------------ models
class EnrollIn(BaseModel):
    hostname: str = Field("", max_length=100)
    os: str = Field("", max_length=100)


class ReportIn(BaseModel):
    commands: list[str] = []
    usb: bool = False
    usb_events: int = 0
    usb_devices: list[str] = []
    hostname: str = Field("", max_length=100)
    os: str = Field("", max_length=100)


class SignupIn(BaseModel):
    pc_number: str = Field(..., min_length=1, max_length=32)
    name: str = Field(..., min_length=2, max_length=80)
    person_id: str = Field(..., pattern=r"^[A-Za-z0-9_.-]{3,32}$")
    department: str = Field("", max_length=80)
    member_since: str = ""            # YYYY-MM-DD, self-declared (ignored until admin verifies)
    password: str = Field(..., min_length=8, max_length=128)


class LoginIn(BaseModel):
    person_id: str
    password: str


class FlagIn(BaseModel):
    value: bool


# ------------------------------------------------------------------ app
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    with conn() as c:
        if not c.execute("SELECT 1 FROM users WHERE role='admin'").fetchone():
            pw = ADMIN_PASSWORD or secrets.token_urlsafe(9)
            c.execute("INSERT INTO users(person_id,name,department,password_hash,role,verified,created_at) "
                      "VALUES(?,?,?,?,?,?,?)",
                      (ADMIN_PERSON_ID, "Administrator", "IT", hash_password(pw), "admin", 1, time.time()))
            log.warning("=== Admin account created: id=%s password=%s (change TERAMAX_ADMIN_PASSWORD) ===",
                        ADMIN_PERSON_ID, pw)
    await asyncio.to_thread(model._load)
    task = asyncio.create_task(enforcement_loop())
    yield
    task.cancel()


app = FastAPI(title="Teramax", lifespan=lifespan)


@app.middleware("http")
async def captive_redirect(request: Request, call_next):
    """Any other website a blocked client opens (neverssl.com, captive checks...) -> portal."""
    host = (request.headers.get("host") or "").split(":")[0]
    if (request.url.path.startswith(("/api", "/assets", "/portal", "/admin", "/agent"))
            or host in {server_ip(request), "localhost", "127.0.0.1", ""}):
        return await call_next(request)
    return RedirectResponse(f"http://{server_ip(request)}:{PORT}/portal", status_code=302)


# ------------------------------------------------------------------ agent API
@app.post("/api/agent/enroll")
def agent_enroll(body: EnrollIn, request: Request):
    ip, now, key = client_ip(request), time.time(), secrets.token_urlsafe(24)
    mac = get_mac(ip)
    with conn() as c:
        ex = c.execute("SELECT id FROM devices WHERE mac=?", (mac,)).fetchone() if mac else None
        if ex:
            did = ex["id"]
            c.execute("UPDATE devices SET key_hash=?, ip=?, hostname=?, os=?, last_seen=? WHERE id=?",
                      (sha256(key), ip, body.hostname, body.os, now, did))
        else:
            did = c.execute("INSERT INTO devices(key_hash,mac,ip,hostname,os,first_seen,last_seen) "
                            "VALUES(?,?,?,?,?,?,?)",
                            (sha256(key), mac, ip, body.hostname, body.os, now, now)).lastrowid
            reclassify(c, did, now)
        bind_sessions(c, did, ip, now)
    log.info("agent enrolled: %s (%s) %s", body.hostname, ip, mac)
    return {"agent_key": key, "device_id": did}


@app.post("/api/agent/report")
def agent_report(body: ReportIn, request: Request, x_agent_key: str = Header("")):
    ip, now = client_ip(request), time.time()
    with conn() as c:
        dev = c.execute("SELECT * FROM devices WHERE key_hash=?", (sha256(x_agent_key),)).fetchone()
        if not dev:
            raise HTTPException(401, "unknown agent key - re-enroll")
        mac = get_mac(ip) or dev["mac"]
        c.execute("""UPDATE devices SET ip=?, mac=?, hostname=COALESCE(NULLIF(?,''),hostname),
                     os=COALESCE(NULLIF(?,''),os), last_seen=?, usb=?, usb_names=? WHERE id=?""",
                  (ip, mac, body.hostname, body.os, now, int(body.usb),
                   json.dumps(body.usb_devices[:10]), dev["id"]))
        bind_sessions(c, dev["id"], ip, now)
        sess = active_session(c, dev["id"], now)
        uid = sess["user_id"] if sess else None

        counts = {"sudo": 0, "danger": 0, "nettool": 0, "tamper": 0}
        live_alerts = 0
        cmds = [x.strip()[:1000] for x in body.commands[:500] if x.strip()]
        for cmd in cmds:
            flags = analyze(cmd)
            for f in flags:
                counts[f] += 1
            c.execute("INSERT INTO commands(device_id,user_id,ts,command,flags) VALUES(?,?,?,?,?)",
                      (dev["id"], uid, now, cmd, json.dumps(flags)))
            if flags and live_alerts < 50:      # one live alert per flagged command (capped per report)
                live_alerts += 1
                lvl = max(FLAG_LEVEL[f] for f in flags)
                c.execute("INSERT INTO alerts(ts,device_id,user_id,level,message,kind,command,flags) "
                          "VALUES(?,?,?,?,?,'command',?,?)",
                          (now, dev["id"], uid, lvl, "flagged command", cmd, json.dumps(flags)))
        usb_changed = bool(dev["usb"]) != body.usb
        last = c.execute("SELECT MAX(ts) t FROM reports WHERE device_id=?", (dev["id"],)).fetchone()["t"] or 0
        interesting = bool(cmds) or body.usb_events > 0 or usb_changed
        if interesting or now - last > 300:      # keep DB small: heartbeats are stored every 5 min
            c.execute("INSERT INTO reports(device_id,user_id,ts,usb,usb_events,cmd_count,sudo_count,"
                      "danger_count,net_count,tamper_count) VALUES(?,?,?,?,?,?,?,?,?,?)",
                      (dev["id"], uid, now, int(body.usb), body.usb_events, len(cmds), counts["sudo"],
                       counts["danger"], counts["nettool"], counts["tamper"]))
        if interesting or now - dev["classified_at"] > 60:
            reclassify(c, dev["id"], now)
        d = c.execute("SELECT category, access, access_reason FROM devices WHERE id=?", (dev["id"],)).fetchone()
        st = get_settings(c)
        ok, why = decide(c, c.execute("SELECT * FROM devices WHERE id=?", (dev["id"],)).fetchone(), st, now)
    return {"logged_in": bool(sess), "internet": ok, "message": why, "category": d["category"]}


@app.get("/agent/download")
def agent_download(request: Request):
    """Zip with the agent, pre-configured with this master's address."""
    url = f"http://{server_ip(request)}:{PORT}"
    code = (AGENT_DIR / "agent.py").read_text().replace("__SERVER_URL__", url)
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("teramax_agent/agent.py", code)
        z.writestr("teramax_agent/run_windows.bat", "@echo off\r\npython agent.py\r\npause\r\n")
        z.writestr("teramax_agent/run_linux_mac.sh",
                   "#!/bin/sh\n# makes bash write history after every command, then starts the agent\n"
                   "grep -q 'history -a' ~/.bashrc 2>/dev/null || "
                   "echo 'PROMPT_COMMAND=\"history -a; $PROMPT_COMMAND\"' >> ~/.bashrc\n"
                   "python3 agent.py\n")
    return Response(buf.getvalue(), media_type="application/zip",
                    headers={"Content-Disposition": "attachment; filename=teramax_agent.zip"})


# ------------------------------------------------------------------ portal API
@app.get("/api/portal/status")
def portal_status(request: Request):
    ip, now = client_ip(request), time.time()
    with conn() as c:
        dev = c.execute("SELECT * FROM devices WHERE ip=? ORDER BY last_seen DESC LIMIT 1", (ip,)).fetchone()
        sess = None
        if dev:
            sess = active_session(c, dev["id"], now)
        if not sess:
            sess = c.execute("SELECT * FROM sessions WHERE ip=? AND role='user' AND expires>? "
                             "ORDER BY created DESC LIMIT 1", (ip, now)).fetchone()
        user = c.execute("SELECT name, person_id FROM users WHERE id=?", (sess["user_id"],)).fetchone() if sess else None
        alive = bool(dev and dev["last_seen"] and now - dev["last_seen"] <= AGENT_TIMEOUT)
        ok, why = decide(c, dev, get_settings(c), now) if dev else (False, "agent not installed")
    return {"ip": ip, "agent_installed": bool(dev), "agent_running": alive, "signed_in": bool(sess),
            "user": row(user), "internet": ok, "reason": why,
            "category": dev["category"] if dev else None}


def _start_session(c, user, ip, now):
    dev = c.execute("SELECT id FROM devices WHERE ip=? ORDER BY last_seen DESC LIMIT 1", (ip,)).fetchone()
    c.execute("DELETE FROM sessions WHERE ip=? AND role='user'", (ip,))
    c.execute("INSERT INTO sessions VALUES(?,?,?,?,?,?,?)",
              (new_token(), user["id"], "user", ip, dev["id"] if dev else None, now, now + SESSION_HOURS * 3600))
    if dev:
        c.execute("UPDATE devices SET user_id=? WHERE id=?", (user["id"], dev["id"]))


@app.post("/api/portal/signup")
def portal_signup(body: SignupIn, request: Request):
    ip, now = client_ip(request), time.time()
    ms = None
    if body.member_since:
        try:
            ms = datetime.strptime(body.member_since, "%Y-%m-%d").replace(tzinfo=timezone.utc).timestamp()
        except ValueError:
            raise HTTPException(422, "member_since must be YYYY-MM-DD")
    with conn() as c:
        if c.execute("SELECT 1 FROM users WHERE person_id=?", (body.person_id,)).fetchone():
            raise HTTPException(409, "Person ID already registered - please log in instead")
        uid = c.execute("INSERT INTO users(person_id,name,department,pc_number,password_hash,member_since,"
                        "created_at,signup_ip) VALUES(?,?,?,?,?,?,?,?)",
                        (body.person_id, body.name.strip(), body.department.strip(), body.pc_number.strip(),
                         hash_password(body.password), ms, now, ip)).lastrowid
        user = c.execute("SELECT * FROM users WHERE id=?", (uid,)).fetchone()
        _start_session(c, user, ip, now)
    enforce_once()
    return {"ok": True}


@app.post("/api/portal/login")
def portal_login(body: LoginIn, request: Request):
    ip, now = client_ip(request), time.time()
    if login_limiter.blocked(ip):
        raise HTTPException(429, "Too many failed attempts. Try again in a few minutes.")
    with conn() as c:
        user = c.execute("SELECT * FROM users WHERE person_id=? AND role='user'", (body.person_id,)).fetchone()
        if not user or not verify_password(body.password, user["password_hash"]):
            login_limiter.fail(ip)
            raise HTTPException(401, "Wrong Person ID or password")
        if user["blocked"]:
            raise HTTPException(403, "This account has been blocked by the administrator")
        login_limiter.reset(ip)
        _start_session(c, user, ip, now)
    enforce_once()
    return {"ok": True}


@app.post("/api/portal/logout")
def portal_logout(request: Request):
    with conn() as c:
        c.execute("DELETE FROM sessions WHERE ip=? AND role='user'", (client_ip(request),))
    enforce_once()
    return {"ok": True}


# ------------------------------------------------------------------ admin API
def admin_required(authorization: str = Header("")):
    token = authorization.removeprefix("Bearer ").strip()
    with conn() as c:
        s = c.execute("SELECT * FROM sessions WHERE token=? AND role='admin' AND expires>?",
                      (token, time.time())).fetchone()
    if not s:
        raise HTTPException(401, "admin login required")
    return s


@app.post("/api/admin/login")
def admin_login(body: LoginIn, request: Request):
    ip = client_ip(request)
    if login_limiter.blocked("admin:" + ip):
        raise HTTPException(429, "Too many failed attempts")
    with conn() as c:
        u = c.execute("SELECT * FROM users WHERE person_id=? AND role='admin'", (body.person_id,)).fetchone()
        if not u or not verify_password(body.password, u["password_hash"]):
            login_limiter.fail("admin:" + ip)
            raise HTTPException(401, "Wrong admin ID or password")
        token, now = new_token(), time.time()
        c.execute("INSERT INTO sessions VALUES(?,?,?,?,?,?,?)", (token, u["id"], "admin", ip, None, now, now + 8 * 3600))
    return {"token": token, "name": u["name"]}


def _device_out(d, user):
    out = row(d)
    out.pop("key_hash", None)
    for k in ("reasons", "probs", "features", "usb_names"):
        out[k] = json.loads(out[k] or "null")
    out["online"] = bool(d["last_seen"] and time.time() - d["last_seen"] <= AGENT_TIMEOUT)
    out["user"] = {k: user[k] for k in ("id", "name", "person_id", "department", "pc_number", "verified")} if user else None
    return out


@app.get("/api/admin/overview")
def admin_overview(_=Depends(admin_required)):
    now = time.time()
    with conn() as c:
        devs = c.execute("SELECT * FROM devices").fetchall()
        online = [d for d in devs if d["last_seen"] and now - d["last_seen"] <= AGENT_TIMEOUT]
        cats = {k: 0 for k in model.LABELS}
        for d in online:
            cats[d["category"]] += 1
        risk = round(sum(d["risk"] for d in online) / len(online), 1) if online else 0.0
        tl = c.execute("""SELECT strftime('%H:00', ts, 'unixepoch', 'localtime') h,
                          SUM(sudo_count) sudo, SUM(danger_count) danger, SUM(usb_events) usb, SUM(cmd_count) cmds
                          FROM reports WHERE ts>? GROUP BY strftime('%Y-%m-%d %H', ts, 'unixepoch', 'localtime')
                          ORDER BY MIN(ts)""", (now - 24 * 3600,)).fetchall()
        return {
            "devices_total": len(devs), "devices_online": len(online),
            "signed_in": sum(1 for d in online if active_session(c, d["id"], now)),
            "internet_allowed": sum(1 for d in online if d["access"]),
            "blocked": sum(1 for d in devs if not d["access"] and d["last_seen"]),
            "users": c.execute("SELECT COUNT(*) FROM users WHERE role='user'").fetchone()[0],
            "usb_now": sum(1 for d in online if d["usb"]),
            "categories": cats, "risk_index": risk, "settings": get_settings(c),
            "firewall": fw.mode, "timeline": [dict(r) for r in tl]}


@app.get("/api/admin/devices")
def admin_devices(_=Depends(admin_required)):
    with conn() as c:
        out = []
        for d in c.execute("SELECT * FROM devices ORDER BY level DESC, last_seen DESC").fetchall():
            u = c.execute("SELECT * FROM users WHERE id=?", (d["user_id"],)).fetchone() if d["user_id"] else None
            out.append(_device_out(d, u))
    return out


@app.get("/api/admin/devices/{did}")
def admin_device(did: int, _=Depends(admin_required)):
    with conn() as c:
        d = c.execute("SELECT * FROM devices WHERE id=?", (did,)).fetchone()
        if not d:
            raise HTTPException(404, "no such device")
        u = c.execute("SELECT * FROM users WHERE id=?", (d["user_id"],)).fetchone() if d["user_id"] else None
        cmds = c.execute("SELECT ts, command, flags FROM commands WHERE device_id=? ORDER BY id DESC LIMIT 100", (did,)).fetchall()
    out = _device_out(d, u)
    out["commands"] = [{"ts": r["ts"], "command": r["command"], "flags": json.loads(r["flags"])} for r in cmds]
    return out


@app.post("/api/admin/devices/{did}/block")
def admin_block_device(did: int, body: FlagIn, _=Depends(admin_required)):
    with conn() as c:
        c.execute("UPDATE devices SET blocked=? WHERE id=?", (int(body.value), did))
    enforce_once()
    return {"ok": True}


@app.post("/api/admin/devices/{did}/clear")
def admin_clear_device(did: int, _=Depends(admin_required)):
    """Forget recent behaviour (e.g. after investigating a false positive)."""
    now = time.time()
    with conn() as c:
        c.execute("UPDATE devices SET cleared_at=?, level=1 WHERE id=?", (now, did))
        reclassify(c, did, now)
    enforce_once()
    return {"ok": True}


@app.get("/api/admin/users")
def admin_users(_=Depends(admin_required)):
    with conn() as c:
        rows = c.execute("SELECT id,person_id,name,department,pc_number,member_since,verified,blocked,"
                         "created_at,signup_ip FROM users WHERE role='user' ORDER BY created_at DESC").fetchall()
    return [dict(r) for r in rows]


@app.post("/api/admin/users/{uid}/verify")
def admin_verify(uid: int, body: FlagIn, _=Depends(admin_required)):
    with conn() as c:
        c.execute("UPDATE users SET verified=? WHERE id=?", (int(body.value), uid))
        for d in c.execute("SELECT id FROM devices WHERE user_id=?", (uid,)).fetchall():
            reclassify(c, d["id"])
    enforce_once()
    return {"ok": True}


@app.post("/api/admin/users/{uid}/block")
def admin_block_user(uid: int, body: FlagIn, _=Depends(admin_required)):
    with conn() as c:
        c.execute("UPDATE users SET blocked=? WHERE id=?", (int(body.value), uid))
    enforce_once()
    return {"ok": True}


@app.get("/api/admin/alerts")
def admin_alerts(_=Depends(admin_required)):
    with conn() as c:
        rows = c.execute("""SELECT a.*, d.hostname, d.ip, u.name AS uname, u.person_id
                            FROM alerts a LEFT JOIN devices d ON d.id=a.device_id
                            LEFT JOIN users u ON u.id=a.user_id ORDER BY a.id DESC LIMIT 100""").fetchall()
    out = []
    for r in rows:
        x = dict(r)
        x["flags"] = json.loads(x["flags"]) if x.get("flags") else []
        out.append(x)
    return out


class SettingIn(BaseModel):
    key: str
    value: bool


@app.post("/api/admin/settings")
def admin_setting(body: SettingIn, _=Depends(admin_required)):
    with conn() as c:
        if body.key not in get_settings(c):
            raise HTTPException(404, "unknown setting")
        c.execute("INSERT OR REPLACE INTO settings VALUES(?,?)", (body.key, str(int(body.value))))
    enforce_once()
    return {"ok": True}


@app.get("/api/admin/model")
def admin_model(_=Depends(admin_required)):
    return model.model_info()


@app.post("/api/admin/model/retrain")
def admin_retrain(_=Depends(admin_required)):
    return model.train()


# ------------------------------------------------------------------ frontend
if (FRONTEND_DIST / "assets").exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")


@app.get("/")
def root():
    return RedirectResponse("/portal")


@app.get("/portal")
@app.get("/admin")
def spa():
    index = FRONTEND_DIST / "index.html"
    if index.exists():
        return FileResponse(index)
    return JSONResponse({"detail": "Frontend not built. Run: cd frontend && npm install && npm run build"}, 503)
