// ────────────────────────────────────────────────────────────────────────────

async function refreshDashboard() {
  const icon = document.getElementById('refresh-icon');
  if (icon) { icon.style.animation = 'spin 0.8s linear infinite'; icon.style.transformOrigin = 'center'; }
  await load();
  renderDashboard();
  if (icon) icon.style.animation = '';
}
function renderDashboard() {
  const cu = getCurrentUser();
  showViewSwitcher(true);
  setDashView(currentDashView);

  // Welcome banner — avatar initial + name
  // avatar removed — no-op
  const nameEl = document.getElementById('dash-welcome-name');
  if (nameEl) nameEl.innerHTML = `<span>${cu || 'User'}</span><span style="font-size:26px;letter-spacing:0">👋</span>`;
  // Live clock
  if (window._welcomeClockInterval) clearInterval(window._welcomeClockInterval);
  function updateClock() {
    const n = new Date();
    const dateStr = n.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
    const timeStr = n.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true});
    const el = document.getElementById('dash-welcome-date');
    if (el) el.textContent = dateStr + '  •  ' + timeStr.toUpperCase();
  }
  updateClock();
  window._welcomeClockInterval = setInterval(updateClock, 1000);

  // ---- KPI TILES — role-based visibility ----
  const isDeliveryDept = LOGGED_IN_USER && (LOGGED_IN_USER.dept||'').toLowerCase() === 'delivery';
  const leadsKpiCard = document.querySelector('.dash-kpi-card[onclick*="leads"]');
  if (leadsKpiCard) leadsKpiCard.style.display = isDeliveryDept ? 'none' : '';

  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth();
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthStr = `${thisYear}-${String(thisMonth+1).padStart(2,'0')}`;

  // Leads created this month (all users)
  const leadsThisMonth = DB.leads.filter(l => (l.createdAt||'').startsWith(monthStr));
  // Deals created this month
  const dealsThisMonth = DB.deals.filter(d => (d.createdAt||'').startsWith(monthStr));
  // Revenue this month = sum of Closed Won expected revenue (won in this month)
  const revenueThisMonth = DB.deals
    .filter(d => isWon(d) && (d.wonAt||d.closeDate||d.createdAt||'').startsWith(monthStr))
    .reduce((a,d)=>a+Number(d.expectedRevenue||d.amount||d.value||0),0);
  // Open + overdue tasks
  const todayStr = today();
  const openTasks = DB.tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress');
  const overdueTasks = openTasks.filter(t => (t.dueDate||t.due) && (t.dueDate||t.due) < todayStr);
  // Current quarter metrics — Indian FY: Q1=Apr-Jun, Q2=Jul-Sep, Q3=Oct-Dec, Q4=Jan-Mar
  // Map calendar month (0=Jan) → FY quarter index (0=Q1)
  const fyQMap = [3,3,3,0,0,0,1,1,1,2,2,2]; // Jan-Mar→Q4(3), Apr-Jun→Q1(0), Jul-Sep→Q2(1), Oct-Dec→Q3(2)
  const cqIdx = fyQMap[thisMonth]; // current FY quarter index (0-3)
  // FY quarter month ranges (calendar months, 0-based): Q1=Apr(3)-Jun(5), Q2=Jul(6)-Sep(8), Q3=Oct(9)-Dec(11), Q4=Jan(0)-Mar(2)
  const fyQMonths = [[3,4,5],[6,7,8],[9,10,11],[0,1,2]];
  const cqCalMonths = fyQMonths[cqIdx]; // calendar months in this quarter
  // Build YYYY-MM strings for each month in current quarter
  const cqYearFor = (m) => (cqIdx === 3 && m <= 2) ? thisYear : thisYear; // Q4 Jan-Mar stays in same year for display
  const lqMonths = cqCalMonths.map(m => `${thisYear}-${String(m+1).padStart(2,'0')}`);
  // All deals active or closed in current quarter (created OR won in this quarter)
  const lqDeals = DB.deals.filter(d => {
    const dateStr = d.createdAt || '';
    return lqMonths.some(m => dateStr.startsWith(m));
  });
  // Won deals: check wonAt or closeDate falling in this quarter (not just created)
  const lqWon = DB.deals.filter(d => {
    if (!isWon(d)) return false;
    const dateStr = d.wonAt || d.closeDate || d.createdAt || '';
    return lqMonths.some(m => dateStr.startsWith(m));
  });
  const lqRevenue = lqWon.reduce((a,d)=>a+Number(d.expectedRevenue||d.amount||d.value||0),0);
  const lqWinRate = lqDeals.length ? Math.round(lqWon.length/lqDeals.length*100) : 0;
  const lqLeads = DB.leads.filter(l=>lqMonths.some(m=>(l.createdAt||'').startsWith(m)));
  const qNames = ['Q1','Q2','Q3','Q4'];
  // FY year label: Q1-Q3 use current year FY, Q4 (Jan-Mar) is end of previous FY
  const fyLabelYear = cqIdx === 3 ? thisYear : thisYear;
  const lqLabel = `${qNames[cqIdx]} FY${String(fyLabelYear+1).slice(2)}`; // e.g. "Q3 FY27"

  const setEl = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
  setEl('stat-leads-month', leadsThisMonth.length);
  setEl('stat-deals-month', dealsThisMonth.length);
  setEl('stat-month-name', monthNames[thisMonth]);
  setEl('stat-month-name2', monthNames[thisMonth]);
  setEl('stat-revenue-month', fmt(revenueThisMonth));
  setEl('stat-overdue-tasks', openTasks.length);
  const subEl = document.getElementById('stat-overdue-sub');
  if (subEl) subEl.textContent = overdueTasks.length > 0 ? `${overdueTasks.length} past due date` : 'Pending & In Progress';
  setEl('stat-winrate', lqWinRate+'%');
  setEl('stat-winrate-sub', `${lqWon.length} won of ${lqDeals.length} deals`);

  // Banner mini-stats: today's open tasks + today's meetings
  const todayTaskCount = DB.tasks.filter(t => t.owner === cu && (t.status==='Pending'||t.status==='In Progress') && (t.dueDate||t.due)===todayStr).length;
  const todayMeetCount = DB.activities.filter(a => a.type==='Meeting' && (a.date||'').startsWith(todayStr)).length;
  setEl('dash-today-tasks', todayTaskCount || openTasks.filter(t=>t.owner===cu).length);
  setEl('dash-today-meetings', todayMeetCount);
  setEl('lq-label', lqLabel);
  setEl('lq-leads', lqLeads.length);
  setEl('lq-deals', lqDeals.length);
  setEl('lq-won', lqWon.length);
  setEl('lq-revenue', fmtC(lqRevenue));
  setEl('lq-winrate', lqWinRate+'%');

  // My Open Tasks table
  const pendingTasks = DB.tasks.filter(t=>t.owner===cu && t.status==='Pending').slice(0,8);
  const tasksBody = document.getElementById('dash-tasks-body');
  if (!pendingTasks.length) {
    tasksBody.innerHTML = '<tr><td colspan="3" style="padding:32px;text-align:center;color:var(--fg3);font-size:13px">No Tasks found.</td></tr>';
  } else {
    tasksBody.innerHTML = pendingTasks.map(t=>`
      <tr style="border-bottom:1px solid var(--border)" onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background=''">
        <td style="padding:10px 16px;color:var(--fg);font-size:13px">${t.title}</td>
        <td style="padding:10px 12px;color:${isOverdue(t.due)?'var(--red)':'var(--fg2)'};font-size:13px">${fmtDate(t.due)}</td>
        <td style="padding:10px 12px">${badge(t.status==='Pending'&&isOverdue(t.due)?'Overdue':t.status)}</td>
      </tr>`).join('');
  }

  // My Meetings table
  const meetings = DB.activities.filter(a=>a.owner===cu && a.type==='Meeting').slice(0,8);
  const meetBody = document.getElementById('dash-meetings-body');
  if (!meetings.length) {
    meetBody.innerHTML = '<tr><td colspan="3" style="padding:32px;text-align:center;color:var(--fg3);font-size:13px">No Meetings found.</td></tr>';
  } else {
    meetBody.innerHTML = meetings.map(m=>`
      <tr style="border-bottom:1px solid var(--border)" onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background=''">
        <td style="padding:10px 16px;color:var(--fg);font-size:13px">${m.summary}</td>
        <td style="padding:10px 12px;color:var(--fg2);font-size:13px">${fmtDate(m.date)}</td>
        <td style="padding:10px 12px;color:var(--fg2);font-size:13px">${m.contact||'—'}</td>
      </tr>`).join('');
  }

  // Recent Activity feed — admin/superadmin only
  const actEl = document.getElementById('dash-activity');
  const actParentCard = actEl ? actEl.closest('.dash-card') : null;
  if (actParentCard) actParentCard.style.display = isAdminOrAbove() ? '' : 'none';
  if (isAdminOrAbove() && actEl) {
  const auditEntries = DB.audit.slice(0, 10);
  const callMeetings = DB.activities.slice(0, 6);
  const feedItems = auditEntries.length ? auditEntries : [];
  const actionColors = { Create: 'var(--green)', Update: 'var(--accent)', Delete: 'var(--red)' };
  const moduleIcons = { leads:'🎯', deals:'💼', contacts:'👤', companies:'🏢', tasks:'✅', activities:'📞', documents:'📄', invoices:'🧾' };
  if (!feedItems.length && !callMeetings.length) {
    actEl.innerHTML = '<div class="empty-state"><div class="icon">📭</div><p>No activity yet</p></div>';
  } else if (feedItems.length) {
    actEl.innerHTML = feedItems.map(a => {
      const icon = moduleIcons[a.module] || '📋';
      const color = actionColors[a.action] || 'var(--fg3)';
      const ts = a.ts ? new Date(a.ts).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:true}) : '—';
      return `<div class="activity-item">
        <div class="activity-dot" style="background:${color}"></div>
        <div class="activity-content">
          <div class="act-text">${icon} <strong>${a.user||'System'}</strong> <span style="color:${color};font-weight:600">${a.action}d</span> ${a.record ? '"'+a.record+'"' : 'a record'} in <span style="color:var(--fg2)">${a.module}</span></div>
          <div class="act-time">${ts}</div>
        </div>
      </div>`;
    }).join('');
  } else {
    actEl.innerHTML = callMeetings.map(a=>`
      <div class="activity-item">
        <div class="activity-dot" style="background:${a.type==='Call'?'var(--green)':a.type==='Email'?'var(--accent)':'var(--amber)'}"></div>
        <div class="activity-content">
          <div class="act-text"><strong>${a.type}</strong> — ${a.summary||a.subject||''}</div>
          <div class="act-time">${a.owner} · ${fmtDate(a.date)}</div>
        </div>
      </div>`).join('');
  }
  } // end isAdminOrAbove activity block

  // Pipeline summary
  const pipEl = document.getElementById('dash-pipeline');
  const stageCount = {};
  DB.deals.forEach(d=>{ stageCount[d.stage]=(stageCount[d.stage]||0)+1; });
  const totalPipeline = DB.deals.reduce((a,d)=>a+Number(d.amount||0),0);
  pipEl.innerHTML = `
    <div style="margin-bottom:12px;padding:12px;background:var(--surface2);border-radius:8px">
      <div style="font-size:11px;color:var(--fg3);text-transform:uppercase;letter-spacing:0.6px;margin-bottom:4px">Total Pipeline Value</div>
      <div style="font-size:22px;font-weight:700;color:var(--accent)">${fmt(totalPipeline)}</div>
    </div>
    ${Object.entries(stageCount).map(([s,c])=>`
    <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border);font-size:13px">
      <span style="color:var(--fg2)">${s}</span>
      <span style="font-weight:600;color:var(--fg)">${c} deal${c>1?'s':''}</span>
    </div>`).join('')||'<div style="color:var(--fg3);font-size:13px;padding:12px 0">No deals yet.</div>'}`;

  renderRevenueTarget();
  renderMonthlyRevenue();
  renderRevenuePie();
}

