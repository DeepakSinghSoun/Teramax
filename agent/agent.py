
import json
import os
import platform
import re
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

SERVER = os.environ.get("TERAMAX_SERVER", "__SERVER_URL__").rstrip("/")
INTERVAL = 10
STATE_FILE = Path.home() / ".teramax_agent.json"
OS = platform.system()

REDACT = [re.compile(p, re.I) for p in (
    r"(--?pass(?:word)?[= ]+)\S+",
    r"((?:password|passwd|pwd|token|secret|api[_-]?key)=)\S+",
    r"(authorization:\s*\w+\s+)\S+",
    r"(\bmysql\b.*\s-p)\S+",
)]


def redact(line: str) -> str:
    for rx in REDACT:
        line = rx.sub(r"\1[redacted]", line)
    return line


# --------------------------------------------------------------- history collection
def history_files():
    home = Path.home()
    files = [home / ".bash_history", home / ".zsh_history"]
    if OS == "Windows":
        appdata = os.environ.get("APPDATA", str(home / "AppData/Roaming"))
        files.append(Path(appdata) / "Microsoft/Windows/PowerShell/PSReadLine/ConsoleHost_history.txt")
    return files


def collect(state):
    """Return (new_lines, new_offsets). Offsets are only saved after a successful upload."""
    offsets, new_offsets, lines = state.get("offsets", {}), {}, []
    for p in history_files():
        try:
            size = p.stat().st_size
        except OSError:
            continue
        key = str(p)
        off = offsets.get(key, size)           # first run: start from "now", don't upload old history
        if size < off:
            off = 0                            # file was truncated
        if size > off:
            with open(p, "rb") as f:
                f.seek(off)
                text = f.read(size - off).decode("utf-8", errors="replace")
            for ln in text.splitlines():
                m = re.match(r"^: \d+:\d+;(.*)$", ln)    # zsh extended-history format
                ln = (m.group(1) if m else ln).strip()
                if ln and not ln.startswith("#"):
                    lines.append(redact(ln))
        new_offsets[key] = size
    return lines, new_offsets


# --------------------------------------------------------------- USB detection
def usb_storage():
    """Return names of connected USB storage devices (best effort per OS)."""
    names = []
    try:
        if OS == "Linux":
            for dev in Path("/sys/block").glob("*"):
                real = os.path.realpath(dev)
                if "/usb" in real:
                    model = (dev / "device/model")
                    names.append(model.read_text().strip() if model.exists() else dev.name)
        elif OS == "Windows":
            out = subprocess.run(
                ["powershell", "-NoProfile", "-Command",
                 "Get-CimInstance Win32_DiskDrive | Where-Object {$_.InterfaceType -eq 'USB'} "
                 "| ForEach-Object {$_.Model}"],
                capture_output=True, text=True, timeout=15).stdout
            names = [x.strip() for x in out.splitlines() if x.strip()]
        elif OS == "Darwin":
            out = subprocess.run(["diskutil", "list", "external", "physical"],
                                 capture_output=True, text=True, timeout=10).stdout
            names = [x.split()[0] for x in out.splitlines() if x.startswith("/dev/")]
    except Exception:
        pass
    return names


# --------------------------------------------------------------- server communication
def post(path, body, key=None):
    req = urllib.request.Request(SERVER + path, json.dumps(body).encode(),
                                 {"Content-Type": "application/json", **({"X-Agent-Key": key} if key else {})})
    try:
        with urllib.request.urlopen(req, timeout=8) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, {}
    except Exception:
        return 0, {}


def load_state():
    try:
        return json.loads(STATE_FILE.read_text())
    except Exception:
        return {}


def save_state(state):
    try:
        STATE_FILE.write_text(json.dumps(state))
    except OSError:
        pass


def main():
    if "__SERVER_URL__" in SERVER:
        sys.exit("Set TERAMAX_SERVER=http://<master-ip>:8000 (or download the agent from the portal).")
    print(f"Teramax agent -> {SERVER}\n"
          "Reports: new shell-history lines + USB storage presence. Close this window = internet stops.\n")
    state, prev_usb, host = load_state(), set(), socket.gethostname()
    while True:
        if not state.get("key"):
            code, res = post("/api/agent/enroll", {"hostname": host, "os": f"{OS} {platform.release()}"})
            if code == 200:
                state["key"] = res["agent_key"]
                save_state(state)
                print("enrolled with master")
            else:
                print("cannot reach master, retrying...")
                time.sleep(INTERVAL)
                continue
        lines, offs = collect(state)
        usb = usb_storage()
        chunks = [lines[i:i + 500] for i in range(0, len(lines), 500)] or [[]]
        ok = True
        for i, chunk in enumerate(chunks):
            body = {"commands": chunk, "usb": bool(usb), "usb_events": len(set(usb) - prev_usb) if i == 0 else 0,
                    "usb_devices": usb, "hostname": host, "os": f"{OS} {platform.release()}"}
            code, res = post("/api/agent/report", body, state["key"])
            if code == 401:
                state.pop("key", None)
                ok = False
                break
            if code != 200:
                ok = False
                print("master unreachable")
                break
        if ok:
            state.setdefault("offsets", {}).update(offs)
            save_state(state)
            prev_usb = set(usb)
            print(time.strftime("%H:%M:%S"), "| signed in:", res.get("logged_in"),
                  "| internet:", res.get("internet"), "|", res.get("message"), "|", res.get("category"))
        time.sleep(INTERVAL)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nagent stopped")
