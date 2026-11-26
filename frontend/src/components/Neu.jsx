import React, { useEffect, useRef, useState } from 'react'

export const LEVELS = ['trusted', 'normal', 'risky', 'suspicious', 'untrusted']
export const catColor = (c) => `var(--c-${c})`

/** Accessible switch: <button role="switch">, keyboard + screen-reader friendly. */
export function Toggle({ label, hint, checked, onChange, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={checked} disabled={disabled}
            className="switch" onClick={() => onChange(!checked)}>
      <span className="lbl">
        <b>{label}</b><span className="state" aria-hidden="true">{checked ? 'ON' : 'OFF'}</span>
        {hint && <small>{hint}</small>}
      </span>
      <span className="track" aria-hidden="true"><span className="knob" /></span>
    </button>
  )
}

/** Circular progress dial (0-100) - raised ring, carved-in face, accent arc. */
export function Dial({ value, label, caption }) {
  const r = 82, circ = 2 * Math.PI * r
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className="dial-wrap" role="img" aria-label={`${label}: ${Math.round(v)} out of 100. ${caption || ''}`}>
      <div className="dial-outer">
        <div className="dial-inner">
          <svg viewBox="0 0 210 210" aria-hidden="true">
            <circle cx="105" cy="105" r={r} fill="none" stroke="#c9cfd6" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${circ * 0.75} ${circ}`} transform="rotate(135 105 105)" opacity=".55" />
            <circle cx="105" cy="105" r={r} fill="none" stroke="var(--accent)" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${(circ * 0.75 * v) / 100} ${circ}`} transform="rotate(135 105 105)"
                    style={{ transition: 'stroke-dasharray .6s ease' }} />
          </svg>
          <div className="dial-val"><b>{Math.round(v)}</b><span>{caption}</span></div>
        </div>
      </div>
    </div>
  )
}

export function Badge({ level }) {
  return <span className="badge"><i style={{ background: catColor(level) }} aria-hidden="true" />{level}</span>
}

export function usePoll(fn, ms, deps = []) {
  const ref = useRef(fn)
  ref.current = fn
  useEffect(() => {
    let live = true
    const tick = () => live && ref.current()
    tick()
    const id = setInterval(tick, ms)
    return () => { live = false; clearInterval(id) }
  }, deps) // eslint-disable-line
}

export function Field({ label, id, ...props }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} className="input" {...props} />
    </div>
  )
}

export const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5l8-3z" /><path d="M9 12l2 2 4-4" />
  </svg>
)

export const ago = (ts) => {
  if (!ts) return 'never'
  const s = Math.max(0, Date.now() / 1000 - ts)
  if (s < 60) return `${Math.floor(s)}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}
