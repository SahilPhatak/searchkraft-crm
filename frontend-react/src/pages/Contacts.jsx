import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { api } from '@/lib/api'
import { generateId, formatDate } from '@/lib/utils'

const columns = [
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'company', label: 'Company' },
  { key: 'job_title', label: 'Job Title' },
  { key: 'created_at', label: 'Created', render: (v) => formatDate(v) },
]

const empty = { first_name: '', last_name: '', email: '', phone: '', company: '', job_title: '', notes: '' }

export function Contacts() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)

  const { data = [], isLoading } = useQuery({ queryKey: ['contacts'], queryFn: () => api.get('/api/contacts') })

  const save = useMutation({
    mutationFn: (data) => editing
      ? api.put(`/api/contacts/${editing.id}`, data)
      : api.post('/api/contacts', { ...data, id: generateId() }),
    onSuccess: () => { qc.invalidateQueries(['contacts']); close() },
  })

  const remove = useMutation({
    mutationFn: (id) => api.delete(`/api/contacts/${id}`),
    onSuccess: () => qc.invalidateQueries(['contacts']),
  })

  const close = () => { setOpen(false); setEditing(null); setForm(empty) }

  return (
    <>
      <DataTable
        data={data}
        columns={columns}
        onAdd={() => setOpen(true)}
        onEdit={(row) => { setEditing(row); setForm({ ...row }); setOpen(true) }}
        onDelete={(row) => { if (confirm(`Delete "${row.first_name} ${row.last_name}"?`)) remove.mutate(row.id) }}
        searchFields={['first_name', 'last_name', 'email', 'company']}
        title="Contacts"
        isLoading={isLoading}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) close() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Contact' : 'New Contact'}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(form) }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['first_name', 'First Name', 'text', true],
                ['last_name', 'Last Name', 'text', false],
                ['email', 'Email', 'email', false],
                ['phone', 'Phone', 'text', false],
                ['company', 'Company', 'text', false],
                ['job_title', 'Job Title', 'text', false],
              ].map(([field, label, type, required]) => (
                <div key={field} className="space-y-1.5">
                  <Label>{label}{required ? ' *' : ''}</Label>
                  <Input
                    type={type}
                    value={form[field]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    required={required}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.notes || ''}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
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
