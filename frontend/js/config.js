// ============================================================
//  SearchKraft - CRM — Application Logic
// ============================================================

// ---- SUPABASE CLIENT ----
const SUPA_URL  = 'https://yeidlmkdwyiqavkxnlhs.supabase.co';
const SUPA_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllaWRsbWtkd3lpcWF2a3hubGhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0MjE0OTAsImV4cCI6MjEwODk5NzQ5MH0.7yBHL273FCl9oQYmhxET5QKn3AbW44yh7Zxr2nrb2LE';
const DB_CLIENT = window.supabase.createClient(SUPA_URL, SUPA_KEY);

// ---- DATA STORE (local cache, synced from Supabase) ----
let DB = {
  companies: [], contacts: [], leads: [], deals: [], activities: [],
  tasks: [], invoices: [], documents: [], users: [], audit: []
};

let currentModal = null;
let editId = null;
let taskFilter = 'pending';
const TEAM_MEMBERS = ['Sahil', 'Priya', 'Rahul', 'Neha', 'Arjun'];

// ---- CURRENT USER (logged-in session) ----
// Derived from SETUP_USERS; index determines User ID (SK-0001, SK-0002, …)
function getUserId(user) {
  const idx = SETUP_USERS.findIndex(u => u.id === user.id);
  return 'SK-' + String(idx + 1).padStart(4, '0');
}

let LOGGED_IN_USER = null; // set after auth

function getCurrentUser() {
  return LOGGED_IN_USER ? LOGGED_IN_USER.name.split(' ')[0] : '';
}

function getCurrentUserFull() {
  return LOGGED_IN_USER || {};
}

// ---- ROLE HELPERS ----
function isSuperAdmin() { return LOGGED_IN_USER && LOGGED_IN_USER.role === 'Super Admin'; }
function isAdminOrAbove() { return LOGGED_IN_USER && ['Super Admin','Admin'].includes(LOGGED_IN_USER.role); }
function isManagerOrAbove() { return LOGGED_IN_USER && ['Super Admin','Admin','Manager'].includes(LOGGED_IN_USER.role); }
function canDo(module, action) {
  if (!LOGGED_IN_USER) return false;
  if (isSuperAdmin()) return true; // Super Admin always has full access
  // Per-user custom permissions override role defaults
  if (LOGGED_IN_USER.custom_perms && LOGGED_IN_USER.custom_perms[module] !== undefined) {
    return (LOGGED_IN_USER.custom_perms[module] || []).includes(action);
  }
  const role = LOGGED_IN_USER.role || 'User';
  const perms = ROLE_PERMS[role] || ROLE_PERMS['User'];
  return (perms[module] || []).includes(action);
}

// Get effective perms for a user (custom overrides role default)
function getEffectivePerms(u) {
  if (!u) return {};
  if (u.role === 'Super Admin') return ROLE_PERMS['Super Admin'];
  if (u.custom_perms) return u.custom_perms;
  return ROLE_PERMS[u.role] || ROLE_PERMS['User'];
}

// Map nav page names → module permission key
const PAGE_MODULE_MAP = {
  leads: 'leads', contacts: 'contacts', accounts: 'accounts',
  deals: 'deals', reports: 'reports', setup: 'setup',
  activities: 'activities', documents: 'documents',
  dashboard: null, audit: null, team: null, 'personal-settings': null
};

// Apply nav visibility based on role + custom_perms (called after login and after saving perms)
function applyNavPermissions() {
  // Admin-only nav items (by role only — not overridable by custom_perms)
  const adminOnlyPages = ['audit', 'setup', 'team'];
  adminOnlyPages.forEach(p => {
    const btn = document.querySelector(`.nav-item[data-page="${p}"]`);
    if (btn) btn.style.display = isAdminOrAbove() ? '' : 'none';
  });
  // Module-gated pages: hide nav + block access if user lacks 'view' permission
  const modulePages = ['leads','contacts','accounts','deals','reports','activities','documents'];
  modulePages.forEach(p => {
    const btn = document.querySelector(`.nav-item[data-page="${p}"]`);
    if (!btn) return;
    const canView = canDo(p, 'view');
    btn.style.display = canView ? '' : 'none';
  });
}

