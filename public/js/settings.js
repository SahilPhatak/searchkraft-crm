// ---- PERSONAL SETTINGS PAGE ----
function openPersonalSettings() {
  closeUserPanel();
  history.pushState({ page: 'personal-settings' }, '', '#/personal-settings');
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const page = document.getElementById('page-personal-settings');
  if (page) page.classList.add('active');
  document.getElementById('topbar-title').textContent = 'Personal Settings';
  showViewSwitcher(false);
  refreshPersonalSettings();
}

function refreshPersonalSettings() {
  const u = LOGGED_IN_USER;
  const uid = getUserId(u);
  const initials = u.avatar || u.name.split(' ').map(p=>p[0]).join('').substring(0,2).toUpperCase();

  const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  set('ps-name', u.name.split(' ')[0]);
  set('ps-title-dept', (u.title||'') + ' at Searchkraft AI Labs Private Limited');
  set('ps-email', u.email||'');
  set('ps-phone', u.phone||'');
  set('ps-uid-text', uid);
  set('ps-uid-full', uid);
  set('ps-dept', u.dept||'');
  set('ps-title', u.title||'');
  set('ps-uid-text', uid);
  const statusEl = document.getElementById('ps-status');
  if (statusEl) {
    statusEl.textContent = u.status === 'active' ? 'Active' : 'Inactive';
    statusEl.style.background = u.status === 'active' ? '#E8F5E9' : '#FBE9E7';
    statusEl.style.color = u.status === 'active' ? '#2E7D32' : '#BF360C';
  }
  // Role badge
  const rb = document.getElementById('ps-role-badge');
  if (rb) {
    rb.textContent = u.role || 'User';
    const badgeMap = {
      'Super Admin': {bg:'#FFF3E0',color:'#E65100',border:'#FFCC02'},
      'Admin':       {bg:'#E3F2FD',color:'#1565C0',border:'#90CAF9'},
      'Manager':     {bg:'#E8F5E9',color:'#2E7D32',border:'#A5D6A7'},
      'User':        {bg:'#F3E5F5',color:'#6A1B9A',border:'#CE93D8'},
      'Restricted':  {bg:'#FBE9E7',color:'#BF360C',border:'#FFAB91'}
    };
    const b = badgeMap[u.role] || badgeMap['User'];
    rb.style.background = b.bg; rb.style.color = b.color; rb.style.borderColor = b.border;
  }
  // Permissions summary box
  const psPermsEl = document.getElementById('ps-permissions-box');
  if (psPermsEl) {
    const role = u.role || 'User';
    const perms = ROLE_PERMS[role] || ROLE_PERMS['User'];
    const icons = { view:'👁', create:'✚', edit:'✎', delete:'🗑', manage:'⚙' };
    const moduleLabels = { leads:'Leads', contacts:'Contacts', accounts:'Accounts', deals:'Deals', reports:'Reports', setup:'Setup' };
    psPermsEl.innerHTML = `
      <div style="font-size:13px;font-weight:700;color:var(--fg);margin-bottom:12px">Your Access Permissions — <span style="color:var(--accent)">${role}</span></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px">
        ${Object.entries(moduleLabels).map(([mod,label]) => {
          const acts = perms[mod] || [];
          const hasAny = acts.length > 0;
          return `<div style="background:${hasAny?'var(--bg)':'var(--red-bg)'};border:1px solid ${hasAny?'var(--border)':'var(--red)'};border-radius:8px;padding:10px 12px">
            <div style="font-size:11px;font-weight:700;color:${hasAny?'var(--fg)':'var(--red)'};margin-bottom:6px">${label}</div>
            ${hasAny ? acts.map(a=>`<span style="display:inline-block;font-size:10px;background:var(--accent-bg);color:var(--accent);border-radius:4px;padding:2px 6px;margin:2px">${icons[a]||''} ${a}</span>`).join('') : '<span style="font-size:11px;color:var(--red)">No access</span>'}
          </div>`;
        }).join('')}
      </div>
      ${isSuperAdmin() ? '<div style="margin-top:12px;font-size:12px;color:var(--fg3)">As Super Admin, you have full access to all modules including Setup, Audit Log and Team management.</div>' : ''}
    `;
  }
}

