import { useState } from 'react'
import { supabase } from '@/lib/supabase'

// Ported 1:1 from production public/index.html (#login-page, lines 2655–2760) and its
// handlers doLogin / doRegister / doSendOtp / doVerifyOtp / doResendOtp / switchAuthTab.
const pageStyle = { display: 'flex', position: 'fixed', inset: '0', background: 'linear-gradient(135deg,#0f1b3d 0%,#1a3a6b 50%,#0d2451 100%)', zIndex: '9999', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif', overflowY: 'auto', padding: '24px 16px' }
const cardStyle = { background: '#fff', borderRadius: '20px', padding: '40px 40px 32px', width: '100%', maxWidth: '420px', boxShadow: '0 32px 80px rgba(0,0,0,0.35)' }
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '5px' }
const inputStyle = { width: '100%', padding: '10px 13px', border: '1.5px solid #d1d5db', borderRadius: '9px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }
const primaryBtn = { width: '100%', padding: '11px', background: 'linear-gradient(135deg,#1a56db,#1e40af)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }
const linkBtn = { color: '#1a56db', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', padding: '0' }
const focusBorder = {
  onFocus: (e) => { e.currentTarget.style.borderColor = '#1a56db' },
  onBlur: (e) => { e.currentTarget.style.borderColor = '#d1d5db' },
}
const errStyle = { display: 'block', fontSize: '12px', padding: '8px 12px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626' }
const okStyle = { display: 'block', fontSize: '12px', padding: '8px 12px', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #86efac', color: '#166534' }

function Msg({ msg, margin }) {
  if (!msg) return null
  return <div style={{ ...(msg.ok ? okStyle : errStyle), margin }}>{msg.text}</div>
}

export function Login() {
  const [tab, setTab] = useState('signin')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [loginMsg, setLoginMsg] = useState(null)
  const [loggingIn, setLoggingIn] = useState(false)

  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPass, setRegPass] = useState('')
  const [regMsg, setRegMsg] = useState(null)
  const [registering, setRegistering] = useState(false)

  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotStep, setForgotStep] = useState(1)
  const [forgotMsg, setForgotMsg] = useState(null)
  const [sending, setSending] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpEmail, setOtpEmail] = useState('')
  const [otpMsg, setOtpMsg] = useState(null)
  const [verifying, setVerifying] = useState(false)

  const switchAuthTab = (t) => {
    setTab(t)
    if (t === 'forgot') {
      if (email) setForgotEmail(email) // pre-fill from sign-in field
      setForgotStep(1); setForgotMsg(null); setOtp(''); setOtpEmail('')
    }
  }

  const doLogin = async (e) => {
    e.preventDefault()
    if (!email.trim()) { setLoginMsg({ text: 'Enter your email address.' }); return }
    if (!pass) { setLoginMsg({ text: 'Enter your password.' }); return }
    setLoggingIn(true); setLoginMsg(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass })
    setLoggingIn(false)
    if (error) {
      setLoginMsg({
        text: error.message === 'Invalid login credentials' ? 'Wrong email or password. Please try again.'
          : error.message === 'Email not confirmed' ? 'Please confirm your email first — check your inbox for a verification link.'
          : error.message,
      })
      return
    }
    // onAuthStateChange(SIGNED_IN) in authStore takes it from here
  }

  const doRegister = async (e) => {
    e.preventDefault()
    if (!regName.trim() || !regEmail.trim() || !regPass) { setRegMsg({ text: 'All fields are required.' }); return }
    if (regPass.length < 6) { setRegMsg({ text: 'Password must be at least 6 characters.' }); return }
    setRegistering(true); setRegMsg(null)
    const { data, error } = await supabase.auth.signUp({
      email: regEmail.trim(), password: regPass,
      options: { data: { name: regName.trim(), role: 'User', color: '#1a56db' } },
    })
    setRegistering(false)
    if (error) { setRegMsg({ text: error.message }); return }
    if (data.user && !data.session) { setRegMsg({ text: '✓ Account created! Check your email to confirm, then sign in.', ok: true }); return }
    // signed in immediately → onAuthStateChange(SIGNED_IN) loads the app
  }

  const doSendOtp = async (e) => {
    e.preventDefault()
    const em = forgotEmail.trim()
    setSending(true); setForgotMsg(null)
    const { error } = await supabase.auth.signInWithOtp({ email: em, options: { shouldCreateUser: false, emailRedirectTo: null } })
    setSending(false)
    if (error) {
      const msg = error.message || ''
      setForgotMsg({ text: (msg.includes('504') || msg.includes('500') || msg.includes('timeout') || msg.includes('sending')) ? 'Email sending failed. SMTP not configured — contact your admin.' : msg })
    } else {
      setOtpEmail(em); setForgotStep(2)
    }
  }

  const doResendOtp = async () => {
    if (!otpEmail) return
    await supabase.auth.signInWithOtp({ email: otpEmail, options: { shouldCreateUser: false, emailRedirectTo: null } })
    setOtpMsg({ text: '✓ A new code was sent to your email.', ok: true })
  }

  const doVerifyOtp = async (e) => {
    e.preventDefault()
    setVerifying(true); setOtpMsg(null)
    const { error } = await supabase.auth.verifyOtp({ email: otpEmail, token: otp.trim(), type: 'email' })
    setVerifying(false)
    if (error) { setOtpMsg({ text: error.message }); return }
    setOtpMsg({ text: '✓ Identity verified! Signing you in…', ok: true })
    // onAuthStateChange(SIGNED_IN) loads the app
  }

  return (
    <div id="login-page" style={pageStyle}>
      <div style={cardStyle}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '52px', height: '52px', background: 'linear-gradient(135deg,#1a56db,#1e40af)', borderRadius: '13px', marginBottom: '12px' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>SearchKraft CRM</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Sign in to your account</div>
        </div>

        {/* Sign In Panel */}
        {tab === 'signin' && (
          <div id="auth-signin">
            <form onSubmit={doLogin}>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Email address</label>
                <input id="login-email" type="email" required autoComplete="email" placeholder="you@searchkraft.com" style={inputStyle} {...focusBorder} value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div style={{ marginBottom: '4px' }}>
                <label style={labelStyle}>Password</label>
                <input id="login-pass" type="password" required autoComplete="current-password" placeholder="••••••••" style={inputStyle} {...focusBorder} value={pass} onChange={(e) => setPass(e.target.value)} />
              </div>
              <Msg msg={loginMsg} margin="10px 0" />
              <button type="submit" id="login-btn" disabled={loggingIn} style={{ ...primaryBtn, marginTop: '8px', transition: 'opacity 0.15s' }}>{loggingIn ? 'Signing in…' : 'Sign In →'}</button>
              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                <button type="button" onClick={() => switchAuthTab('forgot')} style={{ fontSize: '12px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: '0' }}>Forgot your password?</button>
              </div>
            </form>
            <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              Don't have an account?{' '}
              <button type="button" onClick={() => switchAuthTab('register')} style={linkBtn}>Create one</button>
            </p>
          </div>
        )}

        {/* Create Account Panel */}
        {tab === 'register' && (
          <div id="auth-register">
            <form onSubmit={doRegister}>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Full Name</label>
                <input id="reg-name" type="text" required autoComplete="name" placeholder="Your full name" style={inputStyle} {...focusBorder} value={regName} onChange={(e) => setRegName(e.target.value)} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Email address</label>
                <input id="reg-email" type="email" required autoComplete="email" placeholder="you@searchkraft.com" style={inputStyle} {...focusBorder} value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
              </div>
              <div style={{ marginBottom: '6px' }}>
                <label style={labelStyle}>Password <span style={{ fontWeight: '400', color: '#94a3b8' }}>min 6 chars</span></label>
                <input id="reg-pass" type="password" required autoComplete="new-password" placeholder="••••••••" style={inputStyle} {...focusBorder} value={regPass} onChange={(e) => setRegPass(e.target.value)} />
              </div>
              <Msg msg={regMsg} margin="10px 0" />
              <button type="submit" id="reg-btn" disabled={registering} style={{ ...primaryBtn, background: 'linear-gradient(135deg,#0d9488,#0f766e)', marginTop: '8px' }}>{registering ? 'Creating…' : 'Create Account →'}</button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748b' }}>
              Already have an account?{' '}
              <button type="button" onClick={() => switchAuthTab('signin')} style={linkBtn}>Sign in</button>
            </p>
          </div>
        )}

        {/* Forgot Password Panel */}
        {tab === 'forgot' && (
          <div id="auth-forgot">
            {forgotStep === 1 ? (
              <div id="forgot-step1">
                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px' }}>Enter your email and we'll send a 6-digit code to verify your identity.</p>
                <form onSubmit={doSendOtp}>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={labelStyle}>Email address</label>
                    <input id="forgot-email" type="email" required autoComplete="email" placeholder="you@searchkraft.com" style={inputStyle} {...focusBorder} value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
                  </div>
                  <Msg msg={forgotMsg} margin="0 0 10px" />
                  <button type="submit" id="forgot-btn" disabled={sending} style={primaryBtn}>{sending ? 'Sending…' : 'Send Code →'}</button>
                </form>
              </div>
            ) : (
              <div id="forgot-step2">
                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 4px' }}>A 6-digit code was sent to</p>
                <p id="forgot-email-display" style={{ fontSize: '13px', fontWeight: '700', color: '#1a56db', margin: '0 0 20px' }}>{otpEmail}</p>
                <form onSubmit={doVerifyOtp}>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={labelStyle}>Verification Code</label>
                    <input id="forgot-otp" type="text" required inputMode="numeric" maxLength="6" placeholder="123456" autoFocus style={{ ...inputStyle, fontSize: '22px', letterSpacing: '8px', textAlign: 'center', fontWeight: '700' }} {...focusBorder} value={otp} onChange={(e) => setOtp(e.target.value)} />
                  </div>
                  <Msg msg={otpMsg} margin="0 0 10px" />
                  <button type="submit" id="otp-btn" disabled={verifying} style={primaryBtn}>{verifying ? 'Verifying…' : 'Verify Code'}</button>
                </form>
                <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', color: '#64748b' }}>
                  Didn't receive it?{' '}
                  <button type="button" onClick={doResendOtp} style={{ ...linkBtn, fontSize: '12px' }}>Resend code</button>
                </p>
              </div>
            )}
            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748b' }}>
              <button type="button" onClick={() => switchAuthTab('signin')} style={linkBtn}>← Back to Sign In</button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
