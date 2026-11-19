import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { api } from '@/lib/api'
import { generateId } from '@/lib/utils'

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'industry', label: 'Industry' },
  { key: 'website', label: 'Website', render: (v) => v ? <a href={v} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate max-w-[180px] block">{v}</a> : '—' },
  { key: 'phone', label: 'Phone' },
  { key: 'city', label: 'City' },
  { key: 'employees', label: 'Employees' },
]

const empty = { name: '', industry: '', website: '', phone: '', city: '', state: '', country: '', employees: '', notes: '' }

export function Companies() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)

  const { data = [], isLoading } = useQuery({ queryKey: ['companies'], queryFn: () => api.get('/api/companies') })

  const save = useMutation({
    mutationFn: (d) => editing
      ? api.put(`/api/companies/${editing.id}`, d)
      : api.post('/api/companies', { ...d, id: generateId() }),
    onSuccess: () => { qc.invalidateQueries(['companies']); close() },
  })

  const remove = useMutation({
    mutationFn: (id) => api.delete(`/api/companies/${id}`),
    onSuccess: () => qc.invalidateQueries(['companies']),
  })

  const close = () => { setOpen(false); setEditing(null); setForm(empty) }

  return (
    <>
      <DataTable
        data={data} columns={columns}
        onAdd={() => setOpen(true)}
        onEdit={(row) => { setEditing(row); setForm({ ...row }); setOpen(true) }}
        onDelete={(row) => { if (confirm(`Delete company "${row.name}"?`)) remove.mutate(row.id) }}
        searchFields={['name', 'industry', 'city']}
        title="Companies" isLoading={isLoading}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) close() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Company' : 'New Company'}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(form) }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['name', 'Company Name', true],
                ['industry', 'Industry'],
                ['website', 'Website'],
                ['phone', 'Phone'],
                ['city', 'City'],
                ['state', 'State'],
                ['country', 'Country'],
                ['employees', 'Employees'],
              ].map(([field, label, req]) => (
                <div key={field} className="space-y-1.5">
                  <Label>{label}{req ? ' *' : ''}</Label>
                  <Input value={form[field] || ''} onChange={(e) => setForm({ ...form, [field]: e.target.value })} required={!!req} />
                </div>
              ))}
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
