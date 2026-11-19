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

const priorities = ['low', 'medium', 'high', 'urgent']
const statuses = ['pending', 'in_progress', 'completed', 'cancelled']
const priorityColors = { low: 'info', medium: 'warning', high: 'destructive', urgent: 'destructive' }
const statusColors = { pending: 'secondary', in_progress: 'info', completed: 'success', cancelled: 'outline' }

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'priority', label: 'Priority', render: (v) => <Badge variant={priorityColors[v]} className="capitalize text-xs">{v}</Badge> },
  { key: 'status', label: 'Status', render: (v) => <Badge variant={statusColors[v]} className="capitalize text-xs">{v?.replace(/_/g, ' ')}</Badge> },
  { key: 'due_date', label: 'Due Date', render: (v) => formatDate(v) },
  { key: 'assigned_to', label: 'Assigned To' },
]

const empty = { title: '', priority: 'medium', status: 'pending', due_date: '', assigned_to: '', description: '' }

export function Tasks() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)

  const { data = [], isLoading } = useQuery({ queryKey: ['tasks'], queryFn: () => api.get('/api/tasks') })

  const save = useMutation({
    mutationFn: (d) => editing
      ? api.put(`/api/tasks/${editing.id}`, d)
      : api.post('/api/tasks', { ...d, id: generateId() }),
    onSuccess: () => { qc.invalidateQueries(['tasks']); close() },
  })

  const remove = useMutation({
    mutationFn: (id) => api.delete(`/api/tasks/${id}`),
    onSuccess: () => qc.invalidateQueries(['tasks']),
  })

  const close = () => { setOpen(false); setEditing(null); setForm(empty) }

  return (
    <>
      <DataTable
        data={data} columns={columns}
        onAdd={() => setOpen(true)}
        onEdit={(row) => { setEditing(row); setForm({ ...row }); setOpen(true) }}
        onDelete={(row) => { if (confirm(`Delete task "${row.title}"?`)) remove.mutate(row.id) }}
        searchFields={['title', 'assigned_to']}
        title="Tasks" isLoading={isLoading}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) close() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Task' : 'New Task'}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(form) }} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Due Date</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Assigned To</Label>
                <Input value={form.assigned_to || ''} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>Cancel</Button>
              <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
