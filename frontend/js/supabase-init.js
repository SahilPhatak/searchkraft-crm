function switchAuthTab(tab) {
  document.getElementById('auth-signin').style.display   = tab === 'signin'   ? '' : 'none';
  document.getElementById('auth-register').style.display = tab === 'register' ? '' : 'none';
  document.getElementById('auth-forgot').style.display   = tab === 'forgot'   ? '' : 'none';
  if (tab === 'forgot') {
    // Pre-fill email from sign-in field
    const e = document.getElementById('login-email').value;
    if (e) document.getElementById('forgot-email').value = e;
    // Always start at step 1
    document.getElementById('forgot-step1').style.display = '';
    document.getElementById('forgot-step2').style.display = 'none';
    document.getElementById('forgot-msg').style.display = 'none';
    document.getElementById('forgot-otp').value = '';
    _otpEmail = '';
  }
}

let _otpEmail = '';

async function doSendOtp(e) {
  e.preventDefault();
  const email = document.getElementById('forgot-email').value.trim();
  const msgEl = document.getElementById('forgot-msg');
  const btn   = document.getElementById('forgot-btn');
  btn.disabled = true; btn.textContent = 'Sending…';
  msgEl.style.display = 'none';
  const { error } = await DB_CLIENT.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: null } });
  btn.disabled = false; btn.textContent = 'Send Code →';
  if (error) {
    msgEl.style.cssText = 'display:block;font-size:12px;padding:8px 12px;border-radius:8px;margin-bottom:10px;background:#fef2f2;border:1px solid #fca5a5;color:#dc2626';
    const msg = error.message || '';
    msgEl.textContent = (msg.includes('504') || msg.includes('500') || msg.includes('timeout') || msg.includes('sending'))
      ? 'Email sending failed. SMTP not configured — contact your admin.'
      : msg;
  } else {
    _otpEmail = email;
    document.getElementById('forgot-email-display').textContent = email;
    document.getElementById('forgot-step1').style.display = 'none';
    document.getElementById('forgot-step2').style.display = '';
    setTimeout(() => document.getElementById('forgot-otp').focus(), 50);
  }
}

async function doResendOtp() {
  if (!_otpEmail) return;
  await DB_CLIENT.auth.signInWithOtp({ email: _otpEmail, options: { shouldCreateUser: false, emailRedirectTo: null } });
  const m = document.getElementById('otp-msg');
  m.style.cssText = 'display:block;font-size:12px;padding:8px 12px;border-radius:8px;margin-bottom:10px;background:#f0fdf4;border:1px solid #86efac;color:#166534';
  m.textContent = '✓ A new code was sent to your email.';
}

async function doVerifyOtp(e) {
  e.preventDefault();
  const token = document.getElementById('forgot-otp').value.trim();
  const msgEl = document.getElementById('otp-msg');
  const btn   = document.getElementById('otp-btn');
  btn.disabled = true; btn.textContent = 'Verifying…';
  msgEl.style.display = 'none';
  const { data, error } = await DB_CLIENT.auth.verifyOtp({ email: _otpEmail, token, type: 'email' });
  btn.disabled = false; btn.textContent = 'Verify Code';
  if (error) {
    msgEl.style.cssText = 'display:block;font-size:12px;padding:8px 12px;border-radius:8px;margin-bottom:10px;background:#fef2f2;border:1px solid #fca5a5;color:#dc2626';
    msgEl.textContent = error.message;
  } else {
    // Verified — user is now signed in, onAuthStateChange will fire
    msgEl.style.cssText = 'display:block;font-size:12px;padding:8px 12px;border-radius:8px;margin-bottom:10px;background:#f0fdf4;border:1px solid #86efac;color:#166534';
    msgEl.textContent = '✓ Identity verified! Signing you in…';
    if (data.user) await onSignedIn(data.user);
  }
}
