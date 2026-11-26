"""Internet gating on the master PC (Linux gateway).

`scripts/gateway_setup.sh` installs the iptables rules once. At run time this module only
keeps the ipset `teramax_allowed` (ip,mac pairs) in sync with who is currently allowed.
Binding to MAC as well as IP stops a user from just copying someone else's IP address.

Without Linux + root + ipset the module runs in SIMULATION mode: it logs what it would do,
so the dashboard, portal and model all still work for development on any OS.
"""
import logging
import platform
import re
import shutil
import subprocess

from .config import ENFORCE, SIM

log = logging.getLogger("teramax.firewall")
SET = "teramax_allowed"


def get_mac(ip: str):
    """Look up a LAN client's MAC from the ARP table."""
    if SIM and ip:
        try:
            return "02:00:" + ":".join(f"{int(o):02x}" for o in ip.split("."))
        except ValueError:
            return None
    try:
        if platform.system() == "Linux":
            for line in open("/proc/net/arp").read().splitlines()[1:]:
                p = line.split()
                if p[0] == ip and p[3] != "00:00:00:00:00:00":
                    return p[3].lower()
        else:
            out = subprocess.run(["arp", "-a", ip], capture_output=True, text=True, timeout=3).stdout
            m = re.search(r"([0-9a-f]{2}[:-]){5}[0-9a-f]{2}", out, re.I)
            if m:
                return m.group(0).lower().replace("-", ":")
    except Exception:
        pass
    return None


class Firewall:
    def __init__(self):
        live_capable = (platform.system() == "Linux" and shutil.which("ipset") is not None
                        and hasattr(__import__("os"), "geteuid") and __import__("os").geteuid() == 0)
        self.live = (ENFORCE == "on") or (ENFORCE == "auto" and live_capable)
        self.current: set = set()
        if self.live:
            self._run(["ipset", "create", SET, "hash:ip,mac", "-exist"])
            self._run(["ipset", "flush", SET])
        log.warning("Firewall mode: %s", "LIVE (ipset)" if self.live else "SIMULATION (no changes made)")

    @property
    def mode(self) -> str:
        return "live" if self.live else "simulation"

    def _run(self, cmd):
        if not self.live:
            log.info("[sim] %s", " ".join(cmd))
            return
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode:
            log.error("%s -> %s", " ".join(cmd), r.stderr.strip())

    def sync(self, allowed: set):
        """allowed = {(ip, mac), ...}. Adds/removes only the difference."""
        allowed = {(ip, mac) for ip, mac in allowed if ip and mac}
        for ip, mac in allowed - self.current:
            self._run(["ipset", "add", SET, f"{ip},{mac}", "-exist"])
        for ip, mac in self.current - allowed:
            self._run(["ipset", "del", SET, f"{ip},{mac}", "-exist"])
        self.current = allowed
