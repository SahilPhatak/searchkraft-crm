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

const types = ['proposal', 'contract', 'invoice', 'report', 'presentation', 'other']

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type', render: (v) => <Badge variant="secondary" className="capitalize text-xs">{v}</Badge> },
  { key: 'file_url', label: 'File', render: (v) => v ? <a href={v} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs">View</a> : '—' },
  { key: 'created_at', label: 'Created', render: (v) => formatDate(v) },
]

const empty = { name: '', type: 'proposal', file_url: '', description: '' }

export function Documents() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)

  const { data = [], isLoading } = useQuery({ queryKey: ['documents'], queryFn: () => api.get('/api/documents') })

  const save = useMutation({
    mutationFn: (d) => editing
      ? api.put(`/api/documents/${editing.id}`, d)
      : api.post('/api/documents', { ...d, id: generateId() }),
    onSuccess: () => { qc.invalidateQueries(['documents']); close() },
  })

  const remove = useMutation({
    mutationFn: (id) => api.delete(`/api/documents/${id}`),
    onSuccess: () => qc.invalidateQueries(['documents']),
  })

  const close = () => { setOpen(false); setEditing(null); setForm(empty) }

  return (
    <>
      <DataTable
        data={data} columns={columns}
        onAdd={() => setOpen(true)}
        onEdit={(row) => { setEditing(row); setForm({ ...row }); setOpen(true) }}
        onDelete={(row) => { if (confirm(`Delete document "${row.name}"?`)) remove.mutate(row.id) }}
        searchFields={['name']}
        title="Documents" isLoading={isLoading}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) close() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Document' : 'New Document'}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(form) }} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
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
              <Label>File URL</Label>
              <Input type="url" value={form.file_url || ''} onChange={(e) => setForm({ ...form, file_url: e.target.value })} placeholder="https://..." />
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