function switchPsTab(btn, tabId) {
  document.querySelectorAll('.ps-tab').forEach(t => {
    t.style.color = 'var(--fg2)'; t.style.borderBottomColor = 'transparent'; t.style.fontWeight = '500';
  });
  btn.style.color = 'var(--accent)'; btn.style.borderBottomColor = 'var(--accent)'; btn.style.fontWeight = '600';
  document.querySelectorAll('.ps-panel').forEach(p => p.style.display = 'none');
  const panel = document.getElementById(tabId);
  if (panel) panel.style.display = 'block';
}

function togglePsDetails() {
  const body = document.getElementById('ps-details-body');
  const arrow = document.getElementById('ps-details-arrow');
  const toggle = document.getElementById('ps-show-details-toggle');
  if (!body) return;
  const open = body.style.display !== 'none';
  body.style.display = open ? 'none' : 'block';
  if (arrow) arrow.style.transform = open ? 'rotate(0deg)' : 'rotate(180deg)';
  toggle.querySelector('span').textContent = open ? 'Show Details' : 'Hide Details';
}

function openPsEditModal() {
  const u = LOGGED_IN_USER;
  openGenericModal('Edit Profile', `
    <div class="um-field"><label class="um-label">First Name</label><input class="um-input" id="pse-first" value="${u.name.split(' ')[0]}"></div>
    <div class="um-field"><label class="um-label">Last Name</label><input class="um-input" id="pse-last" value="${u.name.split(' ').slice(1).join(' ')}"></div>
    <div class="um-field"><label class="um-label">Phone</label><input class="um-input" id="pse-phone" type="tel" value="${u.phone||''}" oninput="this.value=this.value.replace(/[^0-9+\\-() ]/g,'')"></div>
    <div class="um-field"><label class="um-label">Title</label><input class="um-input" id="pse-title" value="${u.title||''}"></div>
    <div class="um-field"><label class="um-label">Department</label><input class="um-input" id="pse-dept" value="${u.dept||''}"></div>
    <div style="display:flex;gap:10px;margin-top:18px">
      <button onclick="savePsEdit()" style="flex:1;padding:10px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">Save Changes</button>
      <button onclick="closeGenericModal()" style="padding:10px 18px;background:none;border:1.5px solid var(--border);border-radius:8px;font-size:13px;cursor:pointer;color:var(--fg2)">Cancel</button>
    </div>`);
}

function savePsEdit() {
  const first = document.getElementById('pse-first')?.value.trim();
  const last  = document.getElementById('pse-last')?.value.trim();
  const phone = document.getElementById('pse-phone')?.value.trim();
  const title = document.getElementById('pse-title')?.value.trim();
  const dept  = document.getElementById('pse-dept')?.value.trim();
  if (!first) { alert('First name is required'); return; }
  LOGGED_IN_USER.name  = first + (last ? ' '+last : '');
  LOGGED_IN_USER.phone = phone;
  LOGGED_IN_USER.title = title;
  LOGGED_IN_USER.dept  = dept;
  LOGGED_IN_USER.avatar = (first[0]+(last?last[0]:'')).toUpperCase();
  closeGenericModal();
  applyLoggedInUser(LOGGED_IN_USER);
  refreshPersonalSettings();
  showToast('Profile updated', '#2EA44F');
}

function openLocaleModal() {
  openGenericModal('Edit Locale Information', `
    <div class="um-field"><label class="um-label">Language</label>
      <select class="um-select" id="loc-lang">
        <option selected>English (United States)</option>
        <option>English (India)</option>
        <option>Hindi</option>
      </select></div>
    <div class="um-field"><label class="um-label">Country Locale</label>
      <select class="um-select" id="loc-country">
        <option selected>India</option>
        <option>United States</option>
        <option>United Kingdom</option>
      </select></div>
    <div class="um-field"><label class="um-label">Date Format</label>
      <select class="um-select" id="loc-date">
        <option selected>DD/MM/YYYY</option>
        <option>MM/DD/YYYY</option>
        <option>YYYY-MM-DD</option>
      </select></div>
    <div class="um-field"><label class="um-label">Time Format</label>
      <select class="um-select" id="loc-time">
        <option selected>12 Hours</option>
        <option>24 Hours</option>
      </select></div>
    <div class="um-field"><label class="um-label">Time Zone</label>
      <select class="um-select" id="loc-tz">
        <option selected>(GMT 5:30) India Standard Time (Asia/Kolkata)</option>
        <option>(GMT 0:00) UTC</option>
        <option>(GMT -5:00) Eastern Time</option>
      </select></div>
    <div class="um-field"><label class="um-label">Distance Unit</label>
      <select class="um-select" id="loc-dist">
        <option selected>Kilometers (km)</option>
        <option>Miles (mi)</option>
      </select></div>
    <div class="um-field"><label class="um-label">Number Format</label>
      <select class="um-select" id="loc-num">
        <option selected>1,23,456.789 (Indian)</option>
        <option>1,234,567.89 (US)</option>
        <option>1.234.567,89 (European)</option>
      </select></div>
    <div style="display:flex;gap:10px;margin-top:18px">
      <button onclick="saveLocale()" style="flex:1;padding:10px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">Save</button>
      <button onclick="closeGenericModal()" style="padding:10px 18px;background:none;border:1.5px solid var(--border);border-radius:8px;font-size:13px;cursor:pointer;color:var(--fg2)">Cancel</button>
    </div>`);
}

