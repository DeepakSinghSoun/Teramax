import React, { useEffect, useRef, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import { api, getToken, setToken } from '../api.js'
import { Badge, Dial, Field, LEVELS, ShieldIcon, Toggle, ago, catColor, usePoll } from './Neu.jsx'

const clock = (ts) => new Date(ts * 1000).toLocaleTimeString([], { 
  hour: '2-digit', 
  minute: '2-digit', 
  second: '2-digit' 
})

function Navbar() {
  return (
    <nav className="nav-links" aria-label="Main navigation">
      <a href="/portal" className="btn nav-link">
        Home
      </a>

      <a href="/admin" className="btn primary nav-link nav-admin">
        Admin
      </a>
    </nav>
  )
}

/* ------------------------------ Login ------------------------------ */
function Login({ onDone }) {
  const [id, setId] = useState('admin')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')

  async function go(e) {
    e.preventDefault()
    setErr('')

    try {
      const r = await api('/api/admin/login', {
        method: 'POST',
        body: {
          person_id: id,
          password: pw
        }
      })

      setToken(r.token)
      onDone()
    } catch (x) {
      setErr(x.message)
    }
  }

  return (
    <main
      className="portal"
      style={{ maxWidth: 460, paddingTop: 40 }}
    >
      <header className="topbar portal-topbar">
        <div className="brand">
          <span className="logo">
            <ShieldIcon />
          </span>
          <span>TERAMAX</span>
        </div>

        <Navbar />
      </header>

      <form className="card stack" onSubmit={go}>
        <h1>Master console</h1>

        <Field
          id="aid"
          label="Admin ID"
          value={id}
          onChange={(e) => setId(e.target.value)}
          autoComplete="username"
        />

        <Field
          id="apw"
          label="Password"
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoComplete="current-password"
          autoFocus
        />

        {err && (
          <p className="error" role="alert">
            {err}
          </p>
        )}

        <button type="submit" className="btn primary">
          Sign in
        </button>
      </form>
    </main>
  )
}

/* ------------------------------------------------------------------ device drawer */
function Drawer({ id, onClose, refresh }) {
  const [d, setD] = useState(null)
  const closeRef = useRef(null)
  const load = () => api(`/api/admin/devices/${id}`, { admin: true })
    .then(setD)
    .catch(() => {})
  usePoll(load, 4000, [id])
  useEffect(() => {
    closeRef.current?.focus()
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k); 
    return () => window.removeEventListener('keydown', k)
  }, [])
  if (!d) {
    return null
  }
  const act = async (path, body) => {
    await api(`/api/admin/devices/${id}/${path}`,
      { 
        method: 'POST', 
        admin: true, body 
      }); 
      load(); 
      refresh() 
    }
  const f = d.features || {}
  return (
    <div className="overlay" onClick={onClose}>
      <aside className="drawer stack" role="dialog" aria-modal="true" aria-label={`Device ${d.hostname || d.ip}`} onClick={(e) => e.stopPropagation()}>
        <div className="row between">
          <div>
            <h1>
              {d.hostname || 'Unnamed PC'}
            </h1>
            <p className="muted mono">{d.ip} · {d.mac || 'MAC unknown'} · {d.os}</p>
          </div>

          <button ref={closeRef} className="btn sm" onClick={onClose}>Close</button>
        </div>

        <div className="row wrap">
          <Badge level={d.category} />
          <span className="chip">risk {Math.round(d.risk)}/100</span>
          <span className="chip">{d.access ? 'internet: allowed' : 'internet: blocked'}</span>
          <span className="chip">USB: {d.usb ? 'connected' : 'none'}</span>
        </div>

        <div className="well stack">
          <b>Person</b>
          {d.user ? <p>{d.user.name} · <span className="mono">{d.user.person_id}</span> · {d.user.department || 'no dept'} · PC {d.user.pc_number}
            <br /><span className="muted">{d.user.verified ? 'Verified history' : 'Unverified (counts from sign-up date)'}</span>
            </p> : <p className="muted">Nobody signed in.</p>}
        </div>

        <div className="well stack">
          <b>Why this category</b>
          <ul className="clean">{(d.reasons?.length ? d.reasons : ['Nothing unusual detected']).map((r) => <li key={r}>{r}</li>)}</ul>
          {!d.access && <p className="error">Blocked: {d.access_reason}</p>}
        </div>

        <div className="stack">
          <b>Model confidence</b>
          {LEVELS.map((l) => (
            <div key={l} className="row"><span style={{ width: 90 }}>{l}</span>
              <div className="bar" style={{ flex: 1 }}><div style={{ width: `${(d.probs?.[l] || 0) * 100}%`, background: catColor(l) }} /></div>
              <span className="mono" style={{ width: 42, textAlign: 'right' }}>{Math.round((d.probs?.[l] || 0) * 100)}%</span></div>
          ))}
          <p className="muted mono">last 24h: sudo {f.sudo_count} · danger {f.danger_count} · net-tools {f.net_count} · tamper {f.tamper_count} · usb events {f.usb_events} · tenure {Math.round(f.tenure_days || 0)}d</p>
        </div>

        <div className="stack">
          <Toggle label="Block this PC" hint="Manual override – overrides everything else" checked={!!d.blocked} onChange={(v) => act('block', { value: v })} />
          <button className="btn sm" onClick={() => act('clear')}>Clear recent flags (false positive)</button>
        </div>

        <div className="stack">
          <b>Command journal</b>
          <div className="stack scroll tall" style={{ gap: 8 }}>
            {d.commands.length === 0 && <p className="muted">No commands received yet.</p>}
            {d.commands.map((c, i) => (
              <div key={i} className={'cmd mono' + (c.flags.length ? ' flag' : '')}>
                <span>{c.command}</span><small>{c.flags.join(' · ') || ago(c.ts)}</small></div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}

/* ------------------------------------------------------------------ dashboard */
function Dashboard({ onLogout }) {
  const [ov, setOv] = useState(null)
  const [devs, setDevs] = useState([])
  const [alerts, setAlerts] = useState([])
  const [users, setUsers] = useState([])
  const [mdl, setMdl] = useState(null)
  const [open, setOpen] = useState(null)
  const [busy, setBusy] = useState(false)
  const [onlyDanger, setOnlyDanger] = useState(false)

  const guard = (p) => p.catch((e) => { 
    if (e.status === 401) onLogout() 
    })

  const refresh = () => {
    guard(api('/api/admin/overview', { admin: true }).then(setOv))
    guard(api('/api/admin/devices', { admin: true }).then(setDevs))
  }

  usePoll(refresh, 4000)
  usePoll(() => guard(api('/api/admin/alerts', 
    { admin: true })
    .then(setAlerts)), 2000)  // live feed
  
  usePoll(() => guard(api('/api/admin/users', 
    { admin: true })
    .then(setUsers)), 8000)
  
  useEffect(() => { 
    guard(api('/api/admin/model', 
      { admin: true })
      .then(setMdl)) 
  }, [])

  const setting = async (key, value) => { 
    await api('/api/admin/settings', 
      { method: 'POST', 
        admin: true, 
        body: { key, value } 
      }); 
      
      refresh() 
  }

  const userFlag = async (u, what, value) => { 
    await api(`/api/admin/users/${u.id}/${what}`, 
      { method: 'POST', 
        admin: true, 
        body: { value } 
      }); 
      
      api('/api/admin/users', 
        { admin: true })
        .then(setUsers); 
        
        refresh() 
  }

  const retrain = async () => { 
    setBusy(true); 
    try { 
      setMdl(await api('/api/admin/model/retrain', 
        { method: 'POST', 
          admin: true 
        })) 
    } 
    finally { 
      setBusy(false) 
    } 
  }

  if (!ov){ 
    return <div className="shell"><p className="muted" role="status">Loading dashboard…</p></div>
  }

  const shown = alerts.filter((x) => !onlyDanger || x.flags.some((f) => f !== 'sudo') || (x.kind !== 'command' && x.level >= 3))
  const catData = LEVELS.map((l) => ({ name: l, count: ov.categories[l] }))

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="logo"><ShieldIcon /></span>TERAMAX 
          <span className="muted" style={{ fontWeight: 500, fontSize: 14, letterSpacing: 0 }}>master console</span>
        </div>

        <div className="row wrap">
          <span className="chip" 
            title={ov.firewall === 'live' ? 'Real iptables/ipset enforcement' : 'Simulation: decisions are made but no firewall changes'}>
              Firewall: {ov.firewall}
          </span>
          <button className="btn sm" onClick={onLogout}>Log out</button>
        </div>
      </header>


      <div className="grid g3">
        <section className="card" aria-label="Devices online">
          <h2>Devices online</h2>
          <div className="hero-num" style={{ marginTop: 14 }}>{ov.devices_online}</div>
          <p className="muted">of {ov.devices_total} known PCs · {ov.users} registered users</p>

          <div className="hero-sub">
            <div className="well">
              <b>{ov.internet_allowed}</b>
              <span>internet allowed</span>
            </div>

            <div className="well">
              <b>{ov.blocked}</b>
              <span>blocked</span>
            </div>

            <div className="well">
              <b>{ov.usb_now}</b>
              <span>USB connected</span>
            </div>
          </div>
        </section>

        <section className="card" aria-label="Network risk index">
          <h2>Network risk index</h2>
          <Dial value={ov.risk_index} 
            label="Network risk index" 
            caption={ov.risk_index < 25 ? 'calm' : ov.risk_index < 55 ? 'elevated' : 'critical'}
          />
        </section>

        <section className="card stack" aria-label="Automation controls">
          <h2>Automation</h2>
          <Toggle label="Auto-block untrusted" 
            hint="Cut internet for PCs the model rates untrusted" 
            checked={!!ov.settings.auto_block_untrusted} 
            onChange={(v) => setting('auto_block_untrusted', v)} 
          />

          <Toggle label="Auto-block suspicious" 
            hint="Stricter: also block suspicious PCs" 
            checked={!!ov.settings.auto_block_suspicious} 
            onChange={(v) => setting('auto_block_suspicious', v)} 
          />

          <Toggle label="Require sign-in" 
            hint="Portal login needed for internet" 
            checked={!!ov.settings.require_login} 
            onChange={(v) => setting('require_login', v)} 
          />
        </section>
      </div>


      <div className="grid g2" style={{ marginTop: 28 }}>
        <section className="card" aria-label="Activity last 24 hours">
          <h2>Activity · last 24h</h2>
          <div style={{ height: 250, marginTop: 14 }}>
            {ov.timeline.length === 0 ? <p className="muted">No activity reported yet.</p> : (
              <ResponsiveContainer>
                <AreaChart data={ov.timeline} margin={{ left: -18, right: 6, top: 6 }}>
                  <CartesianGrid strokeDasharray="3 5" stroke="#bec3c9" />
                  <XAxis dataKey="h" stroke="#4a545c" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="#4a545c" fontSize={12} />
                  
                  <Tooltip contentStyle={{ 
                    background: '#e0e5ec', 
                    border: 0,
                    borderRadius: 12, 
                    boxShadow: '5px 5px 10px #bec3c9, -5px -5px 10px #fff' }} 
                  />

                  <Legend />
                  <Area type="monotone" 
                    dataKey="sudo" 
                    name="sudo" 
                    stroke="#d2691e" 
                    fill="#d2691e" 
                    fillOpacity={0.18} 
                  />

                  <Area type="monotone" 
                    dataKey="danger" 
                    name="dangerous cmds" 
                    stroke="#c0392b" 
                    fill="#c0392b" 
                    fillOpacity={0.22} 
                  />

                  <Area type="monotone" 
                    dataKey="usb" 
                    name="USB inserts" 
                    stroke="#4d6bfe" 
                    fill="#4d6bfe" 
                    fillOpacity={0.18} 
                  />
                </AreaChart>
              </ResponsiveContainer>)}
          </div>
        </section>

        <section className="card" aria-label="Devices by category">
          <h2>Online PCs by category</h2>
          <div style={{ height: 250, marginTop: 14 }}>
            <ResponsiveContainer>
              <BarChart data={catData} layout="vertical" margin={{ left: 18, right: 14 }}>
                <XAxis type="number" allowDecimals={false} stroke="#4a545c" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="#4a545c" fontSize={12} width={78} />
                <Tooltip cursor={false} 
                  contentStyle={{ 
                    background: '#e0e5ec', 
                    border: 0, borderRadius: 12, 
                    boxShadow: '5px 5px 10px #bec3c9, -5px -5px 10px #fff' }} 
                />
                <Bar dataKey="count" radius={8}>{
                  catData.map((d) => <Cell key={d.name} fill={catColor(d.name)} />)}
                </Bar>

              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>


      <section className="card" style={{ marginTop: 28 }} aria-label="Devices">
        <h2>Devices 
          <span className="muted" style={{ textTransform: 'none', letterSpacing: 0 }}>· click a row for the command journal</span>
        </h2>

        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>PC</th>
                <th>Person</th>
                <th>IP</th>
                <th>Category</th>
                <th>Risk</th>
                <th>USB</th>
                <th>Internet</th>
                <th>Seen</th>
              </tr>
            </thead>

            <tbody>
              {devs.length === 0 && 
                <tr className="static">
                  <td colSpan="8" className="muted">No PCs have enrolled yet.</td>
                </tr>
              }

              {devs.map((d) => (
                <tr key={d.id} tabIndex={0} onClick={() => setOpen(d.id)} onKeyDown={
                    (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setOpen(d.id))
                  }>

                  <td>
                    <b>{d.hostname || '—'}</b><br />
                    <span className="muted">{d.user?.pc_number ? `PC ${d.user.pc_number}` : ''}</span>
                  </td>

                  <td>{d.user ? <>{d.user.name}<br />
                    <span className="muted mono">{d.user.person_id}</span></> : <span className="muted">no one</span>}
                  </td>
                  <td className="mono">{d.ip}</td>
                  <td><Badge level={d.category} /></td>
                  <td><b>{Math.round(d.risk)}</b></td>
                  <td>{d.usb ? 'Yes' : 'No'}</td>
                  <td>
                    <span className="chip" title={d.access_reason}>{d.access ? 'allowed' : 'blocked'}</span>
                  </td>
                  <td className="muted">{d.online ? 'online' : ago(d.last_seen)}</td>
                </tr>))
              }

            </tbody>
          </table>
        </div>
      </section>


      <div className="grid g2e" style={{ marginTop: 28 }}>
        <section className="card stack" aria-label="Live alerts">
          <div className="row between wrap">
            <h2>Live alerts 
              <span className="chip" style={{ marginLeft: 8 }}>● live</span>
            </h2>
            <button className="btn sm" aria-pressed={onlyDanger} onClick={() => setOnlyDanger(!onlyDanger)}>Dangerous only</button>
          </div>

          <div className="scroll tall" role="log" aria-live="polite">
            {shown.length === 0 && <p className="muted">All quiet.</p>}
            {shown.map((a) => (
              <div key={a.id} className={'alert-item' + (Date.now() / 1000 - a.ts < 10 ? ' fresh' : '')} style={{ marginBottom: 10 }}>
                <div className="row between wrap">
                  <b>{a.hostname || a.ip || 'PC'}{a.uname ? ` · ${a.uname}` : ''}</b>
                  <span className="mono muted">{clock(a.ts)}</span>
                </div>

                {a.kind === 'command' ? (
                  <>
                    <div className="mono cmdline">{a.command}</div>
                    <div className="row wrap" style={{ gap: 6, marginTop: 6 }}>
                      {a.flags.map((f) => <span key={f} className={'chip f-' + f}>{f}</span>)}
                    </div>
                  </>
                  ) : <small>{a.message}</small>
                }
              </div>))
            }            
          </div>
        </section>

        <section className="card stack" aria-label="Users">
          <h2>People</h2>
          <div className="scroll">
            {users.length === 0 && 
              <p className="muted">No users registered.</p>
            }

            {users.map((u) => (
              <div key={u.id} className="alert-item" style={{ marginBottom: 10 }}>
                <div className="row between wrap"><b>{u.name} 
                  <span className="muted mono">{u.person_id}</span></b>
                  <span className="muted">{u.department}</span>
                </div>

                <Toggle label="Verified long-term member" 
                  hint={u.member_since ? `Declared since ${new Date(u.member_since * 1000)
                  .getFullYear()}` : 'No tenure declared'} 
                  checked={!!u.verified} onChange={(v) => userFlag(u, 'verify', v)} 
                />

                <Toggle label="Block account" checked={!!u.blocked} onChange={(v) => userFlag(u, 'block', v)} />
              </div>))}
          </div>
        </section>
      </div>



      {mdl && (
        <section className="card" style={{ marginTop: 28 }} aria-label="Model">
          <div className="row between wrap">
            <h2>Risk model · RandomForest</h2>
            <button className="btn sm" onClick={retrain} disabled={busy}>{busy ? 'Training…' : 'Retrain'}</button>
          </div>

          <div className="row wrap" style={{ marginTop: 14, gap: 28, alignItems: 'flex-start' }}>
            <div className="well"><b style={{ fontSize: 28 }}>{mdl.accuracy}%</b><br />
              <span className="muted">hold-out accuracy on {mdl.samples} samples</span>
            </div>
            
            <div style={{ flex: 1, minWidth: 260 }} className="stack">
              {Object.entries(mdl.importances).slice(0, 6).map(([k, v]) => (
                <div key={k} className="row"><span className="mono" style={{ width: 120 }}>{k}</span>
                  <div className="bar" style={{ flex: 1 }}><div style={{ width: `${v * 100 * 3}%` }} /></div>
                  <span className="mono">{Math.round(v * 100)}%</span>
                </div>))}
            </div>
          </div>
        </section>)
      }

      {open && <Drawer id={open} onClose={() => setOpen(null)} refresh={refresh} />}
    </div>
  )
}

export default function Admin() {
  const [authed, setAuthed] = useState(!!getToken())
  if (!authed) return <Login onDone={() => setAuthed(true)} />
  return <Dashboard onLogout={() => { setToken(null); setAuthed(false) }} />
}