// Guard navigation — redirect if user doesn't have access
function hasPageAccess(page) {
  const adminOnlyPages = ['audit', 'setup', 'team'];
  if (adminOnlyPages.includes(page) && !isAdminOrAbove()) return false;
  const modulePages = ['leads','contacts','accounts','deals','reports','activities','documents'];
  if (modulePages.includes(page) && !canDo(page, 'view')) return false;
  return true;
}

function applyLoggedInUser(user) {
  LOGGED_IN_USER = user;
  const initials = user.avatar || (user.name.split(' ').map(p=>p[0]).join('').substring(0,2).toUpperCase());
  const uid = getUserId(user);

  // Topbar avatar: initials + tooltip
  const avatarBtn = document.getElementById('tb-avatar-btn');
  if (avatarBtn) {
    avatarBtn.title = user.name + ' · ' + uid;
    avatarBtn.style.background = 'linear-gradient(135deg,' + user.color + ',' + user.color + 'cc)';
    avatarBtn.childNodes[0].textContent = initials;
  }

  // User panel header
  const upName = document.getElementById('up-user-name');
  const upUid  = document.getElementById('up-user-id');
  const upRole = document.getElementById('up-user-role');
  const upInitials = document.getElementById('up-user-initials');
  if (upName) upName.textContent = user.name;
  if (upUid)  upUid.textContent  = 'User ID: ' + uid;
  if (upRole) upRole.textContent = user.role || 'User';
  if (upInitials) { upInitials.textContent = initials; upInitials.style.color = user.color; }
  // Apply nav permissions after role is known
  applyNavPermissions();

  // Welcome banner name (update immediately so no flash of old name)
  const welcomeNameEl = document.getElementById('dash-welcome-name');
  if (welcomeNameEl) welcomeNameEl.textContent = 'Welcome, ' + user.name.split(' ')[0] + ' 👋';

  // Workqueue mini-avatar
  const wqA = document.getElementById('wq-user-avatar');
  const wqN = document.getElementById('wq-user-name');
  if (wqA) wqA.textContent = initials;
  if (wqN) wqN.textContent = user.name.split(' ')[0];

}
// Get all team member names dynamically from DB.users
function getTeamNames() {
  return DB.users && DB.users.length ? DB.users.map(u => u.name.split(' ')[0]) : TEAM_MEMBERS;
}
// Owner field: locked to current user when creating new, editable dropdown when editing
function ownerField(fieldId, currentVal, isEdit) {
  const cu = getCurrentUser();
  const names = getTeamNames();
  if (!isEdit) {
    // Creating new: show current user, read-only badge + hidden input
    return `<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--accent-bg);border:1px solid var(--accent);border-radius:6px;font-size:13px;color:var(--accent);font-weight:500">
      <span>👤</span> ${cu}
      <input type="hidden" id="f-${fieldId}" value="${cu}">
    </div>`;
  }
  // Editing: full dropdown
  return `<select id="f-${fieldId}">${names.map(m=>`<option ${(currentVal||cu)===m?'selected':''}>${m}</option>`).join('')}</select>`;
}
// Delivery SPOC: always a dropdown from live team names
function deliveryField(fieldId, currentVal) {
  const names = getTeamNames();
  const cu = getCurrentUser();
  return `<select id="f-${fieldId}">${names.map(m=>`<option ${(currentVal||cu)===m?'selected':''}>${m}</option>`).join('')}</select>`;
}