function saveLocale() {
  const set = (id, elId) => { const s=document.getElementById(id); const t=document.getElementById(elId); if(s&&t) t.textContent=s.value; };
  set('loc-lang','ps-locale-language');
  set('loc-country','ps-locale-country');
  set('loc-date','ps-locale-date');
  set('loc-time','ps-locale-time');
  set('loc-tz','ps-locale-tz');
  set('loc-dist','ps-locale-dist');
  set('loc-num','ps-locale-num');
  closeGenericModal();
  showToast('Locale settings saved', '#2EA44F');
}

// User profile panel
function toggleUserPanel(e) {
  e.stopPropagation();
  const p = document.getElementById('user-panel');
  p.style.display = p.style.display === 'none' ? 'block' : 'none';
}
function closeUserPanel() {
  document.getElementById('user-panel').style.display = 'none';
}
document.addEventListener('click', function(e) {
  const panel = document.getElementById('user-panel');
  const avatar = document.getElementById('tb-avatar-btn');
  if (panel && !panel.contains(e.target) && avatar && !avatar.contains(e.target)) {
    panel.style.display = 'none';
  }
  const appsPanel = document.getElementById('apps-panel');
  const appsBtn = document.getElementById('apps-panel-btn');
  if (appsPanel && !appsPanel.contains(e.target) && appsBtn && !appsBtn.contains(e.target)) {
    appsPanel.style.display = 'none';
  }
  const createPanel = document.getElementById('create-panel');
  const createBtn = document.getElementById('create-panel-btn');
  if (createPanel && !createPanel.contains(e.target) && createBtn && !createBtn.contains(e.target)) {
    createPanel.style.display = 'none';
  }
});
function setMode(mode) {
  // Apply theme to <html>
  if (mode === 'dark') {
    document.documentElement.setAttribute('data-theme','dark');
  } else if (mode === 'light') {
    document.documentElement.setAttribute('data-theme','light');
  } else {
    // auto: follow system
    document.documentElement.removeAttribute('data-theme');
  }
  // Update pill buttons
  const activeStyle = {background:'#4A7FE8', color:'#fff'};
  const inactiveStyle = {background:'none', color:'var(--fg2)'};
  const map = {day:'light', night:'dark', auto:'auto'};
  ['day','night','auto'].forEach(m => {
    const btn = document.getElementById('mode-'+m);
    if (!btn) return;
    const isActive = map[m] === mode;
    btn.style.background = isActive ? '#4A7FE8' : 'none';
    btn.style.color = isActive ? '#fff' : 'var(--fg2)';
  });
  try { localStorage.setItem('sk_mode', mode); } catch(e){}
}
function setAccent(color) {
  document.documentElement.style.setProperty('--accent', color);
  try { localStorage.setItem('sk_accent', color); } catch(e){}
}
// Restore mode/accent on load
try {
  const m = localStorage.getItem('sk_mode');
  if (m) setMode(m);
  else setMode('light'); // default day
  const a = localStorage.getItem('sk_accent');
  if (a) setAccent(a);
} catch(e){ setMode('light'); }
// Restore sidebar state
try {
  const sb = document.getElementById('sidebar');
  // Restore sidebar hidden state (new: fully hide/show, not icon-strip)
  if (localStorage.getItem('sk_sidebar_hidden') === '1' && window.innerWidth > 860) {
    sb.classList.remove('app-visible');
  }
  // Legacy: remove old collapsed class
  sb.classList.remove('collapsed');
} catch(e){}

function v(id) { const el=document.getElementById('f-'+id); return el ? el.value : ''; }

