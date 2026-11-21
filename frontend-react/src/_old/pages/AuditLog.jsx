import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Shield, RefreshCw, Search, Filter } from 'lucide-react'

const ACTION_COLORS = {
  create: 'success', update: 'info', delete: 'destructive',
  login: 'secondary', logout: 'secondary', view: 'outline',
}

export default function AuditLog() {
  const { profile } = useAuthStore()
  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner'
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [page, setPage] = useState(1)
  const PER_PAGE = 25

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['audit'],
    queryFn: () => api.get('/api/audit'),
    refetchInterval: 30000,
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users-audit'],
    queryFn: () => api.get('/api/profiles'),
  })

  const userMap = {}
  users.forEach(u => { userMap[u.id] = u.full_name || u.email || u.id })

  const modules = [...new Set(logs.map(l => l.module).filter(Boolean))]
  const actions = [...new Set(logs.map(l => l.action).filter(Boolean))]

  const filtered = logs.filter(l => {
    if (moduleFilter !== 'all' && l.module !== moduleFilter) return false
    if (actionFilter !== 'all' && l.action !== actionFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (l.module || '').toLowerCase().includes(q)
        || (l.action || '').toLowerCase().includes(q)
        || (l.record_id || '').toLowerCase().includes(q)
        || (userMap[l.user_id] || '').toLowerCase().includes(q)
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div className="p-6 space-y-4">
      {isAdmin && (
        <div className="rounded-xl p-4 flex items-center gap-4 text-white" style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)' }}>
          <span className="text-2xl">🔐</span>
          <div className="flex-1">
            <div className="font-bold">Super Admin — Activity Monitor</div>
            <div className="text-sm opacity-80 mt-0.5">You can see all user actions. Assign roles in Setup → Users.</div>
          </div>
          <Button variant="ghost" size="sm" className="text-white border-white/40 hover:bg-white/20 hover:text-white" onClick={() => window.location.href = '/setup'}>
            Manage Users →
          </Button>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle>System Audit Log</CardTitle>
            <span className="text-xs text-muted-foreground">Session activity · refreshes every 30s</span>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="w-3.5 h-3.5 mr-1" />Refresh</Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input className="pl-9 h-8 text-sm" placeholder="Search logs…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
            </div>
            <Select value={moduleFilter} onValueChange={v => { setModuleFilter(v); setPage(1) }}>
              <SelectTrigger className="h-8 w-36 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                {modules.map(m => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={v => { setActionFilter(v); setPage(1) }}>
              <SelectTrigger className="h-8 w-32 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actions.map(a => <SelectItem key={a} value={a} className="capitalize">{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/30">
                <th className="text-left p-3 font-semibold">Timestamp</th>
                <th className="text-left p-3 font-semibold">User</th>
                <th className="text-left p-3 font-semibold">Action</th>
                <th className="text-left p-3 font-semibold">Module</th>
                <th className="text-left p-3 font-semibold">Record</th>
                <th className="text-left p-3 font-semibold">Details</th>
              </tr></thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
                )}
                {!isLoading && paginated.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No audit logs found</td></tr>
                )}
                {paginated.map((log, i) => (
                  <tr key={log.id || i} className="border-b hover:bg-muted/20">
                    <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                    </td>
                    <td className="p-3">
                      <div className="text-sm font-medium">{userMap[log.user_id] || log.user_id || '—'}</div>
                    </td>
                    <td className="p-3">
                      <Badge variant={ACTION_COLORS[log.action] || 'outline'} className="capitalize text-xs">{log.action || '—'}</Badge>
                    </td>
                    <td className="p-3 capitalize">{log.module || '—'}</td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{log.record_id ? log.record_id.slice(0, 8) + '…' : '—'}</td>
                    <td className="p-3 text-xs text-muted-foreground max-w-[200px] truncate">
                      {log.details ? (typeof log.details === 'object' ? JSON.stringify(log.details) : log.details) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t">
              <span className="text-xs text-muted-foreground">Showing {((page-1)*PER_PAGE)+1}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
