import { useQuery } from '@tanstack/react-query'
import { Users, Building2, CheckSquare, TrendingUp, Clock, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'

function StatCard({ title, value, icon: Icon, description, color = 'blue' }) {
  const colorMap = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50',
    orange: 'text-orange-600 bg-orange-50',
  }
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function Dashboard() {
  const { data: leads = [] } = useQuery({ queryKey: ['leads'], queryFn: () => api.get('/api/leads') })
  const { data: contacts = [] } = useQuery({ queryKey: ['contacts'], queryFn: () => api.get('/api/contacts') })
  const { data: deals = [] } = useQuery({ queryKey: ['deals'], queryFn: () => api.get('/api/deals') })
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => api.get('/api/tasks') })
  const { data: business = [] } = useQuery({ queryKey: ['business_onboarded'], queryFn: () => api.get('/api/business-onboarded') })

  const openDeals = deals.filter((d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost')
  const totalDealValue = openDeals.reduce((sum, d) => sum + (d.amount || 0), 0)
  const pendingTasks = tasks.filter((t) => t.status !== 'completed')
  const newLeads = leads.filter((l) => l.status === 'new').length
  const recentLeads = [...leads].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)
  const upcomingTasks = [...tasks]
    .filter((t) => t.status !== 'completed')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Leads" value={leads.length} icon={Users} description={`${newLeads} new`} color="blue" />
        <StatCard title="Contacts" value={contacts.length} icon={Building2} color="green" />
        <StatCard title="Open Deals" value={openDeals.length} icon={TrendingUp} description={formatCurrency(totalDealValue)} color="purple" />
        <StatCard title="Pending Tasks" value={pendingTasks.length} icon={CheckSquare} color="orange" />
      </div>

      {/* Total Positions card */}
      {business.length > 0 && (() => {
        const active = business.filter(b => b.status === 'active').length
        const hold = business.filter(b => b.status === 'inactive' || b.status === 'pending').length
        const churned = business.filter(b => b.status === 'churned').length
        return (
          <Card className="border-l-4 border-l-teal-500">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Total Positions</p>
                  <p className="text-4xl font-bold text-teal-600">{business.length}</p>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{active}</p>
                    <p className="text-xs text-muted-foreground">active</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{hold}</p>
                    <p className="text-xs text-muted-foreground">hold</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-500">{churned}</p>
                    <p className="text-xs text-muted-foreground">churned</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })()}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" /> Recent Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground">No leads yet</p>
            ) : (
              <div className="space-y-3">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.company || lead.email}</p>
                    </div>
                    <Badge variant={lead.status === 'new' ? 'info' : 'secondary'} className="text-xs">
                      {lead.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" /> Upcoming Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending tasks</p>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between">
                    <div className="flex items-start gap-2">
                      <AlertCircle className={`h-4 w-4 mt-0.5 shrink-0 ${
                        task.priority === 'high' ? 'text-red-500' :
                        task.priority === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(task.due_date)}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
