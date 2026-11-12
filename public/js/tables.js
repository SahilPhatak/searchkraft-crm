// ---- GENERIC TABLE RENDERERS ----
function getCompanyName(id) { return DB.companies.find(c=>c.id===id)?.name||''; }

// Debounce helper for search
let _searchTimers = {};
function debounce(key, fn, ms=350) {
  clearTimeout(_searchTimers[key]);
  _searchTimers[key] = setTimeout(fn, ms);
}

// Backend search: queries Supabase directly with ilike filters
async function searchFromDB(type, q) {
  const Q = (q||'').trim();
  if (type === 'leads') {
    let query = DB_CLIENT.from('leads').select('*').order('created_at',{ascending:false}).limit(200);
    if (Q) query = query.or(`first_name.ilike.%${Q}%,last_name.ilike.%${Q}%,email.ilike.%${Q}%,company.ilike.%${Q}%,client_name.ilike.%${Q}%`);
    const { data } = await query;
    if (data) { DB.leads = data.map(norm); renderTableRows('leads'); }
  } else if (type === 'contacts') {
    let query = DB_CLIENT.from('contacts').select('*').order('created_at',{ascending:false}).limit(200);
    if (Q) query = query.or(`name.ilike.%${Q}%,email.ilike.%${Q}%,company.ilike.%${Q}%`);
    const { data } = await query;
    if (data) { DB.contacts = data.map(norm).filter(r=>!r.stage||!LEAD_STAGES.includes(r.stage)); renderTableRows('contacts'); }
  } else if (type === 'companies') {
    let query = DB_CLIENT.from('companies').select('*').order('name',{ascending:true}).limit(200);
    if (Q) query = query.or(`name.ilike.%${Q}%,industry.ilike.%${Q}%,city.ilike.%${Q}%`);
    const { data } = await query;
    if (data) { DB.companies = data.map(norm); renderTableRows('companies'); }
  } else {
    renderTable(type, q);
  }
}

function renderTableRows(type) { renderTable(type, ''); }

function renderTable(type, q='') {
  const Q = (q||'').toLowerCase();
  const tbody = document.getElementById(type.replace('team','team')+'-body') || document.getElementById(type==='team'?'team-body':type+'-body');

  if (type==='companies') {
    const rows = DB.companies.filter(r=>!Q||r.name.toLowerCase().includes(Q)||r.industry?.toLowerCase().includes(Q));
    const ccount = document.getElementById('companies-count'); if(ccount) ccount.textContent=rows.length;
    const cpi = document.getElementById('companies-page-info'); if(cpi) cpi.textContent=rows.length?`1 to ${Math.min(25,rows.length)}`:'0';
    document.getElementById('companies-body').innerHTML = rows.length ? rows.map(r=>`<tr>
      <td><input type="checkbox" style="accent-color:var(--accent)"></td>
      <td class="name-cell" onclick="openModal('company','${r.id}')">${r.name}</td>
      <td>${r.industry||'—'}</td><td>${r.city||'—'}</td>
      <td>${badge(r.status)}</td><td>${r.bdOwner||'—'}</td>
      <td style="white-space:nowrap">
        ${canDo('accounts','edit')?`<button class="btn btn-ghost btn-sm" title="Edit" onclick="openModal('company','${r.id}')" style="padding:4px 7px">${ICON_EDIT}</button>`:''}
        ${canDo('accounts','delete')?`<button class="btn btn-ghost btn-sm" title="Delete" onclick="deleteCRMRecord('companies','${r.id}')" style="padding:4px 7px;color:#ef4444">${ICON_TRASH}</button>`:''}
      </td>
    </tr>`).join('') : '<tr><td colspan="7" class="empty-state">No accounts found</td></tr>';
  }

  else if (type==='contacts') {
    // Only show proper contacts (not lead records accidentally mixed in)
    const rows = DB.contacts.filter(r=>
      (!r.stage || !LEAD_STAGES.includes(r.stage)) &&
      (!Q||(r.name||'').toLowerCase().includes(Q)||(r.email||'').toLowerCase().includes(Q))
    );
    const ctcount = document.getElementById('contacts-count'); if(ctcount) ctcount.textContent=rows.length;
    const ctpi = document.getElementById('contacts-page-info'); if(ctpi) ctpi.textContent=rows.length?`1 to ${Math.min(25,rows.length)}`:'0';
    document.getElementById('contacts-body').innerHTML = rows.length ? rows.map(r=>`<tr>
      <td><input type="checkbox" style="accent-color:var(--accent)"></td>
      <td class="name-cell" onclick="openModal('contact','${r.id}')">${r.name}</td>
      <td>${r.title||'—'}</td><td>${r.company||getCompanyName(r.companyId)||'—'}</td>
      <td style="font-family:'Inter',system-ui,sans-serif;color:var(--fg2)">${r.email||'—'}</td><td style="font-family:'Inter',system-ui,sans-serif;color:var(--fg2)">${r.phone||'—'}</td>
      <td style="white-space:nowrap">
        ${canDo('contacts','edit')?`<button class="btn btn-ghost btn-sm" title="Edit" onclick="openModal('contact','${r.id}')" style="padding:4px 7px">${ICON_EDIT}</button>`:''}
        ${canDo('contacts','delete')?`<button class="btn btn-ghost btn-sm" title="Delete" onclick="deleteCRMRecord('contacts','${r.id}')" style="padding:4px 7px;color:#ef4444">${ICON_TRASH}</button>`:''}
      </td>
    </tr>`).join('') : '<tr><td colspan="7" class="empty-state">No contacts found</td></tr>';
  }

  else if (type==='leads') {
    const rows = DB.leads.filter(r=>(!Q||(r.title||r.name||'').toLowerCase().includes(Q)||getCompanyName(r.companyId).toLowerCase().includes(Q)||(r.company||r.companyName||'').toLowerCase().includes(Q)));
    const lcount = document.getElementById('leads-count'); if(lcount) lcount.textContent=rows.length;
    const lpi = document.getElementById('leads-page-info'); if(lpi) lpi.textContent=rows.length?`1 to ${Math.min(25,rows.length)}`:'0';
    const stageColor = s=>({New:'#6366f1',Contacted:'#0ea5e9','Pre Qualified':'#f59e0b',Qualified:'#10b981','Not Qualified':'#ef4444','Junk Lead':'#9ca3af','Proposal Sent':'#8b5cf6',Negotiation:'#f97316','Follow Up':'#06b6d4',Won:'#22c55e',Lost:'#ef4444','Lost Lead':'#9ca3af'}[s]||'#9ca3af');
    document.getElementById('leads-body').innerHTML = rows.length ? rows.map(r=>`<tr>
      <td><input type="checkbox" style="accent-color:var(--accent)"></td>
      <td class="name-cell" onclick="openModal('lead','${r.id}')">${r.name||r.title||'—'}</td>
      <td>${r.title||'—'}</td>
      <td>${r.company||r.companyName||getCompanyName(r.companyId)||'—'}</td>
      <td><span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600;color:#fff;background:${stageColor(r.stage)}">${r.stage||'—'}</span></td>
      <td class="mono">${r.email||'—'}</td>
      <td class="mono">${r.phone||'—'}</td>
      <td>${r.owner||'—'}</td>
      <td style="white-space:nowrap">
        ${canDo('leads','edit')?`<button class="btn btn-ghost btn-sm" title="Edit" onclick="openModal('lead','${r.id}')" style="padding:4px 7px">${ICON_EDIT}</button>`:''}
        ${canDo('leads','delete')?`<button class="btn btn-ghost btn-sm" title="Delete" onclick="deleteCRMRecord('leads','${r.id}')" style="padding:4px 7px;color:#ef4444">${ICON_TRASH}</button>`:''}
      </td>
    </tr>`).join('') : '<tr><td colspan="9" class="empty-state">No leads found</td></tr>';
  }

  else if (type==='deals') {
    const rows = (DB.deals||[]).filter(r=>!Q||(r.name||'').toLowerCase().includes(Q)||(r.companyName||'').toLowerCase().includes(Q));
    const dcount = document.getElementById('deals-count'); if(dcount) dcount.textContent=rows.length;
    const dpi = document.getElementById('deals-page-info'); if(dpi) dpi.textContent=rows.length?`1 to ${Math.min(25,rows.length)}`:'0';
    document.getElementById('deals-body').innerHTML = rows.length ? rows.map(r=>`<tr>
      <td><input type="checkbox" style="accent-color:var(--accent)"></td>
      <td class="name-cell" onclick="openModal('deal','${r.id}')">${r.name||'—'}</td>
      <td>${r.companyName||'—'}</td>
      <td>${r.candidateName||'—'}</td>
      <td class="mono fw-600">${fmt(r.amount||0)}</td>
      <td>${badge(r.stage)}</td>
      <td>${fmtDate(r.closeDate)}</td>
      <td>${r.owner||'—'}</td>
      <td style="white-space:nowrap">
        ${canDo('deals','edit')?`<button class="btn btn-ghost btn-sm" title="Edit" onclick="openModal('deal','${r.id}')" style="padding:4px 7px">${ICON_EDIT}</button>`:''}
        ${canDo('deals','delete')?`<button class="btn btn-ghost btn-sm" title="Delete" onclick="deleteCRMRecord('deals','${r.id}')" style="padding:4px 7px;color:#ef4444">${ICON_TRASH}</button>`:''}
      </td>
    </tr>`).join('') : '<tr><td colspan="9" class="empty-state">No deals found</td></tr>';
  }

  else if (type==='tasks') {
    const rows = DB.tasks.filter(t=>taskFilter==='all'||taskFilter==='pending'&&t.status!=='Done'||taskFilter==='done'&&t.status==='Done');
    document.getElementById('tasks-body').innerHTML = rows.length ? rows.map(r=>`<tr>
      <td><div class="primary">${r.title}</div></td>
      <td><span class="badge badge-gray">${r.type||'General'}</span></td>
      <td>${r.relatedTo||'—'}</td><td>${r.owner||'—'}</td>
      <td style="color:${isOverdue(r.due)&&r.status!=='Done'?'var(--red)':'var(--fg2)'}">${fmtDate(r.due)}</td>
      <td>${badge(r.status)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-ghost btn-sm" title="Edit" onclick="openModal('task','${r.id}')" style="padding:4px 7px">${ICON_EDIT}</button>
        ${r.status!=='Done'?`<button class="btn btn-ghost btn-sm" title="Complete" onclick="completeTask('${r.id}')" style="padding:4px 7px;color:#22c55e">✓</button>`:''}
        <button class="btn btn-ghost btn-sm" title="Delete" onclick="deleteCRMRecord('tasks','${r.id}')" style="padding:4px 7px;color:#ef4444">${ICON_TRASH}</button>
      </td>
    </tr>`).join('') : '<tr><td colspan="7" class="empty-state">No tasks</td></tr>';
  }

  else if (type==='team') {
    document.getElementById('team-body').innerHTML = DB.users.map(r=>`<tr>
      <td><div class="flex-row"><div class="avatar">${r.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div><div class="primary">${r.name}</div></div></td>
      <td class="mono text-xs">${r.email||'—'}</td>
      <td><span class="badge badge-purple">${r.role}</span></td>
      <td>${badge(r.status)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-ghost btn-sm" title="Edit" onclick="openModal('user','${r.id}')" style="padding:4px 7px">${ICON_EDIT}</button>
      </td>
    </tr>`).join('');
  }
}

// ---- LEAD BOARD ----
let _dragLeadId = null;
function renderLeadsBoard() {
  const stages = LEAD_STAGES;
  const board = document.getElementById('leads-board');
  board.innerHTML = stages.map(s=>{
    const cards = DB.leads.filter(l=>l.stage===s);
    return `<div class="kanban-col" data-stage="${s}"
      ondragover="event.preventDefault();this.classList.add('drag-over')"
      ondragleave="this.classList.remove('drag-over')"
      ondrop="dropLeadCard(event,'${s}')">
      <div class="kanban-col-header">
        <span class="col-label">${s}</span>
        <span class="col-count">${cards.length}</span>
      </div>
      <div class="kanban-cards">
        ${cards.map(c=>`
          <div class="k-card" draggable="true"
            ondragstart="dragLeadCard(event,'${c.id}')"
            ondragend="this.classList.remove('dragging')"
            onclick="openModal('lead','${c.id}')">
            <div class="k-name">${c.title}</div>
            <div class="k-meta">${getCompanyName(c.companyId)}</div>
            <div class="k-tags"><span class="badge badge-gray">${fmt(c.value||0)}</span><span class="badge badge-blue">${c.owner||''}</span></div>
          </div>`).join('')}
      </div>
    </div>`;
  }).join('');
}
function dragLeadCard(e, id) {
  _dragLeadId = id;
  setTimeout(()=>{ const el=document.querySelector(`.k-card[ondragstart*="${id}"]`); if(el) el.classList.add('dragging'); },0);
}
async function dropLeadCard(e, newStage) {
  e.preventDefault();
  document.querySelectorAll('.kanban-col').forEach(c=>c.classList.remove('drag-over'));
  if (!_dragLeadId) return;
  const lead = DB.leads.find(l=>l.id===_dragLeadId);
  if (!lead || lead.stage===newStage) { _dragLeadId=null; return; }
  lead.stage = newStage;
  // Persist to Supabase
  await DB_CLIENT.from('leads').update({ stage: newStage, updated_at: new Date().toISOString() }).eq('id', lead.id);
  audit('Update', 'Leads', lead.title||'Lead', `Stage → ${newStage}`);
  _dragLeadId = null;
  renderLeadsBoard();
  renderTable('leads','');
}

// ---- ACTIVITIES ----
let _actTypeFilter = 'all';
function switchActTab(type, el) {
  _actTypeFilter = type;
  document.querySelectorAll('#page-activities .crm-subtab').forEach(t => t.classList.remove('active-subtab'));
  if (el) el.classList.add('active-subtab');
  renderActivities();
}

function renderActivities() {
  const el = document.getElementById('activities-list');
  const acts = _actTypeFilter === 'all'
    ? DB.activities
    : DB.activities.filter(a => a.type === _actTypeFilter);
  if (!acts.length) {
    el.innerHTML = `<div class="empty-state"><div class="icon">📭</div><p>No ${_actTypeFilter === 'all' ? '' : _actTypeFilter.toLowerCase() + ' '}activities logged</p></div>`;
    return;
  }
  el.innerHTML = acts.map(a=>`
    <div class="activity-item">
      <div class="activity-dot" style="background:${a.type==='Call'?'var(--green)':a.type==='Email'?'var(--accent)':a.type==='Meeting'?'var(--amber)':'var(--purple)'}"></div>
      <div class="activity-content" style="flex:1">
        <div class="flex-row">
          <span class="badge ${a.type==='Call'?'badge-green':a.type==='Email'?'badge-blue':'badge-amber'}">${a.type}</span>
          <div class="act-text">${a.summary}</div>
          <button class="btn btn-ghost btn-sm ml-auto" onclick="deleteCRMRecord('activities','${a.id}')" title="Delete">${ICON_TRASH}</button>
        </div>
        <div class="act-time" style="margin-top:4px">${a.contact||''} · ${a.company||''} · ${a.owner} · ${fmtDate(a.date)}</div>
      </div>
    </div>`).join('');
}

// ---- DOCUMENTS ----
const DOC_CATEGORIES_DEFAULT = ['MSA (Master Service Agreement)','NDA (Non-Disclosure Agreement)','Service Agreement','Client Contracts','Invoices','Purchase Orders','Company Documents','Other Documents'];
let _docCategories = null;
function getDocCategories() {
  if (!_docCategories) {
    try { _docCategories = JSON.parse(localStorage.getItem('sk_doc_categories') || 'null'); } catch(e) {}
    if (!_docCategories) _docCategories = [...DOC_CATEGORIES_DEFAULT];
  }
  return _docCategories;
}
function saveDocCategories(cats) {
  _docCategories = cats;
  try { localStorage.setItem('sk_doc_categories', JSON.stringify(cats)); } catch(e) {}
}

