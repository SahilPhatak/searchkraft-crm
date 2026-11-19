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
import { generateId, formatCurrency, formatDate } from '@/lib/utils'

const stages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost']
const stageColors = { prospecting: 'info', qualification: 'secondary', proposal: 'warning', negotiation: 'warning', closed_won: 'success', closed_lost: 'destructive' }

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'amount', label: 'Amount', render: (v) => formatCurrency(v) },
  { key: 'stage', label: 'Stage', render: (v) => <Badge variant={stageColors[v] || 'secondary'} className="capitalize text-xs">{v?.replace(/_/g, ' ')}</Badge> },
  { key: 'close_date', label: 'Close Date', render: (v) => formatDate(v) },
  { key: 'probability', label: 'Prob.', render: (v) => v != null ? `${v}%` : '—' },
]

const empty = { title: '', amount: '', stage: 'prospecting', close_date: '', probability: '', notes: '' }

export function Deals() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)

  const { data = [], isLoading } = useQuery({ queryKey: ['deals'], queryFn: () => api.get('/api/deals') })

  const save = useMutation({
    mutationFn: (d) => editing
      ? api.put(`/api/deals/${editing.id}`, d)
      : api.post('/api/deals', { ...d, id: generateId() }),
    onSuccess: () => { qc.invalidateQueries(['deals']); close() },
  })

  const remove = useMutation({
    mutationFn: (id) => api.delete(`/api/deals/${id}`),
    onSuccess: () => qc.invalidateQueries(['deals']),
  })

  const close = () => { setOpen(false); setEditing(null); setForm(empty) }

  return (
    <>
      <DataTable
        data={data} columns={columns}
        onAdd={() => setOpen(true)}
        onEdit={(row) => { setEditing(row); setForm({ ...row }); setOpen(true) }}
        onDelete={(row) => { if (confirm(`Delete deal "${row.title}"?`)) remove.mutate(row.id) }}
        searchFields={['title']}
        title="Deals" isLoading={isLoading}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) close() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Deal' : 'New Deal'}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(form) }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Amount</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Probability (%)</Label>
                <Input type="number" min="0" max="100" value={form.probability} onChange={(e) => setForm({ ...form, probability: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Stage</Label>
                <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {stages.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Close Date</Label>
                <Input type="date" value={form.close_date} onChange={(e) => setForm({ ...form, close_date: e.target.value })} />
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
