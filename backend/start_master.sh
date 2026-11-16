#!/usr/bin/env bash
# Teramax master launcher: network -> forwarding -> firewall rules -> DNS/DHCP -> server
#
#   sudo ./start_master.sh          start everything (Ctrl+C stops it all)
#   sudo ./start_master.sh stop     stop everything and block all clients
#
# Put this file inside the Teramax folder (next to "backend" and "scripts").
# Override names if yours differ, e.g.:  sudo LAN_IF=eth1 WAN_IF=eth0 ./start_master.sh
set -u

# ---------------- settings ----------------
LAN_IF="${LAN_IF:-eth1}"                  # Internal Network adapter (clients connect here)
WAN_IF="${WAN_IF:-eth0}"                  # NAT adapter (internet)
LAN_CIDR="${LAN_CIDR:-192.168.50.1/24}"   # master's address on the client network
LAN_IP="${LAN_CIDR%/*}"
DHCP_START="${DHCP_START:-192.168.50.10}"
DHCP_END="${DHCP_END:-192.168.50.100}"
PORT="${PORT:-8000}"
ADMIN_PASSWORD="${TERAMAX_ADMIN_PASSWORD:-admin12345}"

# ---------------- helpers ----------------
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -d "$HERE/backend" ]; then ROOT="$HERE"; else ROOT="$(dirname "$HERE")"; fi

say()  { printf '\033[1;36m[teramax]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[warning]\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m[error]\033[0m %s\n' "$*"; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "Run with sudo:  sudo $0"

stop_all() {
  fuser -k "${PORT}/tcp" >/dev/null 2>&1          # old Teramax server
  pkill -9 -x dnsmasq   >/dev/null 2>&1           # old DNS/DHCP
  ipset flush teramax_allowed >/dev/null 2>&1     # nobody stays allowed
}

if [ "${1:-}" = "stop" ]; then
  stop_all
  say "Stopped: server and dnsmasq killed, allowed list emptied."
  exit 0
fi

[ -d "$ROOT/backend" ]                 || fail "Cannot find the backend folder (looked in $ROOT)."
[ -f "$ROOT/scripts/gateway_setup.sh" ] || fail "Missing $ROOT/scripts/gateway_setup.sh"
command -v ipset    >/dev/null || fail "ipset not installed:    sudo apt install -y ipset"
command -v dnsmasq  >/dev/null || fail "dnsmasq not installed:  sudo apt install -y dnsmasq"

# ---------------- 1. network ----------------
say "1/6 Network: internet side ($WAN_IF) and client side ($LAN_IF = $LAN_IP)"
command -v nmcli >/dev/null && nmcli device connect "$WAN_IF" >/dev/null 2>&1
if ! ip -4 addr show "$LAN_IF" | grep -q "inet $LAN_IP/"; then
  if command -v nmcli >/dev/null; then
    if nmcli -t -f NAME con show | grep -qx teramax; then
      nmcli con up teramax >/dev/null 2>&1
    else
      nmcli con add type ethernet ifname "$LAN_IF" con-name teramax \
        ipv4.method manual ipv4.addresses "$LAN_CIDR" >/dev/null 2>&1
      nmcli con up teramax >/dev/null 2>&1
    fi
  else
    ip addr add "$LAN_CIDR" dev "$LAN_IF" 2>/dev/null
    ip link set "$LAN_IF" up
  fi
fi
ip -4 addr show "$LAN_IF" | grep -q "inet $LAN_IP/" || fail "$LAN_IF has no $LAN_IP. Check 'ip a' and the interface names."
if ping -c 1 -W 3 8.8.8.8 >/dev/null 2>&1; then
  say "     master has internet: OK"
else
  warn "master cannot reach the internet - clients will have none either. Fix $WAN_IF first."
fi

# ---------------- 2. clean start ----------------
say "2/6 Stopping old server / dnsmasq"
systemctl stop dnsmasq >/dev/null 2>&1
stop_all
sleep 1

# ---------------- 3. forwarding ----------------
say "3/6 Turning on IP forwarding"
sysctl -w net.ipv4.ip_forward=1 >/dev/null
echo 'net.ipv4.ip_forward=1' > /etc/sysctl.d/99-teramax.conf

# ---------------- 4. firewall rules ----------------
say "4/6 Installing firewall rules (iptables + ipset)"
bash "$ROOT/scripts/gateway_setup.sh" "$LAN_IF" "$WAN_IF" "$PORT" >/dev/null || fail "gateway_setup.sh failed"

# ---------------- 5. DNS + DHCP ----------------
say "5/6 Starting dnsmasq (DHCP + DNS) on $LAN_IF"
dnsmasq --conf-file=/dev/null --interface="$LAN_IF" --bind-interfaces --no-resolv --server=8.8.8.8 \
  --dhcp-range="$DHCP_START,$DHCP_END,12h" \
  --dhcp-option=3,"$LAN_IP" --dhcp-option=6,"$LAN_IP" \
  --log-queries --log-facility=/tmp/teramax-dnsmasq.log --pid-file=/run/teramax-dnsmasq.pid
sleep 1
pgrep -x dnsmasq >/dev/null || fail "dnsmasq did not start. Log: $(tail -3 /tmp/teramax-dnsmasq.log 2>/dev/null)"

# ---------------- 6. Teramax server ----------------
PY="$ROOT/backend/venv/bin/python"
[ -x "$PY" ] || PY="$(command -v python3)"
cd "$ROOT/backend" || fail "cannot enter backend folder"

cat <<EOF

  Teramax master is starting.
    Dashboard (this PC):  http://localhost:$PORT/admin      (admin / $ADMIN_PASSWORD)
    Client portal:        http://$LAN_IP:$PORT/portal
    Client agent:         TERAMAX_SERVER=http://$LAN_IP:$PORT python3 agent.py
    DNS log:              tail -f /tmp/teramax-dnsmasq.log
  Press Ctrl+C to stop everything (this also blocks all clients).

EOF

trap 'exit 130' INT TERM
trap 'echo; say "Stopping..."; stop_all' EXIT
say "6/6 Starting Teramax server"
TERAMAX_ADMIN_PASSWORD="$ADMIN_PASSWORD" "$PY" -m uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
