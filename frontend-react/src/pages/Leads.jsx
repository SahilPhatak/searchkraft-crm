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
import { LayoutList, Columns, GripVertical, Phone, Mail, Building2, Calendar, ChevronRight } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

const statusOptions = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
const sourceOptions = ['website', 'referral', 'social_media', 'cold_call', 'email', 'event', 'other']

const statusColors = {
  new: 'info', contacted: 'secondary', qualified: 'warning',
  proposal: 'secondary', negotiation: 'warning', won: 'success', lost: 'destructive',
}

const kanbanColors = {
  new: 'bg-blue-500', contacted: 'bg-purple-500', qualified: 'bg-yellow-500',
  proposal: 'bg-orange-500', negotiation: 'bg-pink-500', won: 'bg-green-500', lost: 'bg-red-500',
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

function LeadForm({ lead, onSave, onClose }) {
  const [form, setForm] = useState(lead || { name: '', email: '', phone: '', company: '', status: 'new', source: '', notes: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Name *</Label><Input value={form.name} onChange={e => set('name', e.target.value)} /></div>
        <div><Label>Email</Label><Input value={form.email} onChange={e => set('email', e.target.value)} /></div>
        <div><Label>Phone</Label><Input value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
        <div><Label>Company</Label><Input value={form.company} onChange={e => set('company', e.target.value)} /></div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={v => set('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{statusOptions.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Source</Label>
          <Select value={form.source || ''} onValueChange={v => set('source', v)}>
            <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
            <SelectContent>{sourceOptions.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>Notes</Label><textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} className="w-full border rounded-md p-2 text-sm min-h-[80px] bg-background" /></div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(form)} disabled={!form.name}>Save Lead</Button>
      </DialogFooter>
    </div>
  )
}

// Kanban Card
function KanbanCard({ lead, onEdit, onDelete, onDragStart }) {
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, lead.id)}
      className="bg-background border rounded-lg p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow space-y-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="font-medium text-sm leading-tight">{lead.name}</div>
        <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100">
          <button onClick={() => onEdit(lead)} className="text-xs text-muted-foreground hover:text-foreground p-0.5">✏</button>
          <button onClick={() => onDelete(lead.id)} className="text-xs text-muted-foreground hover:text-red-500 p-0.5">×</button>
        </div>
      </div>
      {lead.company && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Building2 className="w-3 h-3" />{lead.company}</div>}
      {lead.email && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="w-3 h-3" /><span className="truncate">{lead.email}</span></div>}
      {lead.phone && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="w-3 h-3" />{lead.phone}</div>}
      {lead.source && (
        <div className="flex gap-1 mt-1">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">{lead.source?.replace(/_/g, ' ')}</Badge>
        </div>
      )}
      <div className="flex justify-between items-center pt-1">
        <span className="text-[10px] text-muted-foreground">{formatDate(lead.created_at)}</span>
        <div className="flex gap-1">
          <button onClick={() => onEdit(lead)} className="text-[10px] text-primary hover:underline">Edit</button>
          <span className="text-muted-foreground text-[10px]">·</span>
          <button onClick={() => onDelete(lead.id)} className="text-[10px] text-red-500 hover:underline">Del</button>
        </div>
      </div>
    </div>
  )
}

// Kanban Board
function KanbanBoard({ leads, onEdit, onDelete, onStatusChange }) {
  const dragLeadId = useRef(null)
  const [dragOver, setDragOver] = useState(null)

  const handleDragStart = (e, id) => { dragLeadId.current = id; e.dataTransfer.effectAllowed = 'move' }
  const handleDragOver = (e, status) => { e.preventDefault(); setDragOver(status) }
  const handleDrop = (e, status) => {
    e.preventDefault()
    if (dragLeadId.current) onStatusChange(dragLeadId.current, status)
    dragLeadId.current = null
    setDragOver(null)
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-[500px]">
      {statusOptions.map(status => {
        const col = leads.filter(l => (l.status || 'new') === status)
        return (
          <div
            key={status}
            className={`flex-shrink-0 w-56 flex flex-col rounded-xl transition-colors ${dragOver === status ? 'ring-2 ring-primary ring-offset-1' : ''}`}
            onDragOver={e => handleDragOver(e, status)}
            onDrop={e => handleDrop(e, status)}
            onDragLeave={() => setDragOver(null)}
          >
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-t-xl bg-muted/50 border border-b-0">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${kanbanColors[status]}`} />
              <span className="text-xs font-semibold capitalize">{status}</span>
              <span className="ml-auto text-xs text-muted-foreground font-medium">{col.length}</span>
            </div>
            <div className="flex-1 p-2 space-y-2 bg-muted/20 border rounded-b-xl min-h-[100px] group">
              {col.map(lead => (
                <KanbanCard key={lead.id} lead={lead} onEdit={onEdit} onDelete={onDelete} onDragStart={handleDragStart} />
              ))}
              {col.length === 0 && (
                <div className="h-20 flex items-center justify-center text-xs text-muted-foreground/50 border-2 border-dashed rounded-lg">
                  Drop here
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function Leads() {
  const [viewMode, setViewMode] = useState('list') // 'list' | 'kanban'
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data: leads = [], isLoading } = useQuery({ queryKey: ['leads'], queryFn: () => api.get('/api/leads') })

  const saveMutation = useMutation({
    mutationFn: (data) => data.id ? api.put(`/api/leads/${data.id}`, data) : api.post('/api/leads', { ...data, id: generateId() }),
    onSuccess: () => { qc.invalidateQueries(['leads']); setModalOpen(false); setEditing(null); toast({ title: editing ? 'Lead updated' : 'Lead created' }) },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/leads/${id}`),
    onSuccess: () => { qc.invalidateQueries(['leads']); toast({ title: 'Lead deleted' }) },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/api/leads/${id}`, { status }),
    onSuccess: () => { qc.invalidateQueries(['leads']); toast({ title: 'Lead moved' }) },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const handleEdit = (lead) => { setEditing(lead); setModalOpen(true) }
  const handleDelete = (id) => { if (confirm('Delete this lead?')) deleteMutation.mutate(id) }
  const handleStatusChange = (id, status) => statusMutation.mutate({ id, status })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold">Leads</h1>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
              <LayoutList className="w-3.5 h-3.5" /> List
            </button>
            <button onClick={() => setViewMode('kanban')} className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${viewMode === 'kanban' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
              <Columns className="w-3.5 h-3.5" /> Kanban
            </button>
          </div>
          <Button onClick={() => { setEditing(null); setModalOpen(true) }}>+ Add Lead</Button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <DataTable
          data={leads}
          columns={columns}
          onAdd={() => { setEditing(null); setModalOpen(true) }}
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchFields={['name', 'email', 'company', 'phone']}
          isLoading={isLoading}
          hideHeader
        />
      ) : (
        <KanbanBoard
          leads={leads}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Edit Lead' : 'Add Lead'}</DialogTitle></DialogHeader>
          <LeadForm lead={editing} onSave={(data) => saveMutation.mutate(data)} onClose={() => setModalOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
