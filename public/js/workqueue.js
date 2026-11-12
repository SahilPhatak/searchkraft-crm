// ---- MY DAY ----
// ---- WORKQUEUE ----
let wqActiveSection = 'tasks';

function renderWorkqueue() {
  const cu = getCurrentUser();
  document.getElementById('wq-user-name').textContent = cu;
  document.getElementById('wq-user-avatar').textContent = cu.slice(0,2).toUpperCase();

  const filter = document.getElementById('wq-filter')?.value || 'today';
  const tdStr = today();
  const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate()+7);
  const weekStr = weekEnd.toISOString().slice(0,10);

  function inFilter(dateStr) {
    if (!dateStr) return filter==='all';
    if (filter==='today') return dateStr <= tdStr;
    if (filter==='week') return dateStr <= weekStr;
    return true;
  }

  const myTasks = DB.tasks.filter(t=>t.owner===cu && t.status==='Pending' && inFilter(t.due));
  const myMeetings = DB.activities.filter(a=>a.owner===cu && a.type==='Meeting' && inFilter(a.date));
  const myCalls = DB.activities.filter(a=>a.owner===cu && a.type==='Call' && inFilter(a.date));
  const myLeads = DB.leads.filter(l=>l.owner===cu && !['Won','Lost'].includes(l.stage));
  const myContacts = DB.contacts.filter(c=>c.owner===cu||true); // all contacts for now
  const myDeals = DB.deals.filter(d=>d.owner===cu && !['Closed Won','Closed Lost'].includes(d.stage));
  const now3h = new Date(Date.now()-3*60*60*1000).toISOString();
  const leadsRecent = DB.leads.filter(l=>l.createdAt && l.createdAt > now3h);
  const contactsRecent = DB.contacts.filter(c=>c.createdAt && c.createdAt > now3h);
  const closingMonth = new Date(); closingMonth.setDate(1); closingMonth.setMonth(closingMonth.getMonth()+1);
  const dealsClosing = DB.deals.filter(d=>d.closeDate && d.closeDate <= closingMonth.toISOString().slice(0,10));

  document.getElementById('wq-badge-tasks').textContent = myTasks.length;
  document.getElementById('wq-badge-meetings').textContent = myMeetings.length;
  document.getElementById('wq-badge-calls').textContent = myCalls.length;
  document.getElementById('wq-badge-blueprint').textContent = 0;
  document.getElementById('wq-badge-my-leads').textContent = myLeads.length;
  document.getElementById('wq-badge-leads-recent').textContent = leadsRecent.length;
  document.getElementById('wq-badge-my-contacts').textContent = myContacts.length;
  document.getElementById('wq-badge-contacts-recent').textContent = contactsRecent.length;
  document.getElementById('wq-badge-my-deals').textContent = myDeals.length;
  document.getElementById('wq-badge-deals-closing').textContent = dealsClosing.length;

  renderWQRight(wqActiveSection, {myTasks, myMeetings, myCalls, myLeads, myContacts, myDeals, leadsRecent, contactsRecent, dealsClosing});
}

function switchWQ(btn, section) {
  document.querySelectorAll('.wq-nav-item').forEach(b=>b.classList.remove('wq-active'));
  btn.classList.add('wq-active');
  wqActiveSection = section;
  renderWorkqueue();
}