// Compact format: ₹4.13L, ₹1.00Cr — 2 decimal digits + unit
function fmtC(n) {
  const num = Number(n) || 0;
  if (num >= 1e7) return '₹' + (num/1e7).toFixed(2) + 'Cr';
  if (num >= 1e5) return '₹' + (num/1e5).toFixed(2) + 'L';
  if (num >= 1e3) return '₹' + (num/1e3).toFixed(2) + 'K';
  return '₹' + num.toFixed(0);
}

function renderRevenuePie() {
  const canvas = document.getElementById('dash-revenue-pie');
  const legend = document.getElementById('dash-revenue-pie-legend');
  if (!canvas || !legend) return;

  // Aggregate Won deal revenue by client (companyName)
  const map = {};
  (DB.deals || []).filter(d => isWon(d)).forEach(d => {
    const client = d.companyName || 'Unknown';
    const rev = Number(d.expectedRevenue || d.amount || d.value || 0);
    map[client] = (map[client] || 0) + rev;
  });

  const entries = Object.entries(map).filter(([,v]) => v > 0).sort((a,b) => b[1]-a[1]);
  const total = entries.reduce((s,[,v]) => s+v, 0);

  if (!entries.length || total === 0) {
    canvas.style.display = 'none';
    legend.innerHTML = '<div style="color:var(--fg3);font-size:13px;padding:20px 0">No won deal revenue yet.</div>';
    return;
  }

  // Top 8 clients, rest → "Others"
  let slices = entries.slice(0, 8);
  if (entries.length > 8) {
    const othersVal = entries.slice(8).reduce((s,[,v]) => s+v, 0);
    slices.push(['Others', othersVal]);
  }

  const palette = ['#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#ec4899','#14b8a6','#f97316','#a855f7'];
  const ctx = canvas.getContext('2d');

  // HiDPI / retina fix
  const dpr = window.devicePixelRatio || 1;
  const size = 200;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
  ctx.scale(dpr, dpr);

  const cx = size / 2, cy = size / 2, r = 84, inner = 46;

  // resolve CSS vars via computed style on the card element
  const cardEl = canvas.closest('.dash-card') || document.body;
  const cs = getComputedStyle(cardEl);
  const bgColor = cs.backgroundColor || '#ffffff';
  const fgColor = cs.color || '#111111';

  ctx.clearRect(0, 0, size, size);

  // draw slices with white separators (using actual resolved bg)
  let angle = -Math.PI / 2;
  slices.forEach(([name, val], i) => {
    const sweep = (val / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + sweep);
    ctx.closePath();
    ctx.fillStyle = palette[i % palette.length];
    ctx.fill();
    angle += sweep;
  });

  // draw white separating lines between slices
  angle = -Math.PI / 2;
  slices.forEach(([, val]) => {
    const sweep = (val / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    ctx.strokeStyle = bgColor;
    ctx.lineWidth = slices.length > 1 ? 2.5 : 0;
    ctx.stroke();
    angle += sweep;
  });

  // donut hole — fill with card background
  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, 2 * Math.PI);
  ctx.fillStyle = bgColor;
  ctx.fill();

  // center label — use px sizes (already in CSS px thanks to ctx.scale)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 13px "Plus Jakarta Sans",Inter,sans-serif';
  ctx.fillStyle = fgColor;
  ctx.fillText('Won', cx, cy - 9);
  ctx.font = '500 11px "Plus Jakarta Sans",Inter,sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Revenue', cx, cy + 9);

  // legend
  legend.innerHTML = slices.map(([name, val], i) => {
    const pct = Math.round(val / total * 100);
    return `<div style="display:flex;align-items:center;gap:10px;font-size:12.5px">
      <div style="width:11px;height:11px;border-radius:4px;background:${palette[i % palette.length]};flex-shrink:0"></div>
      <span style="color:var(--fg2);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500">${name}</span>
      <span style="font-weight:800;color:var(--fg);flex-shrink:0;font-family:'Plus Jakarta Sans','Inter',sans-serif">${fmtC(val)}</span>
      <span style="color:var(--fg3);flex-shrink:0;min-width:34px;text-align:right;font-weight:500">${pct}%</span>
    </div>`;
  }).join('');
}