let _docCurrentTab = 'dashboard';
function switchDocTab(tab, el) {
  _docCurrentTab = tab;
  document.querySelectorAll('#page-documents .crm-subtab').forEach(t => t.classList.remove('active-subtab'));
  if (el) el.classList.add('active-subtab');
  ['dashboard','all','categories'].forEach(t => {
    const v = document.getElementById('doc-view-'+t);
    if (v) v.style.display = t === tab ? (t==='all'?'flex':'block') : 'none';
  });
  if (tab === 'dashboard') renderDocDashboard();
  else if (tab === 'all') renderDocTable();
  else if (tab === 'categories') renderDocCategories();
  markSectionSeen('documents');
}

function renderDocuments() {
  // Restore last tab or default to dashboard
  const tabEl = document.getElementById('doc-tab-' + _docCurrentTab);
  switchDocTab(_docCurrentTab, tabEl);
  markSectionSeen('documents');
}

function renderDocDashboard() {
  const docs = DB.documents || [];
  const thisMonth = new Date().toISOString().slice(0,7);
  const totalDocs = docs.length;
  const uniqueClients = new Set(docs.map(d => d.clientId || d.clientName).filter(Boolean)).size;
  const thisMonthCount = docs.filter(d => (d.createdAt||'').startsWith(thisMonth)).length;
  const now = new Date();
  const monthLabel = now.toLocaleString('en-IN',{month:'long',year:'numeric'});

  const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setEl('doc-stat-total', totalDocs);
  setEl('doc-stat-clients', uniqueClients);
  setEl('doc-stat-month', thisMonthCount);
  setEl('doc-stat-month-label', monthLabel);

  // Recent docs (last 8)
  const recentBody = document.getElementById('doc-recent-body');
  if (recentBody) {
    const recent = docs.slice(0, 8);
    recentBody.innerHTML = recent.length ? recent.map(d => `<tr>
      <td><span style="font-weight:600;color:var(--fg)">${esc(d.name||'—')}</span></td>
      <td>${esc(d.clientName||'—')}</td>
      <td><span class="badge badge-blue">${esc(d.category||'—')}</span></td>
      <td><span class="badge">${esc(d.stage||'—')}</span></td>
      <td>${badge(d.status||'—')}</td>
      <td>${fmtDate(d.createdAt)}</td>
      <td>${esc(d.uploadedBy||'—')}</td>
      <td>
        ${d.fileUrl ? `<a href="${esc(d.fileUrl)}" target="_blank" class="btn btn-ghost btn-sm">View</a>` : ''}
        <button class="btn btn-ghost btn-sm" onclick="openModal('document','${d.id}')">Edit</button>
      </td>
    </tr>`).join('') : '<tr><td colspan="8" class="empty-state">No documents yet</td></tr>';
  }

  // Category summary
  const cats = getDocCategories();
  const catSummary = document.getElementById('doc-cat-summary');
  if (catSummary) {
    catSummary.innerHTML = cats.map(cat => {
      const count = docs.filter(d => d.category === cat).length;
      return `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 16px;border-bottom:1px solid var(--border)">
        <span style="font-size:13px;color:var(--fg2)">${esc(cat)}</span>
        <span style="font-size:13px;font-weight:700;color:var(--fg);font-family:'Roboto Mono',monospace">${count}</span>
      </div>`;
    }).join('');
  }
}

function renderDocTable() {
  const docs = DB.documents || [];
  const q = (document.getElementById('doc-search')||{}).value?.toLowerCase() || '';
  const clientQ = (document.getElementById('doc-client-search')||{}).value?.toLowerCase() || '';
  const fClient = (document.getElementById('doc-filter-client')||{}).value || '';
  const fCat = (document.getElementById('doc-filter-cat')||{}).value || '';
  const fStage = (document.getElementById('doc-filter-stage')||{}).value || '';
  const fStatus = (document.getElementById('doc-filter-status')||{}).value || '';
  const fType = (document.getElementById('doc-filter-type')||{}).value || '';
  const sort = (document.getElementById('doc-sort')||{}).value || 'newest';

  // Populate client filter dropdown (once)
  const clientSel = document.getElementById('doc-filter-client');
  if (clientSel && clientSel.options.length <= 1) {
    const clients = [...new Set(docs.map(d => d.clientName).filter(Boolean))].sort();
    clients.forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c; clientSel.appendChild(o); });
  }
  // Populate category filter
  const catSel = document.getElementById('doc-filter-cat');
  if (catSel && catSel.options.length <= 1) {
    getDocCategories().forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c; catSel.appendChild(o); });
  }

  let filtered = docs.filter(d => {
    if (q && !(d.name||'').toLowerCase().includes(q)) return false;
    if (clientQ && !(d.clientName||'').toLowerCase().includes(clientQ)) return false;
    if (fClient && d.clientName !== fClient) return false;
    if (fCat && d.category !== fCat) return false;
    if (fStage && d.stage !== fStage) return false;
    if (fStatus && d.status !== fStatus) return false;
    if (fType && d.fileType !== fType) return false;
    return true;
  });

  if (sort === 'oldest') filtered.sort((a,b) => (a.createdAt||'').localeCompare(b.createdAt||''));
  else if (sort === 'name') filtered.sort((a,b) => (a.name||'').localeCompare(b.name||''));
  else filtered.sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''));

  const tbody = document.getElementById('doc-table-body');
  const info = document.getElementById('doc-table-info');
  if (!tbody) return;
  tbody.innerHTML = filtered.length ? filtered.map(d => `<tr>
    <td><span style="font-weight:600;color:var(--fg)">${esc(d.name||'—')}</span>${d.referenceNumber?`<div style="font-size:11px;color:var(--fg3)">${esc(d.referenceNumber)}</div>`:''}</td>
    <td>${esc(d.clientName||'—')}</td>
    <td><span class="badge badge-blue">${esc(d.category||'—')}</span></td>
    <td><span class="badge">${esc(d.stage||'Draft')}</span></td>
    <td>${badge(d.status||'Pending')}</td>
    <td><span class="mono">${esc(d.fileType||'—')}</span></td>
    <td style="font-size:12px;color:var(--fg3)">${esc(d.fileSize||'—')}</td>
    <td>${esc(d.uploadedBy||'—')}</td>
    <td>${fmtDate(d.createdAt)}</td>
    <td style="color:${d.expiryDate&&d.expiryDate<today()?'var(--red)':'inherit'}">${fmtDate(d.expiryDate)||'—'}</td>
    <td style="white-space:nowrap">
      ${d.fileUrl ? `<a href="${esc(d.fileUrl)}" target="_blank" class="btn btn-ghost btn-sm">View</a>` : ''}
      <button class="btn btn-ghost btn-sm" onclick="openModal('document','${d.id}')">Edit</button>
      <button class="btn btn-ghost btn-sm" onclick="deleteCRMRecord('documents','${d.id}')" style="color:var(--red)">Del</button>
    </td>
  </tr>`).join('') : '<tr><td colspan="11" class="empty-state">No documents match your filters</td></tr>';
  if (info) info.textContent = `Showing ${filtered.length} of ${docs.length} documents`;
}

function renderDocCategories() {
  const cats = getDocCategories();
  const docs = DB.documents || [];
  const el = document.getElementById('doc-categories-list');
  if (!el) return;
  el.innerHTML = cats.map((cat, i) => {
    const count = docs.filter(d => d.category === cat).length;
    return `<div class="card" style="padding:16px;display:flex;align-items:center;justify-content:space-between;gap:12px">
      <div>
        <div style="font-size:14px;font-weight:600;color:var(--fg)">${esc(cat)}</div>
        <div style="font-size:12px;color:var(--fg3);margin-top:2px">${count} document${count!==1?'s':''}</div>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        <button class="btn btn-ghost btn-sm" onclick="editDocCategory(${i})">Edit</button>
        <button class="btn btn-ghost btn-sm" style="color:var(--red)" onclick="deleteDocCategory(${i})">Del</button>
      </div>
    </div>`;
  }).join('') || '<div style="color:var(--fg3);font-size:13px;padding:12px 0">No categories yet.</div>';
}

function openAddDocCategory() {
  const name = prompt('New category name:');
  if (!name || !name.trim()) return;
  const cats = getDocCategories();
  if (cats.includes(name.trim())) return alert('Category already exists');
  cats.push(name.trim());
  saveDocCategories(cats);
  renderDocCategories();
}
function editDocCategory(i) {
  const cats = getDocCategories();
  const name = prompt('Edit category name:', cats[i]);
  if (!name || !name.trim()) return;
  cats[i] = name.trim();
  saveDocCategories(cats);
  renderDocCategories();
  renderDocDashboard();
}
function deleteDocCategory(i) {
  const cats = getDocCategories();
  const count = (DB.documents||[]).filter(d => d.category === cats[i]).length;
  if (count > 0 && !confirm(`"${cats[i]}" has ${count} document(s). Delete category anyway?`)) return;
  cats.splice(i, 1);
  saveDocCategories(cats);
  renderDocCategories();
}

function openDocUpload(prefillClientId, prefillClientName) {
  openModal('document', null, { clientId: prefillClientId||'', clientName: prefillClientName||'' });
}

