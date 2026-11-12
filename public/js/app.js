// ---- GLOBAL SEARCH ----
document.getElementById('global-search')?.addEventListener('keydown', (e) => {
  if (e.key==='Enter') {
    const q = e.target.value.toLowerCase();
    if (!q) return;
    // Find across companies, leads, deals
    const co = DB.companies.find(x=>x.name.toLowerCase().includes(q));
    if (co) { document.querySelector('[data-page=companies]').click(); setTimeout(()=>renderTable('companies',q),50); }
  }
});

// Close modal on overlay click
document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
  if (e.target===document.getElementById('modal-overlay')) closeModal();
});

// ---- INIT ----
// NOTE: load() and seedData() are called inside onSignedIn() after auth — not here

// ---- LOGIN / SIGN OUT ----
function hideAuthLoading() {
  const el = document.getElementById('auth-loading');
  if (el) el.style.display = 'none';
}

// Show "set your new password" screen for first-time users
function showSetPasswordScreen(user) {
  hideAuthLoading();
  document.getElementById('login-page').style.display = 'none';
  const el = document.getElementById('set-password-screen');
  if (el) {
    el.style.display = 'flex';
    document.getElementById('sp-user-name').textContent = user.name || user.email;
    // Store user temporarily for after password set
    el._pendingUser = user;
  }
}

async function submitNewPassword() {
  const p1 = document.getElementById('sp-pwd1').value;
  const p2 = document.getElementById('sp-pwd2').value;
  const err = document.getElementById('sp-err');
  err.textContent = '';
  if (!p1 || p1.length < 8) { err.textContent = 'Password must be at least 8 characters.'; return; }
  if (p1 !== p2) { err.textContent = 'Passwords do not match.'; return; }
  const btn = document.getElementById('sp-submit-btn');
  btn.disabled = true; btn.textContent = 'Saving…';
  try {
    const { error } = await DB_CLIENT.auth.updateUser({ password: p1 });
    if (error) throw error;
    // Clear the force_password_change flag
    await DB_CLIENT.from('profiles').update({ force_password_change: false, updated_at: new Date().toISOString() })
      .eq('id', DB_CLIENT.auth.getUser ? (await DB_CLIENT.auth.getUser()).data?.user?.id : '');
    // Hide set-password screen, continue to app
    document.getElementById('set-password-screen').style.display = 'none';
    const el = document.getElementById('set-password-screen');
    const user = el._pendingUser;
    if (user) { user.force_password_change = false; applyLoggedInUser(user); showAppPage(); await load(); syncSetupUsersFromDB(); const page = getHashPage(); if (page && page !== 'login') { history.replaceState({page},'',' #/'+page); _doNavigate(page); } else { history.replaceState({page:'dashboard'},'','#/dashboard'); renderDashboard(); } }
  } catch(e) {
    err.textContent = 'Failed: ' + (e?.message || e);
    btn.disabled = false; btn.textContent = 'Set Password & Continue';
  }
}

function showLoginPage() {
  hideAuthLoading();
  const sb = document.getElementById('sidebar');
  if (sb) { sb.classList.remove('app-visible','mobile-open'); sb.style.display = ''; }
  const overlay = document.getElementById('mobile-nav-overlay');
  if (overlay) overlay.style.display = 'none';
  const main = document.getElementById('main');
  if (main) main.style.display = 'none';
  document.getElementById('login-page').style.display = 'flex';
  history.replaceState({}, '', '#/login');
}

function showAppPage() {
  hideAuthLoading();
  const sb = document.getElementById('sidebar');
  if (sb) { sb.style.display = ''; sb.classList.add('app-visible'); sb.classList.remove('mobile-open'); }
  const overlay = document.getElementById('mobile-nav-overlay');
  if (overlay) overlay.style.display = 'none';
  const main = document.getElementById('main');
  if (main) main.style.display = 'flex';
  const lp = document.getElementById('login-page');
  if (lp) lp.style.display = 'none';
}

function setLoginLoading(loading) {
  const btn = document.querySelector('#auth-signin button[type=submit]');
  if (btn) { btn.disabled = loading; btn.textContent = loading ? 'Signing in…' : 'Sign In →'; }
}

function setRegisterLoading(loading) {
  const btn = document.querySelector('#auth-register button[type=submit]');
  if (btn) { btn.disabled = loading; btn.textContent = loading ? 'Creating…' : 'Create Account →'; }
}

async function doSignOut() {
  // Clear in-memory data so next user starts fresh
  stopRealtimeSync();
  DB.leads = []; DB.contacts = []; DB.companies = []; DB.deals = [];
  DB.tasks = []; DB.activities = []; DB.users = []; DB.audit = [];
  // Clear Google Calendar in-memory state (token stays in Supabase for next login)
  gcalAccessToken = null;
  gcalUserEmail = null;
  gcalEvents = [];
  LOGGED_IN_USER = null;
  await DB_CLIENT.auth.signOut();
  showLoginPage();
}

function showErr(elId, msg, isSuccess) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = msg;
  if (isSuccess) {
    el.style.cssText = 'display:block;font-size:12px;padding:8px 12px;border-radius:8px;margin:10px 0;background:#f0fdf4;border:1px solid #86efac;color:#166534';
  } else {
    el.style.cssText = 'display:block;font-size:12px;padding:8px 12px;border-radius:8px;margin:10px 0;background:#fef2f2;border:1px solid #fca5a5;color:#dc2626';
  }
}