function renderWQRight(section, data) {
  const titleMap = {tasks:'Tasks', meetings:'Meetings', calls:'Calls', blueprint:'Blueprint',
    'my-leads':'My Leads', 'leads-recent':'Leads (Last 3 hrs)', 'my-contacts':'My Contacts',
    'contacts-recent':'Contacts (Last 3 hrs)', 'my-deals':'My Deals', 'deals-closing':'Deals Closing This Month'};
  document.getElementById('wq-right-title').textContent = titleMap[section]||section;

  let rows = [];
  let headers = ['Subject','Due Date','Status','Priority'];

  if (section==='tasks') {
    rows = data.myTasks;
    document.getElementById('wq-table-header').innerHTML = `
      <div style="padding:9px 16px;font-size:11px;font-weight:600;color:var(--fg3);text-transform:uppercase;letter-spacing:0.6px">Subject</div>
      <div style="padding:9px 12px;font-size:11px;font-weight:600;color:var(--fg3);text-transform:uppercase;letter-spacing:0.6px">Due Date</div>
      <div style="padding:9px 12px;font-size:11px;font-weight:600;color:var(--fg3);text-transform:uppercase;letter-spacing:0.6px">Status</div>
      <div style="padding:9px 12px;font-size:11px;font-weight:600;color:var(--fg3);text-transform:uppercase;letter-spacing:0.6px">Priority</div>`;
    document.getElementById('wq-right-body').innerHTML = rows.length ? rows.map(t=>`
      <div style="display:grid;grid-template-columns:1fr 160px 120px 100px;border-bottom:1px solid var(--border);align-items:center" onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background=''">
        <div style="padding:10px 16px;font-size:13px;color:var(--fg);font-weight:500">${t.title}</div>
        <div style="padding:10px 12px;font-size:13px;color:${isOverdue(t.due)?'var(--red)':'var(--fg2)'}">${fmtDate(t.due)}</div>
        <div style="padding:10px 12px">${badge(t.status)}</div>
        <div style="padding:10px 12px;font-size:13px;color:var(--fg2)">${t.priority||'Normal'}</div>
      </div>`).join('') : `<div style="text-align:center;padding:60px 20px;color:var(--fg3);font-size:13px">No Tasks found.</div>`;
  } else if (section==='meetings' || section==='calls') {
    const items = section==='meetings' ? data.myMeetings : data.myCalls;
    document.getElementById('wq-table-header').innerHTML = `
      <div style="padding:9px 16px;font-size:11px;font-weight:600;color:var(--fg3);text-transform:uppercase;letter-spacing:0.6px">Subject</div>
      <div style="padding:9px 12px;font-size:11px;font-weight:600;color:var(--fg3);text-transform:uppercase;letter-spacing:0.6px">Date</div>
      <div style="padding:9px 12px;font-size:11px;font-weight:600;color:var(--fg3);text-transform:uppercase;letter-spacing:0.6px">Contact</div>
      <div style="padding:9px 12px;font-size:11px;font-weight:600;color:var(--fg3);text-transform:uppercase;letter-spacing:0.6px">Status</div>`;
    document.getElementById('wq-right-body').innerHTML = items.length ? items.map(a=>`
      <div style="display:grid;grid-template-columns:1fr 160px 120px 100px;border-bottom:1px solid var(--border);align-items:center" onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background=''">
        <div style="padding:10px 16px;font-size:13px;color:var(--fg);font-weight:500">${a.summary}</div>
        <div style="padding:10px 12px;font-size:13px;color:var(--fg2)">${fmtDate(a.date)}</div>
        <div style="padding:10px 12px;font-size:13px;color:var(--fg2)">${a.contact||'—'}</div>
        <div style="padding:10px 12px">${badge('Scheduled')}</div>
      </div>`).join('') : `<div style="text-align:center;padding:60px 20px;color:var(--fg3);font-size:13px">No ${section==='meetings'?'Meetings':'Calls'} found.</div>`;
  } else if (section==='my-leads' || section==='leads-recent') {
    const items = section==='my-leads' ? data.myLeads : data.leadsRecent;
    document.getElementById('wq-table-header').innerHTML = `
      <div style="padding:9px 16px;font-size:11px;font-weight:600;color:var(--fg3);text-transform:uppercase;letter-spacing:0.6px">Lead Name</div>
      <div style="padding:9px 12px;font-size:11px;font-weight:600;color:var(--fg3);text-transform:uppercase;letter-spacing:0.6px">Company</div>
      <div style="padding:9px 12px;font-size:11px;font-weight:600;color:var(--fg3);text-transform:uppercase;letter-spacing:0.6px">Stage</div>
      <div style="padding:9px 12px;font-size:11px;font-weight:600;color:var(--fg3);text-transform:uppercase;letter-spacing:0.6px">Value</div>`;
    document.getElementById('wq-right-body').innerHTML = items.length ? items.map(l=>`
      <div style="display:grid;grid-template-columns:1fr 160px 120px 100px;border-bottom:1px solid var(--border);align-items:center" onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background=''">
        <div style="padding:10px 16px;font-size:13px;color:var(--fg);font-weight:500">${l.title}</div>
        <div style="padding:10px 12px;font-size:13px;color:var(--fg2)">${getCompanyName(l.companyId)}</div>
        <div style="padding:10px 12px">${badge(l.stage)}</div>
        <div style="padding:10px 12px;font-size:13px;color:var(--fg2)">${l.value?fmt(l.value):'—'}</div>
      </div>`).join('') : `<div style="text-align:center;padding:60px 20px;color:var(--fg3);font-size:13px">No Leads found.</div>`;
  } else if (section==='my-deals' || section==='deals-closing') {
    const items = section==='my-deals' ? data.myDeals : data.dealsClosing;
    document.getElementById('wq-table-header').innerHTML = `
      <div style="padding:9px 16px;font-size:11px;font-weight:600;color:var(--fg3);text-transform:uppercase;letter-spacing:0.6px">Deal Name</div>
      <div style="padding:9px 12px;font-size:11px;font-weight:600;color:var(--fg3);text-transform:uppercase;letter-spacing:0.6px">Company</div>
      <div style="padding:9px 12px;font-size:11px;font-weight:600;color:var(--fg3);text-transform:uppercase;letter-spacing:0.6px">Stage</div>
      <div style="padding:9px 12px;font-size:11px;font-weight:600;color:var(--fg3);text-transform:uppercase;letter-spacing:0.6px">Amount</div>`;
    document.getElementById('wq-right-body').innerHTML = items.length ? items.map(d=>`
      <div style="display:grid;grid-template-columns:1fr 160px 120px 100px;border-bottom:1px solid var(--border);align-items:center" onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background=''">
        <div style="padding:10px 16px;font-size:13px;color:var(--fg);font-weight:500">${d.name}</div>
        <div style="padding:10px 12px;font-size:13px;color:var(--fg2)">${d.companyName||getCompanyName(d.companyId)||'—'}</div>
        <div style="padding:10px 12px">${badge(d.stage)}</div>
        <div style="padding:10px 12px;font-size:13px;color:var(--fg2)">${d.amount?fmt(Number(d.amount)):'—'}</div>
      </div>`).join('') : `<div style="text-align:center;padding:60px 20px;color:var(--fg3);font-size:13px">No Deals found.</div>`;
  } else {
    document.getElementById('wq-right-body').innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--fg3);font-size:13px">No records found.</div>`;
  }

  const countEl = document.getElementById('wq-total');
  if (countEl) countEl.textContent = document.querySelectorAll('#wq-right-body > div').length;
}