function renderRevenueTarget() {
  const achieved = DB.deals
    .filter(d => isWon(d) && (d.wonAt||d.closeDate||'').startsWith(new Date().getFullYear()+''))
    .reduce((a,d) => a + Number(d.expectedRevenue||d.amount||0), 0);

  const inputEl = document.getElementById('dash-target-input');
  const target = inputEl ? Number(inputEl.value) || 0 : 0;

  // save target to localStorage
  if (inputEl && inputEl.value) localStorage.setItem('sk_rev_target', inputEl.value);
  else if (inputEl && !inputEl.value) {
    const saved = localStorage.getItem('sk_rev_target');
    if (saved) { inputEl.value = saved; }
  }
  const finalTarget = inputEl ? Number(inputEl.value) || 0 : 0;

  const pct = finalTarget > 0 ? Math.min(Math.round(achieved / finalTarget * 100), 100) : 0;
  const remaining = finalTarget > 0 ? Math.max(finalTarget - achieved, 0) : 0;
  const maxVal = finalTarget > 0 ? Math.max(finalTarget * 1.2, achieved * 1.2, 1000) : Math.max(achieved * 1.2, 10000);

  // bar
  const bar = document.getElementById('dash-achieved-bar');
  const line = document.getElementById('dash-target-line');
  const lineLabel = document.getElementById('dash-target-line-label');
  const axis = document.getElementById('dash-target-axis');

  if (bar) bar.style.width = (achieved / maxVal * 100) + '%';

  if (line && lineLabel) {
    if (finalTarget > 0) {
      const linePos = Math.min(finalTarget / maxVal * 100, 98);
      line.style.left = linePos + '%';
      line.style.display = 'block';
      lineLabel.textContent = 'Target: ' + fmtC(finalTarget);
    } else {
      line.style.display = 'none';
    }
  }

  // axis ticks — 5 evenly spaced
  if (axis) {
    const ticks = [0,1,2,3,4,5].map(i => Math.round(maxVal / 5 * i));
    axis.innerHTML = ticks.map(t => `<span>${fmtC(t)}</span>`).join('');
  }

  const setEl = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
  setEl('dash-achieved-val', fmtC(achieved));
  setEl('dash-target-val',   finalTarget > 0 ? fmtC(finalTarget) : '—');
  setEl('dash-remaining-val',finalTarget > 0 ? fmtC(remaining) : '—');
  setEl('dash-pct-val',      finalTarget > 0 ? pct + '%' : '—');
  setEl('dash-target-label', finalTarget > 0 ? `${pct}% of ${fmtC(finalTarget)} achieved` : 'Set a target above');
}