// ---- SUPABASE DATA SYNC ----
// save() — upserts a single record into Supabase, then updates local DB cache
async function saveRecord(table, record) {
  try {
    const { error } = await DB_CLIENT.from(table).upsert(record, { onConflict: 'id' });
    if (error) console.error('Supabase save error:', error.message);
  } catch(e) { console.error('saveRecord failed:', e); }
}

async function deleteRecord(table, id) {
  try {
    const { error } = await DB_CLIENT.from(table).delete().eq('id', id);
    if (error) console.error('Supabase delete error:', error.message);
  } catch(e) { console.error('deleteRecord failed:', e); }
}

// load() — fetches all CRM data from Supabase into local DB cache
// Graceful: if a table doesn't exist yet, that collection stays empty
async function load() {
  const safe = async (query, label) => {
    try {
      const r = await query;
      if (r.error) {
        console.error(`load() failed for [${label}]:`, r.error.message);
        return null; // null = failed, don't overwrite existing DB cache
      }
      return r.data || [];
    }
    catch(e) { console.error(`load() exception [${label}]:`, e); return null; }
  };
  const [leads, contacts, companies, deals, tasks, activities, users, documents, auditRows] = await Promise.all([
    safe(DB_CLIENT.from('leads').select('*').order('created_at', { ascending: false }), 'leads'),
    safe(DB_CLIENT.from('contacts').select('*').order('created_at', { ascending: false }), 'contacts'),
    safe(DB_CLIENT.from('companies').select('*').order('created_at', { ascending: false }), 'companies'),
    safe(DB_CLIENT.from('deals').select('*').order('created_at', { ascending: false }), 'deals'),
    safe(DB_CLIENT.from('tasks').select('*').order('created_at', { ascending: false }), 'tasks'),
    safe(DB_CLIENT.from('activities').select('*').order('created_at', { ascending: false }), 'activities'),
    safe(DB_CLIENT.from('profiles').select('*').order('created_at', { ascending: true }), 'profiles'),
    safe(DB_CLIENT.from('documents').select('*').order('created_at', { ascending: false }), 'documents'),
    safe(DB_CLIENT.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200), 'audit_logs'),
  ]);
  // Normalize snake_case from Supabase → camelCase used throughout the app
  const norm = (r) => ({
    ...r,
    createdAt:        r.createdAt        || r.created_at,
    updatedAt:        r.updatedAt        || r.updated_at,
    closeDate:        r.closeDate        || r.close_date,
    dueDate:          r.dueDate          || r.due_date,
    due:              r.due              || r.due_date,
    companyId:        r.companyId        || r.company_id,
    companyName:      r.companyName      || r.company,
    contactId:        r.contactId        || r.contact_id,
    ownerId:          r.ownerId          || r.owner_id,
    leadId:           r.leadId           || r.lead_id,
    dealId:           r.dealId           || r.deal_id,
    bdOwner:          r.bdOwner          || r.bd_owner,
    firstName:        r.firstName        || r.first_name,
    lastName:         r.lastName         || r.last_name,
    numEmployees:     r.numEmployees     || r.num_employees,
    annualRevenue:    r.annualRevenue    || r.annual_revenue,
    emailOptOut:      r.emailOptOut      ?? r.email_opt_out,
    handoverDate:     r.handoverDate     || r.handover_date,
    followupDate:     r.followupDate     || r.followup_date,
    handoverDone:     r.handoverDone     ?? r.handover_done,
    clientName:       r.clientName       || r.client_name,
    clientType:       r.clientType       || r.client_type,
    deliveryPOC:      r.deliveryPOC      || r.delivery_poc,
    numPositions:     r.numPositions     || r.num_positions,
    commercialsSigned:r.commercialsSigned?? r.commercials_signed,
    followupStatus:   r.followupStatus   || r.followup_status,
    followupNotes:    r.followupNotes    || r.followup_notes,
    sourceSD:         r.sourceSD         || r.source_sd,
    leadType:         r.leadType         || r.lead_type,
    addrLine1:        r.addrLine1        || r.addr_line1,
    wonAt:            r.wonAt            || r.won_at,
    lostAt:           r.lostAt           || r.lost_at,
    lostReason:       r.lostReason       || r.lost_reason,
    completedAt:      r.completedAt      || r.completed_at,
    relatedTo:        r.relatedTo        || r.related_to,
    amount:           (r.amount != null && r.amount !== '') ? r.amount : r.value,
    expectedRevenue:  (r.expectedRevenue != null && r.expectedRevenue !== '') ? r.expectedRevenue : r.expected_revenue,
    probability:      r.probability      !== undefined ? r.probability      : r.probability_pct,
    // documents
    clientId:         r.clientId         || r.client_id,
    clientName:       r.clientName       || r.client_name,
    fileType:         r.fileType         || r.file_type,
    fileSize:         r.fileSize         || r.file_size,
    fileUrl:          r.fileUrl          || r.file_url,
    uploadedBy:       r.uploadedBy       || r.uploaded_by,
    referenceNumber:  r.referenceNumber  || r.reference_number,
    startDate:        r.startDate        || r.start_date,
    expiryDate:       r.expiryDate       || r.expiry_date,
    candidateName:    r.candidateName    || r.candidate_name,
    contactName:      r.contactName      || r.contact_name,
    nextStep:         r.nextStep         || r.next_step,
    dealType:         r.dealType         || r.deal_type,
    custom_perms:           r.custom_perms            || null,
    force_password_change:  r.force_password_change   || false,
  });
  // Only overwrite DB cache if Supabase returned data (null = query failed, keep existing cache)
  if (leads      !== null) DB.leads      = leads.map(norm);
  if (contacts   !== null) DB.contacts   = contacts.map(norm);
  if (companies  !== null) DB.companies  = companies.map(norm);
  if (deals      !== null) DB.deals      = deals.map(norm);
  if (tasks      !== null) DB.tasks      = tasks.map(norm);
  if (activities !== null) DB.activities = activities.map(norm);
  if (users      !== null) DB.users      = users.map(norm);
  if (documents  !== null) DB.documents  = documents.map(norm);
  // Load audit log from Supabase (merge with any in-memory entries from this session)
  const auditFromDB = (auditRows||[]).map(r => ({
    id: r.id, ts: r.created_at, user: r.user_name, action: r.action, module: r.module, record: r.record_name
  }));
  const existingIds = new Set(auditFromDB.map(r => r.id));
  DB.audit = [...DB.audit.filter(r => !existingIds.has(r.id)), ...auditFromDB]
    .sort((a,b) => (b.ts||'').localeCompare(a.ts||'')).slice(0, 500);
  updateNavBadges();
}

