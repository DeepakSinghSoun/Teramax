"""Turn raw agent data (terminal history, USB state) + user profile into model features.

The server is the authority: agents send RAW commands, and all flagging happens here,
so a tampered agent cannot simply claim "nothing suspicious".
"""
import re
import time
from datetime import datetime, timedelta, timezone

from .config import WINDOW_HOURS


def _rx(*pats):
    return [re.compile(p, re.I) for p in pats]


SUDO = _rx(r"(?:^|[;&|(]\s*)(?:sudo|doas|pkexec|runas)\b", r"(?:^|[;&|(]\s*)su(?:\s|$)")

DANGER = _rx(
    r"\brm\s+(?:-\w*\s+)*-\w*[rf]\w*\s+(?:-\w+\s+)*(?:/|~|\*|--no-preserve-root)",
    r"\bmkfs(?:\.\w+)?\b",
    r"\bdd\s+if=\S+\s+of=/dev/",
    r":\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:",
    r"\bchmod\s+(?:-R\s+)?[0-7]?777\b",
    r"\b(?:nc|ncat|netcat)\b.*\s-e\b",
    r"/dev/tcp/",
    r"\b(?:curl|wget)\b[^|]*\|\s*(?:sudo\s+)?(?:ba|z)?sh\b",
    r"base64\s+(?:-d|--decode)[^|]*\|\s*(?:ba)?sh",
    r"\bshred\b",
    r"\biptables\s+-F\b",
    r"\bnet\s+user\b.*/add",
    r"mimikatz|meterpreter|msfvenom|msfconsole",
    r"powershell.*\s-e(?:nc|ncodedcommand)\b",
    r"\b(?:iex|invoke-expression)\b.*(?:downloadstring|http)",
    r"\breg\s+add\b.*\\run\b",
    r"\bcat\s+/etc/shadow\b",
)

NETTOOL = _rx(
    r"\b(?:nmap|masscan|zmap|tcpdump|tshark|hydra|medusa|sqlmap|nikto|ettercap|arpspoof|bettercap|"
    r"hashcat|aircrack-ng|responder|netdiscover|john)\b",
)

TAMPER = _rx(
    r"\bhistory\s+-c\b", r"\bunset\s+HISTFILE\b", r"\bHISTSIZE=0\b", r"\bclear-history\b",
    r"remove-item.*consolehost_history", r"(?:kill|pkill|taskkill)\b.*teramax",
    r"systemctl\s+(?:stop|disable)\s+teramax", r"\bshopt\s+-u\s+histappend\b",
)


def analyze(cmd: str) -> list[str]:
    """Return the flags that apply to one command line."""
    flags = []
    if any(p.search(cmd) for p in SUDO):
        flags.append("sudo")
    if any(p.search(cmd) for p in DANGER):
        flags.append("danger")
    if any(p.search(cmd) for p in NETTOOL):
        flags.append("nettool")
    if any(p.search(cmd) for p in TAMPER):
        flags.append("tamper")
    return flags


def build_features(c, dev, user, now=None) -> dict:
    """Aggregate the device's last WINDOW_HOURS of activity plus the user's history."""
    now = now or time.time()
    start = max(now - WINDOW_HOURS * 3600, dev["cleared_at"] or 0)
    r = c.execute(
        """SELECT COALESCE(SUM(cmd_count),0) cmd, COALESCE(SUM(sudo_count),0) sudo,
                  COALESCE(SUM(danger_count),0) dng, COALESCE(SUM(net_count),0) net,
                  COALESCE(SUM(tamper_count),0) tmp, COALESCE(SUM(usb_events),0) ue
           FROM reports WHERE device_id=? AND ts>=?""", (dev["id"], start)).fetchone()

    tenure, incident = 0.0, 0.0
    if user:
        # Self-declared "member since" only counts once an admin has verified the person.
        base = user["member_since"] if (user["verified"] and user["member_since"]) else user["created_at"]
        tenure = max(0.0, (now - base) / 86400)
        today = datetime.fromtimestamp(now, timezone.utc).strftime("%Y-%m-%d")
        since = (datetime.fromtimestamp(now, timezone.utc) - timedelta(days=90)).strftime("%Y-%m-%d")
        n = c.execute("SELECT COUNT(*) FROM incidents WHERE user_id=? AND day<? AND day>=? AND level>=3",
                      (user["id"], today, since)).fetchone()[0]
        incident = n / 90.0

    return {
        "sudo_count": int(r["sudo"]), "usb_connected": int(bool(dev["usb"])),
        "usb_events": int(r["ue"]), "danger_count": int(r["dng"]), "net_count": int(r["net"]),
        "tamper_count": int(r["tmp"]), "cmd_count": int(r["cmd"]),
        "tenure_days": round(tenure, 1), "incident_rate": round(incident, 4),
    }
