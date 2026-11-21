import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, DollarSign, Users, BarChart2, RefreshCw } from 'lucide-react'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#84cc16']

function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (!total) return <div className="text-muted-foreground text-sm text-center py-8">No data</div>
  let angle = -Math.PI / 2
  const paths = data.map((d, i) => {
    const frac = d.value / total
    const a1 = angle
    const a2 = angle + frac * 2 * Math.PI
    angle = a2
    const cx = 80, cy = 80, r = 60, ir = 36
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1)
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2)
    const ix1 = cx + ir * Math.cos(a2), iy1 = cy + ir * Math.sin(a2)
    const ix2 = cx + ir * Math.cos(a1), iy2 = cy + ir * Math.sin(a1)
    const large = frac > 0.5 ? 1 : 0
    return <path key={i} d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${ir} ${ir} 0 ${large} 0 ${ix2} ${iy2} Z`} fill={COLORS[i % COLORS.length]} />
  })
  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 160 160" width="140" height="140">
        {paths}
        <text x="80" y="76" textAnchor="middle" fontSize="13" fontWeight="700" fill="currentColor">{total}</text>
        <text x="80" y="91" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.6">total</text>
      </svg>
      <div className="w-full grid grid-cols-2 gap-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="truncate text-muted-foreground">{d.label}</span>
            <span className="ml-auto font-medium">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.won + d.lost + d.open), 1)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-1 h-32">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end gap-0.5" title={`${d.label}: Won ₹${d.won.toLocaleString()} / Lost ₹${d.lost.toLocaleString()} / Open ₹${d.open.toLocaleString()}`}>
            {d.won > 0 && <div className="rounded-t-sm" style={{ height: `${(d.won / max) * 112}px`, background: '#10b981' }} />}
            {d.lost > 0 && <div style={{ height: `${(d.lost / max) * 112}px`, background: '#ef4444' }} />}
            {d.open > 0 && <div style={{ height: `${(d.open / max) * 112}px`, background: '#f59e0b' }} />}
          </div>
        ))}
      </div>
      <div className="flex gap-1">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[10px] text-muted-foreground">{d.label}</div>
        ))}
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500" /> Won</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Lost</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Open</span>
      </div>
    </div>
  )
}

export default function Reports() {
  const [view, setView] = useState('all')

  const { data: leads = [], refetch: refetchLeads } = useQuery({ queryKey: ['leads-rpt'], queryFn: () => api.get('/api/leads') })
  const { data: deals = [], refetch: refetchDeals } = useQuery({ queryKey: ['deals-rpt'], queryFn: () => api.get('/api/deals') })
  const { data: contacts = [], refetch: refetchContacts } = useQuery({ queryKey: ['contacts-rpt'], queryFn: () => api.get('/api/contacts') })
  const { data: activities = [], refetch: refetchActivities } = useQuery({ queryKey: ['activities-rpt'], queryFn: () => api.get('/api/activities') })
  const { data: users = [] } = useQuery({ queryKey: ['users-rpt'], queryFn: () => api.get('/api/profiles') })

  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()

  const leadsThisMonth = leads.filter(l => {
    const d = new Date(l.created_at)
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear
  }).length

  const leadsLastMonth = leads.filter(l => {
    const d = new Date(l.created_at)
    const lm = thisMonth === 0 ? 11 : thisMonth - 1
    const ly = thisMonth === 0 ? thisYear - 1 : thisYear
    return d.getMonth() === lm && d.getFullYear() === ly
  }).length

  const pct = leadsLastMonth > 0 ? Math.round(((leadsThisMonth - leadsLastMonth) / leadsLastMonth) * 100) : 0

  const wonDeals = deals.filter(d => d.stage === 'Won')
  const revenue = wonDeals.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0)
  const pipeline = deals.filter(d => !['Won','Lost'].includes(d.stage)).length

  const contactsThisMonth = contacts.filter(c => {
    const d = new Date(c.created_at)
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear
  }).length

  // Leads by source
  const sourceMap = {}
  leads.forEach(l => {
    const src = l.source || 'Unknown'
    sourceMap[src] = (sourceMap[src] || 0) + 1
  })
  const sourceData = Object.entries(sourceMap).map(([label, value]) => ({ label, value }))

  // Revenue bar chart - last 6 months
  const barData = []
  for (let i = 5; i >= 0; i--) {
    const mo = (thisMonth - i + 12) % 12
    const yr = thisYear - (thisMonth - i < 0 ? 1 : 0)
    const monthDeals = deals.filter(d => {
      const cd = new Date(d.close_date || d.created_at)
      return cd.getMonth() === mo && cd.getFullYear() === yr
    })
    barData.push({
      label: MONTHS[mo],
      won: monthDeals.filter(d => d.stage === 'Won').reduce((s, d) => s + (parseFloat(d.amount) || 0), 0),
      lost: monthDeals.filter(d => d.stage === 'Lost').reduce((s, d) => s + (parseFloat(d.amount) || 0), 0),
      open: monthDeals.filter(d => !['Won','Lost'].includes(d.stage)).reduce((s, d) => s + (parseFloat(d.amount) || 0), 0),
    })
  }

  // Performance matrix - last 3 months
  const perfMonths = []
  for (let i = 2; i >= 0; i--) {
    const mo = (thisMonth - i + 12) % 12
    const yr = thisYear - (thisMonth - i < 0 ? 1 : 0)
    perfMonths.push({ label: MONTHS[mo], mo, yr })
  }

  const userPerf = users.map(u => {
    const name = u.full_name || u.email || 'User'
    return {
      name,
      months: perfMonths.map(({ mo, yr }) => ({
        leads: leads.filter(l => l.assigned_to === u.id && new Date(l.created_at).getMonth() === mo && new Date(l.created_at).getFullYear() === yr).length,
        deals: deals.filter(d => d.owner_id === u.id && new Date(d.created_at).getMonth() === mo && new Date(d.created_at).getFullYear() === yr).length,
      }))
    }
  })

  // Client revenue analysis
  const clientWon = {}, clientLost = {}, clientClosures = {}
  deals.forEach(d => {
    const name = d.contact_name || d.company_name || 'Unknown'
    if (d.stage === 'Won') {
      clientWon[name] = (clientWon[name] || 0) + (parseFloat(d.amount) || 0)
      clientClosures[name] = (clientClosures[name] || 0) + 1
    }
    if (d.stage === 'Lost') clientLost[name] = (clientLost[name] || 0) + (parseFloat(d.amount) || 0)
  })

  const sortedWon = Object.entries(clientWon).sort((a, b) => b[1] - a[1]).slice(0, 10)
  const sortedLost = Object.entries(clientLost).sort((a, b) => b[1] - a[1]).slice(0, 10)
  const sortedClosures = Object.entries(clientClosures).sort((a, b) => b[1] - a[1]).slice(0, 10)

  // User activity this month
  const userActivity = users.map(u => ({
    name: u.full_name || u.email,
    email: u.email,
    leads: leads.filter(l => l.assigned_to === u.id && new Date(l.created_at).getMonth() === thisMonth).length,
    deals: deals.filter(d => d.owner_id === u.id && new Date(d.created_at).getMonth() === thisMonth).length,
    activities: activities.filter(a => a.user_id === u.id && new Date(a.created_at).getMonth() === thisMonth).length,
  }))

  const handleRefresh = () => {
    refetchLeads(); refetchDeals(); refetchContacts(); refetchActivities()
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {[['all','All'],['org','☆ Org Overview'],['users','🌐 All Users']].map(([v, label]) => (
          <Button key={v} variant={view === v ? 'default' : 'outline'} size="sm" onClick={() => setView(v)}>{label}</Button>
        ))}
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={handleRefresh}><RefreshCw className="w-3.5 h-3.5 mr-1" />Refresh</Button>
        </div>
      </div>

      {/* All Users view */}
      {view === 'users' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wide text-muted-foreground">All Users — Activity This Month</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b">
                  <th className="text-left p-3 font-semibold">Name</th>
                  <th className="text-left p-3 font-semibold">Email</th>
                  <th className="text-center p-3 font-semibold">Leads</th>
                  <th className="text-center p-3 font-semibold">Deals</th>
                  <th className="text-center p-3 font-semibold">Activities</th>
                </tr></thead>
                <tbody>
                  {userActivity.map((u, i) => (
                    <tr key={i} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">{u.name}</td>
                      <td className="p-3 text-muted-foreground">{u.email}</td>
                      <td className="p-3 text-center">{u.leads}</td>
                      <td className="p-3 text-center">{u.deals}</td>
                      <td className="p-3 text-center">{u.activities}</td>
                    </tr>
                  ))}
                  {userActivity.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No users found</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Leads This Month</div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold">{leadsThisMonth}</span>
              <span className={`text-xs font-semibold ${pct >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {pct >= 0 ? '▲' : '▼'} {Math.abs(pct)}%
              </span>
            </div>
            <div className="text-xs text-muted-foreground">Last month: {leadsLastMonth}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Revenue (Won Deals)</div>
            <div className="flex items-center justify-center h-10 text-4xl">📥</div>
            <div className="text-xl font-bold text-center mt-1">₹{revenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Deals In Pipeline</div>
            <div className="text-3xl font-bold mb-1">{pipeline}</div>
            <div className="text-xs text-muted-foreground">Active open deals</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Contacts This Month</div>
            <div className="flex items-center justify-center h-10 text-4xl">📥</div>
            <div className="text-xl font-bold text-center mt-1">{contactsThisMonth}</div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Matrix + Leads by Source + Prolific Reps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Last 3 Months Performance</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[340px]">
                <thead><tr className="border-b bg-muted/30">
                  <th className="text-left p-3 font-semibold">Rep</th>
                  {perfMonths.map(m => <th key={m.label} className="text-center p-3 font-semibold">{m.label}</th>)}
                </tr></thead>
                <tbody>
                  {userPerf.map((u, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-3 font-medium truncate max-w-[100px]">{u.name}</td>
                      {u.months.map((m, j) => (
                        <td key={j} className="p-3 text-center">
                          <div>{m.leads}L</div>
                          <div className="text-muted-foreground">{m.deals}D</div>
                        </td>
                      ))}
                    </tr>
                  ))}
                  {userPerf.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No data</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Leads By Source</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <DonutChart data={sourceData} />
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Prolific Sales Reps</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {userPerf.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">No data</div>
            ) : (
              <div className="space-y-3">
                {userPerf
                  .map(u => ({ ...u, total: u.months.reduce((s, m) => s + m.leads + m.deals, 0) }))
                  .sort((a, b) => b.total - a.total)
                  .slice(0, 5)
                  .map((u, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{u.name}</div>
                        <div className="text-xs text-muted-foreground">{u.total} records</div>
                      </div>
                      <span className="text-xs font-semibold text-primary">#{i + 1}</span>
                    </div>
                  ))
                }
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Target Bar Chart */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center">
            <CardTitle className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Revenue Target – Last 6 Months</CardTitle>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={handleRefresh}><RefreshCw className="w-3.5 h-3.5" /></Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <BarChart data={barData} />
        </CardContent>
      </Card>

      {/* Client Revenue Analysis */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-violet-500" />
          <span className="text-sm font-bold">Client Revenue Analysis</span>
          <span className="text-xs text-muted-foreground font-medium">All time</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="overflow-hidden">
            <div className="p-3 border-b flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-full px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-300">
                <span className="w-2 h-2 rounded-full bg-green-600" /> Revenue Won
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {sortedWon.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground text-center">No data</div>
              ) : sortedWon.map(([name, amt], i) => (
                <div key={i} className="flex items-center justify-between p-3 border-b last:border-0 hover:bg-muted/30">
                  <span className="text-sm truncate">{name}</span>
                  <span className="text-sm font-semibold text-green-600 ml-2">₹{amt.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="overflow-hidden">
            <div className="p-3 border-b">
              <span className="inline-flex items-center gap-1.5 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-full px-3 py-1 text-xs font-semibold text-red-700 dark:text-red-300">
                <span className="w-2 h-2 rounded-full bg-red-600" /> Revenue Lost
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {sortedLost.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground text-center">No data</div>
              ) : sortedLost.map(([name, amt], i) => (
                <div key={i} className="flex items-center justify-between p-3 border-b last:border-0 hover:bg-muted/30">
                  <span className="text-sm truncate">{name}</span>
                  <span className="text-sm font-semibold text-red-600 ml-2">₹{amt.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="overflow-hidden">
            <div className="p-3 border-b">
              <span className="inline-flex items-center gap-1.5 bg-violet-50 dark:bg-violet-950 border border-violet-200 dark:border-violet-800 rounded-full px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
                <span className="w-2 h-2 rounded-full bg-violet-600" /> Closures (Won Deals)
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {sortedClosures.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground text-center">No data</div>
              ) : sortedClosures.map(([name, count], i) => (
                <div key={i} className="flex items-center justify-between p-3 border-b last:border-0 hover:bg-muted/30">
                  <span className="text-sm truncate">{name}</span>
                  <span className="text-sm font-semibold text-violet-600 ml-2">{count} deals</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