async function doLogin(e) {
  e && e.preventDefault();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-pass').value;
  if (!email) { showErr('login-err', 'Enter your email address.'); return; }
  if (!password) { showErr('login-err', 'Enter your password.'); return; }
  setLoginLoading(true);
  document.getElementById('login-err').style.display = 'none';
  const { data, error } = await DB_CLIENT.auth.signInWithPassword({ email, password });
  setLoginLoading(false);
  if (error) {
    showErr('login-err', error.message === 'Invalid login credentials'
      ? 'Wrong email or password. Please try again.'
      : error.message === 'Email not confirmed'
      ? 'Please confirm your email first — check your inbox for a verification link.'
      : error.message);
    return;
  }
  await onSignedIn(data.user);
}

async function doRegister(e) {
  e && e.preventDefault();
  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-pass').value;
  const errEl    = document.getElementById('reg-err');
  if (!name || !email || !password) { showErr('reg-err', 'All fields are required.'); return; }
  if (password.length < 6) { showErr('reg-err', 'Password must be at least 6 characters.'); return; }
  setRegisterLoading(true);
  document.getElementById('reg-err').style.display = 'none';
  const { data, error } = await DB_CLIENT.auth.signUp({
    email, password,
    options: { data: { name, role: 'User', color: '#1a56db' } }
  });
  setRegisterLoading(false);
  if (error) { showErr('reg-err', error.message); return; }
  if (data.user && !data.session) {
    showErr('reg-err', '✓ Account created! Check your email to confirm, then sign in.', true);
    return;
  }
  await onSignedIn(data.user);
}

// Called after successful Supabase auth — fetches profile + loads app
async function onSignedIn(authUser) {
  // Build user from auth metadata first (works even before DB tables exist)
  const meta = authUser.user_metadata || {};
  let user = {
    id: authUser.id, supaId: authUser.id,
    name: meta.name || meta.full_name || authUser.email.split('@')[0],
    email: authUser.email,
    role: meta.role || 'User',
    title: meta.title || '',
    dept: meta.dept || '',
    color: meta.color || '#1a56db',
    status: 'active', online: true
  };
  user.avatar = (user.name).split(' ').map(p=>p[0]).join('').substring(0,2).toUpperCase();

  // Try to get richer profile from DB (only if table exists)
  try {
    const { data: profile, error } = await DB_CLIENT
      .from('profiles').select('*').eq('id', authUser.id).single();
    if (!error && profile) {
      user = {
        id: profile.id, supaId: profile.id,
        name: profile.name || user.name,
        email: profile.email || authUser.email,
        role: profile.role || user.role,
        title: profile.title || '',
        dept: profile.dept || '',
        avatar: profile.avatar || user.avatar,
        color: profile.color || user.color,
        status: profile.status || 'active',
        custom_perms: profile.custom_perms || null,
        force_password_change: profile.force_password_change || false,
        online: true
      };
      // New user first login — show password change screen before app
      if (profile.force_password_change) {
        showSetPasswordScreen(user);
        return;
      }
    }
  } catch(e) { /* profiles table may not exist yet — use auth metadata */ }

  applyLoggedInUser(user);
  showAppPage();
  // Load CRM data from Supabase
  await load();
  // Only seed if ALL tables are truly empty (first-time DB setup — no real data yet)
  if (!DB.companies.length && !DB.leads.length && !DB.deals.length && !DB.contacts.length) {
    seedData();
  }
  syncSetupUsersFromDB(); // merge real DB users into Setup panel
  // Re-apply nav perms after DB load — now LOGGED_IN_USER.custom_perms is current
  const myDbUser = DB.users.find(u => u.id === LOGGED_IN_USER.id || u.email === LOGGED_IN_USER.email);
  if (myDbUser && myDbUser.custom_perms) {
    LOGGED_IN_USER.custom_perms = myDbUser.custom_perms;
  }
  applyNavPermissions();
  markLoginTime(); // record login time as badge baseline
  updateNavBadges();
  startRealtimeSync(); // live updates from other team members
  const page = getHashPage();
  if (page && page !== 'login') {
    history.replaceState({ page }, '', '#/' + page);
    _doNavigate(page);
  } else {
    history.replaceState({ page: 'dashboard' }, '', '#/dashboard');
    renderDashboard();
  }
}

// Auth init — rely entirely on onAuthStateChange; INITIAL_SESSION fires on every page load
// including hard refresh, so we don't need a separate getSession() call.
let _authInitialized = false;

// Helper: run fn after DOM is ready (or immediately if already ready)
function whenDOMReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  } else {
    fn();
  }
}

// Flag to suppress auth state changes during admin-initiated signUp
let _suppressAuthChange = false;

DB_CLIENT.auth.onAuthStateChange(async (event, session) => {
  if (_suppressAuthChange) return; // admin is creating a new user — ignore
  if (event === 'SIGNED_OUT') {
    _authInitialized = true;
    LOGGED_IN_USER = null;
    whenDOMReady(showLoginPage);
  } else if (session && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
    if (!_authInitialized || !LOGGED_IN_USER) {
      _authInitialized = true;
      whenDOMReady(async () => { await onSignedIn(session.user); });
    }
  } else if (event === 'INITIAL_SESSION' && !session) {
    _authInitialized = true;
    whenDOMReady(showLoginPage);
  }
});