function renderMonthlyRevenue() {
  // Indian FY: Apr–Mar (FY26 = Apr 2025 – Mar 2026)
  const now = new Date();
  const calYr = now.getFullYear();
  // FY starts in April: if current month < April (0-indexed < 3), FY started last year
  const fyStart = now.getMonth() < 3 ? calYr - 1 : calYr;
  const fyEnd   = fyStart + 1;
  const el = document.getElementById('dash-monthly-year');
  if (el) el.textContent = `FY${String(fyEnd).slice(2)}`; // e.g. "FY26"

  // FY months in order: Apr(3) May(4) Jun(5) Jul(6) Aug(7) Sep(8) Oct(9) Nov(10) Dec(11) Jan(0) Feb(1) Mar(2)
  const fyMonths = [3,4,5,6,7,8,9,10,11,0,1,2];
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Sum Closed Won revenue per FY-month index (0=Apr … 11=Mar)
  const monthly = Array(12).fill(0);
  DB.deals.filter(d => isWon(d)).forEach(d => {
    const dt = d.wonAt || d.closeDate || d.createdAt || '';
    if (!dt) return;
    const dYr = parseInt(dt.slice(0,4),10);
    const dMo = parseInt(dt.slice(5,7),10) - 1; // 0-based calendar month
    // Apr–Dec of fyStart OR Jan–Mar of fyEnd
    const inFY = (dYr === fyStart && dMo >= 3) || (dYr === fyEnd && dMo <= 2);
    if (!inFY) return;
    const fyIdx = fyMonths.indexOf(dMo);
    if (fyIdx >= 0) monthly[fyIdx] += Number(d.expectedRevenue||d.amount||0);
  });

  const maxMon = Math.max(...monthly, 1);
  // FY quarters: Q1=Apr-Jun(0-2), Q2=Jul-Sep(3-5), Q3=Oct-Dec(6-8), Q4=Jan-Mar(9-11)
  const quarters = [[0,1,2],[3,4,5],[6,7,8],[9,10,11]];

  // Clean standard palette — matches KPI cards
  const qPalette = [
    { color:'#6366f1', gFrom:'#6366f1', gTo:'#4f46e5', pill:'#eef2ff', pillBorder:'#c7d2fe', textColor:'#4338ca' }, // Q1 indigo
    { color:'#3b82f6', gFrom:'#3b82f6', gTo:'#2563eb', pill:'#eff6ff', pillBorder:'#bfdbfe', textColor:'#1d4ed8' }, // Q2 blue
    { color:'#10b981', gFrom:'#10b981', gTo:'#059669', pill:'#f0fdf4', pillBorder:'#bbf7d0', textColor:'#15803d' }, // Q3 green
    { color:'#f59e0b', gFrom:'#f59e0b', gTo:'#d97706', pill:'#fffbeb', pillBorder:'#fde68a', textColor:'#b45309' }, // Q4 amber
  ];
  const qNames = ['Q1','Q2','Q3','Q4'];

  const grid = document.getElementById('dash-quarterly-grid');
  if (!grid) return;

  // Inject SVG gradient defs once
  const svgNS = 'http://www.w3.org/2000/svg';

  grid.innerHTML = quarters.map((qMons, qi) => {
    const p = qPalette[qi];
    const qTotal = qMons.reduce((a,m) => a + monthly[m], 0);
    const hasQData = qTotal > 0;
    const barH = 92;

    const bars = qMons.map(m => {
      const h = Math.max(Math.round(monthly[m] / maxMon * barH), monthly[m] > 0 ? 4 : 0);
      const hasVal = monthly[m] > 0;
      return `
        <div style="display:flex;flex-direction:column;align-items:center;gap:5px;flex:1;min-width:0">
          <div style="font-size:10px;font-weight:700;color:${p.color};min-height:15px;line-height:1;letter-spacing:-0.3px;font-family:'Plus Jakarta Sans',Inter,sans-serif">${hasVal ? fmtC(monthly[m]) : ''}</div>
          <div style="width:100%;height:${barH}px;display:flex;align-items:flex-end;position:relative">
            <div style="position:absolute;inset:0;background:var(--surface2,#f1f5f9);border-radius:4px 4px 0 0;opacity:0.5"></div>
            <div style="width:100%;height:${h}px;border-radius:${h>=barH?'4px':'3px 3px 0 0'};background:${hasVal?p.color:'transparent'};opacity:${hasVal?'0.75':'0'};transition:height 0.5s ease;position:relative"></div>
          </div>
          <div style="font-size:10px;color:var(--fg3);font-weight:500;letter-spacing:0.2px">${monthNames[fyMonths[m]]}</div>
        </div>`;
    }).join('');

    return `
      <div style="padding:16px 14px 14px;border-right:1px solid var(--border);background:var(--surface);${qi===3?'border-right:none':''}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <span style="display:inline-flex;align-items:center;gap:5px;background:${p.pill};border:1px solid ${p.pillBorder};border-radius:20px;padding:3px 10px 3px 7px">
            <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="${p.color}"/></svg>
            <span style="font-size:11px;font-weight:600;color:${p.textColor};letter-spacing:0.2px">${qNames[qi]}</span>
          </span>
          <span style="font-size:12px;font-weight:700;color:${hasQData?'var(--fg)':'var(--fg3)'};letter-spacing:-0.3px">${fmtC(qTotal)}</span>
        </div>
        <div style="display:flex;gap:7px;align-items:flex-end">${bars}</div>
      </div>`;
  }).join('');
}