function openModal(type, id, defaults) {
  currentModal = type;
  editId = id || null;
  const cfg = MODAL_FORMS[type];
  if (!cfg) return;
  const rec = id ? DB[pluralize(type)].find(r=>r.id===id) : Object.assign({}, defaults||{});

  if (cfg.fullPage) {
    // Inject form into content-area (Zoho-style: sidebar + topbar stay, content replaced)
    const saveAndNewFn = type === 'contact' ? 'saveContactAndNew()' : type === 'company' ? 'saveAccountAndNew()' : type === 'deal' ? 'saveDealAndNew()' : 'saveLeadAndNew()';
    const contentArea = document.getElementById('content-area');
    // Hide all pages completely so their buttons don't bleed through
    contentArea.querySelectorAll('.page').forEach(p => { p.style.display = 'none'; p.style.visibility = 'hidden'; });
    // Inject or reuse form container
    let overlay = document.getElementById('lead-form-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'lead-form-overlay';
      overlay.className = 'lead-form-overlay';
      contentArea.appendChild(overlay);
    }
    overlay.innerHTML = `
      <div class="lead-form-topbar">
        <div style="display:flex;align-items:baseline;gap:12px">
          <div class="lf-title">${cfg.title(id)}</div>
          
        </div>
        <div style="margin-left:auto;display:flex;gap:8px">
          <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          <button class="btn btn-secondary" onclick="${saveAndNewFn}">Save and New</button>
          <button class="btn btn-primary" onclick="saveRecord()">Save</button>
        </div>
      </div>
      <div class="lead-form-body">
        ${cfg.fields(rec||{}, id)}
      </div>`;
    overlay.style.display = 'flex';
    if (type === 'lead') setTimeout(initDescLog, 0);
    // Update topbar title
    const ttl = cfg.fpModule ? cfg.fpModule.charAt(0).toUpperCase() + cfg.fpModule.slice(1) : cfg.title(id);
    document.getElementById('topbar-title').textContent = ttl;
    return;
  }

  document.getElementById('modal-title').textContent = cfg.title(id);
  document.getElementById('modal-body').innerHTML = cfg.fields(rec||{}, id);
  document.getElementById('modal-save').style.display = '';
  document.getElementById('modal-overlay').style.display = 'flex';
  if (type === 'lead') setTimeout(initDescLog, 0);
}

function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  const fp = document.getElementById('lead-form-overlay');
  if (fp) fp.style.display = 'none';
  // Restore hidden pages visibility
  document.querySelectorAll('#content-area .page').forEach(p => { p.style.visibility = ''; });
  // Restore the current page (only show the active one)
  const hash = window.location.hash.replace('#/','') || 'dashboard';
  renderPage(hash);
  currentModal = null; editId = null;
}

function saveLeadAndNew() {
  saveRecord();
  setTimeout(() => openModal('lead'), 50);
}

function saveContactAndNew() {
  saveRecord();
  setTimeout(() => openModal('contact'), 50);
}

function copyMailingToOther() {
  const fields = ['country','addrLine1','street','city','state','zip','lat','lng'];
  fields.forEach(f => {
    const src = document.getElementById('f-'+f);
    const dst = document.getElementById('f-'+f+'2');
    if (src && dst) {
      if (dst.tagName === 'SELECT') dst.value = src.value;
      else dst.value = src.value;
    }
  });
}

function clearMailingAddr() {
  ['country','addrLine1','street','city','state','zip','lat','lng'].forEach(f => {
    const el = document.getElementById('f-'+f);
    if (el) el.value = '';
  });
}

function clearOtherAddr() {
  ['country2','addrLine2','street2','city2','state2','zip2','lat2','lng2'].forEach(f => {
    const el = document.getElementById('f-'+f);
    if (el) el.value = '';
  });
}

function saveAccountAndNew() {
  saveRecord();
  setTimeout(() => openModal('company'), 50);
}

function saveDealAndNew() {
  saveRecord();
  setTimeout(() => openModal('deal'), 50);
}

function copyBillingToShipping() {
  const map = {billingCountry:'shippingCountry',billingFlat:'shippingFlat',billingStreet:'shippingStreet',billingCity:'shippingCity',billingState:'shippingState',billingZip:'shippingZip',billingLat:'shippingLat',billingLng:'shippingLng'};
  Object.entries(map).forEach(([src,dst]) => {
    const s = document.getElementById('f-'+src), d = document.getElementById('f-'+dst);
    if (s && d) d.value = s.value;
  });
}