function completeTask(id) {
  const t = DB.tasks.find(x=>x.id===id);
  if(t) { t.status='Done'; audit('Update','Tasks',t.title); save(); renderWorkqueue(); renderDashboard(); }
}

// ---- CALENDAR ----
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();

function calNav(dir) {
  calMonth += dir;
  if (calMonth > 11) { calMonth=0; calYear++; }
  if (calMonth < 0) { calMonth=11; calYear--; }
  renderCalendarGrid();
  renderMiniCal();
  renderCalPopup();
}

function toggleCalendar() {
  const p = document.getElementById('cal-popup');
  const isOpen = p.style.display !== 'none';
  p.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) renderCalPopup();
}

function calPopupNav(dir) {
  calMonth += dir;
  if (calMonth > 11) { calMonth=0; calYear++; }
  if (calMonth < 0) { calMonth=11; calYear--; }
  renderCalPopup();
  renderCalendarGrid();
  renderMiniCal();
}

function renderCalPopup() {
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const label = document.getElementById('cal-popup-label');
  if (label) label.textContent = MONTHS[calMonth] + ' ' + calYear;
  renderMiniCalGrid('cal-popup-grid');
  // Upcoming events
  const ev = document.getElementById('cal-popup-events');
  if (!ev) return;
  const tdStr = today();
  const upcoming = [
    ...DB.activities.filter(a=>a.date && a.date>=tdStr).slice(0,3).map(a=>({label:a.type+': '+a.summary, date:a.date})),
    ...DB.tasks.filter(t=>t.due && t.due>=tdStr && t.status==='Pending').slice(0,2).map(t=>({label:'Task: '+t.title, date:t.due}))
  ].sort((a,b)=>a.date.localeCompare(b.date)).slice(0,4);
  ev.innerHTML = upcoming.length ? upcoming.map(e=>`
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
      <div style="width:6px;height:6px;border-radius:50%;background:var(--accent);flex-shrink:0;margin-top:1px"></div>
      <div><div style="color:var(--fg);font-size:12px">${e.label}</div><div style="color:var(--fg3);font-size:11px">${fmtDate(e.date)}</div></div>
    </div>`).join('') : '<div style="color:var(--fg3);font-size:12px">No upcoming events</div>';
}

function renderCalendar() {
  renderMiniCal();
  renderCalendarGrid();
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const ml = document.getElementById('cal-main-label');
  if (ml) ml.textContent = MONTHS[calMonth] + '  ' + calYear;
}

