import { useState, useRef } from 'react'
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
import { LayoutList, Columns, Building2, DollarSign, Calendar } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

const stageOptions = ['Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost']
const priorityOptions = ['low', 'medium', 'high']

const stageColors = {
  Qualification: 'bg-blue-500', Proposal: 'bg-purple-500', Negotiation: 'bg-yellow-500',
  Won: 'bg-green-500', Lost: 'bg-red-500',
}

const stageBadge = { Qualification: 'info', Proposal: 'secondary', Negotiation: 'warning', Won: 'success', Lost: 'destructive' }

const columns = [
  { key: 'title', label: 'Deal Name' },
  { key: 'contact_name', label: 'Contact' },
  { key: 'company_name', label: 'Company' },
  { key: 'amount', label: 'Amount', render: v => v ? `₹${parseFloat(v).toLocaleString()}` : '—' },
  { key: 'stage', label: 'Stage', render: v => <Badge variant={stageBadge[v] || 'secondary'}>{v}</Badge> },
  { key: 'probability', label: 'Probability', render: v => v != null ? `${v}%` : '—' },
  { key: 'close_date', label: 'Close Date', render: v => formatDate(v) },
]

function DealForm({ deal, onSave, onClose }) {
  const [form, setForm] = useState(deal || { title: '', contact_name: '', company_name: '', amount: '', stage: 'Qualification', probability: '', close_date: '', notes: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><Label>Deal Name *</Label><Input value={form.title} onChange={e => set('title', e.target.value)} /></div>
        <div><Label>Contact Name</Label><Input value={form.contact_name || ''} onChange={e => set('contact_name', e.target.value)} /></div>
        <div><Label>Company</Label><Input value={form.company_name || ''} onChange={e => set('company_name', e.target.value)} /></div>
        <div><Label>Amount (₹)</Label><Input type="number" value={form.amount || ''} onChange={e => set('amount', e.target.value)} /></div>
        <div>
          <Label>Stage</Label>
          <Select value={form.stage} onValueChange={v => set('stage', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{stageOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Probability (%)</Label><Input type="number" min="0" max="100" value={form.probability || ''} onChange={e => set('probability', e.target.value)} /></div>
        <div><Label>Close Date</Label><Input type="date" value={form.close_date || ''} onChange={e => set('close_date', e.target.value)} /></div>
      </div>
      <div><Label>Notes</Label><textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} className="w-full border rounded-md p-2 text-sm min-h-[80px] bg-background" /></div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(form)} disabled={!form.title}>Save Deal</Button>
      </DialogFooter>
    </div>
  )
}

function KanbanCard({ deal, onEdit, onDelete, onDragStart }) {
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, deal.id)}
      className="bg-background border rounded-lg p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow space-y-2"
    >
      <div className="font-medium text-sm leading-tight">{deal.title}</div>
      {deal.company_name && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Building2 className="w-3 h-3" />{deal.company_name}</div>}
      {deal.amount && (
        <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
          <DollarSign className="w-3.5 h-3.5" />₹{parseFloat(deal.amount).toLocaleString()}
        </div>
      )}
      {deal.close_date && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="w-3 h-3" />{formatDate(deal.close_date)}</div>}
      {deal.probability != null && (
        <div className="mt-1">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
            <span>Probability</span><span>{deal.probability}%</span>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${deal.probability}%` }} />
          </div>
        </div>
      )}
      <div className="flex justify-between items-center pt-1">
        <span className="text-[10px] text-muted-foreground">{deal.contact_name || ''}</span>
        <div className="flex gap-1">
          <button onClick={() => onEdit(deal)} className="text-[10px] text-primary hover:underline">Edit</button>
          <span className="text-muted-foreground text-[10px]">·</span>
          <button onClick={() => onDelete(deal.id)} className="text-[10px] text-red-500 hover:underline">Del</button>
        </div>
      </div>
    </div>
  )
}

function KanbanBoard({ deals, onEdit, onDelete, onStageChange }) {
  const dragDealId = useRef(null)
  const [dragOver, setDragOver] = useState(null)
  const handleDragStart = (e, id) => { dragDealId.current = id; e.dataTransfer.effectAllowed = 'move' }
  const handleDrop = (e, stage) => {
    e.preventDefault()
    if (dragDealId.current) onStageChange(dragDealId.current, stage)
    dragDealId.current = null; setDragOver(null)
  }
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-[500px]">
      {stageOptions.map(stage => {
        const col = deals.filter(d => (d.stage || 'Qualification') === stage)
        const colValue = col.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0)
        return (
          <div key={stage} className={`flex-shrink-0 w-56 flex flex-col rounded-xl transition-colors ${dragOver === stage ? 'ring-2 ring-primary ring-offset-1' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(stage) }}
            onDrop={e => handleDrop(e, stage)}
            onDragLeave={() => setDragOver(null)}>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-t-xl bg-muted/50 border border-b-0">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${stageColors[stage]}`} />
              <span className="text-xs font-semibold">{stage}</span>
              <span className="ml-auto text-xs text-muted-foreground font-medium">{col.length}</span>
            </div>
            {colValue > 0 && (
              <div className="px-3 py-1 bg-muted/30 border-x text-xs font-medium text-green-600">₹{colValue.toLocaleString()}</div>
            )}
            <div className="flex-1 p-2 space-y-2 bg-muted/20 border rounded-b-xl min-h-[100px]">
              {col.map(deal => (
                <KanbanCard key={deal.id} deal={deal} onEdit={onEdit} onDelete={onDelete} onDragStart={handleDragStart} />
              ))}
              {col.length === 0 && (
                <div className="h-20 flex items-center justify-center text-xs text-muted-foreground/50 border-2 border-dashed rounded-lg">Drop here</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function Deals() {
  const [viewMode, setViewMode] = useState('list')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data: deals = [], isLoading } = useQuery({ queryKey: ['deals'], queryFn: () => api.get('/api/deals') })

  const saveMutation = useMutation({
    mutationFn: (data) => data.id ? api.put(`/api/deals/${data.id}`, data) : api.post('/api/deals', { ...data, id: generateId() }),
    onSuccess: () => { qc.invalidateQueries(['deals']); setModalOpen(false); setEditing(null); toast({ title: editing ? 'Deal updated' : 'Deal created' }) },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/deals/${id}`),
    onSuccess: () => { qc.invalidateQueries(['deals']); toast({ title: 'Deal deleted' }) },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const stageMutation = useMutation({
    mutationFn: ({ id, stage }) => api.put(`/api/deals/${id}`, { stage }),
    onSuccess: () => { qc.invalidateQueries(['deals']); toast({ title: 'Deal stage updated' }) },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const handleEdit = (deal) => { setEditing(deal); setModalOpen(true) }
  const handleDelete = (id) => { if (confirm('Delete this deal?')) deleteMutation.mutate(id) }
  const handleStageChange = (id, stage) => stageMutation.mutate({ id, stage })

  const pipelineValue = deals.filter(d => !['Won', 'Lost'].includes(d.stage)).reduce((s, d) => s + (parseFloat(d.amount) || 0), 0)
  const wonValue = deals.filter(d => d.stage === 'Won').reduce((s, d) => s + (parseFloat(d.amount) || 0), 0)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-bold">Deals</h1>
          <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
            <span>Pipeline: <span className="font-semibold text-foreground">₹{pipelineValue.toLocaleString()}</span></span>
            <span>Won: <span className="font-semibold text-green-600">₹{wonValue.toLocaleString()}</span></span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
              <LayoutList className="w-3.5 h-3.5" /> List
            </button>
            <button onClick={() => setViewMode('kanban')} className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${viewMode === 'kanban' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
              <Columns className="w-3.5 h-3.5" /> Kanban
            </button>
          </div>
          <Button onClick={() => { setEditing(null); setModalOpen(true) }}>+ Add Deal</Button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <DataTable
          data={deals}
          columns={columns}
          onAdd={() => { setEditing(null); setModalOpen(true) }}
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchFields={['title', 'contact_name', 'company_name']}
          isLoading={isLoading}
          hideHeader
        />
      ) : (
        <KanbanBoard deals={deals} onEdit={handleEdit} onDelete={handleDelete} onStageChange={handleStageChange} />
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Edit Deal' : 'Add Deal'}</DialogTitle></DialogHeader>
          <DealForm deal={editing} onSave={(data) => saveMutation.mutate(data)} onClose={() => setModalOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