// Legacy save() — kept for compatibility; actual saves go through saveRecord()
function save() {
  // no-op: data is saved directly to Supabase via saveRecord()
}

async function audit(action, module, record) {
  const user = LOGGED_IN_USER;
  const entry = {
    id: uid(),
    ts: new Date().toISOString(),
    user: user ? user.name : 'System',
    action, module,
    record: record || '',
    user_id: user ? user.supaId || null : null
  };
  DB.audit.unshift(entry);
  if (DB.audit.length > 500) DB.audit = DB.audit.slice(0, 500);
  // Persist to Supabase audit_logs table
  try {
    DB_CLIENT.from('audit_logs').insert({
      id: entry.id,
      user_name: entry.user,
      user_id: entry.user_id,
      action: entry.action,
      module: entry.module,
      record_name: entry.record,
      created_at: entry.ts
    }).then(({ error }) => { if (error) console.warn('Audit log write:', error.message); });
  } catch(e) { /* silent — audit is best-effort */ }
}
function uid() {
  // Generate a proper UUID v4 for Supabase compatibility
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}
// Shared SVG icons for table action buttons
const ICON_EDIT  = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
const ICON_TRASH = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;

function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmt(n) { const num = Number(n)||0; return '₹' + num.toLocaleString('en-IN', {maximumFractionDigits:2}); }
function fmtDate(d) { if(!d) return '—'; try { return new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}); } catch(e) { return d; } }
function today() { return new Date().toISOString().slice(0,10); }
function isToday(d) { return d && d.slice(0,10) === today(); }
function isOverdue(d) { return d && d.slice(0,10) < today(); }