function clearBillingAddr() {
  ['billingCountry','billingFlat','billingStreet','billingCity','billingState','billingZip','billingLat','billingLng'].forEach(f => {
    const el = document.getElementById('f-'+f); if (el) el.value = '';
  });
}

function clearShippingAddr() {
  ['shippingCountry','shippingFlat','shippingStreet','shippingCity','shippingState','shippingZip','shippingLat','shippingLng'].forEach(f => {
    const el = document.getElementById('f-'+f); if (el) el.value = '';
  });
}

function saveRecord() {
  if (!currentModal) return;
  MODAL_FORMS[currentModal].save(editId);
}

function pluralize(t) {
  const map = { company:'companies', contact:'contacts', lead:'leads', job:'jobs', candidate:'candidates', submission:'submissions', interview:'interviews', offer:'offers', task:'tasks', activity:'activities', invoice:'invoices', user:'users' };
  return map[t] || t+'s';
}

// Table name map: JS collection name → Supabase table name
const SUPA_TABLE = {
  companies: 'companies', contacts: 'contacts', leads: 'leads',
  deals: 'deals', tasks: 'tasks', activities: 'activities',
  documents: 'documents',
  users: 'profiles', audit: 'audit_logs', invoices: null
};

// Exact columns that exist in each Supabase table
const SUPA_COLS = {
  leads: ['id','name','email','phone','company','title','source','stage','value','notes',
    'owner','owner_id','created_at','updated_at','salutation','first_name','last_name','email2',
    'website','skype','twitter','industry','num_employees','annual_revenue','email_opt_out',
    'handover_date','followup_date','lane','source_sd','lead_type','lead_category','month','handover_done','client_name',
    'compensation','client_type','delivery_poc','agreement','num_positions','commercials_signed',
    'followup_status','followup_notes',
    'country','addr_line1','street','city','state','zip','lat','lng','description'],
  contacts: ['id','name','email','phone','title','dept','company','company_id','owner','owner_id','created_at','updated_at'],
  companies: ['id','name','industry','website','phone','employees','revenue','address','city','state','country','status','bd_owner','owner_id','created_at','updated_at',
    'fax','account_site','parent_account','account_number','ticker_symbol','account_type','ownership','annual_revenue','sic_code','delivery_pillar',
    'billing_country','billing_flat','billing_street','billing_city','billing_state','billing_zip','billing_lat','billing_lng',
    'shipping_country','shipping_flat','shipping_street','shipping_city','shipping_state','shipping_zip','shipping_lat','shipping_lng','description'],
  deals: ['id','name','stage','amount','value','expected_revenue','currency','close_date','probability','source','notes','contact','contact_id','company','company_id','owner','owner_id','won_at','lost_at','lost_reason','candidate_name','contact_name','next_step','campaign','deal_type','created_at','updated_at'],
  tasks: ['id','title','type','description','due_date','status','priority','owner','owner_id','lead_id','contact_id','deal_id','related_to','completed_at','created_at','updated_at'],
  activities: ['id','type','subject','summary','description','date','time','duration','outcome','owner','owner_id','contact','lead_id','contact_id','deal_id','created_at','updated_at'],
  documents: ['id','name','client_id','client_name','category','stage','status','file_type','file_size','file_url','uploaded_by','owner_id','description','reference_number','start_date','expiry_date','created_at','updated_at'],
  profiles: ['id','name','email','role','title','dept','phone','avatar','color','status','online','created_at','updated_at'],
};

// camelCase → snake_case field name map
const CAMEL_TO_SNAKE = {
  createdAt:'created_at', updatedAt:'updated_at', closeDate:'close_date',
  dueDate:'due_date', companyId:'company_id', companyName:'company',
  contactId:'contact_id', ownerId:'owner_id', leadId:'lead_id',
  dealId:'deal_id', bdOwner:'bd_owner', handoverDate:'handover_date',
  followupDate:'followup_date', firstName:'first_name', lastName:'last_name',
  numEmployees:'num_employees', annualRevenue:'annual_revenue',
  emailOptOut:'email_opt_out', addrLine1:'addr_line1', handoverDone:'handover_done',
  clientName:'client_name', clientType:'client_type', deliveryPOC:'delivery_poc',
  numPositions:'num_positions', commercialsSigned:'commercials_signed',
  sourceSD:'source_sd', leadType:'lead_type', wonAt:'won_at', lostAt:'lost_at', lostReason:'lost_reason',
  followupStatus:'followup_status', followupNotes:'followup_notes',
  candidateName:'candidate_name', contactName:'contact_name', nextStep:'next_step',
  dealType:'deal_type',
  completedAt:'completed_at', expectedRevenue:'expected_revenue', relatedTo:'related_to',
  clientId:'client_id', clientName:'client_name', fileType:'file_type', fileSize:'file_size',
  fileUrl:'file_url', uploadedBy:'uploaded_by', referenceNumber:'reference_number',
  startDate:'start_date', expiryDate:'expiry_date'
};

