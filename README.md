# Teramax

ML-assisted network access control for a Wi-Fi hotspot LAN. The **master PC** runs the hotspot,
a captive portal, and an ML risk model. Every client PC must **install the agent** and **sign in**
before it gets internet; the master watches what each PC does and rates it
`trusted · normal · risky · suspicious · untrusted`.

```
 Client PC                                   Master PC (Linux)
 ┌──────────────┐  heartbeat + new shell    ┌────────────────────────────────────────────┐
 │ agent.py     │  history + USB state ───▶ │ FastAPI  :8000                             │
 │ (stdlib)     │                           │  /portal  sign-in / sign-up / agent download│
 ├──────────────┤  browser: any website     │  /api/agent/*   enroll + reports           │
 │ browser      │ ── redirected ──────────▶ │  /admin   React dashboard                  │
 └──────────────┘                           │ SQLite: users, devices, journal, alerts    │
                                            │ model.py: rules + RandomForest             │
        internet ◀── only if allowed ────── │ firewall.py → ipset(ip,mac) + iptables     │
                                            └────────────────────────────────────────────┘
 Internet access = agent heartbeat alive  AND  signed in  AND  not blocked (manual / auto by model)
```

## 1 · Try it in 2 minutes (any OS, no real PCs needed)

```bash
cd backend
pip install -r requirements.txt
TERAMAX_SIM=1 TERAMAX_ADMIN_PASSWORD=admin12345 uvicorn app.main:app --port 8000   # terminal 1

python scripts/simulate.py                                                        # terminal 2: 7 fake PCs
```
Open **http://localhost:8000/admin** (admin / admin12345) and **/portal**.
Firewall runs in *simulation* (decisions are made and shown, nothing is blocked on your machine).

Frontend dev with hot reload: `cd frontend && npm install && npm run dev` (http://localhost:5173/admin).
Production: `npm run build` — FastAPI serves `frontend/dist` itself (already built in this zip).

> ⚠ `TERAMAX_SIM=1` trusts a request header to fake client IPs. **Never set it on a real deployment.**

## 2 · Real deployment (Linux master PC)

```bash
# a) hotspot (NetworkManager): clients get 10.42.0.x + DNS/DHCP from the master
nmcli device wifi hotspot ifname wlan0 ssid Teramax password 'choose-a-strong-one'

# b) gate rules (once; re-run after reboot)         <hotspot-if> <internet-if> <port>
sudo ./scripts/gateway_setup.sh wlan0 eth0 8000

# c) start the master (root is needed to edit the ipset)
cd backend && sudo TERAMAX_ADMIN_PASSWORD='your-admin-password' \
     python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
A client that joins the hotspot and opens any `http://` page lands on `/portal`:
1. **Step 1** – "Install the agent from here" (downloads a zip pre-pointed at the master).
2. **Step 2** – *Log in* (existing) or *Sign up* (PC number, name, Person ID, department, member-since, new password; IP is auto-filled).
3. **Step 3** – internet unlocks within ~3 s. If the agent stops (>30 s) or the PC is blocked, it locks again.

Agent: unzip → `run_windows.bat` or `sh run_linux_mac.sh` (needs Python 3.8+).

## 3 · What the model decides

Features (last 24 h per PC + the signed-in person's profile): `sudo_count, usb_connected, usb_events,
danger_count, net_count, tamper_count, cmd_count, tenure_days, incident_rate`.
*Known user* = verified, ≥ 1 year tenure, clean record.

| Situation | Category |
|---|---|
| sudo + USB, **known** clean user | **suspicious** |
| sudo + USB, **new / unknown** user (< 1 year) | **untrusted** |
| sudo, no USB, **new / unknown** user | **suspicious** |
| dangerous commands (`rm -rf /`, reverse shell, `curl … \| sh`), scanners (`nmap`, `hydra`), hiding history / killing the agent | scored → risky … untrusted |
| known user, nothing unusual | trusted / normal |

`model.py` = your rules written as `policy_floor()` + `score_label()`; a RandomForest learns them from a generated dataset and
gives probabilities + a 0-100 risk score; final level = `max(model, policy_floor)` so your three rules are never violated.
`untrusted` PCs are auto-blocked (toggle in the dashboard); `suspicious` can be too.
"Verified" is set by the admin — a self-declared *member since* date is ignored until then, so nobody can fake tenure.

## 4 · Honest limitations (read before relying on it)

* **The model currently learns *your rules*** from synthetic data (≈99% accuracy just means "it copied the rules"). It becomes
  genuinely *learned* when you replace `generate_dataset()` with real, admin-labelled incidents (Clear-flags / Block buttons are good label sources).
* **Enforcement is untested on real hardware** here (iptables/ipset can't run in the build sandbox). Test `gateway_setup.sh` on a spare machine first.
* HTTPS sites can't be redirected to a portal (browsers would show certificate errors) — blocked clients get a reset on 443 and the portal on HTTP; OS "captive portal" popups normally appear.
* Shell history: bash writes on exit (the Linux/mac launcher adds `history -a`), PowerShell logs per command, plain `cmd.exe` keeps none.
* A user with admin rights on their PC can stop or fake an agent. Stopping it cuts internet (heartbeat), but a faked agent can hide commands — treat the agent as a *signal*, not proof.
* Traffic is plain HTTP on the LAN; put it behind TLS (e.g. Caddy) before using real passwords you care about.
* **Tell your users.** The portal discloses what the agent sends; monitoring command history is only appropriate with their knowledge/consent and a policy (labs, company laptops, etc.).

## 5 · Layout

```
backend/app/   main.py (API) · model.py (ML) · features.py (command analysis) · firewall.py · db.py · security.py
agent/agent.py            endpoint agent (stdlib only)
frontend/src              React: Portal.jsx, Admin.jsx, Neu.jsx (neumorphic kit), styles.css
scripts/                  gateway_setup.sh · simulate.py
legacy/ + docs/           your original files (untouched) and notes
```
Your old pieces live on: `master.py`/`agents.py` socket protocol → HTTP `/api/agent/report`; `createDataset.py` → `generate_dataset()`;
`model.py` → `backend/app/model.py`; `main.py` ARP scan idea → `get_mac()` (the module-level port scan in the old `main.py` ran on import, so it was left out).



frontend start :
npm run dev


backend start:
1 - python -m venv .venv
2 - .\.venv\Scripts\Activate.ps1
<!--3 - $env:TERAMAX_SIM = "1"
    $env:TERAMAX_ADMIN_PASSWORD = "admin12345" -->
    uvicorn app.main:app --reload
4 - python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

deactivate