function handleDocFileSelect(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  showDocFileInfo(file);
}
function handleDocFileDrop(e) {
  const file = e.dataTransfer.files && e.dataTransfer.files[0];
  if (!file) return;
  const input = document.getElementById('f-file');
  // Assign file to input via DataTransfer so save() can read it
  try {
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
  } catch(err) { /* Safari fallback — store on input */ input._droppedFile = file; }
  showDocFileInfo(file);
}
function showDocFileInfo(file) {
  const nameEl = document.getElementById('doc-file-name');
  const sizeEl = document.getElementById('doc-file-size');
  const infoEl = document.getElementById('doc-file-info');
  if (nameEl) nameEl.textContent = file.name;
  if (sizeEl) sizeEl.textContent = formatFileSize(file.size);
  if (infoEl) infoEl.style.display = 'block';
}
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/(1024*1024)).toFixed(1) + ' MB';
}
async function uploadDocFile(file) {
  const MAX = 50 * 1024 * 1024; // 50 MB
  if (file.size > MAX) { alert('File is too large (max 50 MB)'); return null; }
  const progressWrap = document.getElementById('doc-upload-progress');
  const progressBar  = document.getElementById('doc-progress-bar');
  const statusEl     = document.getElementById('doc-upload-status');
  if (progressWrap) progressWrap.style.display = 'block';
  if (statusEl) statusEl.textContent = 'Uploading…';
  if (progressBar) progressBar.style.width = '10%';

  const ext = file.name.split('.').pop();
  const path = `documents/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  try {
    const { data, error } = await DB_CLIENT.storage.from('crm-documents').upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    if (progressBar) progressBar.style.width = '80%';
    // Get public URL
    const { data: urlData } = DB_CLIENT.storage.from('crm-documents').getPublicUrl(path);
    if (progressBar) progressBar.style.width = '100%';
    if (statusEl) statusEl.textContent = 'Upload complete ✓';
    return { url: urlData.publicUrl, path };
  } catch(err) {
    console.error('Upload failed:', err);
    if (progressWrap) progressWrap.style.display = 'none';
    alert('Upload failed: ' + (err.message || 'Unknown error') + '\n\nMake sure you have a Supabase Storage bucket named "crm-documents" with public access enabled.');
    return null;
  }
}

// ---- COMMERCIAL ----
function renderCommercial() {
  const total = DB.invoices.reduce((a,i)=>a+Number(i.amount||0),0);
  const paid = DB.invoices.filter(i=>i.status==='Paid').reduce((a,i)=>a+Number(i.amount||0),0);
  document.getElementById('comm-billed').textContent = fmt(total);
  document.getElementById('comm-collected').textContent = fmt(paid);
  document.getElementById('comm-outstanding').textContent = fmt(total - paid);
  document.getElementById('invoices-body').innerHTML = DB.invoices.map(r=>`<tr>
    <td><span class="mono">${r.invNo||'—'}</span></td>
    <td>${getCompanyName(r.companyId)}</td>
    <td>${r.placement||'—'}</td>
    <td class="mono fw-600">${fmt(Number(r.amount||0))}</td>
    <td>${fmtDate(r.raised)}</td>
    <td style="color:${isOverdue(r.due)&&r.status!=='Paid'?'var(--red)':'inherit'}">${fmtDate(r.due)}</td>
    <td>${badge(r.status)}</td>
    <td><button class="btn btn-ghost btn-sm" onclick="openModal('invoice','${r.id}')">Edit</button>
        <button class="btn btn-ghost btn-sm" onclick="deleteCRMRecord('invoices','${r.id}')">Del</button></td>
  </tr>`).join('') || '<tr><td colspan="8" class="empty-state">No invoices</td></tr>';
}

// ---- REPORTS ----
function renderReports() {
  // Apply any saved component visibility prefs
  applyComponentPrefs();
  const now2 = new Date();
  // Use local date to avoid UTC-offset month rollback (IST = UTC+5:30)
  function localYM(d) {
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
  }
  const thisMonth = localYM(now2);

  // Helper: get YYYY-MM for N months ago (local time, no UTC shift)
  function monthStr(offset) {
    const d = new Date(now2.getFullYear(), now2.getMonth()-offset, 1);
    return localYM(d);
  }
  const m2 = monthStr(1); // true "last calendar month" for KPI comparison
  function mLabel(ym) {
    const [y,m] = ym.split('-');
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m)-1]+' '+y;
  }

  // Robust UTC ISO → local YYYY-MM (must be defined before KPI tiles and matrix)
  function recLocalYM(x, field) {
    const raw = x[field] || x[field==='createdAt'?'created_at':field==='closeDate'?'close_date':field] || '';
    if (!raw) return '';
    try {
      const d = new Date(raw);
      if (isNaN(d)) return raw.slice(0,7);
      return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
    } catch(e) { return raw.slice(0,7); }
  }

  // KPI Tiles
  const leadsThisMonth = DB.leads.filter(l=>recLocalYM(l,'createdAt')===thisMonth).length;
  const leadsLastMonth = DB.leads.filter(l=>recLocalYM(l,'createdAt')===m2).length;
  // % change: if last month had 0, show +100% per new lead (not ÷0)
  let pct, pctLabel, pctColor;
  if (leadsLastMonth === 0 && leadsThisMonth === 0) {
    pctLabel = '—'; pctColor = 'var(--fg3)';
  } else if (leadsLastMonth === 0 && leadsThisMonth > 0) {
    pct = 100 * leadsThisMonth;
    pctLabel = '+' + pct + '% vs last month'; pctColor = 'var(--green)';
  } else {
    pct = Math.round((leadsThisMonth - leadsLastMonth) / leadsLastMonth * 100);
    pctLabel = (pct >= 0 ? '+' : '') + pct + '% vs last month';
    pctColor = pct >= 0 ? 'var(--green)' : 'var(--red)';
  }
  const el_lm = document.getElementById('an-leads-month');
  if (el_lm) el_lm.textContent = leadsThisMonth;
  const el_pct = document.getElementById('an-leads-pct');
  if (el_pct) { el_pct.textContent = pctLabel; el_pct.style.color = pctColor; }
  const el_ll = document.getElementById('an-leads-last');
  if (el_ll) el_ll.textContent = leadsLastMonth === 0 ? 'No leads last month' : leadsLastMonth + ' last month';

  const wonDeals = DB.deals.filter(d=>isWon(d)&&recLocalYM(d,'wonAt')===thisMonth);
  const revenue = wonDeals.reduce((s,d)=>s+Number(d.expectedRevenue||d.amount||0),0);
  const el_rev = document.getElementById('an-revenue');
  if (el_rev) el_rev.textContent = fmt(revenue);

  const pipeline = DB.deals.filter(d=>!['Closed Won','Closed Lost'].includes(d.stage));
  const el_pip = document.getElementById('an-deals-pipeline');
  if (el_pip) el_pip.textContent = pipeline.length;

  const accts = DB.companies.filter(c=>c.createdAt&&c.createdAt.startsWith(thisMonth));
  const el_acc = document.getElementById('an-accounts');
  if (el_acc) el_acc.textContent = accts.length;

  // Performance matrix rendered as a single unified grid (header + rows)

  function monthCount(arr, dateField, mo) {
    return arr.filter(x => recLocalYM(x, dateField) === mo).length;
  }
  function monthSum(arr, dateField, valField, mo) {
    return arr.filter(x => recLocalYM(x, dateField) === mo).reduce((s,x)=>s+Number(x[valField]||0),0);
  }

  // Smart month selection: always include current month (m3) as the rightmost column.
  // For the other 2 columns, look back up to 24 months and pick the 2 most recent months
  // that actually have leads OR deals data — so the matrix always shows real activity.
  function findActiveMonths() {
    const allRecords = [...DB.leads, ...DB.deals];
    const monthSet = new Set();
    allRecords.forEach(r => {
      const ym = recLocalYM(r, 'createdAt');
      if (ym && ym < thisMonth) monthSet.add(ym);
    });
    // Sort descending, take 2 most recent before current month
    const pastMonths = [...monthSet].sort((a,b)=>b.localeCompare(a)).slice(0,2).reverse();
    // Pad with calendar months if fewer than 2 past months with data
    // Build a sorted candidate list: 2 months before current, then 1 month before
    if (pastMonths.length < 2) {
      const needed = [];
      for (let off = 2; off >= 1; off--) {
        const d = new Date(now2.getFullYear(), now2.getMonth() - off, 1);
        const ym = localYM(d);
        if (!pastMonths.includes(ym)) needed.push(ym);
      }
      // Insert missing months in correct chronological position
      for (const ym of needed) {
        if (pastMonths.length < 2) pastMonths.push(ym);
      }
      pastMonths.sort((a,b) => a.localeCompare(b));
    }
    return [pastMonths[0], pastMonths[1], thisMonth];
  }

  const [sm1, sm2, sm3] = findActiveMonths();

  const matrixRows = [
    { label:'Leads Created', vals:[monthCount(DB.leads,'createdAt',sm1), monthCount(DB.leads,'createdAt',sm2), monthCount(DB.leads,'createdAt',sm3)] },
    { label:'Deals Created', vals:[monthCount(DB.deals,'createdAt',sm1), monthCount(DB.deals,'createdAt',sm2), monthCount(DB.deals,'createdAt',sm3)] },
    { label:'Deals Won', vals:[
      DB.deals.filter(d=>isWon(d)).filter(d=>recLocalYM(d,'closeDate')===sm1).length,
      DB.deals.filter(d=>isWon(d)).filter(d=>recLocalYM(d,'closeDate')===sm2).length,
      DB.deals.filter(d=>isWon(d)).filter(d=>recLocalYM(d,'closeDate')===sm3).length,
    ]},
    { label:'Revenue Won', vals:[
      monthSum(DB.deals.filter(d=>d.stage==='Joined'),'wonAt','expectedRevenue',sm1),
      monthSum(DB.deals.filter(d=>d.stage==='Joined'),'wonAt','expectedRevenue',sm2),
      monthSum(DB.deals.filter(d=>d.stage==='Joined'),'wonAt','expectedRevenue',sm3)
    ], isCurrency:true },
    { label:'Open Amount', vals:[
      monthSum(DB.deals.filter(d=>d.stage==='Offered'),'createdAt','expectedRevenue',sm1),
      monthSum(DB.deals.filter(d=>d.stage==='Offered'),'createdAt','expectedRevenue',sm2),
      monthSum(DB.deals.filter(d=>d.stage==='Offered'),'createdAt','expectedRevenue',sm3),
    ], isCurrency:true },
    { label:'Revenue Lost', vals:[
      monthSum(DB.deals.filter(d=>d.stage==='Declined'),'lostAt','expectedRevenue',sm1),
      monthSum(DB.deals.filter(d=>d.stage==='Declined'),'lostAt','expectedRevenue',sm2),
      monthSum(DB.deals.filter(d=>d.stage==='Declined'),'lostAt','expectedRevenue',sm3),
    ], isCurrency:true }
  ];

  const el_pm = document.getElementById('an-perf-matrix');
  if (el_pm) {
    const months = [sm1, sm2, sm3];
    // Active column default = current month (rightmost, index 2)
    // Only restore a stored index if the stored months match current months (avoids stale highlight)
    const storedIdx = parseInt(el_pm.dataset.activeIdx ?? '2');
    const storedMonths = el_pm.dataset.months || '';
    let activeIdx = storedMonths === months.join(',') ? storedIdx : 2;

    function renderPerfMatrix() {
      el_pm.dataset.activeIdx = activeIdx;
      el_pm.dataset.months = months.join(',');
      const hCell = (txt, accent, idx) => `<div onclick="window._pmSetActive(${idx})" style="padding:9px 10px;font-size:11px;font-weight:700;cursor:pointer;user-select:none;color:${accent?'var(--accent)':'var(--fg3)'};text-align:center;border-bottom:${accent?'2px solid var(--accent)':'1px solid var(--border)'};background:var(--surface2)">${txt}</div>`;
      const labelCell = txt => `<div style="padding:9px 14px;font-size:12px;font-weight:600;color:var(--fg2);border-bottom:1px solid var(--border);background:var(--surface)">${txt}</div>`;
      const valCell = (v, isCur, isActive) => `<div style="padding:9px 10px;font-size:13px;font-weight:700;color:${isActive?'var(--accent)':'var(--fg)'};border-bottom:1px solid var(--border);text-align:center">${isCur?fmt(v):v}</div>`;
      el_pm.innerHTML =
        `<div style="padding:9px 14px;border-bottom:1px solid var(--border);background:var(--surface2)"></div>` +
        months.map((mo, i) => hCell(mLabel(mo) + (i===activeIdx?' ★':''), i===activeIdx, i)).join('') +
        matrixRows.map(r =>
          labelCell(r.label) + r.vals.map((v, i) => valCell(v, r.isCurrency, i===activeIdx)).join('')
        ).join('');
    }

    window._pmSetActive = function(idx) {
      activeIdx = idx;
      renderPerfMatrix();
    };

    renderPerfMatrix();
  }

  // Donut chart — Leads by Source
  const sourceMap = {};
  DB.leads.forEach(l=>{ const s=l.source||'Other'; sourceMap[s]=(sourceMap[s]||0)+1; });
  const sourceColors = ['#2563EB','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4'];
  const sourceEntries = Object.entries(sourceMap).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const total = sourceEntries.reduce((s,[,v])=>s+v,0)||1;
  const R=54, cx=70, cy=70, donutW=24;
  let startAngle = -Math.PI/2;
  let donutPaths = '';
  sourceEntries.forEach(([src,cnt],i)=>{
    const angle = (cnt/total)*2*Math.PI;
    const endAngle = startAngle + angle;
    const x1=cx+R*Math.cos(startAngle), y1=cy+R*Math.sin(startAngle);
    const x2=cx+R*Math.cos(endAngle), y2=cy+R*Math.sin(endAngle);
    const ir=R-donutW;
    const ix1=cx+ir*Math.cos(startAngle), iy1=cy+ir*Math.sin(startAngle);
    const ix2=cx+ir*Math.cos(endAngle), iy2=cy+ir*Math.sin(endAngle);
    const large = angle>Math.PI?1:0;
    donutPaths += `<path d="M${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2} L${ix2},${iy2} A${ir},${ir} 0 ${large},0 ${ix1},${iy1} Z" fill="${sourceColors[i%sourceColors.length]}"/>`;
    startAngle = endAngle;
  });
  const el_donut = document.getElementById('an-donut');
  if (el_donut) el_donut.innerHTML = donutPaths + `<text x="${cx}" y="${cy-6}" text-anchor="middle" font-size="16" font-weight="700" fill="var(--fg)">${total}</text><text x="${cx}" y="${cy+10}" text-anchor="middle" font-size="10" fill="var(--fg3)">Leads</text>`;

  const el_leg = document.getElementById('an-donut-legend');
  if (el_leg) el_leg.innerHTML = sourceEntries.map(([src,cnt],i)=>`
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">
      <div style="width:10px;height:10px;border-radius:2px;background:${sourceColors[i%sourceColors.length]};flex-shrink:0"></div>
      <div style="font-size:11px;color:var(--fg2);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${src}</div>
      <div style="font-size:11px;font-weight:600;color:var(--fg)">${cnt}</div>
    </div>`).join('');

  // Prolific sales reps
  const repMap = {};
  DB.deals.filter(d=>d.stage==='Joined').forEach(d=>{ const o=d.owner||'Unknown'; repMap[o]=(repMap[o]||0)+Number(d.expectedRevenue||d.amount||0); });
  const repEntries = Object.entries(repMap).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const maxRep = repEntries.length ? repEntries[0][1] : 1;
  const el_reps = document.getElementById('an-reps');
  if (el_reps) el_reps.innerHTML = repEntries.length ? repEntries.map(([name,amt],i)=>`
    <div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
        <div style="font-size:12px;font-weight:600;color:var(--fg)">${name}</div>
        <div style="font-size:12px;color:var(--accent);font-weight:600">${fmt(amt)}</div>
      </div>
      <div style="height:6px;background:var(--surface2);border-radius:3px">
        <div style="height:6px;background:var(--accent);border-radius:3px;width:${amt/maxRep*100}%;transition:width 0.3s"></div>
      </div>
    </div>`).join('') : '<div style="font-size:12px;color:var(--fg3)">No closed deals yet</div>';

  // ── Client Revenue Analysis ──
  function clientTable(elId, entries, valueFormatter, barColor, emptyMsg, textColor) {
    const el = document.getElementById(elId);
    if (!el) return;
    if (!entries.length) {
      el.innerHTML = `<div style="padding:32px 18px;text-align:center;color:var(--fg3);font-size:13px">${emptyMsg}</div>`;
      return;
    }
    const maxVal = entries[0][1] || 1;
    const valColor = textColor || 'var(--fg)';
    el.innerHTML = entries.map(([client, val], i) => {
      const pct = Math.round(val / maxVal * 100);
      const rank = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`;
      return `<div style="padding:10px 18px;border-bottom:1px solid var(--border);${i===entries.length-1?'border-bottom:none':''}">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
          <span style="font-size:11px;color:var(--fg3);flex-shrink:0;width:22px;text-align:center">${rank}</span>
          <span style="font-size:13px;font-weight:600;color:var(--fg);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${client}</span>
          <span style="font-size:13px;font-weight:700;color:${valColor};font-family:'Plus Jakarta Sans','Inter',sans-serif;flex-shrink:0">${valueFormatter(val)}</span>
        </div>
        <div style="margin-left:30px;height:3px;background:var(--surface2);border-radius:2px">
          <div style="height:3px;background:${barColor};border-radius:2px;width:${pct}%;opacity:0.6;transition:width 0.3s"></div>
        </div>
      </div>`;
    }).join('');
  }

  // Aggregate won revenue by client
  const wonByClient = {};
  DB.deals.filter(d => isWon(d)).forEach(d => {
    const c = d.companyName || 'Unknown';
    wonByClient[c] = (wonByClient[c] || 0) + Number(d.expectedRevenue || d.amount || 0);
  });
  const wonEntries = Object.entries(wonByClient).sort((a,b) => b[1]-a[1]);

  // Aggregate lost revenue by client
  const lostByClient = {};
  DB.deals.filter(d => isLost(d)).forEach(d => {
    const c = d.companyName || 'Unknown';
    lostByClient[c] = (lostByClient[c] || 0) + Number(d.expectedRevenue || d.amount || 0);
  });
  const lostEntries = Object.entries(lostByClient).sort((a,b) => b[1]-a[1]);

  // Count closures (won deals) by client
  const closuresByClient = {};
  DB.deals.filter(d => isWon(d)).forEach(d => {
    const c = d.companyName || 'Unknown';
    closuresByClient[c] = (closuresByClient[c] || 0) + 1;
  });
  const closureEntries = Object.entries(closuresByClient).sort((a,b) => b[1]-a[1]);

  clientTable('an-client-won',      wonEntries,     fmtC,  '#4ade80', 'No won deals yet',  '#15803d');
  clientTable('an-client-lost',     lostEntries,    fmtC,  '#f87171', 'No lost deals yet', '#b91c1c');
  clientTable('an-client-closures', closureEntries, v => v + (v===1?' deal':' deals'), '#a78bfa', 'No closed deals yet', '#6d28d9');

  // Revenue Target bar chart — 3 bars per month: Won / Lost / Open — premium grouped
  const el_bar = document.getElementById('revenue-bar-svg');
  if (el_bar) {
    const wonMonths  = [sm1,sm2,sm3].map(mo=>monthSum(DB.deals.filter(d=>isWon(d)),              'wonAt',     'expectedRevenue', mo));
    const lostMonths = [sm1,sm2,sm3].map(mo=>monthSum(DB.deals.filter(d=>isLost(d)),             'lostAt',    'expectedRevenue', mo));
    const openMonths = [sm1,sm2,sm3].map(mo=>monthSum(DB.deals.filter(d=>!isWon(d)&&!isLost(d)),'createdAt', 'expectedRevenue', mo));
    const labels = [mLabel(sm1),mLabel(sm2),mLabel(sm3)];

    const W2 = el_bar.parentElement?.offsetWidth || 560;
    const H2 = 190, pad = 52, baseline = H2 - 38;
    const chartH = baseline - 16; // drawable bar height
    const groupW = (W2 - pad*2) / 3;
    const bw = 22, gap = 5;
    const groupBarW = bw*3 + gap*2;

    // Palette — muted, sophisticated
    const C_WON  = '#22c55e'; // emerald-500
    const C_LOST = '#f43f5e'; // rose-500
    const C_OPEN = '#818cf8'; // indigo-400

    const allVals = [...wonMonths, ...lostMonths, ...openMonths];
    const maxBar = Math.max(...allVals, 1);

    // Horizontal grid lines
    const gridLines = [0.25, 0.5, 0.75, 1].map(f => {
      const gy = baseline - f * chartH;
      return `<line x1="${pad}" y1="${gy}" x2="${W2-pad}" y2="${gy}" stroke="var(--border)" stroke-width="0.5" stroke-dasharray="4 4" opacity="0.6"/>
              <text x="${pad-6}" y="${gy+3.5}" text-anchor="end" font-size="9" fill="var(--fg3)" opacity="0.7">${fmtC(maxBar*f)}</text>`;
    }).join('');

    el_bar.setAttribute('viewBox', `0 0 ${W2} ${H2}`);
    el_bar.setAttribute('width', W2);
    el_bar.setAttribute('height', H2);

    // Gradient defs
    const defs = `<defs>
      <linearGradient id="gWon" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${C_WON}" stop-opacity="1"/><stop offset="100%" stop-color="${C_WON}" stop-opacity="0.65"/></linearGradient>
      <linearGradient id="gLost" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${C_LOST}" stop-opacity="1"/><stop offset="100%" stop-color="${C_LOST}" stop-opacity="0.65"/></linearGradient>
      <linearGradient id="gOpen" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${C_OPEN}" stop-opacity="1"/><stop offset="100%" stop-color="${C_OPEN}" stop-opacity="0.65"/></linearGradient>
    </defs>`;

    const bars = [sm1,sm2,sm3].map((mo, i) => {
      const gx  = pad + i*groupW + groupW/2 - groupBarW/2;
      const won = wonMonths[i], lost = lostMonths[i], open = openMonths[i];
      const bhW = won /maxBar*chartH, bhL = lost/maxBar*chartH, bhO = open/maxBar*chartH;
      const x0  = gx, x1 = gx+bw+gap, x2 = gx+(bw+gap)*2;
      const lx  = gx + groupBarW/2;

      const bar = (x, bh, fillId, color, val) => val > 0 ? `
        <rect x="${x}" y="${baseline-bh}" width="${bw}" height="${bh}" rx="4" fill="url(#${fillId})"/>
        <text x="${x+bw/2}" y="${baseline-bh-5}" text-anchor="middle" font-size="8.5" fill="${color}" font-weight="700" font-family="'Plus Jakarta Sans',Inter,sans-serif">${fmtC(val)}</text>` : `
        <rect x="${x}" y="${baseline-2}" width="${bw}" height="2" rx="1" fill="${color}" opacity="0.15"/>`;

      return `<g>
        ${bar(x0, bhW, 'gWon',  C_WON,  won)}
        ${bar(x1, bhL, 'gLost', C_LOST, lost)}
        ${bar(x2, bhO, 'gOpen', C_OPEN, open)}
        <text x="${lx}" y="${H2-14}" text-anchor="middle" font-size="10.5" fill="var(--fg2)" font-weight="600" font-family="'Plus Jakarta Sans',Inter,sans-serif">${labels[i].slice(0,3)} '${labels[i].slice(-2)}</text>
      </g>`;
    }).join('');

    el_bar.innerHTML = defs + gridLines + bars +
      `<line x1="${pad}" y1="${baseline}" x2="${W2-pad}" y2="${baseline}" stroke="var(--border)" stroke-width="1"/>`;

    // Sync legend
    const legEl = el_bar.closest('.card')?.querySelector('.rpt-bar-legend');
    if (legEl) legEl.innerHTML = [
      [C_WON,  'Won Revenue'],
      [C_LOST, 'Lost / Declined'],
      [C_OPEN, 'Open Pipeline'],
    ].map(([c,l],i)=>`<span style="display:inline-flex;align-items:center;gap:6px${i?';margin-left:18px':''}">
      <span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${c}"></span>
      <span style="font-size:11px;font-weight:600;color:var(--fg2)">${l}</span>
    </span>`).join('');
  }

}

