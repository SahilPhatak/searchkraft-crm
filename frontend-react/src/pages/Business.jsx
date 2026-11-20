import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { api } from '@/lib/api'
import { generateId, formatDate } from '@/lib/utils'
import { TrendingUp, Users, CheckCircle, AlertCircle } from 'lucide-react'

const statuses = ['active', 'inactive', 'pending', 'churned']
const statusColors = { active: 'success', inactive: 'secondary', pending: 'warning', churned: 'destructive' }

const columns = [
  { key: 'business_name', label: 'Business' },
  { key: 'owner_name', label: 'Owner' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'revenue', label: 'Revenue', render: (v) => v ? `₹${parseFloat(v).toLocaleString()}` : '—' },
  { key: 'status', label: 'Status', render: (v) => <Badge variant={statusColors[v] || 'secondary'} className="capitalize text-xs">{v}</Badge> },
  { key: 'onboarded_date', label: 'Onboarded', render: (v) => formatDate(v) },
]

const empty = { business_name: '', owner_name: '', email: '', phone: '', status: 'active', onboarded_date: '', revenue: '', notes: '' }

export function Business() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)

  const { data = [], isLoading } = useQuery({
    queryKey: ['business_onboarded'],
    queryFn: () => api.get('/api/business-onboarded'),
  })

  const save = useMutation({
    mutationFn: (d) => editing
      ? api.put(`/api/business-onboarded/${editing.id}`, d)
      : api.post('/api/business-onboarded', { ...d, id: generateId() }),
    onSuccess: () => { qc.invalidateQueries(['business_onboarded']); close() },
  })

  const remove = useMutation({
    mutationFn: (id) => api.delete(`/api/business-onboarded/${id}`),
    onSuccess: () => qc.invalidateQueries(['business_onboarded']),
  })

  const close = () => { setOpen(false); setEditing(null); setForm(empty) }

  // KPI calculations
  const active = data.filter(b => b.status === 'active')
  const inactive = data.filter(b => b.status === 'inactive')
  const churned = data.filter(b => b.status === 'churned')
  const totalRevenue = data.reduce((s, b) => s + (parseFloat(b.revenue) || 0), 0)
  const activeRevenue = active.reduce((s, b) => s + (parseFloat(b.revenue) || 0), 0)

  const now = new Date()
  const thisMonth = data.filter(b => {
    const d = new Date(b.onboarded_date || b.created_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const kpis = [
    { label: 'Total Onboarded', value: data.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
    { label: 'Active Businesses', value: active.length, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
    { label: 'Churned', value: churned.length, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950' },
    { label: 'Onboarded This Month', value: thisMonth, icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
  ]

  return (
    <div className="p-6 space-y-5">
      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k, i) => {
          const Icon = k.icon
          return (
            <Card key={i}>
              <CardContent className="p-4">
                <div className={`w-9 h-9 rounded-lg ${k.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4.5 h-4.5 ${k.color}`} />
                </div>
                <div className="text-2xl font-bold">{k.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{k.label}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Revenue summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Revenue (All)</div>
            <div className="text-2xl font-bold text-foreground">₹{totalRevenue.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">{data.length} businesses</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Active Revenue</div>
            <div className="text-2xl font-bold text-green-600">₹{activeRevenue.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">{active.length} active businesses</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <DataTable
        data={data} columns={columns}
        onAdd={() => setOpen(true)}
        onEdit={(row) => { setEditing(row); setForm({ ...row }); setOpen(true) }}
        onDelete={(row) => { if (confirm(`Remove "${row.business_name}"?`)) remove.mutate(row.id) }}
        searchFields={['business_name', 'owner_name', 'email']}
        title="Business Onboarded" isLoading={isLoading}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) close() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Business' : 'Onboard Business'}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(form) }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Business Name *</Label>
                <Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} required />
              </div>
              {[['owner_name', 'Owner Name'], ['email', 'Email'], ['phone', 'Phone']].map(([f, l]) => (
                <div key={f} className="space-y-1.5">
                  <Label>{l}</Label>
                  <Input value={form[f] || ''} onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
                </div>
              ))}
              <div className="space-y-1.5">
                <Label>Revenue (₹)</Label>
                <Input type="number" value={form.revenue || ''} onChange={(e) => setForm({ ...form, revenue: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Onboarded Date</Label>
                <Input type="date" value={form.onboarded_date || ''} onChange={(e) => setForm({ ...form, onboarded_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>Cancel</Button>
              <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
