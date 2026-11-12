// ---- NAVIGATION ----
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    closeMobileNav();
    navigateTo(btn.dataset.page);
  });
});

function renderPage(pg) {
  // Show/hide pages — special full-bleed pages get display:flex
  document.querySelectorAll('.page').forEach(p => {
    p.style.display = 'none';
    p.classList.remove('active');
  });
  const el = document.getElementById('page-'+pg);
  if (el) {
    const flexPages = ['documents'];
    el.style.display = flexPages.includes(pg) ? 'flex' : 'block';
    el.classList.add('active');
  }
  if (pg==='dashboard') renderDashboard();
  else if (pg==='my-day') renderWorkqueue();
  else if (pg==='calendar') { renderCalendar(); gcalLoadState(); }
  else if (pg==='companies') { markSectionSeen('companies'); renderTable('companies',''); }
  else if (pg==='contacts')  { markSectionSeen('contacts');  renderTable('contacts',''); }
  else if (pg==='leads')     { markSectionSeen('leads');     renderLeadsBoard(); renderTable('leads',''); }
  else if (pg==='deals')     { markSectionSeen('deals');     renderDealsBoard(); renderTable('deals',''); }
  else if (pg==='activities'){ markSectionSeen('activities');renderActivities(); }
  else if (pg==='tasks')     { markSectionSeen('tasks');     renderTable('tasks',''); }
  else if (pg==='documents') renderDocuments();
  else if (pg==='commercial') renderCommercial();
  else if (pg==='reports') renderReports();
  else if (pg==='team') renderTable('team','');
  else if (pg==='audit') renderAudit();
  else if (pg==='setup') { const firstTab = document.querySelector('.setup-tab'); if(firstTab) firstTab.click(); }
}

// ---- NAVIGATION + URL HASH ROUTING ----
const PAGE_TITLES = {
  dashboard:'Home', leads:'Leads', 'my-day':'Workqueue', reports:'Analytics',
  calendar:'Calendar', contacts:'Contacts', companies:'Accounts', deals:'Deals',
  documents:'Documents', commercial:'Invoices', tasks:'Tasks', activities:'Calls & Meetings',
  team:'Team', audit:'Audit Log', setup:'Setup', 'personal-settings':'Personal Settings'
};

function hasUnsavedForm() {
  // Check if any visible form panel has user input
  const panels = document.querySelectorAll('.detail-panel, .lf-form, [id$="-form"]');
  for (const p of panels) {
    if (p.style.display === 'none' || p.closest('[style*="display: none"]')) continue;
    const inputs = p.querySelectorAll('input, textarea, select');
    for (const inp of inputs) {
      if (inp.type === 'checkbox' || inp.type === 'radio') continue;
      if (inp.defaultValue !== undefined && inp.value !== inp.defaultValue) return true;
    }
  }
  return false;
}

function navigateTo(page) {
  // Close mobile sidebar on navigation
  if (window.innerWidth <= 860) closeMobileNav();
  // Block unauthorized pages
  if (!hasPageAccess(page)) {
    showToast('You don\'t have permission to access this section.', '#dc2626');
    return;
  }
  // Warn if a form has unsaved changes
  if (hasUnsavedForm()) {
    if (!confirm('You have unsaved changes. Leave without saving?')) return;
  }
  // Close any open full-page forms
  const fp = document.getElementById('lead-form-overlay');
  if (fp) fp.style.display = 'none';
  // Update URL hash
  if (window.location.hash !== '#/' + page) {
    history.pushState({ page }, '', '#/' + page);
  }
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));
  const btn = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (btn) btn.classList.add('active');
  document.getElementById('topbar-title').textContent = PAGE_TITLES[page] || page;
  showViewSwitcher(page === 'dashboard');
  renderPage(page);
  updateNavBadges();
}

// Handle browser back/forward
window.addEventListener('popstate', (e) => {
  const page = e.state?.page || getHashPage();
  if (page) _doNavigate(page);
});

// Auto-refresh data when tab gets focus (catches data added by other users)
window.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible' && LOGGED_IN_USER) {
    await load();
    const curPage = getHashPage();
    if (curPage === 'dashboard') renderDashboard();
    else updateNavBadges();
  }
});

function getHashPage() {
  const hash = window.location.hash; // e.g. #/leads
  return hash.replace(/^#\//, '') || 'dashboard';
}

function _doNavigate(page) {
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));
  const btn = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (btn) btn.classList.add('active');
  document.getElementById('topbar-title').textContent = PAGE_TITLES[page] || page;
  showViewSwitcher(page === 'dashboard');
  renderPage(page);
  updateNavBadges();
}