// ---- REPORTS VIEW SWITCHER ----
let _currentReportView = 'all';
function switchReportView(view, el) {
  _currentReportView = view;
  // Update tab button styles
  ['all','org','users'].forEach(t => {
    const btn = document.getElementById('rpt-tab-'+t);
    if (!btn) return;
    if (t === view) { btn.style.borderColor = 'var(--accent)'; btn.style.color = 'var(--accent)'; btn.style.fontWeight = '600'; }
    else { btn.style.borderColor = ''; btn.style.color = ''; btn.style.fontWeight = ''; }
  });
  const usersView = document.getElementById('rpt-users-view');
  const mainView = document.getElementById('rpt-main-view');
  if (view === 'users') {
    if (usersView) usersView.style.display = '';
    renderReportUsersView();
  } else {
    if (usersView) usersView.style.display = 'none';
  }
  if (view === 'org') {
    // Org overview — jump to manager dashboard
    navigateTo('dashboard');
    setTimeout(() => setDashView('manager'), 100);
  }
}

function renderReportUsersView() {
  const now2 = new Date();
  const thisMonth = now2.getFullYear() + '-' + String(now2.getMonth()+1).padStart(2,'0');
  const users = DB.users.filter(u => u.status !== 'Inactive');
  const tbody = document.getElementById('rpt-users-table');
  if (!tbody) return;
  tbody.innerHTML = `<table style="width:100%;border-collapse:collapse">
    <thead><tr>
      <th style="padding:8px 16px;background:var(--surface2);color:var(--fg3);font-size:11px;font-weight:600;text-align:left;border-bottom:1px solid var(--border)">User</th>
      <th style="padding:8px 12px;background:var(--surface2);color:var(--fg3);font-size:11px;font-weight:600;text-align:center;border-bottom:1px solid var(--border)">Role</th>
      <th style="padding:8px 12px;background:var(--surface2);color:var(--fg3);font-size:11px;font-weight:600;text-align:center;border-bottom:1px solid var(--border)">Leads This Month</th>
      <th style="padding:8px 12px;background:var(--surface2);color:var(--fg3);font-size:11px;font-weight:600;text-align:center;border-bottom:1px solid var(--border)">Deals This Month</th>
      <th style="padding:8px 12px;background:var(--surface2);color:var(--fg3);font-size:11px;font-weight:600;text-align:center;border-bottom:1px solid var(--border)">Deals Won</th>
      <th style="padding:8px 12px;background:var(--surface2);color:var(--fg3);font-size:11px;font-weight:600;text-align:right;border-bottom:1px solid var(--border)">Revenue Won</th>
      <th style="padding:8px 12px;background:var(--surface2);color:var(--fg3);font-size:11px;font-weight:600;text-align:center;border-bottom:1px solid var(--border)">Open Tasks</th>
      <th style="padding:8px 12px;background:var(--surface2);color:var(--fg3);font-size:11px;font-weight:600;text-align:center;border-bottom:1px solid var(--border)">Activities</th>
    </tr></thead>
    <tbody>
    ${users.map(u => {
      const name = u.name || u.email || '—';
      const leads = DB.leads.filter(l => l.owner === name && (l.createdAt||'').startsWith(thisMonth)).length;
      const deals = DB.deals.filter(d => d.owner === name && (d.createdAt||'').startsWith(thisMonth)).length;
      const won   = DB.deals.filter(d => d.owner === name && d.stage==='Joined').length;
      const rev   = DB.deals.filter(d => d.owner === name && d.stage==='Joined').reduce((s,d)=>s+Number(d.expectedRevenue||d.amount||0),0);
      const tasks = DB.tasks.filter(t => t.owner === name && (t.status === 'Pending' || t.status === 'In Progress')).length;
      const acts  = DB.activities.filter(a => a.owner === name).length;
      return `<tr onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background=''">
        <td style="padding:10px 16px;border-bottom:1px solid var(--border)">
          <div style="font-weight:600;font-size:13px;color:var(--fg)">${name}</div>
          <div style="font-size:11px;color:var(--fg3)">${u.email||''}</div>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:center">${badge(u.role||'User')}</td>
        <td style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:center;font-size:14px;font-weight:600;color:var(--fg)">${leads}</td>
        <td style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:center;font-size:14px;font-weight:600;color:var(--fg)">${deals}</td>
        <td style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:center;font-size:14px;font-weight:600;color:var(--green)">${won}</td>
        <td style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:right;font-size:13px;font-weight:600;color:var(--fg)">${fmt(rev)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:center;font-size:14px;font-weight:600;color:${tasks>0?'var(--amber)':'var(--fg)'}">${tasks}</td>
        <td style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:center;font-size:14px;font-weight:600;color:var(--fg)">${acts}</td>
      </tr>`;
    }).join('')}
    ${users.length === 0 ? '<tr><td colspan="8" style="padding:32px;text-align:center;color:var(--fg3)">No active users</td></tr>' : ''}
    </tbody>
  </table>`;
}

// ---- ADD COMPONENT ----
const REPORT_COMPONENTS = [
  { id: 'an-kpi-row',       label: 'KPI Tiles (Leads, Revenue, Deals, Accounts)',  section: 'kpi' },
  { id: 'an-perf-matrix',   label: 'Last 3 Months Performance Matrix',              section: 'perf' },
  { id: 'an-leads-source',  label: 'Leads by Source Donut Chart',                   section: 'source' },
  { id: 'an-top-reps',      label: 'Prolific Sales Reps',                           section: 'reps' },
  { id: 'an-revenue-bar',   label: 'Revenue Target Bar Chart',                      section: 'revenue' },
  { id: 'an-pipeline',      label: 'Pipeline by Stage',                             section: 'pipeline' },
  { id: 'an-activity-feed', label: 'Recent Activity Feed',                          section: 'activity' },
];

function getComponentPrefs() {
  try { return JSON.parse(localStorage.getItem('sk_report_components') || 'null') || {}; } catch(e) { return {}; }
}

function applyComponentPrefs() {
  const prefs = getComponentPrefs();
  REPORT_COMPONENTS.forEach(c => {
    // Find all wrappers that contain this element (look for the card parent)
    const el = document.getElementById(c.id);
    if (!el) return;
    const card = el.closest('.card') || el.parentElement;
    if (card && card !== el) {
      card.style.display = prefs[c.id] === false ? 'none' : '';
    }
  });
}

function openAddComponent() {
  const prefs = getComponentPrefs();
  const list = document.getElementById('add-component-list');
  list.innerHTML = REPORT_COMPONENTS.map(c => {
    const checked = prefs[c.id] !== false;
    return `<label style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer">
      <input type="checkbox" id="comp-${c.id}" ${checked?'checked':''} style="width:16px;height:16px;accent-color:var(--accent)">
      <span style="font-size:13px;color:var(--fg)">${c.label}</span>
    </label>`;
  }).join('');
  const ov = document.getElementById('add-component-overlay');
  ov.style.display = 'flex';
}

function closeAddComponent() {
  document.getElementById('add-component-overlay').style.display = 'none';
}

function saveComponentPrefs() {
  const prefs = {};
  REPORT_COMPONENTS.forEach(c => {
    const cb = document.getElementById('comp-'+c.id);
    if (cb) prefs[c.id] = cb.checked;
  });
  localStorage.setItem('sk_report_components', JSON.stringify(prefs));
  closeAddComponent();
  applyComponentPrefs();
  showToast('Component preferences saved');
}

// ---- CREATE DASHBOARD ----
function getDashboards() {
  try { return JSON.parse(localStorage.getItem('sk_dashboards') || '[]'); } catch(e) { return []; }
}