// Convert app data to Supabase payload: camelCase→snake_case, whitelist only known columns
// Fields that must be stored as numeric (float) in Supabase
const FLOAT_COLS = new Set(['probability','amount','value','expected_revenue','lat','lng','annual_revenue','revenue']);
function toSupabase(collection, data) {
  const tbl = SUPA_TABLE[collection];
  const allowed = SUPA_COLS[tbl] || SUPA_COLS[collection] || null;
  const d = {};
  Object.entries(data).forEach(([k, v]) => {
    const sk = CAMEL_TO_SNAKE[k] || k; // convert to snake_case if mapping exists
    if (!allowed || allowed.includes(sk)) {
      if (v !== undefined && v !== null && v !== '') {
        // Cast to float for numeric columns so decimals don't fail integer columns
        d[sk] = FLOAT_COLS.has(sk) ? parseFloat(v) : v;
      }
      else if (v === false || v === 0) d[sk] = v; // keep false/0
    }
  });
  return d;
}

async function upsert(collection, id, data) {
  const now = new Date().toISOString();
  let mergedData;
  if (id) {
    // Always merge with the full existing record so no fields get wiped on edit
    const existing = DB[collection].find(r=>r.id===id) || {};
    mergedData = { ...existing, ...data, id, updatedAt: now, updated_at: now };
    const i = DB[collection].findIndex(r=>r.id===id);
    if (i>=0) DB[collection][i] = mergedData;
    audit('Update', collection, data.name||data.title||id);
  } else {
    const newId = uid();
    mergedData = { id: newId, createdAt: now, created_at: now, updatedAt: now, updated_at: now, ...data };
    DB[collection].unshift(mergedData);
    audit('Create', collection, data.name||data.title||newId);
    id = newId;
  }
  // Persist to Supabase — await so errors surface immediately
  const tbl = SUPA_TABLE[collection];
  if (tbl) {
    const payload = toSupabase(collection, mergedData);
    const { error } = await DB_CLIENT.from(tbl).upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('Supabase upsert error:', error.message, payload);
      if (typeof showToast === 'function') showToast('⚠️ Save failed: ' + error.message, '#dc2626');
      // DO NOT close modal — let user retry
      return;
    }
  }
  // Auto-sync lead → contact on every lead save
  // Won lead → Account sync is handled ONLY by the Supabase DB trigger (won_lead_sync_v2.sql)
  // Do NOT call syncWonLeadToContactAndAccount here — it causes duplicate contacts
  if (collection === 'leads') {
    syncLeadToContact(mergedData);
  }

  closeModal();
  refreshCurrentPage();
}

