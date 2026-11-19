import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { api } from '@/lib/api'
import { generateId, formatDate } from '@/lib/utils'

const statusOptions = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
const sourceOptions = ['website', 'referral', 'social_media', 'cold_call', 'email', 'event', 'other']

const statusColors = {
  new: 'info', contacted: 'secondary', qualified: 'warning',
  proposal: 'secondary', negotiation: 'warning', won: 'success', lost: 'destructive',
}

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'company', label: 'Company' },
  {
    key: 'status', label: 'Status',
    render: (v) => <Badge variant={statusColors[v] || 'secondary'} className="capitalize">{v}</Badge>,
  },
  { key: 'source', label: 'Source', render: (v) => v ? <span className="capitalize">{v?.replace(/_/g, ' ')}</span> : '—' },
  { key: 'created_at', label: 'Created', render: (v) => formatDate(v) },
]

const empty = { name: '', email: '', phone: '', company: '', status: 'new', source: '', notes: '' }

export function Leads() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)

  const { data = [], isLoading } = useQuery({ queryKey: ['leads'], queryFn: () => api.get('/api/leads') })

  const save = useMutation({
    mutationFn: (data) => editing
      ? api.put(`/api/leads/${editing.id}`, data)
      : api.post('/api/leads', { ...data, id: generateId() }),
    onSuccess: () => { qc.invalidateQueries(['leads']); close() },
  })

  const remove = useMutation({
    mutationFn: (id) => api.delete(`/api/leads/${id}`),
    onSuccess: () => qc.invalidateQueries(['leads']),
  })

  const close = () => { setOpen(false); setEditing(null); setForm(empty) }

  const handleEdit = (row) => { setEditing(row); setForm({ ...row }); setOpen(true) }

  const handleDelete = (row) => {
    if (confirm(`Delete lead "${row.name}"?`)) remove.mutate(row.id)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    save.mutate(form)
  }

  return (
    <>
      <DataTable
        data={data}
        columns={columns}
        onAdd={() => setOpen(true)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchFields={['name', 'email', 'company', 'phone']}
        title="Leads"
        isLoading={isLoading}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) close() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Lead' : 'New Lead'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Company</Label>
                <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Source</Label>
                <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                  <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                  <SelectContent>
                    {sourceOptions.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>Cancel</Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