function openCreateDashboard() {
  // Build snapshot preview from live data
  const now2 = new Date();
  const thisMonth = now2.getFullYear() + '-' + String(now2.getMonth()+1).padStart(2,'0');
  const prevMonth = (() => { const d = new Date(now2.getFullYear(), now2.getMonth()-1, 1); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0'); })();
  const leadsNow  = DB.leads.filter(l => (l.createdAt||'').startsWith(thisMonth)).length;
  const leadsPrev = DB.leads.filter(l => (l.createdAt||'').startsWith(prevMonth)).length;
  const dealsNow  = DB.deals.filter(d => (d.createdAt||'').startsWith(thisMonth)).length;
  const wonDeals  = DB.deals.filter(d => d.stage==='Joined').length;
  const revenue   = DB.deals.filter(d => d.stage==='Joined').reduce((s,d)=>s+Number(d.expectedRevenue||d.amount||0),0);
  const pipeline  = DB.deals.filter(d => d.stage==='Offered').reduce((s,d)=>s+Number(d.expectedRevenue||d.amount||0),0);
  const contacts  = DB.contacts.length;
  const companies = DB.companies.length;

  document.getElementById('dash-snapshot-preview').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div>📊 <b>Leads this month:</b> ${leadsNow} <span style="color:var(--fg3);font-size:11px">(prev: ${leadsPrev})</span></div>
      <div>🤝 <b>Deals created:</b> ${dealsNow}</div>
      <div>✅ <b>Deals won:</b> ${wonDeals}</div>
      <div>💰 <b>Revenue won:</b> ${fmt(revenue)}</div>
      <div>🔄 <b>Open pipeline:</b> ${fmt(pipeline)}</div>
      <div>👥 <b>Contacts:</b> ${contacts}</div>
      <div>🏢 <b>Accounts:</b> ${companies}</div>
      <div>📅 <b>Snapshot date:</b> ${new Date().toLocaleDateString('en-IN')}</div>
    </div>`;

  document.getElementById('dash-name-input').value = '';
  document.getElementById('dash-notes-input').value = '';

  // Show saved dashboards
  const saved = getDashboards();
  const savedEl = document.getElementById('dash-saved-list');
  savedEl.innerHTML = saved.length ? `
    <div style="font-size:12px;font-weight:600;color:var(--fg3);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.6px">Saved Dashboards</div>
    ${saved.map((d,i) => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--surface2);border-radius:8px;margin-bottom:8px">
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--fg)">${esc(d.name)}</div>
          <div style="font-size:11px;color:var(--fg3)">${d.savedAt} · Leads: ${d.data.leadsNow} · Revenue: ${fmt(d.data.revenue)}</div>
          ${d.notes ? `<div style="font-size:11px;color:var(--fg2);margin-top:3px">${esc(d.notes)}</div>` : ''}
        </div>
        <button onclick="deleteDashboard(${i})" style="background:none;border:none;cursor:pointer;color:var(--red);font-size:14px;padding:4px 8px" title="Delete">✕</button>
      </div>`).join('')}` : '';

  const ov = document.getElementById('create-dashboard-overlay');
  ov.style.display = 'flex';
}

function closeCreateDashboard() {
  document.getElementById('create-dashboard-overlay').style.display = 'none';
}

function saveDashboardSnapshot() {
  const name = document.getElementById('dash-name-input').value.trim();
  if (!name) { document.getElementById('dash-name-input').focus(); showToast('Please enter a dashboard name','warn'); return; }
  const notes = document.getElementById('dash-notes-input').value.trim();
  const now2 = new Date();
  const thisMonth = now2.getFullYear() + '-' + String(now2.getMonth()+1).padStart(2,'0');
  const prevMonth = (() => { const d = new Date(now2.getFullYear(), now2.getMonth()-1, 1); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0'); })();
  const snapshot = {
    name, notes,
    savedAt: new Date().toLocaleString('en-IN'),
    data: {
      leadsNow:  DB.leads.filter(l => (l.createdAt||'').startsWith(thisMonth)).length,
      leadsPrev: DB.leads.filter(l => (l.createdAt||'').startsWith(prevMonth)).length,
      dealsNow:  DB.deals.filter(d => (d.createdAt||'').startsWith(thisMonth)).length,
      wonDeals:  DB.deals.filter(d => d.stage==='Joined').length,
      revenue:   DB.deals.filter(d => d.stage==='Joined').reduce((s,d)=>s+Number(d.expectedRevenue||d.amount||0),0),
      pipeline:  DB.deals.filter(d => d.stage==='Offered').reduce((s,d)=>s+Number(d.expectedRevenue||d.amount||0),0),
      contacts:  DB.contacts.length,
      companies: DB.companies.length,
    }
  };
  const saved = getDashboards();
  saved.unshift(snapshot);
  if (saved.length > 20) saved.pop(); // keep last 20
  localStorage.setItem('sk_dashboards', JSON.stringify(saved));
  closeCreateDashboard();
  showToast(`Dashboard "${name}" saved ✓`);
}

function deleteDashboard(idx) {
  const saved = getDashboards();
  saved.splice(idx, 1);
  localStorage.setItem('sk_dashboards', JSON.stringify(saved));
  openCreateDashboard(); // refresh modal
}

// ---- AUDIT ----
function renderAudit() {
  const banner = document.getElementById('audit-admin-banner');
  if (banner) banner.style.display = isSuperAdmin() ? 'flex' : 'none';
  const rows = DB.audit.slice(0, 200);
  document.getElementById('audit-body').innerHTML = rows.length ? rows.map(a => {
    const actionCls = a.action === 'Create' ? 'badge-green' : a.action === 'Delete' ? 'badge-red' : 'badge-blue';
    return `<tr>
      <td class="mono text-xs">${new Date(a.ts).toLocaleString('en-IN')}</td>
      <td style="font-weight:500">${a.user || '—'}</td>
      <td><span class="badge ${actionCls}">${a.action}</span></td>
      <td style="text-transform:capitalize">${a.module}</td>
      <td>${a.record || '—'}</td>
    </tr>`;
  }).join('') : '<tr><td colspan="5" class="empty-state">No audit entries this session</td></tr>';
}

// ---- TAB HELPERS ----
function switchLeadTab(view, el) {
  // Update subtab pills
  document.querySelectorAll('#page-leads .crm-subtab').forEach(t=>t.classList.remove('active-subtab'));
  const pill = document.querySelector(`#page-leads .crm-subtab[onclick*="${view==='board'?'board':'list'}"]`);
  if(pill) pill.classList.add('active-subtab');
  else if(el && el.classList.contains('crm-subtab')) el.classList.add('active-subtab');
  // Update icon buttons
  const lb = document.getElementById('leads-btn-list'), gb = document.getElementById('leads-btn-grid');
  if(lb) lb.classList.toggle('active-view-btn', view!=='board');
  if(gb) gb.classList.toggle('active-view-btn', view==='board');
  // Show/hide panels
  document.getElementById('leads-board').style.display = view==='board'?'flex':'none';
  document.getElementById('leads-list').style.display = view==='board'?'none':'block';
  if(view==='board') renderLeadsBoard();
  else renderTable('leads','');
}
function switchDealTab(view, el) {
  // Update subtab pills
  document.querySelectorAll('#page-deals .crm-subtab').forEach(t=>t.classList.remove('active-subtab'));
  const pill = document.querySelector(`#page-deals .crm-subtab[onclick*="${view==='board'?'board':'list'}"]`);
  if(pill) pill.classList.add('active-subtab');
  else if(el && el.classList.contains('crm-subtab')) el.classList.add('active-subtab');
  // Update icon buttons
  const lb = document.getElementById('deals-btn-list'), gb = document.getElementById('deals-btn-grid');
  if(lb) lb.classList.toggle('active-view-btn', view!=='board');
  if(gb) gb.classList.toggle('active-view-btn', view==='board');
  // Show/hide panels
  document.getElementById('deals-board').style.display = view==='board'?'flex':'none';
  document.getElementById('deals-list').style.display = view==='board'?'none':'block';
  if(view==='board') renderDealsBoard();
  else renderTable('deals','');
}
function toggleFilter(id) {
  const el = document.getElementById(id);
  if(el) el.style.display = el.style.display==='none'?'block':'none';
}
function toggleSection(hdrEl, sectionId) {
  const sec = document.getElementById(sectionId);
  if (!sec) return;
  const open = sec.style.display !== 'none';
  sec.style.display = open ? 'none' : '';
  hdrEl.classList.toggle('collapsed', open);
}

/* ============================================================
   SETUP PAGE — Users, Roles, Security
   ============================================================ */

// 20 pre-seeded users
var SETUP_USERS = [
  { id:'u1',  name:'Vikram Sharma',     email:'vikram@searchkraft.in',     role:'Super Admin', title:'CEO',               dept:'Leadership',   status:'active',  phone:'91-9663212727', avatar:'VS', color:'#1a56db', online:true  },
  { id:'u2',  name:'Poovizhi Devaraj',  email:'poovizhi@searchkraft.in',   role:'Admin',       title:'Manager',           dept:'Sales',        status:'active',  phone:'91-9876543210', avatar:'PD', color:'#7c3aed', online:true  },
  { id:'u3',  name:'Shreya Mitra',      email:'shreya@searchkraft.in',     role:'Admin',       title:'Manager',           dept:'Operations',   status:'active',  phone:'91-9811223344', avatar:'SM', color:'#0891b2', online:false },
  { id:'u4',  name:'Arjun Mehta',       email:'arjun@searchkraft.in',      role:'Manager',     title:'Sales Lead',        dept:'Sales',        status:'active',  phone:'91-9900112233', avatar:'AM', color:'#059669', online:true  },
  { id:'u5',  name:'Priya Nair',        email:'priya@searchkraft.in',      role:'User',        title:'BDE',               dept:'Sales',        status:'active',  phone:'91-9812345678', avatar:'PN', color:'#dc2626', online:false },
  { id:'u6',  name:'Rahul Gupta',       email:'rahul@searchkraft.in',      role:'User',        title:'BDE',               dept:'Sales',        status:'active',  phone:'91-9900234567', avatar:'RG', color:'#ea580c', online:true  },
  { id:'u7',  name:'Sneha Patel',       email:'sneha@searchkraft.in',      role:'User',        title:'Account Manager',   dept:'Accounts',     status:'active',  phone:'91-9811334455', avatar:'SP', color:'#7c3aed', online:false },
  { id:'u8',  name:'Karan Singh',       email:'karan@searchkraft.in',      role:'Manager',     title:'Team Lead',         dept:'Delivery',     status:'active',  phone:'91-9812234567', avatar:'KS', color:'#1a56db', online:true  },
  { id:'u9',  name:'Divya Reddy',       email:'divya@searchkraft.in',      role:'User',        title:'BDE',               dept:'Sales',        status:'active',  phone:'91-9800123456', avatar:'DR', color:'#059669', online:false },
  { id:'u10', name:'Amit Joshi',        email:'amit@searchkraft.in',       role:'User',        title:'Recruiter',         dept:'HR',           status:'active',  phone:'91-9911223344', avatar:'AJ', color:'#d97706', online:true  },
  { id:'u11', name:'Nisha Sharma',      email:'nisha@searchkraft.in',      role:'User',        title:'SDR',               dept:'Sales',        status:'active',  phone:'91-9823456789', avatar:'NS', color:'#dc2626', online:false },
  { id:'u12', name:'Rohit Kumar',       email:'rohit@searchkraft.in',      role:'Restricted',  title:'Intern',            dept:'Sales',        status:'active',  phone:'91-9812567890', avatar:'RK', color:'#6b7280', online:false },
  { id:'u13', name:'Anjali Verma',      email:'anjali@searchkraft.in',     role:'User',        title:'Operations Exec',   dept:'Operations',   status:'active',  phone:'91-9876012345', avatar:'AV', color:'#0891b2', online:true  },
  { id:'u14', name:'Sanjay Malhotra',   email:'sanjay@searchkraft.in',     role:'Manager',     title:'BD Manager',        dept:'Business Dev', status:'active',  phone:'91-9900001111', avatar:'SM', color:'#7c3aed', online:false },
  { id:'u15', name:'Kavya Iyer',        email:'kavya@searchkraft.in',      role:'User',        title:'Marketing Exec',    dept:'Marketing',    status:'active',  phone:'91-9811112222', avatar:'KI', color:'#ea580c', online:false },
  { id:'u16', name:'Deepak Tiwari',     email:'deepak@searchkraft.in',     role:'User',        title:'Data Analyst',      dept:'Analytics',    status:'active',  phone:'91-9823334444', avatar:'DT', color:'#059669', online:true  },
  { id:'u17', name:'Meera Pillai',      email:'meera@searchkraft.in',      role:'User',        title:'Content Writer',    dept:'Marketing',    status:'active',  phone:'91-9900445566', avatar:'MP', color:'#d97706', online:false },
  { id:'u18', name:'Varun Agarwal',     email:'varun@searchkraft.in',      role:'Restricted',  title:'Trainee',           dept:'Sales',        status:'inactive',phone:'91-9811556677', avatar:'VA', color:'#6b7280', online:false },
  { id:'u19', name:'Lakshmi Balan',     email:'lakshmi@searchkraft.in',    role:'User',        title:'HR Executive',      dept:'HR',           status:'active',  phone:'91-9823667788', avatar:'LB', color:'#1a56db', online:false },
  { id:'u20', name:'Tejas Bhatt',       email:'tejas@searchkraft.in',      role:'User',        title:'Finance Exec',      dept:'Finance',      status:'active',  phone:'91-9900778899', avatar:'TB', color:'#dc2626', online:true  },
  { id:'u21', name:'Sahil Phatak',      email:'sahil@searchkraft.in',      role:'Super Admin', title:'Founder',           dept:'Leadership',   status:'active',  phone:'91-9900000000', avatar:'SP', color:'#1a56db', online:true  }
];

// Module access permissions per role
const ROLE_PERMS = {
  'Super Admin': { leads:['view','create','edit','delete'], contacts:['view','create','edit','delete'], accounts:['view','create','edit','delete'], deals:['view','create','edit','delete'], reports:['view','create','edit','delete'], documents:['view','create','edit','delete'], activities:['view','create','edit','delete'], tasks:['view','create','edit','delete'], setup:['view','manage'] },
  'Admin':       { leads:['view','create','edit','delete'], contacts:['view','create','edit','delete'], accounts:['view','create','edit','delete'], deals:['view','create','edit','delete'], reports:['view','create'],                  documents:['view','create','edit','delete'], activities:['view','create','edit','delete'], tasks:['view','create','edit','delete'], setup:['view'] },
  'Manager':     { leads:['view','create','edit'],          contacts:['view','create','edit'],          accounts:['view','create','edit'],          deals:['view','create','edit'],          reports:['view'],                           documents:['view','create','edit'],          activities:['view','create','edit','delete'], tasks:['view','create','edit','delete'], setup:[] },
  'User':        { leads:['view','create'],                 contacts:['view','create'],                 accounts:['view'],                          deals:['view','create'],                 reports:['view'],                           documents:['view','create'],                 activities:['view','create','edit','delete'], tasks:['view','create','edit','delete'], setup:[] },
  'Restricted':  { leads:['view'],                         contacts:[],                                accounts:[],                                deals:[],                                reports:[],                                 documents:['view'],                          activities:['view'],                         tasks:['view'],                          setup:[] }
};

let currentSetupUser = null;
let userStatusFilter = 'active';

function switchSetupTab(btn, tabId) {
  const el = (btn && btn instanceof HTMLElement) ? btn : document.querySelector('[data-stab="'+tabId+'"]');
  document.querySelectorAll('.setup-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  // hide all panels
  document.querySelectorAll('#page-setup .setup-panel').forEach(p => {
    p.classList.remove('sp-active');
  });
  const panel = document.getElementById(tabId);
  if (panel) panel.classList.add('sp-active');
  if (tabId === 'setup-users') {
    setTimeout(function() {
      currentSetupUser = null;
      syncSetupUsersFromDB();
      renderUserList();
    }, 0);
  }
  if (tabId === 'setup-roles') renderRolesPanel();
}

function renderUserList() {
  const q = (document.getElementById('user-search')?.value || '').toLowerCase();
  const list = document.getElementById('user-list');
  if (!list) return;
  const filtered = SETUP_USERS.filter(u => {
    if (userStatusFilter === 'active' && u.status !== 'active') return false;
    if (userStatusFilter === 'inactive' && u.status !== 'inactive') return false;
    if (userStatusFilter === 'admin' && !['Super Admin','Admin'].includes(u.role)) return false;
    if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    return true;
  });
  const lbl = document.getElementById('usr-filter-label');
  if (lbl) lbl.textContent = (userStatusFilter === 'active' ? 'Active Users' : userStatusFilter === 'inactive' ? 'Inactive Users' : userStatusFilter === 'admin' ? 'Admins' : 'All Users') + ' (' + filtered.length + ')';
  if (filtered.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:var(--fg3);padding:32px;font-size:13px">No users found</div>';
    return;
  }
  list.innerHTML = filtered.map(u => {
    const roleCls = u.role === 'Super Admin' ? 'super' : u.role === 'Admin' ? 'admin' : u.role === 'Manager' ? 'manager' : u.role === 'Restricted' ? 'restricted' : 'user';
    return `<div class="user-list-item${currentSetupUser && currentSetupUser.id === u.id ? ' selected' : ''}" onclick="selectUser('${u.id}')">
      <div class="user-avatar" style="background:${u.color};width:44px;height:44px;font-size:14px;border-radius:50%">
        ${u.avatar}
        <div class="user-online-dot" style="background:${u.online ? '#22c55e' : '#94a3b8'}"></div>
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:600;color:var(--fg);display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          ${u.name}
          <span class="user-badge badge-${roleCls}">${u.role}</span>
        </div>
        <div style="font-size:12px;color:var(--fg2);margin-top:1px">${u.title} · ${u.dept}</div>
        <div style="font-size:11px;color:var(--fg3);margin-top:1px">${u.email}</div>
      </div>
    </div>`;
  }).join('');
  // auto-select first user if none selected
  if (!currentSetupUser) {
    currentSetupUser = filtered[0];
    renderUserDetail();
    // re-render list to highlight first
    list.querySelector('.user-list-item').classList.add('selected');
  }
}

function selectUser(uid) {
  currentSetupUser = SETUP_USERS.find(u => u.id === uid) || null;
  renderUserList();
  renderUserDetail();
}

function renderUserDetail() {
  const det = document.getElementById('user-detail');
  if (!det || !currentSetupUser) return;
  const u = currentSetupUser;
  // Use per-user custom_perms if set, otherwise role default
  const perms = getEffectivePerms(u);
  const modules = ['leads','contacts','accounts','deals','reports','setup'];
  const actions = ['view','create','edit','delete'];
  det.innerHTML = `
    <!-- Header -->
    <div style="display:flex;align-items:flex-start;gap:20px;margin-bottom:24px">
      <div class="user-avatar" style="background:${u.color};width:60px;height:60px;font-size:20px;border-radius:50%">${u.avatar}</div>
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <div style="font-size:20px;font-weight:700;color:var(--fg)">${u.name}</div>
          <span class="user-badge badge-${u.role === 'Super Admin' ? 'super' : u.role === 'Admin' ? 'admin' : u.role === 'Manager' ? 'manager' : u.role === 'Restricted' ? 'restricted' : 'user'}" style="font-size:12px;padding:3px 12px">${u.role}</span>
          ${(isSuperAdmin() || (isAdminOrAbove() && u.role !== 'Super Admin')) ? `<button onclick="openEditUserModal('${u.id}')" style="background:none;border:1.5px solid var(--border);border-radius:7px;padding:4px 12px;font-size:12px;cursor:pointer;color:var(--fg)">✎ Edit</button>` : ''}
          ${isAdminOrAbove() && u.id !== (window.LOGGED_IN_USER?.id || '') && u.email !== (window.LOGGED_IN_USER?.email || '') ? `<button onclick="confirmDeleteUser('${u.id}')" style="background:none;border:1.5px solid #ef4444;border-radius:7px;padding:4px 12px;font-size:12px;cursor:pointer;color:#ef4444">🗑 Delete</button>` : ''}
        </div>
        ${(isSuperAdmin() || (isAdminOrAbove() && u.role !== 'Super Admin')) ? `<div style="display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap">
          <label style="font-size:12px;color:var(--fg2);font-weight:500">Change Role:</label>
          <select id="quick-role-${u.id}" style="padding:4px 10px;border:1.5px solid var(--border);border-radius:7px;font-size:12px;color:var(--fg);background:var(--surface)">
            ${(isSuperAdmin() ? ['Super Admin','Admin','Manager','User','Restricted'] : ['Admin','Manager','User','Restricted']).map(r=>`<option${r===u.role?' selected':''}>${r}</option>`).join('')}
          </select>
          <button onclick="quickSaveRole('${u.id}')" style="padding:4px 14px;background:var(--accent);color:#fff;border:none;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer">Save Role</button>
        </div>` : (isAdminOrAbove() && u.role === 'Super Admin' ? `<div style="margin-top:8px;font-size:12px;color:var(--fg3);font-style:italic">🔒 Only Super Admin can edit another Super Admin</div>` : '')}
        <div style="font-size:13px;color:var(--fg2);margin-top:8px">${u.title} · ${u.dept} · Searchkraft AI Labs</div>
        <div style="display:flex;align-items:center;gap:18px;margin-top:6px;font-size:12px;color:var(--fg3)">
          <span>✉ ${u.email}</span>
          <span>📞 ${u.phone}</span>
          <span style="color:${u.status === 'active' ? '#22c55e' : '#ef4444'};font-weight:600">● ${u.status === 'active' ? 'Active' : 'Inactive'}</span>
        </div>
      </div>
    </div>
    <!-- Teamspace Info -->
    <div style="background:var(--surface);border-radius:12px;padding:18px 20px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,0.05)">
      <div style="font-size:13px;font-weight:700;color:var(--fg);margin-bottom:12px">Teamspace Information</div>
      <div style="display:flex;align-items:center;gap:12px;font-size:13px">
        <span style="color:var(--fg2);width:130px">Associated To</span>
        <span style="background:#f59e0b;color:#fff;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:700">CT</span>
        <span style="color:var(--fg)">CRM Teamspace</span>
      </div>
    </div>
    <!-- Locale Info -->
    <div style="background:var(--surface);border-radius:12px;padding:18px 20px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,0.05)">
      <div style="font-size:13px;font-weight:700;color:var(--fg);margin-bottom:12px">Locale Information</div>
      <div style="display:grid;grid-template-columns:140px 1fr;gap:8px;font-size:13px">
        <span style="color:var(--fg2)">Language</span><span style="color:var(--fg)">English (India)</span>
        <span style="color:var(--fg2)">Country Locale</span><span style="color:var(--fg)">India</span>
        <span style="color:var(--fg2)">Date Format</span><span style="color:var(--fg)">DD/MM/YYYY</span>
        <span style="color:var(--fg2)">Time Format</span><span style="color:var(--fg)">12 Hours</span>
        <span style="color:var(--fg2)">Time Zone</span><span style="color:var(--fg)">(GMT 5:30) India Standard Time (Asia/Kolkata)</span>
        <span style="color:var(--fg2)">Distance Unit</span><span style="color:var(--fg)">Kilometers (km)</span>
      </div>
    </div>
    <!-- Permissions Matrix — Admin cannot edit Super Admin perms -->
    ${!isSuperAdmin() && u.role === 'Super Admin' ? `
    <div style="background:var(--surface);border-radius:12px;padding:18px 20px;box-shadow:0 1px 4px rgba(0,0,0,0.05);display:flex;align-items:center;gap:12px">
      <span style="font-size:22px">🔒</span>
      <div>
        <div style="font-size:13px;font-weight:700;color:var(--fg)">Access &amp; Permissions</div>
        <div style="font-size:12px;color:var(--fg3);margin-top:2px">Super Admin permissions are not visible to Admins.</div>
      </div>
    </div>` : `
    <div style="background:var(--surface);border-radius:12px;padding:18px 20px;box-shadow:0 1px 4px rgba(0,0,0,0.05)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div style="font-size:13px;font-weight:700;color:var(--fg)">Access &amp; Permissions</div>
        <div style="font-size:12px;color:var(--fg3)">Based on role: <strong>${u.role}</strong>${u.custom_perms ? ' <span style="color:#f59e0b;font-size:11px">(customised)</span>' : ''}</div>
      </div>
      <table class="perm-table">
        <thead><tr>
          <th>Module</th>
          ${actions.map(a=>`<th style="text-align:center;text-transform:capitalize">${a}</th>`).join('')}
        </tr></thead>
        <tbody>
          ${modules.map(mod => `<tr>
            <td style="font-weight:500;text-transform:capitalize">${mod}</td>
            ${actions.map(act => {
              const has = (perms[mod]||[]).includes(act);
              const disabled = u.role === 'Super Admin'; // Super Admin perms are always full
              return `<td style="text-align:center"><input type="checkbox" class="perm-check" ${has?'checked':''} ${disabled?'disabled title="Super Admin always has full access"':''} onchange="updatePerm('${u.id}','${mod}','${act}',this.checked)"></td>`;
            }).join('')}
          </tr>`).join('')}
        </tbody>
      </table>
      <div style="margin-top:14px;display:flex;gap:10px;align-items:center">
        <button onclick="saveUserPerms('${u.id}')" style="padding:8px 20px;background:#2EA44F;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">Save Permissions</button>
        <button onclick="resetPerms('${u.id}')" style="padding:8px 16px;background:none;border:1.5px solid var(--border);border-radius:8px;font-size:13px;cursor:pointer;color:var(--fg2)">Reset to Role Default</button>
        ${u.custom_perms ? `<span style="font-size:11px;color:#f59e0b;font-style:italic">Custom permissions active</span>` : `<span style="font-size:11px;color:var(--fg3);font-style:italic">Using role defaults</span>`}
      </div>
    </div>`}
    `;
}

function updatePerm(uid, mod, act, checked) {
  const u = SETUP_USERS.find(x => x.id === uid);
  if (!u) return;
  // Work on per-user custom_perms (cloned from role default if not yet set)
  if (!u.custom_perms) {
    u.custom_perms = JSON.parse(JSON.stringify(ROLE_PERMS[u.role] || ROLE_PERMS['User']));
  }
  if (!u.custom_perms[mod]) u.custom_perms[mod] = [];
  if (checked) { if (!u.custom_perms[mod].includes(act)) u.custom_perms[mod].push(act); }
  else { u.custom_perms[mod] = u.custom_perms[mod].filter(a => a !== act); }
  // Also keep DB.users in sync
  const dbU = DB.users.find(x => x.id === uid);
  if (dbU) dbU.custom_perms = u.custom_perms;
}

async function saveUserPerms(uid) {
  const u = SETUP_USERS.find(x => x.id === uid);
  if (!u) return;
  // If no custom_perms built yet, read current checkboxes to build it
  if (!u.custom_perms) {
    const modules = ['leads','contacts','accounts','deals','reports','setup'];
    const actions = ['view','create','edit','delete'];
    const cp = {};
    modules.forEach(mod => {
      cp[mod] = [];
      actions.forEach(act => {
        const cb = document.querySelector(`input[onchange*="'${uid}','${mod}','${act}'"]`);
        if (cb && cb.checked) cp[mod].push(act);
      });
    });
    u.custom_perms = cp;
    const dbU = DB.users.find(x => x.id === uid);
    if (dbU) dbU.custom_perms = cp;
  }
  try {
    const { error } = await DB_CLIENT.from('profiles')
      .update({ custom_perms: u.custom_perms, updated_at: new Date().toISOString() })
      .eq('id', uid);
    if (error) throw error;
    // If this is the logged-in user, update their live perms immediately
    if (LOGGED_IN_USER && LOGGED_IN_USER.id === uid) {
      LOGGED_IN_USER.custom_perms = u.custom_perms;
      applyNavPermissions();
    }
    showToast('Permissions saved for ' + u.name, '#2EA44F');
    audit('Update', 'Users', u.name, 'Permissions updated');
  } catch(e) {
    showToast('Failed to save: ' + (e?.message || e), '#dc2626');
  }
}

async function resetPerms(uid) {
  const u = SETUP_USERS.find(x => x.id === uid);
  if (!u) return;
  u.custom_perms = null;
  const dbU = DB.users.find(x => x.id === uid);
  if (dbU) dbU.custom_perms = null;
  try {
    await DB_CLIENT.from('profiles')
      .update({ custom_perms: null, updated_at: new Date().toISOString() })
      .eq('id', uid);
    if (LOGGED_IN_USER && LOGGED_IN_USER.id === uid) {
      LOGGED_IN_USER.custom_perms = null;
      applyNavPermissions();
    }
    showToast('Reset to role defaults for ' + u.name, '#6366f1');
  } catch(e) { /* ignore — in-memory reset still happened */ }
  renderUserDetail();
}

function toggleUsrFilter() {
  const dd = document.getElementById('usr-filter-dd');
  if (dd) dd.style.display = dd.style.display === 'none' ? '' : 'none';
}

function filterUsers(status, label) {
  userStatusFilter = status;
  document.getElementById('usr-filter-dd').style.display = 'none';
  renderUserList();
}

function openNewUserModal() {
  document.getElementById('user-modal-title').textContent = 'New User';
  document.getElementById('user-modal-body').innerHTML = userModalForm(null);
  document.getElementById('user-modal-overlay').style.display = 'flex';
}

function openEditUserModal(uid) {
  const u = SETUP_USERS.find(x => x.id === uid);
  document.getElementById('user-modal-title').textContent = 'Edit User — ' + (u?.name || '');
  document.getElementById('user-modal-body').innerHTML = userModalForm(u);
  document.getElementById('user-modal-overlay').style.display = 'flex';
}

function closeUserModal() {
  document.getElementById('user-modal-overlay').style.display = 'none';
}

function userModalForm(u) {
  return `
    <div class="um-field"><label class="um-label">First Name</label><input class="um-input" id="um-fname" value="${u ? u.name.split(' ')[0] : ''}"></div>
    <div class="um-field"><label class="um-label">Last Name</label><input class="um-input" id="um-lname" value="${u ? u.name.split(' ').slice(1).join(' ') : ''}"></div>
    <div class="um-field"><label class="um-label">Email</label><input class="um-input" id="um-email" type="email" value="${u?.email || ''}"></div>
    <div class="um-field"><label class="um-label">Phone</label><input class="um-input" id="um-phone" type="tel" value="${u?.phone || ''}" oninput="this.value=this.value.replace(/[^0-9+\\-() ]/g,'')"></div>
    <div class="um-field"><label class="um-label">Title / Designation</label><input class="um-input" id="um-title" value="${u?.title || ''}"></div>
    <div class="um-field"><label class="um-label">Department</label><input class="um-input" id="um-dept" value="${u?.dept || ''}"></div>
    <div class="um-field"><label class="um-label">Role / Access Level</label>
      <select class="um-select" id="um-role">
        ${(isSuperAdmin() ? ['Super Admin','Admin','Manager','User','Restricted'] : ['Admin','Manager','User','Restricted']).map(r=>`<option${r === (u?.role||'User') ? ' selected' : ''}>${r}</option>`).join('')}
      </select>
    </div>
    ${!isSuperAdmin() && u?.role === 'Super Admin' ? '<div style="font-size:11px;color:var(--red);margin-top:-8px">Only Super Admin can change a Super Admin\'s role.</div>' : ''}
    <div class="um-field"><label class="um-label">Status</label>
      <select class="um-select" id="um-status">
        <option${(!u || u.status==='active') ? ' selected' : ''}>active</option>
        <option${u?.status==='inactive' ? ' selected' : ''}>inactive</option>
      </select>
    </div>
    ${!u ? `<div class="um-field"><label class="um-label">Password <span style="color:var(--fg3);font-size:11px">(user can change later)</span></label><input class="um-input" id="um-password" type="password" placeholder="Min 8 characters" autocomplete="new-password"></div>` : ''}
    <div style="display:flex;gap:10px;margin-top:18px">
      <button onclick="saveUserFromModal(${u ? `'${u.id}'` : 'null'})" style="flex:1;padding:10px;background:#2EA44F;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">Save User</button>
      <button onclick="closeUserModal()" style="padding:10px 18px;background:none;border:1.5px solid var(--border);border-radius:8px;font-size:13px;cursor:pointer;color:var(--fg2)">Cancel</button>
    </div>`;
}

async function saveUserFromModal(uid) {
  if (!isSuperAdmin() && !isAdminOrAbove()) {
    showToast('Only Super Admin or Admin can edit users.', '#dc2626'); return;
  }
  const fname = document.getElementById('um-fname').value.trim();
  const lname = document.getElementById('um-lname').value.trim();
  const name = (fname + ' ' + lname).trim();
  const email = document.getElementById('um-email').value.trim();
  const phone = document.getElementById('um-phone').value.trim();
  const title = document.getElementById('um-title').value.trim();
  const dept = document.getElementById('um-dept').value.trim();
  const role = document.getElementById('um-role').value;
  const status = document.getElementById('um-status').value;
  if (!name || !email) { alert('Name and email are required'); return; }

  // Only Super Admin can assign Super Admin role
  if (role === 'Super Admin' && !isSuperAdmin()) {
    showToast('Only a Super Admin can assign the Super Admin role.', '#dc2626'); return;
  }

  if (uid) {
    // Update in SETUP_USERS (local) and also in DB.users + Supabase profiles
    const u = SETUP_USERS.find(x => x.id === uid);
    if (u) { u.name = name; u.email = email; u.phone = phone; u.title = title; u.dept = dept; u.role = role; u.status = status; u.avatar = name.split(' ').map(p=>p[0]).join('').toUpperCase().slice(0,2); }
    // Sync to Supabase profiles if this is a real user (UUID id)
    const dbUser = DB.users.find(x => x.id === uid || x.email === email);
    if (dbUser) {
      try {
        await DB_CLIENT.from('profiles').update({ name, phone, title, dept, role, status, updated_at: new Date().toISOString() }).eq('id', dbUser.id);
        dbUser.name = name; dbUser.role = role; dbUser.title = title; dbUser.dept = dept; dbUser.phone = phone; dbUser.status = status;
      } catch(e) { console.warn('Profile update failed:', e); }
    }
  } else {
    // NEW USER: create Supabase Auth account so they can log in
    const pwdInput = document.getElementById('um-password');
    const enteredPwd = pwdInput ? pwdInput.value.trim() : '';
    if (!enteredPwd || enteredPwd.length < 8) { alert('Password is required and must be at least 8 characters.'); return; }
    let newAuthId = null;
    try {
      // Save current admin session before signUp (signUp auto-logs in the new user)
      const { data: currentSession } = await DB_CLIENT.auth.getSession();
      const adminAccessToken  = currentSession?.session?.access_token;
      const adminRefreshToken = currentSession?.session?.refresh_token;

      // Suppress onAuthStateChange during signUp so admin isn't kicked out
      _suppressAuthChange = true;
      let signUpErr = null;
      try {
        const { data: signUpData, error: err } = await DB_CLIENT.auth.signUp({
          email, password: enteredPwd,
          options: { data: { name, role } }
        });
        signUpErr = err;
        newAuthId = signUpData?.user?.id;
      } finally {
        _suppressAuthChange = false;
      }
      if (signUpErr) throw signUpErr;

      // Restore admin's session immediately so they stay logged in
      if (adminAccessToken && adminRefreshToken) {
        await DB_CLIENT.auth.setSession({ access_token: adminAccessToken, refresh_token: adminRefreshToken });
      }
    } catch(e) {
      _suppressAuthChange = false;
      const msg = e?.message || String(e);
      if (msg.includes('already registered') || msg.includes('already exists')) {
        showToast('A user with this email already exists.', '#dc2626');
      } else {
        showToast('Failed to create auth account: ' + msg, '#dc2626');
      }
      return;
    }
    // Upsert profile row — mark force_password_change so new user sets their own password on first login
    if (newAuthId) {
      try {
        await DB_CLIENT.from('profiles').upsert({
          id: newAuthId, name, email, phone, title, dept, role, status,
          force_password_change: true,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString()
        });
        const colors = ['#1a56db','#7c3aed','#0891b2','#059669','#dc2626','#ea580c','#d97706'];
        DB.users.push({ id: newAuthId, name, email, phone, title, dept, role, status,
          avatar: name.split(' ').map(p=>p[0]).join('').toUpperCase().slice(0,2),
          color: colors[Math.floor(Math.random()*colors.length)], force_password_change: true });
        syncSetupUsersFromDB();
        audit('Create', 'Users', name, `New user created as ${role}`);
        closeUserModal();
        showToast(`✓ ${name} created! They can log in with the password you set and will be prompted to change it.`, '#2EA44F');
        renderUserList();
        renderUserDetail();
        return;
      } catch(e) {
        console.warn('Profile upsert failed:', e);
      }
    }
  }
  closeUserModal();
  syncSetupUsersFromDB(); // refresh from live DB
  renderUserList();
  if (uid && currentSetupUser?.id === uid) renderUserDetail();
  showToast(uid ? 'User updated' : 'User created', '#2EA44F');
}

// Merge real DB users into SETUP_USERS so the Users panel shows live data
function syncSetupUsersFromDB() {
  if (!DB.users || !DB.users.length) return;
  // Rebuild SETUP_USERS entirely from real DB — never show mock/hardcoded users
  // that don't exist in Supabase profiles table
  const colors = ['#1a56db','#7c3aed','#0891b2','#059669','#dc2626','#ea580c','#d97706'];
  SETUP_USERS.length = 0; // clear existing (including mock data)
  DB.users.forEach((dbU, i) => {
    SETUP_USERS.push({
      id:           dbU.id,
      name:         dbU.name   || 'Unknown',
      email:        dbU.email  || '',
      role:         dbU.role   || 'User',
      title:        dbU.title  || '',
      dept:         dbU.dept   || '',
      phone:        dbU.phone  || '',
      status:       dbU.status || 'active',
      avatar:       (dbU.name||'?').split(' ').map(p=>p[0]).join('').toUpperCase().slice(0,2),
      color:        dbU.color  || colors[i % colors.length],
      custom_perms: dbU.custom_perms || null,
      online:       false
    });
  });
}

// Quick role save from user detail panel
async function quickSaveRole(userId) {
  const sel = document.getElementById('quick-role-' + userId);
  if (!sel) return;
  const newRole = sel.value;
  if (newRole === 'Super Admin' && !isSuperAdmin()) {
    showToast('Only a Super Admin can assign the Super Admin role.', '#dc2626'); return;
  }
  const u = SETUP_USERS.find(x => x.id === userId);
  // Match by id OR by email (handles mock IDs like 'u1' that exist in SETUP_USERS but not DB.users)
  const dbUser = DB.users.find(x => x.id === userId) || (u ? DB.users.find(x => x.email === u.email) : null);
  if (!dbUser) {
    // No Supabase record — still update SETUP_USERS in memory only
    if (u) { u.role = newRole; renderUserList(); renderUserDetail(); showToast(`Role updated (local only — user not yet in database)`, '#f59e0b'); }
    else { showToast('User not found.', '#dc2626'); }
    return;
  }
  // Optimistically update memory first
  const prevRole = dbUser.role;
  if (u) u.role = newRole;
  dbUser.role = newRole;
  renderUserList();
  renderUserDetail();
  try {
    const { error } = await DB_CLIENT.from('profiles').update({ role: newRole, updated_at: new Date().toISOString() }).eq('id', dbUser.id);
    if (error) throw error;
    showToast(`Role updated to ${newRole}`, '#2EA44F');
    audit('Update', 'Users', dbUser.name||'User', `Role → ${newRole}`);
  } catch(e) {
    // Revert memory on failure
    if (u) u.role = prevRole;
    dbUser.role = prevRole;
    renderUserList();
    renderUserDetail();
    const msg = e?.message || String(e);
    if (msg.includes('row-level security') || msg.includes('violates')) {
      showToast('Permission denied — run the profiles RLS fix SQL in Supabase first.', '#dc2626');
    } else {
      showToast('Failed to save role: ' + msg, '#dc2626');
    }
    console.error('quickSaveRole error:', e);
  }
}

function confirmDeleteUser(userId) {
  const u = SETUP_USERS.find(x => x.id === userId);
  if (!u) return;
  // Prevent deleting yourself
  if (userId === (window.LOGGED_IN_USER?.id || '') || u.email === (window.LOGGED_IN_USER?.email || '')) {
    showToast('You cannot delete your own account.', '#dc2626'); return;
  }
  // Prevent non-super-admin from deleting a Super Admin
  if (u.role === 'Super Admin' && !isSuperAdmin()) {
    showToast('Only a Super Admin can delete another Super Admin.', '#dc2626'); return;
  }
  // Confirm dialog
  const modal = document.createElement('div');
  modal.id = 'del-user-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center';
  modal.innerHTML = `
    <div style="background:var(--surface);border-radius:16px;padding:28px 32px;max-width:400px;width:90%;box-shadow:0 8px 40px rgba(0,0,0,0.25)">
      <div style="font-size:18px;font-weight:700;color:var(--fg);margin-bottom:8px">Delete User?</div>
      <div style="font-size:14px;color:var(--fg2);margin-bottom:20px">
        This will permanently remove <strong>${u.name}</strong> (${u.email}) from the CRM.<br>
        <span style="color:#ef4444;font-size:12px">This action cannot be undone.</span>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button onclick="document.getElementById('del-user-modal').remove()" style="padding:8px 20px;border:1.5px solid var(--border);border-radius:8px;background:none;font-size:13px;cursor:pointer;color:var(--fg)">Cancel</button>
        <button onclick="deleteUser('${userId}')" style="padding:8px 20px;background:#ef4444;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">Delete</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

async function deleteUser(userId) {
  const modal = document.getElementById('del-user-modal');
  if (modal) modal.remove();
  const u = SETUP_USERS.find(x => x.id === userId);
  const dbUser = DB.users.find(x => x.id === userId) || (u ? DB.users.find(x => x.email === u.email) : null);
  try {
    if (dbUser) {
      // Step 1: Delete audit_logs for this user first (foreign key constraint)
      await DB_CLIENT.from('audit_logs').delete().eq('user_id', dbUser.id);
      // Step 2: Delete the profile row
      const { data, error, status, statusText } = await DB_CLIENT
        .from('profiles').delete().eq('id', dbUser.id).select();
      console.log('[deleteUser] status:', status, statusText, 'data:', data, 'error:', error);
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error(`RLS_SILENT_BLOCK: No rows deleted for id=${dbUser.id}. Check Supabase RLS policies.`);
      }
      DB.users = DB.users.filter(x => x.id !== dbUser.id);
      // Also clean up local audit log
      DB.audit = DB.audit.filter(a => a.user !== (dbUser.name || u?.name));
    }
    const idx = SETUP_USERS.findIndex(x => x.id === userId);
    if (idx >= 0) SETUP_USERS.splice(idx, 1);
    currentSetupUser = null;
    renderUserList();
    renderUserDetail();
    showToast(`User deleted successfully`, '#2EA44F');
    if (dbUser) audit('Delete', 'Users', dbUser.name || u?.name || 'User', 'User removed');
  } catch(e) {
    const msg = e?.message || String(e);
    console.error('[deleteUser] full error:', e);
    if (msg.includes('RLS_SILENT_BLOCK')) {
      showToast('RLS blocked delete — open browser console (F12) for the exact policy needed.', '#dc2626');
    } else if (msg.includes('row-level security') || msg.includes('violates') || msg.includes('policy')) {
      showToast('RLS policy blocked delete — run the SQL fix in Supabase.', '#dc2626');
    } else {
      showToast('Failed to delete: ' + msg, '#dc2626');
    }
  }
}

/* ============================================================
   ROLES & PROFILES + DATA SHARING
   ============================================================ */

// Data store
const PROFILES_DATA = [
  { id:'p1', name:'Administrator',  desc:'Full access to all modules and settings', modules:{leads:'full',contacts:'full',accounts:'full',deals:'full',reports:'full',tasks:'full',setup:'full'} },
  { id:'p2', name:'Standard',       desc:'Create, read, edit own records; no delete', modules:{leads:'create_edit',contacts:'create_edit',accounts:'read',deals:'create_edit',reports:'read',tasks:'create_edit',setup:'none'} },
  { id:'p3', name:'Read-Only',      desc:'View all records but cannot modify', modules:{leads:'read',contacts:'read',accounts:'read',deals:'read',reports:'read',tasks:'read',setup:'none'} },
  { id:'p4', name:'Manager',        desc:'Full access except Setup and delete', modules:{leads:'create_edit',contacts:'create_edit',accounts:'create_edit',deals:'create_edit',reports:'full',tasks:'full',setup:'none'} },
  { id:'p5', name:'Restricted',     desc:'View own records only', modules:{leads:'read_own',contacts:'none',accounts:'none',deals:'none',reports:'none',tasks:'read_own',setup:'none'} }
];

const ROLES_DATA = [
  { id:'r1', name:'Super Admin',       reports_to:null,   profile:'Administrator',  users:['Vikram Sharma'] },
  { id:'r2', name:'Regional Manager',  reports_to:'r1',   profile:'Manager',        users:['Poovizhi Devaraj','Shreya Mitra'] },
  { id:'r3', name:'Sales Lead',        reports_to:'r2',   profile:'Manager',        users:['Arjun Mehta','Sanjay Malhotra'] },
  { id:'r4', name:'Senior BDE',        reports_to:'r3',   profile:'Standard',       users:['Rahul Gupta','Anjali Verma'] },
  { id:'r5', name:'Junior BDE',        reports_to:'r3',   profile:'Standard',       users:['Priya Nair','Nisha Sharma','Divya Reddy'] },
  { id:'r6', name:'HR Executive',      reports_to:'r2',   profile:'Standard',       users:['Amit Joshi','Lakshmi Balan'] },
  { id:'r7', name:'Finance Executive', reports_to:'r2',   profile:'Standard',       users:['Tejas Bhatt'] }
];

const SHARING_MODULES = [
  {name:'Leads',    access:'Private'},
  {name:'Contacts', access:'Private'},
  {name:'Accounts', access:'Private'},
  {name:'Deals',    access:'Private'},
  {name:'Campaigns',access:'Private'},
  {name:'Tasks',    access:'Private'},
  {name:'Meetings', access:'Private'},
  {name:'Calls',    access:'Private'},
  {name:'Visits',   access:'Public (Read/Write/Delete)'},
  {name:'Cases',    access:'Private'},
  {name:'Solutions',access:'Private'},
  {name:'Products', access:'Public (Read/Write/Delete)'},
  {name:'Reports',  access:'Private'},
  {name:'Documents',access:'Private'}
];

const SHARING_RULES = [];

const ACCESS_OPTIONS = ['Private','Public (Read Only)','Public (Read/Write)','Public (Read/Write/Delete)'];

function renderRolesPanel() {
  const pl = document.getElementById('profiles-list');
  const rl = document.getElementById('roles-list');
  if (pl) pl.innerHTML = PROFILES_DATA.map(p=>`
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border)">
      <div>
        <div style="font-size:13px;font-weight:600;color:var(--fg)">${p.name}</div>
        <div style="font-size:11px;color:var(--fg3);margin-top:2px">${p.desc}</div>
      </div>
      <button onclick="openProfileModal('${p.id}')" style="background:none;border:none;color:#2EA44F;font-size:13px;font-weight:600;cursor:pointer;padding:4px 8px">Edit</button>
    </div>`).join('');
  if (rl) rl.innerHTML = ROLES_DATA.map(r=>{
    const parent = ROLES_DATA.find(x=>x.id===r.reports_to);
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border)">
      <div>
        <div style="font-size:13px;font-weight:600;color:var(--fg)">${r.name}</div>
        <div style="font-size:11px;color:var(--fg3);margin-top:2px">Reports to: ${parent?parent.name:'—'} · Profile: ${r.profile} · ${r.users.length} user${r.users.length!==1?'s':''}</div>
      </div>
      <button onclick="openRoleModal('${r.id}')" style="background:none;border:none;color:#2EA44F;font-size:13px;font-weight:600;cursor:pointer;padding:4px 8px">Configure</button>
    </div>`;}).join('');
  renderSharingPerms();
  renderSharingRules();
}

function switchRolesTab(btn, tabId) {
  document.querySelectorAll('.roles-itab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.roles-panel').forEach(p=>p.classList.remove('rp-active'));
  const panel = document.getElementById(tabId);
  if (panel) panel.classList.add('rp-active');
  if (tabId === 'roles-sharing') renderSharingPerms();
}

function switchSharingTab(btn, tabId) {
  document.querySelectorAll('.sharing-tab').forEach(t=>t.classList.remove('st-active'));
  btn.classList.add('st-active');
  ['sharing-default','sharing-rules'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.style.display='none';
  });
  const panel = document.getElementById(tabId);
  if (panel) panel.style.display='block';
  if (tabId==='sharing-default') renderSharingPerms();
  if (tabId==='sharing-rules') renderSharingRules();
}

function renderSharingPerms() {
  const tbody = document.getElementById('sharing-perms-body');
  if (!tbody) return;
  tbody.innerHTML = SHARING_MODULES.map((m,i)=>`
    <tr style="${i%2===0?'background:var(--surface)':'background:var(--bg)'}">
      <td style="padding:12px 16px;font-size:13px;color:var(--fg);border-bottom:1px solid var(--border)">${m.name}</td>
      <td style="padding:12px 16px;font-size:13px;color:var(--fg2);border-bottom:1px solid var(--border)">${m.access}</td>
      <td style="padding:12px 16px;border-bottom:1px solid var(--border)">
        <select onchange="updateSharingAccess(${i},this.value)" style="padding:5px 10px;border:1.5px solid var(--border);border-radius:7px;font-size:12px;color:var(--fg);background:var(--surface);cursor:pointer;outline:none">
          ${ACCESS_OPTIONS.map(o=>`<option${o===m.access?' selected':''}>${o}</option>`).join('')}
        </select>
      </td>
    </tr>`).join('');
}

function updateSharingAccess(idx, val) {
  SHARING_MODULES[idx].access = val;
  showToast('Sharing access updated for '+SHARING_MODULES[idx].name, '#2EA44F');
}

function renderSharingRules() {
  const el = document.getElementById('sharing-rules-list');
  if (!el) return;
  if (SHARING_RULES.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--fg3);font-size:13px;border:1.5px dashed var(--border);border-radius:10px">No sharing rules yet. Click <strong>+ Add Rule</strong> to create one.</div>';
    return;
  }
  el.innerHTML = `<div style="border:1px solid var(--border);border-radius:10px;overflow:hidden">
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:var(--bg)">
        <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:var(--fg2);border-bottom:1px solid var(--border)">Rule Name</th>
        <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:var(--fg2);border-bottom:1px solid var(--border)">Module</th>
        <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:var(--fg2);border-bottom:1px solid var(--border)">Share Based On</th>
        <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:var(--fg2);border-bottom:1px solid var(--border)">Access</th>
        <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:var(--fg2);border-bottom:1px solid var(--border)">Actions</th>
      </tr></thead>
      <tbody>${SHARING_RULES.map((r,i)=>`
        <tr>
          <td style="padding:10px 14px;font-size:13px;color:var(--fg);border-bottom:1px solid var(--border)">${r.name}</td>
          <td style="padding:10px 14px;font-size:13px;color:var(--fg2);border-bottom:1px solid var(--border)">${r.module}</td>
          <td style="padding:10px 14px;font-size:13px;color:var(--fg2);border-bottom:1px solid var(--border)">${r.basis}</td>
          <td style="padding:10px 14px;font-size:13px;border-bottom:1px solid var(--border)"><span style="padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600;background:var(--accent-bg);color:var(--accent)">${r.access}</span></td>
          <td style="padding:10px 14px;border-bottom:1px solid var(--border)">
            <button onclick="deleteSharingRule(${i})" style="background:none;border:none;color:var(--red);font-size:12px;cursor:pointer;font-weight:600">Delete</button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

function deleteSharingRule(idx) {
  SHARING_RULES.splice(idx,1);
  renderSharingRules();
  showToast('Sharing rule deleted', '#dc2626');
}

function openSharingRuleModal() {
  const modules = SHARING_MODULES.map(m=>m.name);
  const roles = ROLES_DATA.map(r=>r.name);
  openGenericModal('New Sharing Rule', `
    <div class="um-field"><label class="um-label">Rule Name</label><input class="um-input" id="sr-name" placeholder="e.g. Sales to Manager"></div>
    <div class="um-field"><label class="um-label">Module</label>
      <select class="um-select" id="sr-module">${modules.map(m=>`<option>${m}</option>`).join('')}</select></div>
    <div class="um-field"><label class="um-label">Share Records Of</label>
      <select class="um-select" id="sr-basis">${roles.map(r=>`<option>Role: ${r}</option>`).join('')}<option>Users: All</option></select></div>
    <div class="um-field"><label class="um-label">Access Level</label>
      <select class="um-select" id="sr-access">${ACCESS_OPTIONS.map(o=>`<option>${o}</option>`).join('')}</select></div>
    <div style="display:flex;gap:10px;margin-top:18px">
      <button onclick="saveSharingRule()" style="flex:1;padding:10px;background:#2EA44F;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">Save Rule</button>
      <button onclick="closeGenericModal()" style="padding:10px 18px;background:none;border:1.5px solid var(--border);border-radius:8px;font-size:13px;cursor:pointer;color:var(--fg2)">Cancel</button>
    </div>`);
}

function saveSharingRule() {
  const name = document.getElementById('sr-name')?.value.trim();
  const module = document.getElementById('sr-module')?.value;
  const basis = document.getElementById('sr-basis')?.value;
  const access = document.getElementById('sr-access')?.value;
  if (!name) { alert('Please enter a rule name'); return; }
  SHARING_RULES.push({name, module, basis, access});
  closeGenericModal();
  renderSharingRules();
  showToast('Sharing rule created', '#2EA44F');
}

// Profile edit modal
function openProfileModal(pid) {
  const p = pid ? PROFILES_DATA.find(x=>x.id===pid) : null;
  const mods = ['leads','contacts','accounts','deals','reports','tasks','setup'];
  const accessOpts = ['none','read_own','read','create_edit','full'];
  const accessLabels = {none:'No Access', read_own:'Read Own', read:'Read All', create_edit:'Create & Edit', full:'Full Access'};
  openGenericModal((p?'Edit Profile: '+p.name:'New Profile'), `
    <div class="um-field"><label class="um-label">Profile Name</label><input class="um-input" id="pm-name" value="${p?.name||''}"></div>
    <div class="um-field"><label class="um-label">Description</label><input class="um-input" id="pm-desc" value="${p?.desc||''}"></div>
    <div style="font-size:13px;font-weight:700;color:var(--fg);margin:14px 0 10px">Module Permissions</div>
    <table class="perm-table" style="margin-bottom:14px">
      <thead><tr><th>Module</th><th>Access Level</th></tr></thead>
      <tbody>${mods.map(m=>`<tr>
        <td style="font-weight:500;text-transform:capitalize">${m}</td>
        <td><select class="um-select" id="pm-${m}" style="padding:5px 8px;font-size:12px">
          ${accessOpts.map(o=>`<option value="${o}"${(p?.modules[m]||'none')===o?' selected':''}>${accessLabels[o]}</option>`).join('')}
        </select></td>
      </tr>`).join('')}</tbody>
    </table>
    <div style="display:flex;gap:10px;margin-top:8px">
      <button onclick="saveProfile('${pid||''}')" style="flex:1;padding:10px;background:#2EA44F;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">Save Profile</button>
      <button onclick="closeGenericModal()" style="padding:10px 18px;background:none;border:1.5px solid var(--border);border-radius:8px;font-size:13px;cursor:pointer;color:var(--fg2)">Cancel</button>
    </div>`);
}

function saveProfile(pid) {
  const name = document.getElementById('pm-name')?.value.trim();
  const desc = document.getElementById('pm-desc')?.value.trim();
  if (!name) { alert('Profile name required'); return; }
  const mods = ['leads','contacts','accounts','deals','reports','tasks','setup'];
  const modules = {};
  mods.forEach(m => { modules[m] = document.getElementById('pm-'+m)?.value || 'none'; });
  if (pid) {
    const p = PROFILES_DATA.find(x=>x.id===pid);
    if (p) { p.name=name; p.desc=desc; p.modules=modules; }
  } else {
    PROFILES_DATA.push({id:'p'+(PROFILES_DATA.length+1), name, desc, modules});
  }
  closeGenericModal();
  renderRolesPanel();
  showToast('Profile saved', '#2EA44F');
}

// Role configure modal
function openRoleModal(rid) {
  const r = rid ? ROLES_DATA.find(x=>x.id===rid) : null;
  const parentOptions = [{ id:'', name:'— No parent (Top Level)' }, ...ROLES_DATA.filter(x=>x.id!==rid)];
  const profileOptions = PROFILES_DATA.map(p=>p.name);
  openGenericModal((r?'Configure Role: '+r.name:'New Role'), `
    <div class="um-field"><label class="um-label">Role Name</label><input class="um-input" id="rm-name" value="${r?.name||''}"></div>
    <div class="um-field"><label class="um-label">Reports To</label>
      <select class="um-select" id="rm-reports">
        ${parentOptions.map(p=>`<option value="${p.id}"${r?.reports_to===p.id?' selected':''}>${p.name}</option>`).join('')}
      </select></div>
    <div class="um-field"><label class="um-label">Default Profile</label>
      <select class="um-select" id="rm-profile">
        ${profileOptions.map(p=>`<option${p===(r?.profile||'')?' selected':''}>${p}</option>`).join('')}
      </select></div>
    <div style="font-size:13px;font-weight:600;color:var(--fg);margin:12px 0 6px">Users in this Role</div>
    <div style="font-size:13px;color:var(--fg2);padding:8px 0">${r && r.users.length ? r.users.join(', ') : 'No users assigned'}</div>
    <div style="font-size:11px;color:var(--fg3);margin-bottom:14px">Assign users from the Users tab.</div>
    <div style="display:flex;gap:10px;margin-top:8px">
      <button onclick="saveRole('${rid||''}')" style="flex:1;padding:10px;background:#2EA44F;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">Save Role</button>
      ${rid?`<button onclick="deleteRole('${rid}')" style="padding:10px 14px;background:none;border:1.5px solid var(--red);border-radius:8px;font-size:13px;cursor:pointer;color:var(--red)">Delete</button>`:''}
      <button onclick="closeGenericModal()" style="padding:10px 18px;background:none;border:1.5px solid var(--border);border-radius:8px;font-size:13px;cursor:pointer;color:var(--fg2)">Cancel</button>
    </div>`);
}

function saveRole(rid) {
  const name = document.getElementById('rm-name')?.value.trim();
  const reportsTo = document.getElementById('rm-reports')?.value || null;
  const profile = document.getElementById('rm-profile')?.value;
  if (!name) { alert('Role name required'); return; }
  if (rid) {
    const r = ROLES_DATA.find(x=>x.id===rid);
    if (r) { r.name=name; r.reports_to=reportsTo||null; r.profile=profile; }
  } else {
    ROLES_DATA.push({id:'r'+(ROLES_DATA.length+1), name, reports_to:reportsTo||null, profile, users:[]});
  }
  closeGenericModal();
  renderRolesPanel();
  showToast('Role saved', '#2EA44F');
}

function deleteRole(rid) {
  const idx = ROLES_DATA.findIndex(x=>x.id===rid);
  if (idx>=0) ROLES_DATA.splice(idx,1);
  closeGenericModal();
  renderRolesPanel();
  showToast('Role deleted', '#dc2626');
}

// Generic modal (reusable)
function openGenericModal(title, bodyHtml) {
  let overlay = document.getElementById('generic-modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'generic-modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:10001;display:flex;align-items:center;justify-content:center';
    overlay.onclick = function(e){ if(e.target===overlay) closeGenericModal(); };
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div style="background:var(--surface);border-radius:16px;width:520px;max-height:88vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.25)">
      <div style="padding:18px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:var(--surface);z-index:1">
        <div style="font-size:15px;font-weight:700;color:var(--fg)">${title}</div>
        <button onclick="closeGenericModal()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--fg3)">✕</button>
      </div>
      <div style="padding:20px 22px">${bodyHtml}</div>
    </div>`;
  overlay.style.display = 'flex';
}

function closeGenericModal() {
  const overlay = document.getElementById('generic-modal-overlay');
  if (overlay) overlay.style.display = 'none';
}

function showToast(msg, color) {
  const existing = document.getElementById('sk-toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.id = 'sk-toast';
  t.textContent = msg;
  t.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:${color||'var(--accent)'};color:#fff;padding:10px 24px;border-radius:8px;font-size:13px;font-weight:600;z-index:99999;box-shadow:0 4px 16px rgba(0,0,0,0.18);pointer-events:none`;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(), 2200);
}

// Close user filter dropdown on outside click
document.addEventListener('click', function(e) {
  const dd = document.getElementById('usr-filter-dd');
  const btn = document.getElementById('usr-filter-btn');
  if (dd && btn && !btn.contains(e.target) && !dd.contains(e.target)) dd.style.display = 'none';
  // close user modal on overlay click
  const mo = document.getElementById('user-modal-overlay');
  if (mo && e.target === mo) closeUserModal();
});
function applyFilter(filterId, module) {
  // collect checked system filters and field filters — for now close panel and show toast
  toggleFilter(filterId);
  const existing = document.getElementById('filter-toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.id = 'filter-toast';
  t.textContent = 'Filter applied';
  t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--accent);color:#fff;padding:10px 24px;border-radius:8px;font-size:13px;font-weight:600;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,0.18);pointer-events:none';
  document.body.appendChild(t);
  setTimeout(()=>t.remove(), 2000);
}
function toggleFilterExpand(e, expandId, labelEl) {
  e.stopPropagation();
  const chk = labelEl ? labelEl.querySelector('input[type=checkbox]') : null;
  const exp = document.getElementById(expandId);
  if (!exp) return;
  const isOpen = exp.style.display !== 'none';
  exp.style.display = isOpen ? 'none' : 'block';
  if (chk) chk.checked = !isOpen;
}
function selectFilterRadio(e, prefix, type) {
  e.stopPropagation();
  const keys = ['without','overdue','due','noact','done'];
  keys.forEach(k => {
    const dot = document.getElementById(prefix+'-'+k);
    if (dot) dot.classList.toggle('selected', k === type);
  });
  const rangeId = prefix+'-due-range';
  const range = document.getElementById(rangeId);
  if (range) range.style.display = type === 'due' ? '' : 'none';
}
function clearFilter(filterId) {
  const panel = document.getElementById(filterId);
  if (!panel) return;
  panel.querySelectorAll('input[type=checkbox]').forEach(c => c.checked = false);
  panel.querySelectorAll('[id$=-expand]').forEach(e => e.style.display = 'none');
  panel.querySelectorAll('.act-radio-dot').forEach(d => d.classList.remove('selected'));
  panel.querySelectorAll('[id$=-due-range]').forEach(r => r.style.display = 'none');
}
function selectActivityFilter(label, type) {
  ['without','overdue','due'].forEach(t => {
    const dot = document.getElementById('afr-'+t);
    if (dot) dot.classList.toggle('selected', t === type);
  });
  document.querySelectorAll('.act-filter-radio').forEach(el => el.classList.remove('active-afr'));
  if (label) label.classList.add('active-afr');
  const range = document.getElementById('activity-due-range');
  if (range) range.style.display = type === 'due' ? '' : 'none';
}
function toggleViewsDropdown(e, ddId) {
  e.stopPropagation();
  const dd = document.getElementById(ddId);
  if (!dd) return;
  const allDDs = document.querySelectorAll('.views-dropdown');
  allDDs.forEach(d => { if (d.id !== ddId) d.style.display = 'none'; });
  dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
  if (dd.style.display === 'block') {
    const inp = dd.querySelector('.views-dd-search');
    if (inp) { inp.value = ''; filterViewsDD(inp, ddId); inp.focus(); }
  }
}
function filterViewsDD(inp, ddId) {
  const q = inp.value.toLowerCase().trim();
  const dd = document.getElementById(ddId);
  if (!dd) return;
  dd.querySelectorAll('.views-dd-item').forEach(el => {
    el.style.display = (!q || el.textContent.toLowerCase().includes(q)) ? '' : 'none';
  });
}
document.addEventListener('click', function() {
  document.querySelectorAll('.views-dropdown').forEach(d => d.style.display = 'none');
});
function _renderDescLog(val) {
  const log = document.getElementById('desc-log');
  if (!log) return;
  const entries = val ? val.split('\n').filter(Boolean) : [];
  log.innerHTML = entries.length ? entries.map((e,i) => {
    const m = e.match(/^(\[.*?\])\s*(.*)/);
    const ts = m ? `<span style="font-size:10px;color:var(--fg3);margin-right:8px;white-space:nowrap;flex-shrink:0">${m[1]}</span>` : '';
    const txt = (m ? m[2] : e).replace(/&/g,'&amp;').replace(/</g,'&lt;');
    return `<div style="display:flex;align-items:center;padding:10px 12px;border-bottom:1px solid var(--border);gap:8px">${ts}<span style="flex:1;font-size:13px;color:var(--fg);line-height:1.5">${txt}</span><button type="button" onclick="editDescEntry(${i})" title="Edit" style="border:none;background:var(--surface2);border-radius:6px;cursor:pointer;padding:5px 10px;color:var(--accent);font-size:15px;flex-shrink:0;line-height:1">✏️</button><button type="button" onclick="deleteDescEntry(${i})" title="Delete" style="border:none;background:#fef2f2;border-radius:6px;cursor:pointer;padding:5px 10px;color:#ef4444;font-size:15px;flex-shrink:0;line-height:1">🗑</button></div>`;
  }).join('') : '<div style="padding:14px 12px;font-size:12px;color:var(--fg3);text-align:center">No notes yet. Add one below.</div>';
  log.scrollTop = log.scrollHeight;
}

function initDescLog() {
  const hidden = document.getElementById('f-description');
  if (!hidden) return;
  window._descVal = hidden.value || '';
  _renderDescLog(window._descVal);
}

function editDescEntry(i) {
  const entries = (window._descVal || '').split('\n').filter(Boolean);
  const e = entries[i] || '';
  const m = e.match(/^(\[.*?\])\s*(.*)/);
  const txt = m ? m[2] : e;
  const inp = prompt('Edit note:', txt);
  if (inp === null) return;
  const ts = m ? m[1] : '';
  entries[i] = ts ? ts + ' ' + inp : inp;
  window._descVal = entries.join('\n');
  const hidden = document.getElementById('f-description');
  if (hidden) hidden.value = window._descVal;
  _renderDescLog(window._descVal);
}

function deleteDescEntry(i) {
  if (!confirm('Delete this note?')) return;
  const entries = (window._descVal || '').split('\n').filter(Boolean);
  entries.splice(i, 1);
  window._descVal = entries.join('\n');
  const hidden = document.getElementById('f-description');
  if (hidden) hidden.value = window._descVal;
  _renderDescLog(window._descVal);
}

function selectAll(tbodyId, masterCb) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  tbody.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = masterCb.checked);
}