function renderMiniCal() {
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const lbl = document.getElementById('cal-mini-label');
  if (lbl) lbl.textContent = MONTHS[calMonth] + ' ' + calYear;
  renderMiniCalGrid('cal-mini-grid');
}

function renderMiniCalGrid(elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  const DAYS = ['M','T','W','T','F','S','S'];
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const offset = (firstDay + 6) % 7; // Monday-first
  const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
  const todayD = new Date().getDate();
  const todayM = new Date().getMonth();
  const todayY = new Date().getFullYear();

  let html = DAYS.map(d=>`<div style="font-size:10px;font-weight:600;color:var(--fg3);padding:2px">${d}</div>`).join('');
  for (let i=0;i<offset;i++) html += '<div></div>';
  for (let d=1;d<=daysInMonth;d++) {
    const isToday2 = d===todayD && calMonth===todayM && calYear===todayY;
    html += `<div onclick="calJumpTo(${d})" style="padding:3px 1px;cursor:pointer;text-align:center;font-size:11px;border-radius:50%;width:20px;margin:1px auto;
      background:${isToday2?'var(--accent)':'none'};
      color:${isToday2?'#fff':'var(--fg2)'};
      font-weight:${isToday2?'700':'400'}">${d}</div>`;
  }
  el.innerHTML = html;
}

function calJumpTo(day) {
  const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  calDayClick(dateStr);
}

function calDayClick(dateStr) {
  // Show activities for this day with edit options, or create new
  const dayActivities = DB.activities.filter(a => a.date && a.date.slice(0,10) === dateStr);
  const dayTasks = DB.tasks.filter(t => t.due && t.due.slice(0,10) === dateStr);
  if (dayActivities.length === 0 && dayTasks.length === 0) {
    openModal('activity', null, { date: dateStr });
    return;
  }
  // Build a quick popup showing items with edit buttons
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const d = new Date(dateStr); const label = d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  let html = `<div style="font-weight:600;margin-bottom:12px">${label}</div>`;
  dayActivities.forEach(a => {
    const time = a.time ? `<span style="color:var(--fg3);font-size:11px">${a.time.slice(0,5)} · </span>` : '';
    const contact = a.contact ? `<span style="color:var(--fg3);font-size:11px"> · ${a.contact}</span>` : '';
    html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
      <div style="flex:1;min-width:0">${time}<span style="font-size:13px;font-weight:500">${a.summary||a.subject||'Activity'}</span><span style="font-size:11px;color:var(--fg3);margin-left:6px">${a.type||''}</span>${contact}</div>
      <div style="display:flex;gap:6px;flex-shrink:0;margin-left:8px">
        <button class="btn btn-sm" onclick="closeModal();openModal('activity','${a.id}')" style="padding:4px 10px;font-size:12px">Edit</button>
        <button class="btn btn-sm" onclick="if(confirm('Delete this activity?')){closeModal();deleteCRMRecord('activities','${a.id}')}" style="padding:4px 10px;font-size:12px;background:#fee2e2;color:#dc2626;border:none">Delete</button>
      </div>
    </div>`;
  });
  dayTasks.forEach(t => {
    html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
      <div style="flex:1;min-width:0"><span style="font-size:13px;font-weight:500">${t.title||'Task'}</span><span style="font-size:11px;color:var(--fg3);margin-left:6px">Task · ${t.status||''}</span></div>
      <div style="display:flex;gap:6px;flex-shrink:0;margin-left:8px">
        <button class="btn btn-sm" onclick="closeModal();openModal('task','${t.id}')" style="padding:4px 10px;font-size:12px">Edit</button>
        <button class="btn btn-sm" onclick="if(confirm('Delete this task?')){closeModal();deleteCRMRecord('tasks','${t.id}')}" style="padding:4px 10px;font-size:12px;background:#fee2e2;color:#dc2626;border:none">Delete</button>
      </div>
    </div>`;
  });
  html += `<button class="btn btn-primary" style="margin-top:14px;width:100%" onclick="closeModal();openModal('activity',null,{date:'${dateStr}'})">+ Log New Activity</button>`;
  document.getElementById('modal-title').textContent = 'Activities';
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal-save').style.display = 'none';
  document.getElementById('modal-overlay').style.display = 'flex';
}

function switchCalView(view, btn) {
  document.querySelectorAll('.cal-view-btn').forEach(b=>b.classList.remove('cal-view-active'));
  btn.classList.add('cal-view-active');
}

