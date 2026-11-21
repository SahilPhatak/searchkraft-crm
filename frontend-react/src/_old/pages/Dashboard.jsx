import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

function fmt(v) {
  if (!v) return '—'
  const n = parseFloat(v)
  if (isNaN(n)) return '—'
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000)     return `₹${(n / 1000).toFixed(0)}K`
  return `₹${n.toLocaleString('en-IN')}`
}

function useLiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

function KpiCard({ color, iconSvg, label, value, sub, onClick }) {
  return (
    <div
      className="dash-kpi-card"
      style={{ '--kpi-color': color, cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <div className="kpi-icon">{iconSvg}</div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ color }}>{value ?? '—'}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  )
}

export function Dashboard() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const now = useLiveClock()

  const { data: leads = [], refetch: refetchLeads } = useQuery({ queryKey: ['leads'], queryFn: () => api.get('/api/leads') })
  const { data: contacts = [] } = useQuery({ queryKey: ['contacts'], queryFn: () => api.get('/api/contacts') })
  const { data: deals = [], refetch: refetchDeals } = useQuery({ queryKey: ['deals'], queryFn: () => api.get('/api/deals') })
  const { data: tasks = [], refetch: refetchTasks } = useQuery({ queryKey: ['tasks'], queryFn: () => api.get('/api/tasks') })
  const { data: activities = [] } = useQuery({ queryKey: ['activities'], queryFn: () => api.get('/api/activities') })
  const { data: business = [] } = useQuery({ queryKey: ['business_onboarded'], queryFn: () => api.get('/api/business-onboarded') })

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthName = now.toLocaleDateString('en-IN', { month: 'long' })

  // KPI: Leads this month
  const leadsThisMonth = leads.filter(l => new Date(l.created_at) >= monthStart).length

  // KPI: Deals this month
  const dealsThisMonth = deals.filter(d => new Date(d.created_at) >= monthStart).length

  // KPI: Revenue this month (closed won)
  const revenueThisMonth = deals
    .filter(d => (d.stage === 'Won' || d.stage === 'closed_won') && new Date(d.close_date || d.updated_at) >= monthStart)
    .reduce((s, d) => s + (parseFloat(d.amount) || 0), 0)

  // KPI: Open tasks (not completed)
  const openTasks = tasks.filter(t => t.status !== 'completed').length

  // KPI: Win rate last quarter
  const qStart = new Date(now)
  qStart.setMonth(qStart.getMonth() - 3)
  const lastQDeals = deals.filter(d => {
    const dt = new Date(d.close_date || d.updated_at)
    return dt >= qStart && dt < monthStart
  })
  const wonQ = lastQDeals.filter(d => d.stage === 'Won' || d.stage === 'closed_won').length
  const winRate = lastQDeals.length > 0 ? Math.round((wonQ / lastQDeals.length) * 100) : '—'

  // KPI: Business Onboarded
  const boTotal = business.length
  const boActive = business.filter(b => b.status === 'active').length
  const boHold = business.filter(b => b.status !== 'active' && b.status !== 'churned').length
  const boClosed = business.filter(b => b.status === 'churned').length

  // Welcome banner stats
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayTasks = tasks.filter(t => t.due_date && new Date(t.due_date) >= todayStart && t.status !== 'completed').length
  const todayMeetings = activities.filter(a => {
    if (a.type !== 'meeting') return false
    if (!a.date) return false
    const d = new Date(a.date)
    return d >= todayStart && d < new Date(todayStart.getTime() + 86400000)
  }).length

  const firstName = profile?.full_name?.split(' ')[0] || 'User'

  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toUpperCase()

  // Recent leads (5)
  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)

  // Upcoming tasks (5)
  const upcomingTasks = [...tasks]
    .filter(t => t.status !== 'completed')
    .sort((a, b) => new Date(a.due_date || '9999') - new Date(b.due_date || '9999'))
    .slice(0, 5)

  // Recent activities (5)
  const recentActivities = [...activities]
    .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
    .slice(0, 5)

  // Pipeline: open deals by stage
  const pipeline = deals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost' && d.stage !== 'closed_won' && d.stage !== 'closed_lost')
  const pipelineValue = pipeline.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0)

  function handleRefresh() {
    refetchLeads(); refetchDeals(); refetchTasks()
  }

  const statusColor = {
    new: '#6366f1', contacted: '#3b82f6', qualified: '#10b981',
    proposal: '#f59e0b', negotiation: '#8b5cf6', won: '#16a34a',
    lost: '#dc2626', unqualified: '#6b7280',
  }

  return (
    <div id="page-dashboard">

      {/* ── Welcome Banner ── */}
      <div
        style={{
          position: 'relative',
          background: 'linear-gradient(135deg,#0a1628 0%,#0f2352 55%,#1a3a6b 100%)',
          borderRadius: 18, padding: '28px 32px', marginBottom: 24,
          color: '#fff', overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(10,22,40,0.18)',
        }}
      >
        {/* Decorative circles */}
        <div style={{ position:'absolute',top:-40,right:-40,width:180,height:180,borderRadius:'50%',background:'rgba(99,102,241,0.12)',pointerEvents:'none' }} />
        <div style={{ position:'absolute',bottom:-30,right:120,width:100,height:100,borderRadius:'50%',background:'rgba(59,130,246,0.09)',pointerEvents:'none' }} />

        <div style={{ display:'flex',alignItems:'center',gap:20,flexWrap:'wrap',position:'relative',zIndex:1 }}>
          {/* Name + date */}
          <div style={{ flex:1,minWidth:140 }}>
            <div style={{ fontSize:11,fontWeight:700,letterSpacing:'1.4px',textTransform:'uppercase',color:'rgba(255,255,255,0.4)',marginBottom:6 }}>
              Welcome back
            </div>
            <div style={{ fontSize:34,fontWeight:800,letterSpacing:'-1.2px',fontFamily:"'Plus Jakarta Sans','Inter',sans-serif",lineHeight:1,display:'flex',alignItems:'center',gap:12 }}>
              <span>{firstName}</span><span style={{ fontSize:32,letterSpacing:0 }}>👋</span>
            </div>
            <div style={{ fontSize:14,color:'rgba(255,255,255,0.4)',marginTop:10,fontWeight:500,letterSpacing:'0.3px' }}>
              {dateStr}&nbsp;&nbsp;•&nbsp;&nbsp;{timeStr}
            </div>
          </div>

          {/* Quick stats strip */}
          <div style={{ display:'flex',gap:0,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:12,overflow:'hidden',flexShrink:0 }}>
            <div style={{ padding:'12px 20px',textAlign:'center',borderRight:'1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize:10,fontWeight:700,letterSpacing:'0.8px',textTransform:'uppercase',color:'rgba(255,255,255,0.45)',marginBottom:4 }}>Today</div>
              <div style={{ fontSize:20,fontWeight:800,color:'#fff',fontFamily:"'Plus Jakarta Sans','Inter',sans-serif",letterSpacing:'-0.5px' }}>{todayTasks}</div>
              <div style={{ fontSize:10,color:'rgba(255,255,255,0.35)',marginTop:2 }}>tasks</div>
            </div>
            <div style={{ padding:'12px 20px',textAlign:'center' }}>
              <div style={{ fontSize:10,fontWeight:700,letterSpacing:'0.8px',textTransform:'uppercase',color:'rgba(255,255,255,0.45)',marginBottom:4 }}>Meetings</div>
              <div style={{ fontSize:20,fontWeight:800,color:'#fff',fontFamily:"'Plus Jakarta Sans','Inter',sans-serif",letterSpacing:'-0.5px' }}>{todayMeetings}</div>
              <div style={{ fontSize:10,color:'rgba(255,255,255,0.35)',marginTop:2 }}>today</div>
            </div>
          </div>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            style={{ background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.18)',borderRadius:10,padding:'9px 16px',color:'rgba(255,255,255,0.85)',fontSize:12,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:7,whiteSpace:'nowrap',letterSpacing:'0.3px',transition:'background 0.15s' }}
            onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.18)'}
            onMouseOut={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="dash-kpi-grid mb-16">
        <KpiCard
          color="#6366f1"
          iconSvg={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          label="Leads This Month"
          value={leadsThisMonth}
          sub={<><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span>Created in {monthName}</span></>}
          onClick={() => navigate('/leads')}
        />
        <KpiCard
          color="#3b82f6"
          iconSvg={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
          label="Deals This Month"
          value={dealsThisMonth}
          sub={<><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span>Created in {monthName}</span></>}
          onClick={() => navigate('/deals')}
        />
        <KpiCard
          color="#10b981"
          iconSvg={<div style={{ fontSize:18,fontWeight:700,color:'#10b981',fontFamily:"'Plus Jakarta Sans','Inter',sans-serif" }}>₹</div>}
          label="Revenue This Month"
          value={<span style={{ fontSize: 30, letterSpacing: '-1.5px' }}>{revenueThisMonth > 0 ? fmt(revenueThisMonth) : '₹0'}</span>}
          sub={<><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg><span>Closed Won deals</span></>}
          onClick={() => navigate('/deals')}
        />
        <KpiCard
          color="#ef4444"
          iconSvg={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>}
          label="Open Tasks"
          value={openTasks}
          sub={<><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span>Pending &amp; In Progress</span></>}
          onClick={() => navigate('/tasks')}
        />
        <KpiCard
          color="#f59e0b"
          iconSvg={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
          label="Last Qtr Win Rate"
          value={typeof winRate === 'number' ? `${winRate}%` : winRate}
          sub={<><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg><span>vs prev quarter</span></>}
        />
        <KpiCard
          color="#0d9488"
          iconSvg={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          label="Total Positions"
          value={boTotal}
          sub={<><span style={{ color:'#16a34a',fontWeight:700 }}>{boActive}</span>&nbsp;<span>active</span>&nbsp;·&nbsp;<span style={{ color:'#ca8a04',fontWeight:700 }}>{boHold}</span>&nbsp;<span>hold</span>&nbsp;·&nbsp;<span style={{ color:'#6366f1',fontWeight:700 }}>{boClosed}</span>&nbsp;<span>closed</span></>}
          onClick={() => navigate('/business')}
        />
      </div>

      {/* ── Tasks + Meetings ── */}
      <div className="grid-2 mb-16">
        {/* Recent Leads */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-section-hdr">
              <div className="dot" />
              Recent Leads
            </div>
            <button
              onClick={() => navigate('/leads')}
              style={{ fontSize:12,color:'var(--sk-accent)',background:'none',border:'none',cursor:'pointer',fontWeight:600 }}
            >
              View all →
            </button>
          </div>
          {recentLeads.length === 0 ? (
            <div className="dash-empty">No leads yet</div>
          ) : (
            <div>
              {recentLeads.map(lead => (
                <div key={lead.id} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 22px',borderBottom:'1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontSize:13,fontWeight:600,color:'var(--fg)' }}>{lead.name}</div>
                    <div style={{ fontSize:12,color:'var(--fg3)',marginTop:2 }}>{lead.company || lead.email}</div>
                  </div>
                  <span style={{
                    padding:'2px 10px',borderRadius:20,fontSize:11,fontWeight:600,
                    background: statusColor[lead.status] ? statusColor[lead.status]+'18' : 'var(--surface2)',
                    color: statusColor[lead.status] || 'var(--fg3)',
                  }}>{lead.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Tasks */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-section-hdr">
              <div className="dot" style={{ background:'#ef4444' }} />
              Upcoming Tasks
            </div>
            <button
              onClick={() => navigate('/tasks')}
              style={{ fontSize:12,color:'var(--sk-accent)',background:'none',border:'none',cursor:'pointer',fontWeight:600 }}
            >
              View all →
            </button>
          </div>
          {upcomingTasks.length === 0 ? (
            <div className="dash-empty">No pending tasks</div>
          ) : (
            <div>
              {upcomingTasks.map(task => {
                const isOverdue = task.due_date && new Date(task.due_date) < now
                return (
                  <div key={task.id} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 22px',borderBottom:'1px solid var(--border-color)' }}>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:13,fontWeight:600,color:'var(--fg)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{task.title}</div>
                      <div style={{ fontSize:12,color: isOverdue ? '#ef4444' : 'var(--fg3)',marginTop:2 }}>
                        {task.due_date ? new Date(task.due_date).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : 'No date'}
                        {isOverdue && ' · Overdue'}
                      </div>
                    </div>
                    <span style={{
                      marginLeft:12,padding:'2px 10px',borderRadius:20,fontSize:11,fontWeight:600,flexShrink:0,
                      background: task.priority === 'high' ? '#fef2f2' : task.priority === 'medium' ? '#fffbeb' : '#f0f9ff',
                      color: task.priority === 'high' ? '#dc2626' : task.priority === 'medium' ? '#d97706' : '#2563eb',
                    }}>{task.priority || 'low'}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Activities + Pipeline ── */}
      <div className="grid-2 mb-16">
        {/* Recent Activities */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-section-hdr">
              <div className="dot" style={{ background:'#8b5cf6' }} />
              Recent Activities
            </div>
            <button
              onClick={() => navigate('/activities')}
              style={{ fontSize:12,color:'var(--sk-accent)',background:'none',border:'none',cursor:'pointer',fontWeight:600 }}
            >
              View all →
            </button>
          </div>
          {recentActivities.length === 0 ? (
            <div className="dash-empty">No recent activities</div>
          ) : (
            <div>
              {recentActivities.map(act => (
                <div key={act.id} style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 22px',borderBottom:'1px solid var(--border-color)' }}>
                  <div style={{ width:32,height:32,borderRadius:8,background:'var(--surface2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:15 }}>
                    {act.type === 'call' ? '📞' : act.type === 'meeting' ? '👥' : '📧'}
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:13,fontWeight:600,color:'var(--fg)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{act.subject || act.type}</div>
                    <div style={{ fontSize:12,color:'var(--fg3)',marginTop:2 }}>{act.date ? new Date(act.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : ''}</div>
                  </div>
                  <span style={{ padding:'2px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:'var(--surface2)',color:'var(--fg3)' }}>{act.type || 'activity'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pipeline Summary */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-section-hdr">
              <div className="dot" style={{ background:'#3b82f6' }} />
              Pipeline
            </div>
            <button
              onClick={() => navigate('/deals')}
              style={{ fontSize:12,color:'var(--sk-accent)',background:'none',border:'none',cursor:'pointer',fontWeight:600 }}
            >
              View all →
            </button>
          </div>
          {pipeline.length === 0 ? (
            <div className="dash-empty">No open deals in pipeline</div>
          ) : (
            <div>
              <div style={{ padding:'14px 22px',borderBottom:'1px solid var(--border-color)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                <div style={{ fontSize:12,color:'var(--fg3)' }}>Total pipeline value</div>
                <div style={{ fontSize:16,fontWeight:700,color:'#3b82f6' }}>{fmt(pipelineValue)}</div>
              </div>
              {pipeline.slice(0, 4).map(deal => (
                <div key={deal.id} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 22px',borderBottom:'1px solid var(--border-color)' }}>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:13,fontWeight:600,color:'var(--fg)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{deal.title || deal.company_name}</div>
                    <div style={{ fontSize:12,color:'var(--fg3)',marginTop:2 }}>{deal.stage}</div>
                  </div>
                  <div style={{ fontSize:13,fontWeight:600,color:'var(--fg2)',flexShrink:0,marginLeft:12 }}>{fmt(deal.amount)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
