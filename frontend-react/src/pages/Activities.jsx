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

const types = ['call', 'email', 'meeting', 'task', 'note', 'other']
const typeColors = { call: 'info', email: 'secondary', meeting: 'warning', task: 'success', note: 'outline', other: 'secondary' }

const columns = [
  { key: 'type', label: 'Type', render: (v) => <Badge variant={typeColors[v]} className="capitalize text-xs">{v}</Badge> },
  { key: 'subject', label: 'Subject' },
  { key: 'contact_name', label: 'Contact' },
  { key: 'activity_date', label: 'Date', render: (v) => formatDate(v) },
  { key: 'duration_minutes', label: 'Duration', render: (v) => v ? `${v} min` : '—' },
]

const empty = { type: 'call', subject: '', contact_name: '', activity_date: '', duration_minutes: '', notes: '' }

export function Activities() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)

  const { data = [], isLoading } = useQuery({ queryKey: ['activities'], queryFn: () => api.get('/api/activities') })

  const save = useMutation({
    mutationFn: (d) => editing
      ? api.put(`/api/activities/${editing.id}`, d)
      : api.post('/api/activities', { ...d, id: generateId() }),
    onSuccess: () => { qc.invalidateQueries(['activities']); close() },
  })

  const remove = useMutation({
    mutationFn: (id) => api.delete(`/api/activities/${id}`),
    onSuccess: () => qc.invalidateQueries(['activities']),
  })

  const close = () => { setOpen(false); setEditing(null); setForm(empty) }

  return (
    <>
      <DataTable
        data={data} columns={columns}
        onAdd={() => setOpen(true)}
        onEdit={(row) => { setEditing(row); setForm({ ...row }); setOpen(true) }}
        onDelete={(row) => { if (confirm(`Delete activity?`)) remove.mutate(row.id) }}
        searchFields={['subject', 'contact_name']}
        title="Activities" isLoading={isLoading}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) close() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Activity' : 'Log Activity'}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(form) }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {types.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={form.activity_date} onChange={(e) => setForm({ ...form, activity_date: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Subject *</Label>
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Contact</Label>
                <Input value={form.contact_name || ''} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Duration (min)</Label>
                <Input type="number" value={form.duration_minutes || ''} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} />
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
    </>
  )
}