let calView = 'month'; // 'day' | 'week' | 'month'
let calWeekStart = null; // Monday of current week for week view
let calDayDate = null;   // date string for day view

function switchMainCalView(view, btn) {
  document.querySelectorAll('.cal-tab-btn').forEach(b=>{
    b.style.background='var(--surface2)'; b.style.color='var(--fg2)';
  });
  btn.style.background='var(--accent)'; btn.style.color='#fff';
  calView = view;
  if (view === 'week') {
    // Set week to contain today or current calMonth
    const ref = new Date(calYear, calMonth, new Date().getDate());
    const dow = (ref.getDay()+6)%7; // Monday=0
    calWeekStart = new Date(ref); calWeekStart.setDate(ref.getDate()-dow);
  }
  if (view === 'day') {
    calDayDate = today();
  }
  renderCalendarGrid();
}

function calNavView(dir) {
  if (calView === 'month') { calNav(dir); return; }
  if (calView === 'week') {
    calWeekStart = calWeekStart || (() => { const d=new Date(); d.setDate(d.getDate()-((d.getDay()+6)%7)); return d; })();
    calWeekStart = new Date(calWeekStart); calWeekStart.setDate(calWeekStart.getDate() + dir*7);
    renderCalendarGrid(); return;
  }
  if (calView === 'day') {
    const d = new Date(calDayDate); d.setDate(d.getDate()+dir);
    calDayDate = d.toISOString().slice(0,10);
    renderCalendarGrid(); return;
  }
}

