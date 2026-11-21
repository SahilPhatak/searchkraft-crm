import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'

// Ported 1:1 from production #set-password-screen (public/index.html lines 2632–2652)
// and submitNewPassword(). Shown on a user's first login when force_password_change is set.
const inputStyle = { width: '100%', padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }
const focusBorder = {
  onFocus: (e) => { e.currentTarget.style.borderColor = '#1a56db' },
  onBlur: (e) => { e.currentTarget.style.borderColor = '#d1d5db' },
}

export function SetPassword() {
  const pendingUser = useAuthStore((s) => s.pendingUser)
  const submitNewPassword = useAuthStore((s) => s.submitNewPassword)
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setErr('')
    if (!p1 || p1.length < 8) { setErr('Password must be at least 8 characters.'); return }
    if (p1 !== p2) { setErr('Passwords do not match.'); return }
    setSaving(true)
    try {
      await submitNewPassword(p1)
    } catch (e) {
      setErr('Failed: ' + (e?.message || e))
      setSaving(false)
    }
  }

  return (
    <div id="set-password-screen" style={{ display: 'flex', position: 'fixed', inset: '0', background: 'linear-gradient(135deg,#0f1b3d 0%,#1a3a6b 50%,#0d2451 100%)', zIndex: '10000', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif', padding: '24px' }}>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 32px 80px rgba(0,0,0,0.35)' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '52px', height: '52px', background: 'linear-gradient(135deg,#1a56db,#1e40af)', borderRadius: '13px', marginBottom: '12px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>Welcome to SearchKraft!</div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>Hi <strong id="sp-user-name">{pendingUser?.name || pendingUser?.email}</strong>, please set your own password to continue.</div>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>New Password</label>
          <input id="sp-pwd1" type="password" placeholder="Min 8 characters" style={inputStyle} {...focusBorder} value={p1} onChange={(e) => setP1(e.target.value)} />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Confirm Password</label>
          <input id="sp-pwd2" type="password" placeholder="Repeat your password" style={inputStyle} {...focusBorder} value={p2} onChange={(e) => setP2(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit() }} />
        </div>
        <div id="sp-err" style={{ color: '#dc2626', fontSize: '13px', marginBottom: '12px', minHeight: '18px' }}>{err}</div>
        <button id="sp-submit-btn" onClick={submit} disabled={saving} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg,#1a56db,#1e40af)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>{saving ? 'Saving…' : 'Set Password & Continue →'}</button>
      </div>
    </div>
  )
}