// Mirror a lead record into the contacts collection automatically.
// Matches on email (most reliable key). Creates a new contact if none exists.
async function syncLeadToContact(lead) {
  if (!lead.email) return; // can't link without email

  const now = new Date().toISOString();

  // Build the contact payload from lead fields
  const contactData = {
    firstName:   lead.firstName   || '',
    lastName:    lead.lastName    || lead.clientName || '',
    name:        lead.name        || lead.clientName || [lead.firstName, lead.lastName].filter(Boolean).join(' '),
    email:       lead.email,
    email2:      lead.email2      || '',
    phone:       lead.phone       || '',
    title:       lead.title       || '',
    company:     lead.company || lead.companyName || lead.clientName || '',
    industry:    lead.industry    || '',
    source:      lead.source      || '',
    owner:       lead.owner       || '',
    country:     lead.country     || '',
    city:        lead.city        || '',
    state:       lead.state       || '',
    zip:         lead.zip         || '',
    addrLine1:   lead.addrLine1   || '',
    street:      lead.street      || '',
    description: lead.description || '',
    leadId:      lead.id,           // keep reference back to the lead
    syncedFromLead: true,
  };

  // Check if a contact with this email already exists
  const existing = DB.contacts.find(c => c.email && c.email.toLowerCase() === lead.email.toLowerCase());

  if (existing) {
    // Update the existing contact (merge — don't overwrite manual edits to contact-only fields)
    const merged = { ...existing, ...contactData, id: existing.id, updatedAt: now, updated_at: now };
    const idx = DB.contacts.findIndex(c => c.id === existing.id);
    if (idx >= 0) DB.contacts[idx] = merged;
    // Persist to Supabase
    const tbl = SUPA_TABLE['contacts'];
    if (tbl) {
      const payload = toSupabase('contacts', merged);
      const { error } = await DB_CLIENT.from(tbl).upsert(payload, { onConflict: 'id' });
      if (error) console.warn('Lead→Contact sync update failed:', error.message);
    }
  } else {
    // Create new contact
    const newId = uid();
    const newContact = { id: newId, createdAt: now, created_at: now, updatedAt: now, updated_at: now, ...contactData };
    DB.contacts.unshift(newContact);
    const tbl = SUPA_TABLE['contacts'];
    if (tbl) {
      const payload = toSupabase('contacts', newContact);
      const { error } = await DB_CLIENT.from(tbl).upsert(payload, { onConflict: 'id' });
      if (error) console.warn('Lead→Contact sync create failed:', error.message);
    }
  }
}

// [Won lead → Contact + Account is handled by Supabase DB trigger: supabase/won_lead_sync.sql]
// Keeping this stub so any accidental calls fail gracefully
async function syncWonLeadToContactAndAccount(lead) {
  const now = new Date().toISOString();

  // ── 1. CONTACT sync ──────────────────────────────────────────────
  const contactData = {
    firstName:   lead.firstName   || '',
    lastName:    lead.lastName    || lead.clientName || '',
    name:        lead.name        || [lead.firstName, lead.lastName].filter(Boolean).join(' ') || lead.clientName || '',
    email:       lead.email       || '',
    email2:      lead.email2      || '',
    phone:       lead.phone       || '',
    title:       lead.title       || '',
    company:     lead.company || lead.companyName || lead.clientName || '',
    industry:    lead.industry    || '',
    source:      lead.source      || '',
    owner:       lead.owner       || '',
    country:     lead.country     || '',
    city:        lead.city        || '',
    state:       lead.state       || '',
    zip:         lead.zip         || '',
    addrLine1:   lead.addrLine1   || '',
    street:      lead.street      || '',
    description: lead.description || '',
    leadId:      lead.id,
    syncedFromLead: true,
  };

  // Match on email first, then name+company
  const existingContact = lead.email
    ? DB.contacts.find(c => c.email && c.email.toLowerCase() === lead.email.toLowerCase())
    : DB.contacts.find(c => c.name && c.name.toLowerCase() === contactData.name.toLowerCase() &&
        (!c.company || c.company.toLowerCase() === contactData.company.toLowerCase()));

  if (existingContact) {
    const merged = { ...existingContact, ...contactData, id: existingContact.id, updatedAt: now, updated_at: now };
    const idx = DB.contacts.findIndex(c => c.id === existingContact.id);
    if (idx >= 0) DB.contacts[idx] = merged;
    const tbl = SUPA_TABLE['contacts'];
    if (tbl) {
      const { error } = await DB_CLIENT.from(tbl).upsert(toSupabase('contacts', merged), { onConflict: 'id' });
      if (error) console.warn('Won lead→Contact update failed:', error.message);
    }
  } else {
    const newId      = uid();
    const newContact = { id: newId, createdAt: now, created_at: now, updatedAt: now, updated_at: now, ...contactData };
    DB.contacts.unshift(newContact);
    const tbl = SUPA_TABLE['contacts'];
    if (tbl) {
      const { error } = await DB_CLIENT.from(tbl).upsert(toSupabase('contacts', newContact), { onConflict: 'id' });
      if (error) console.warn('Won lead→Contact create failed:', error.message);
    }
  }

  // ── 2. ACCOUNT (Company) sync ─────────────────────────────────────
  const companyName = lead.companyName || lead.clientName || '';
  if (companyName) {
    const accountData = {
      name:        companyName,
      industry:    lead.industry    || '',
      source:      lead.source      || '',
      bdOwner:     lead.owner       || lead.bdOwner || '',  // lead_owner → bd_owner in accounts
      website:     lead.website     || '',
      phone:       lead.phone       || '',
      country:     lead.country     || '',
      city:        lead.city        || '',
      state:       lead.state       || '',
      description: lead.description || '',
      status:      'Active',
      leadId:      lead.id,
      syncedFromLead: true,
    };

    const existingCompany = DB.companies.find(c =>
      c.name && c.name.toLowerCase() === companyName.toLowerCase()
    );

    if (existingCompany) {
      // Only fill in blank fields — don't overwrite manually entered data
      const merged = {
        ...existingCompany,
        industry:  existingCompany.industry  || accountData.industry,
        source:    existingCompany.source    || accountData.source,
        bdOwner:   existingCompany.bdOwner   || accountData.bdOwner,
        website:   existingCompany.website   || accountData.website,
        phone:     existingCompany.phone     || accountData.phone,
        country:   existingCompany.country   || accountData.country,
        city:      existingCompany.city      || accountData.city,
        state:     existingCompany.state     || accountData.state,
        status:    existingCompany.status    || 'Active',
        id: existingCompany.id, updatedAt: now, updated_at: now
      };
      const idx = DB.companies.findIndex(c => c.id === existingCompany.id);
      if (idx >= 0) DB.companies[idx] = merged;
      const tbl = SUPA_TABLE['companies'];
      if (tbl) {
        const { error } = await DB_CLIENT.from(tbl).upsert(toSupabase('companies', merged), { onConflict: 'id' });
        if (error) console.warn('Won lead→Account update failed:', error.message);
      }
    } else {
      const newId      = uid();
      const newCompany = { id: newId, createdAt: now, created_at: now, updatedAt: now, updated_at: now, ...accountData };
      DB.companies.unshift(newCompany);
      const tbl = SUPA_TABLE['companies'];
      if (tbl) {
        const { error } = await DB_CLIENT.from(tbl).upsert(toSupabase('companies', newCompany), { onConflict: 'id' });
        if (error) console.warn('Won lead→Account create failed:', error.message);
      }
    }
  }
}