// ---- STAGE CONFIGS ----
const LEAD_STAGES = ['New','Contacted','Pre Qualified','Qualified','Not Qualified','Junk Lead','Proposal Sent','Negotiation','Follow Up','Won','Lost','Lost Lead'];
const DEAL_STAGES = ['Offered','Joined','Absconded','Declined'];
// Stages that count as "won" for revenue calculations
const WON_STAGES  = new Set(['Joined']);
// Stages that count as "lost"
const LOST_STAGES = new Set(['Absconded','Declined']);
// Active pipeline stages (not won, not lost)
function isWon(d)    { return WON_STAGES.has(d.stage); }
function isLost(d)   { return LOST_STAGES.has(d.stage); }
function isActive(d) { return !isWon(d) && !isLost(d); }
const BADGE_MAP = {
  'Active':'badge-green','Prospect':'badge-blue','Inactive':'badge-gray',
  'Won':'badge-green','Lost':'badge-red','New':'badge-blue','Contacted':'badge-amber',
  'Qualified':'badge-purple','Proposal Sent':'badge-amber','Negotiation':'badge-amber',
  'Sourced':'badge-gray','Submitted':'badge-blue','L1 Interview':'badge-purple',
  'L2 Interview':'badge-purple','L3 Interview':'badge-purple',
  'Offer':'badge-amber','Joined':'badge-green','Dropped':'badge-red',
  'Open':'badge-green','On Hold':'badge-amber','Closed':'badge-gray','Filled':'badge-blue',
  'Pending':'badge-amber','Paid':'badge-green','Overdue':'badge-red',
  'Scheduled':'badge-blue','Completed':'badge-green','Cancelled':'badge-red','No Show':'badge-red',
  'Extended':'badge-amber','Declined':'badge-red','Accepted':'badge-green',
  'Done':'badge-green','In Progress':'badge-blue'
};
function badge(s) { const c = BADGE_MAP[s]||'badge-gray'; return `<span class="badge ${c}">${s}</span>`; }