function renderCalendarGrid() {
  const grid = document.getElementById('cal-grid');
  if (!grid) return;
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const ml = document.getElementById('cal-main-label');
  const todayStr = today();

  // Build event lookup by date
  const events = {};
  DB.activities.forEach(a=>{
    if (!a.date) return;
    const d = a.date.slice(0,10);
    if (!events[d]) events[d]=[];
    const timeLabel = a.time ? a.time.slice(0,5)+' ' : '';
    const title = (a.summary||a.subject||'Activity');
    const cls = a.type==='Meeting'?'cal-event-meeting':a.type==='Task'?'cal-event-task':'cal-event-call';
    events[d].push({label:timeLabel+title, cls});
  });
  DB.tasks.filter(t=>t.status==='Pending').forEach(t=>{
    if (!t.due) return;
    const d = t.due.slice(0,10);
    if (!events[d]) events[d]=[];
    events[d].push({label:t.title, cls:'cal-event-task'});
  });
  gcalEvents.forEach(e=>{
    if (!events[e.date]) events[e.date]=[];
    events[e.date].push({label:(e.time?e.time+' · ':'')+e.label, cls:'cal-event-gcal', link:e.link});
  });

  function eventHtml(dayEvents, dateStr, max=4) {
    return dayEvents.slice(0,max).map(e=>e.link
      ? `<a href="${e.link}" target="_blank" style="text-decoration:none"><div class="cal-event ${e.cls}">${e.label}</div></a>`
      : `<div class="cal-event ${e.cls}">${e.label}</div>`
    ).join('') + (dayEvents.length>max ? `<div onclick="event.stopPropagation();calDayClick('${dateStr}')" style="font-size:10px;color:var(--accent);cursor:pointer;padding:1px 4px">+${dayEvents.length-max} more</div>` : '');
  }

  const dowHeader = document.getElementById('cal-dow-header');

  // ── MONTH VIEW ──
  if (!calView || calView === 'month') {
    if (dowHeader) dowHeader.style.display = 'grid';
    if (ml) ml.textContent = MONTHS[calMonth] + '  ' + calYear;
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const offset = (firstDay + 6) % 7;
    const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
    const prevDays = new Date(calYear, calMonth, 0).getDate();
    const numRows = Math.ceil((offset + daysInMonth) / 7);
    // Fill screen: header ~200px, dow header ~32px
    const rowH = Math.max(100, Math.floor((window.innerHeight - 232) / numRows));
    grid.style.gridTemplateColumns = 'repeat(7,1fr)';
    grid.style.gridAutoRows = rowH + 'px';
    // How many events fit: each event is ~20px, day number is 20px, padding 10px
    const maxEvt = Math.max(1, Math.floor((rowH - 30) / 20));
    let cells = '';
    for (let i=offset-1;i>=0;i--)
      cells += `<div class="cal-cell other-month"><span class="cal-day-num" style="color:var(--fg3)">${prevDays-i}</span></div>`;
    for (let d=1;d<=daysInMonth;d++) {
      const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isT = dateStr===todayStr;
      const dayEvents = events[dateStr]||[];
      const col = (offset+d-1)%7;
      const isSat = col===5, isSun=col===6;
      cells += `<div class="cal-cell${isT?' is-today':''}" onclick="calDayClick('${dateStr}')" style="cursor:pointer">
        <span class="cal-day-num" style="${isSat||isSun?'color:var(--red)':''}">${d}</span>
        ${eventHtml(dayEvents, dateStr, maxEvt)}
      </div>`;
    }
    const total = offset + daysInMonth;
    const rem = total%7===0?0:7-(total%7);
    for (let d=1;d<=rem;d++)
      cells += `<div class="cal-cell other-month"><span class="cal-day-num" style="color:var(--fg3)">${d}</span></div>`;
    grid.innerHTML = cells;
    return;
  }

  // ── WEEK VIEW ──
  if (calView === 'week') {
    if (dowHeader) dowHeader.style.display = 'none';
    if (!calWeekStart) {
      const ref = new Date(); const dow = (ref.getDay()+6)%7;
      calWeekStart = new Date(ref); calWeekStart.setDate(ref.getDate()-dow);
    }
    const weekDates = Array.from({length:7}, (_,i) => {
      const d = new Date(calWeekStart); d.setDate(d.getDate()+i); return d;
    });
    const startLabel = weekDates[0].getDate() + ' ' + MONTHS[weekDates[0].getMonth()];
    const endLabel = weekDates[6].getDate() + ' ' + MONTHS[weekDates[6].getMonth()] + ' ' + weekDates[6].getFullYear();
    if (ml) ml.textContent = startLabel + ' – ' + endLabel;
    grid.style.gridTemplateColumns = 'repeat(7,1fr)';
    grid.style.gridAutoRows = 'minmax(140px,auto)';
    let cells = weekDates.map((d,i) => {
      const dateStr = d.toISOString().slice(0,10);
      const isT = dateStr === todayStr;
      const dayEvents = events[dateStr]||[];
      const isSat = i===5, isSun = i===6;
      const dayNumStyle = isT
        ? 'display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:var(--accent);color:#fff;font-weight:700;font-size:13px;'
        : `font-size:13px;font-weight:600;color:${isSat||isSun?'var(--red)':'var(--fg)'};`;
      return `<div class="cal-cell${isT?' is-today':''}" onclick="calDayClick('${dateStr}')" style="cursor:pointer">
        <div style="font-size:11px;color:${isSat||isSun?'var(--red)':'var(--fg3)'};font-weight:600;margin-bottom:2px">${DAYS_SHORT[i].toUpperCase()}</div>
        <div style="${dayNumStyle}margin-bottom:6px">${d.getDate()}</div>
        ${eventHtml(dayEvents, dateStr, 10)}
      </div>`;
    }).join('');
    grid.innerHTML = cells;
    return;
  }

  // ── DAY VIEW ──
  if (calView === 'day') {
    if (dowHeader) dowHeader.style.display = 'none';
    if (!calDayDate) calDayDate = todayStr;
    const d = new Date(calDayDate);
    const dow = (d.getDay()+6)%7;
    if (ml) ml.textContent = DAYS_SHORT[dow] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
    const dayEvents = events[calDayDate]||[];
    grid.style.gridTemplateColumns = '1fr';
    grid.style.gridAutoRows = 'auto';
    if (dayEvents.length === 0) {
      grid.innerHTML = `<div style="padding:40px;text-align:center;color:var(--fg3)">No events for this day.<br><br><button onclick="openModal('activity',null,{date:'${calDayDate}'})" class="btn btn-primary btn-sm">+ Add Activity</button></div>`;
    } else {
      grid.innerHTML = `<div style="padding:16px;display:flex;flex-direction:column;gap:8px">` +
        dayEvents.map(e => e.link
          ? `<a href="${e.link}" target="_blank" style="text-decoration:none"><div class="cal-event ${e.cls}" style="font-size:13px;padding:10px 12px;border-radius:6px">${e.label}</div></a>`
          : `<div class="cal-event ${e.cls}" style="font-size:13px;padding:10px 12px;border-radius:6px">${e.label}</div>`
        ).join('') +
        `<div style="margin-top:8px"><button onclick="openModal('activity',null,{date:'${calDayDate}'})" class="btn btn-primary btn-sm">+ Add Activity</button></div></div>`;
    }
    return;
  }
}