async function deleteCRMRecord(collection, id) {
  // Check delete permission via canDo() — respects custom permissions set by admin
  const moduleMap = { companies:'accounts', contacts:'contacts', leads:'leads', deals:'deals', tasks:'tasks', activities:'activities', documents:'documents' };
  const mod = moduleMap[collection] || collection;
  if (!canDo(mod, 'delete')) {
    alert('Permission denied: you do not have delete access for this module.');
    return;
  }
  const rec = DB[collection].find(r=>r.id===id);
  const label = rec?.name||rec?.title||id;
  if (!confirm(`Delete "${label}"? This cannot be undone.`)) return;
  DB[collection] = DB[collection].filter(r=>r.id!==id);
  audit('Delete', collection, label);
  const tbl = SUPA_TABLE[collection];
  if (tbl) {
    DB_CLIENT.from(tbl).delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('Supabase delete error:', error.message); });
  }
  refreshCurrentPage();
}

function refreshCurrentPage() {
  const active = document.querySelector('.nav-item.active');
  if (active) renderPage(active.dataset.page);
}

// ---- QUICK ADD PANEL ----
const qapBtn = document.getElementById('quick-add-btn');
const qapPanel = document.getElementById('quick-add-panel');

if (qapBtn && qapPanel) {
  qapBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = qapPanel.style.display !== 'none';
    qapPanel.style.display = isOpen ? 'none' : 'block';
    if (!isOpen) {
      const qs = document.getElementById('qap-search');
      if (qs) { qs.value = ''; filterQAP(''); setTimeout(() => qs.focus(), 50); }
    }
  });
}

document.addEventListener('click', (e) => {
  if (qapPanel && qapBtn && !qapPanel.contains(e.target) && e.target !== qapBtn) {
    qapPanel.style.display = 'none';
  }
});

function qapCreate(type, page) {
  qapPanel.style.display = 'none';
  // Navigate to the page first, then open modal
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const navBtn = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navBtn) navBtn.classList.add('active');
  document.getElementById('topbar-title').textContent = document.querySelector(`[data-page="${page}"]`)?.textContent?.trim() || '';
  renderPage(page);
  setTimeout(() => openModal(type), 80);
}

function filterQAP(q) {
  const term = q.toLowerCase();
  document.querySelectorAll('.qap-item').forEach(el => {
    const text = (el.textContent + ' ' + (el.dataset.label||'')).toLowerCase();
    el.style.display = (!term || text.includes(term)) ? '' : 'none';
  });
}


