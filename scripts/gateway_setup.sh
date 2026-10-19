#!/usr/bin/env bash
# Teramax gateway setup (Linux master PC). Run once as root, after the hotspot is up.
#   sudo ./scripts/gateway_setup.sh <hotspot_if> <internet_if> [portal_port]
# e.g. sudo ./scripts/gateway_setup.sh wlan0 eth0 8000
#
# Effect:
#   * clients NOT in ipset "teramax_allowed" (ip+mac): HTTP is redirected to the portal,
#     everything else to the internet is rejected/dropped
#   * clients in the set are NAT-forwarded to the internet
# The Teramax backend adds/removes clients from the set (login + agent running + not blocked).
set -euo pipefail
LAN=${1:?hotspot interface, e.g. wlan0}
WAN=${2:?internet interface, e.g. eth0}
PORT=${3:-8000}

ipset create teramax_allowed hash:ip,mac -exist
sysctl -w net.ipv4.ip_forward=1 >/dev/null

# --- NAT for allowed clients
iptables -t nat -C POSTROUTING -o "$WAN" -j MASQUERADE 2>/dev/null || iptables -t nat -A POSTROUTING -o "$WAN" -j MASQUERADE

# --- captive redirect (HTTP only; browsers/OS captive checks use plain HTTP)
iptables -t nat -N TERAMAX_PRE 2>/dev/null || iptables -t nat -F TERAMAX_PRE
iptables -t nat -A TERAMAX_PRE -m set --match-set teramax_allowed src,src -j RETURN
iptables -t nat -A TERAMAX_PRE -p tcp --dport 80 -j REDIRECT --to-ports "$PORT"
iptables -t nat -C PREROUTING -i "$LAN" -j TERAMAX_PRE 2>/dev/null || iptables -t nat -I PREROUTING 1 -i "$LAN" -j TERAMAX_PRE

# --- forwarding policy
iptables -N TERAMAX_FWD 2>/dev/null || iptables -F TERAMAX_FWD
iptables -A TERAMAX_FWD -m set --match-set teramax_allowed src,src -j ACCEPT
iptables -A TERAMAX_FWD -p tcp -j REJECT --reject-with tcp-reset   # fast failure -> browser shows portal
iptables -A TERAMAX_FWD -j DROP
iptables -C FORWARD -i "$LAN" -j TERAMAX_FWD 2>/dev/null || iptables -I FORWARD 1 -i "$LAN" -j TERAMAX_FWD
iptables -C FORWARD -i "$WAN" -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT 2>/dev/null || \
  iptables -I FORWARD 1 -i "$WAN" -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# --- let hotspot clients reach the portal/API (and DHCP/DNS from the hotspot's dnsmasq)
iptables -C INPUT -i "$LAN" -p tcp --dport "$PORT" -j ACCEPT 2>/dev/null || iptables -I INPUT 1 -i "$LAN" -p tcp --dport "$PORT" -j ACCEPT
iptables -C INPUT -i "$LAN" -p udp -m multiport --dports 53,67 -j ACCEPT 2>/dev/null || iptables -I INPUT 1 -i "$LAN" -p udp -m multiport --dports 53,67 -j ACCEPT

echo "Teramax gateway rules installed (LAN=$LAN WAN=$WAN portal=:$PORT)."