// Nav badges: show count of records created AFTER user last visited that section
function getSeenKey(section) {
  const uid = LOGGED_IN_USER ? (LOGGED_IN_USER.supaId || LOGGED_IN_USER.id || LOGGED_IN_USER.email) : 'anon';
  return `sk_seen_${uid}_${section}`;
}
function getLoginKey() {
  const uid = LOGGED_IN_USER ? (LOGGED_IN_USER.supaId || LOGGED_IN_USER.id || LOGGED_IN_USER.email) : 'anon';
  return `sk_lastlogin_${uid}`;
}
function markLoginTime() {
  // Record the time BEFORE this login so new records added after this point are "new"
  // Only update if not already set for this session (prevents overwrite on token refresh)
  try {
    const key = getLoginKey();
    if (!sessionStorage.getItem('sk_login_marked')) {
      localStorage.setItem(key, new Date().toISOString());
      sessionStorage.setItem('sk_login_marked', '1');
    }
  } catch(e) {}
}
function markSectionSeen(section) {
  try { localStorage.setItem(getSeenKey(section), new Date().toISOString()); } catch(e) {}
  updateNavBadges();
}
function countNewRecords(records, section) {
  try {
    const seenAt = localStorage.getItem(getSeenKey(section));
    const loginAt = localStorage.getItem(getLoginKey());
    // Baseline: when user last SAW this section, or when they last logged in, whichever is later
    const baseline = seenAt && loginAt ? (seenAt > loginAt ? seenAt : loginAt) : (seenAt || loginAt);
    if (!baseline) return 0; // no baseline yet — show nothing
    return records.filter(r => (r.createdAt || r.created_at || '') > baseline).length;
  } catch(e) { return 0; }
}
function updateNavBadges() {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val > 0 ? val : ''; };
  set('nb-leads',      countNewRecords(DB.leads, 'leads'));
  set('nb-contacts',   countNewRecords(DB.contacts, 'contacts'));
  set('nb-companies',  countNewRecords(DB.companies, 'companies'));
  set('nb-deals',      countNewRecords(DB.deals, 'deals'));
  set('nb-tasks',      countNewRecords(DB.tasks, 'tasks'));
  set('nb-activities', countNewRecords(DB.activities, 'activities'));
  set('nb-documents',  countNewRecords(DB.documents, 'documents'));
}

// ── Real-time sync ──────────────────────────────────────────────────────────
// One Supabase Realtime channel that listens to all CRM tables.
// When another user inserts/updates/deletes a record we patch DB in-memory,
// refresh the nav badges, and re-render the current page if it shows that table.
let _realtimeChannel = null;

function startRealtimeSync() {
  if (window._realtimeStarted) return; // already subscribed
  window._realtimeStarted = true;
  // Use global normRecord (defined in config.js, loaded first)
  const norm = normRecord;

  // Map Supabase table name → DB key + page hash(es) to re-render
  const TABLE_MAP = {
    leads:      { key: 'leads',      pages: ['leads','reports','dashboard'] },
    contacts:   { key: 'contacts',   pages: ['contacts','reports'] },
    companies:  { key: 'companies',  pages: ['companies','reports'] },
    deals:      { key: 'deals',      pages: ['deals','reports','dashboard'] },
    tasks:      { key: 'tasks',      pages: ['tasks','dashboard'] },
    activities: { key: 'activities', pages: ['activities','dashboard'] },
    documents:  { key: 'documents',  pages: ['documents'] },
  };

  function handleRealtimePayload(payload) {
    try {
      const table = payload.table;
      const info = TABLE_MAP[table];
      if (!info) return;
      const arr = DB[info.key];
      if (!arr) return;
      if (payload.eventType === 'INSERT') {
        const rec = norm(payload.new);
        if (!arr.find(r => r.id === rec.id)) arr.unshift(rec);
      } else if (payload.eventType === 'UPDATE') {
        const rec = norm(payload.new);
        const idx = arr.findIndex(r => r.id === rec.id);
        if (idx >= 0) arr[idx] = rec; else arr.unshift(rec);
      } else if (payload.eventType === 'DELETE') {
        const rid = payload.old && payload.old.id;
        if (rid) { const idx = arr.findIndex(r => r.id === rid); if (idx >= 0) arr.splice(idx, 1); }
      }
      updateNavBadges();
      const curPage = (window.location.hash.replace('#/','') || 'dashboard');
      if (info.pages.includes(curPage)) {
        clearTimeout(window._rtRenderTimer);
        window._rtRenderTimer = setTimeout(() => renderPage(curPage), 300);
      }
      if (curPage === 'dashboard') {
        clearTimeout(window._rtDashTimer);
        window._rtDashTimer = setTimeout(renderDashboard, 300);
      }
    } catch(e) { console.warn('Realtime patch error:', e); }
  }

  // Subscribe to each table individually for broader Supabase plan compatibility
  const tables = Object.keys(TABLE_MAP);
  tables.forEach(tbl => {
    const ch = DB_CLIENT.channel('crm-' + tbl);
    ch.on('postgres_changes', { event: '*', schema: 'public', table: tbl }, handleRealtimePayload)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') console.log('[RT] subscribed:', tbl);
        if (status === 'CHANNEL_ERROR') console.warn('[RT] channel error:', tbl);
      });
  });

  // Fallback: poll every 30 seconds in case Supabase Realtime replication is not enabled
  window._pollInterval = setInterval(async () => {
    try { await load(); refreshCurrentPage(); } catch(e) {}
  }, 30000);
}

function stopRealtimeSync() {
  if (_realtimeChannel) { DB_CLIENT.removeChannel(_realtimeChannel); _realtimeChannel = null; }
  if (window._pollInterval) { clearInterval(window._pollInterval); window._pollInterval = null; }
}