// ---- SEED DATA ----
function seedData() {
  if (DB.companies.length) return;
  const cos = [
    { id:uid(), name:'Tata Consultancy Services', industry:'IT Services', city:'Mumbai', status:'Active', bdOwner:'Rahul', website:'tcs.com' },
    { id:uid(), name:'Infosys Ltd', industry:'IT Services', city:'Bengaluru', status:'Active', bdOwner:'Sahil', website:'infosys.com' },
    { id:uid(), name:'HDFC Bank', industry:'Banking & Finance', city:'Mumbai', status:'Prospect', bdOwner:'Priya', website:'hdfcbank.com' },
    { id:uid(), name:'Flipkart', industry:'E-Commerce', city:'Bengaluru', status:'Active', bdOwner:'Rahul', website:'flipkart.com' },
    { id:uid(), name:'Ola Cabs', industry:'Mobility Tech', city:'Bengaluru', status:'Prospect', bdOwner:'Neha', website:'olacabs.com' },
  ];
  DB.companies = cos;

  DB.contacts = [
    { id:uid(), name:'Anita Sharma', title:'VP HR', companyId:cos[0].id, email:'anita@tcs.com', phone:'9876543210' },
    { id:uid(), name:'Rohan Mehta', title:'TA Head', companyId:cos[1].id, email:'rohan@infosys.com', phone:'9876543211' },
    { id:uid(), name:'Deepa Nair', title:'HR Director', companyId:cos[2].id, email:'deepa@hdfc.com', phone:'9876543212' },
    { id:uid(), name:'Kiran Patel', title:'Talent Manager', companyId:cos[3].id, email:'kiran@flipkart.com', phone:'9876543213' },
  ];

  DB.leads = [
    { id:uid(), title:'Senior Engineers Mandate', companyId:cos[0].id, value:800000, stage:'Qualified', owner:'Rahul' },
    { id:uid(), title:'Data Science Team Build', companyId:cos[1].id, value:1200000, stage:'Proposal Sent', owner:'Sahil' },
    { id:uid(), title:'Risk & Compliance Roles', companyId:cos[2].id, value:600000, stage:'New', owner:'Priya' },
    { id:uid(), title:'Product Managers x3', companyId:cos[3].id, value:900000, stage:'Won', owner:'Rahul' },
    { id:uid(), title:'Driver App Engineers', companyId:cos[4].id, value:400000, stage:'Contacted', owner:'Neha' },
  ];

  const d = new Date(); const fmt2 = (offset)=>{ const dd=new Date(d); dd.setDate(dd.getDate()+offset); return dd.toISOString().slice(0,10); };

  DB.tasks = [
    { id:uid(), title:'Follow up with Anita on Vikram interview feedback', type:'Follow-up', relatedTo:'SK-1001', owner:'Priya', due:fmt2(0), status:'Pending' },
    { id:uid(), title:'Send shortlist for Data Science role to Rohan', type:'Recruitment', relatedTo:'SK-1002', owner:'Rahul', due:fmt2(0), status:'Pending' },
    { id:uid(), title:'Call HDFC HR – Risk role discussion', type:'BD Call', relatedTo:'Risk Mandate', owner:'Priya', due:fmt2(1), status:'Pending' },
    { id:uid(), title:'Negotiate Aditya Verma joining date', type:'Offer', relatedTo:'SK-1003', owner:'Neha', due:fmt2(0), status:'Done' },
    { id:uid(), title:'Update Ola on Android dev pipeline', type:'Client Update', relatedTo:'SK-1004', owner:'Arjun', due:fmt2(-1), status:'Pending' },
  ];

  DB.activities = [
    { id:uid(), type:'Call', summary:'Intro call with Anita Sharma – TCS open reqs discussed', contact:'Anita Sharma', company:cos[0].name, owner:'Rahul', date:fmt2(-1) },
    { id:uid(), type:'Email', summary:'Sent profile of Vikram Iyer to TCS', contact:'Anita Sharma', company:cos[0].name, owner:'Priya', date:fmt2(-5) },
    { id:uid(), type:'Meeting', summary:'Infosys TA meetup – 3 new reqs identified', contact:'Rohan Mehta', company:cos[1].name, owner:'Sahil', date:fmt2(-3) },
    { id:uid(), type:'Call', summary:'HDFC follow-up – budget approval pending', contact:'Deepa Nair', company:cos[2].name, owner:'Priya', date:fmt2(-2) },
  ];

  DB.invoices = [
    { id:uid(), invNo:'INV-001', companyId:cos[3].id, placement:'Aditya Verma – PM Role', amount:320000, raised:fmt2(-10), due:fmt2(20), status:'Pending' },
  ];

  DB.users = [
    { id:uid(), name:'Sahil Phatak', email:'phataksahil04@gmail.com', role:'Founder / Admin', status:'Active' },
    { id:uid(), name:'Priya Menon', email:'priya@searchkraft.com', role:'Senior Recruiter', status:'Active' },
    { id:uid(), name:'Rahul Gupta', email:'rahul@searchkraft.com', role:'BD Manager', status:'Active' },
    { id:uid(), name:'Neha Singh', email:'neha@searchkraft.com', role:'Recruiter', status:'Active' },
    { id:uid(), name:'Arjun Das', email:'arjun@searchkraft.com', role:'Recruiter', status:'Active' },
  ];

  save();
}

