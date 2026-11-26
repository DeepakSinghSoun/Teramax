import React, { useState } from 'react'
import { api } from '../api.js'
import { Field, ShieldIcon, usePoll } from './Neu.jsx'

const REASON = {
  'agent not installed': 'Install the Teramax agent on this PC.',
  'agent not running': 'The agent stopped. Start it again to restore access.',
  'not signed in': 'Sign in below to unlock the internet.',
  'blocked by administrator': 'This PC has been blocked by the administrator.',
  'user account blocked': 'Your account has been blocked by the administrator.',
}


function Navbar() {
  return (
    <nav className="top-nav">
      <div className="nav-links">
        <a href="/portal" className="nav-link">
          Home
        </a>

        <a href="/admin" className="btn primary nav-admin">
          Admin
        </a>
      </div>
    </nav>
  )
}


function Step({ n, title, done, text }) {
  return (
    <div className={'card sm step ' + (done ? 'done' : '')}>
      <div className="ico" aria-hidden="true">{done ? '✓' : n}</div>
      <b>{title}</b>
      <span className="muted">{done ? 'Done' : text}</span>
    </div>
  )
}

export default function Portal() {
  const [st, setSt] = useState(null)
  const [tab, setTab] = useState('login')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [f, setF] = useState({
    pc_number: '', 
    name: '', 
    person_id: '', 
    department: '', 
    member_since: '', 
    password: '', 
    confirm: '' 
  })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  usePoll(() => api('/api/portal/status')
    .then(setSt)
    .catch(() => {}), 3000)

  async function submit(e) {
    e.preventDefault()
    setErr('')
    if (tab === 'signup' && f.password !== f.confirm) return setErr('Passwords do not match')
    setBusy(true)
    try {
      if (tab === 'login') await api('/api/portal/login', { method: 'POST', body: { person_id: f.person_id, password: f.password } })
      else {
        const { confirm, ...body } = f
        await api('/api/portal/signup', { method: 'POST', body })
      }
      setSt(await api('/api/portal/status'))
      setF({ ...f, password: '', confirm: '' })
    } catch (e2) { setErr(e2.message) } finally { setBusy(false) }
  }

  const logout = async () => { await api('/api/portal/logout', { method: 'POST' }); setSt(await api('/api/portal/status')) }
  if (!st) return <div className="portal"><p className="muted" role="status">Connecting to Teramax…</p></div>

  const agentOk = st.agent_installed && st.agent_running

  return (
    <main className="portal">     
      <header className="topbar portal-topbar">
        <div className="brand">
          <span className="logo">
            <ShieldIcon />
          </span>
          <span>TERAMAX</span>
        </div>

        <nav className="nav-links" aria-label="Main navigation">
          <a href="/portal" className="btn nav-link">
            Home
          </a>

          <a href="/admin" className="btn primary nav-link nav-admin">
            Admin
          </a>
        </nav>

        <span className="chip">Your IP: {st.ip}</span>
      </header>


      <section className="card" aria-live="polite">
        {st.internet ? (
          <div className="stack">
            <h1>You're connected 🎉</h1>
            <p className="banner ok">
              Internet access is active for {st.user?.name || 'this PC'}. Keep the Teramax agent running — closing it will cut your access.
            </p>

            <button className="btn" onClick={logout}>Sign out</button>
          </div>
          ) : (
            <div className="stack">
              <h1>Internet access is locked</h1>
              <p className="muted">
                To use the internet on this network, this PC needs the Teramax agent running and you must be signed in.
              </p>

              {st.reason && 
                <p className="banner">
                  <b>{REASON[st.reason] || st.reason}</b>
                </p>
              }
            </div>
          )
        }
      </section>

      <section className="steps" aria-label="Access checklist">
        <Step n="1" title="Install agent" done={agentOk} text="Required on every PC" />
        <Step n="2" title="Sign in" done={st.signed_in} text="Use your Person ID" />
        <Step n="3" title="Internet" done={st.internet} text="Unlocks automatically" />
      </section>

      {!agentOk && (
        <section className="card stack" aria-labelledby="agent-h">
          <h2 id="agent-h">Step 1 · Install the agent</h2>
          <p>
            <b>Install the agent from here:</b> 
            download it, unzip, and run it (needs Python 3.8+). Leave it running while you work.
          </p>

          <div className="row wrap">
            <a href="/agent/download">
              <button type="button" className="btn primary">Download Teramax agent</button>
            </a>

          </div>
          <div className="well mono">
            Windows: double-click <b>run_windows.bat</b><br />
            Linux / macOS: <b>sh run_linux_mac.sh</b>
          </div>
          <p className="muted">
            The agent reports terminal-command history and whether a USB storage device is connected to the network administrator. It does not capture keystrokes, screens, files or browsing.
          </p>
        </section>
      )}

      {!st.signed_in && (
        <section className="card" aria-labelledby="auth-h">
          <h2 id="auth-h" className="sr-only">Sign in or create account</h2>
          <div className="tabs" role="group" aria-label="Account mode">
            <button type="button" className="btn" aria-pressed={tab === 'login'} onClick={() => { setTab('login'); setErr('') }}>
              Log in
            </button>

            <button type="button" className="btn" aria-pressed={tab === 'signup'} onClick={() => { setTab('signup'); setErr('') }}>
              New user · Sign up
            </button>
          </div>

          <form onSubmit={submit} className="stack">
            {tab === 'signup' && (
              <div className="fgrid">
                <Field id="pc" label="PC number" value={f.pc_number} onChange={set('pc_number')} required placeholder="e.g. LAB-07" />
                <Field id="nm" label="Full name" value={f.name} onChange={set('name')} required minLength={2} autoComplete="name" />
              </div>
            )}

            <div className={tab === 'signup' ? 'fgrid' : ''}>
              <Field id="pid" 
                label="Person ID" 
                value={f.person_id} 
                onChange={set('person_id')} 
                required pattern="[A-Za-z0-9_.\-]{3,32}" 
                title="3–32 letters, numbers, . _ -" 
                autoComplete="username" 
              />

              {tab === 'signup' && <Field id="dep" label="Department" value={f.department} onChange={set('department')} placeholder="e.g. Engineering" />}
            </div>

            {tab === 'signup' && (
              <div className="fgrid">
                <Field id="ms" label="Member since (optional)" type="date" value={f.member_since} onChange={set('member_since')} />
                <Field id="ip" label="IP address (auto-detected)" value={st.ip} readOnly />
              </div>
            )}

            <div className={tab === 'signup' ? 'fgrid' : ''}>
              <Field id="pw" 
                label={tab === 'signup' ? 'Create password (min 8)' : 'Password'} 
                type="password" 
                value={f.password} 
                onChange={set('password')} 
                required minLength={tab === 'signup' ? 8 : 1} 
                autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
              />

              {tab === 'signup' && 
                <Field id="pw2" 
                  label="Confirm password" 
                  type="password" 
                  value={f.confirm} 
                  onChange={set('confirm')} 
                  required autoComplete="new-password" 
                />
              }

            </div>
            {err && <p className="error" role="alert">{err}</p>}
            <button className="btn primary" disabled={busy}>
              {busy ? 'Please wait…' : tab === 'login' ? 'Log in' : 'Create account & sign in'}
            </button>

            {tab === 'signup' && 
              <p className="muted">
                “Member since” is only trusted after an administrator verifies you; until then your history counts from today.
              </p>
            }
          </form>
        </section>
      )}
    </main>
  )
}