function addDescEntry() {
  const input = document.getElementById('f-desc-input');
  const hidden = document.getElementById('f-description');
  if (!input || !hidden) return;
  const text = input.value.trim();
  if (!text) return;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
  const timeStr = now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true});
  const entry = `[${dateStr} ${timeStr}] ${text}`;
  const existing = window._descVal || hidden.value || '';
  const updated = (existing ? existing + '\n' : '') + entry;
  window._descVal = updated;
  hidden.value = updated;
  input.value = '';
  _renderDescLog(updated);
}

function calcExpectedRevenue() {
  const amt = Number(document.getElementById('f-amount')?.value||0);
  const prob = Number(document.getElementById('f-probability')?.value||0);
  const er = document.getElementById('f-expectedRevenue');
  if (er) er.value = Math.round(amt * prob / 100);
}

let _dragDealId = null;
function renderDealsBoard() {
  const stages = DEAL_STAGES;
  const board = document.getElementById('deals-board');
  board.innerHTML = stages.map(s=>{
    const cards = DB.deals.filter(d=>d.stage===s);
    return `<div class="kanban-col" data-stage="${s}"
      ondragover="event.preventDefault();this.classList.add('drag-over')"
      ondragleave="this.classList.remove('drag-over')"
      ondrop="dropDealCard(event,'${s}')">
      <div class="kanban-col-header">
        <span class="col-label">${s}</span>
        <span class="col-count">${cards.length}</span>
      </div>
      <div class="kanban-cards">
        ${cards.map(c=>`
          <div class="k-card" draggable="true"
            ondragstart="dragDealCard(event,'${c.id}')"
            ondragend="this.classList.remove('dragging')"
            onclick="openModal('deal','${c.id}')">
            <div class="k-name">${c.name||'—'}</div>
            <div class="k-meta">${c.companyName||'—'}</div>
            <div class="k-tags"><span class="badge badge-green">${fmt(c.amount||0)}</span><span class="badge badge-blue">${c.owner||''}</span>${c.closeDate?`<span class="badge badge-gray">${fmtDate(c.closeDate)}</span>`:''}</div>
          </div>`).join('')}
      </div>
    </div>`;
  }).join('');
}
function dragDealCard(e, id) {
  _dragDealId = id;
  setTimeout(()=>{ const el=document.querySelector(`.k-card[ondragstart*="${id}"]`); if(el) el.classList.add('dragging'); },0);
}
async function dropDealCard(e, newStage) {
  e.preventDefault();
  document.querySelectorAll('.kanban-col').forEach(c=>c.classList.remove('drag-over'));
  if (!_dragDealId) return;
  const deal = DB.deals.find(d=>d.id===_dragDealId);
  if (!deal || deal.stage===newStage) { _dragDealId=null; return; }
  deal.stage = newStage;
  const update = { stage: newStage, updated_at: new Date().toISOString() };
  // Auto-set won_at when dragged to Joined or Closed Won
  if ((newStage === 'Joined' || newStage === 'Closed Won') && !deal.wonAt) {
    deal.wonAt = deal.closeDate || new Date().toISOString().slice(0,10);
    update.won_at = deal.wonAt;
  }
  if ((newStage === 'Absconded' || newStage === 'Declined' || newStage === 'Closed Lost') && !deal.lostAt) {
    deal.lostAt = deal.closeDate || new Date().toISOString().slice(0,10);
    update.lost_at = deal.lostAt;
  }
  await DB_CLIENT.from('deals').update(update).eq('id', deal.id);
  audit('Update', 'Deals', deal.name||'Deal', `Stage → ${newStage}`);
  _dragDealId = null;
  renderDealsBoard();
  renderTable('deals','');
}
function switchTaskTab(filter, el) {
  taskFilter = filter;
  document.querySelectorAll('#page-tasks .tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  renderTable('tasks','');
}

