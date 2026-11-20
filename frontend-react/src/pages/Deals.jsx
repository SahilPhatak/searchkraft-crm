import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { generateId, formatDate } from '@/lib/utils'
import { LayoutList, Columns, Building2, DollarSign, Calendar, Mail, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useAuthStore } from '@/store/authStore'

const stageOptions = ['Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost']
const priorityOptions = ['low', 'medium', 'high']

const stageColors = {
  Qualification: 'bg-blue-500', Proposal: 'bg-purple-500', Negotiation: 'bg-yellow-500',
  Won: 'bg-green-500', Lost: 'bg-red-500',
}

const stageBadge = { Qualification: 'info', Proposal: 'secondary', Negotiation: 'warning', Won: 'success', Lost: 'destructive' }

const makeColumns = (onNotif) => [
  { key: 'title', label: 'Deal Name', render: (v, row) => (
    <div>
      <div className="font-medium text-sm">{v}</div>
      {row.delivery_pillar && <div className="text-[11px] text-green-600 mt-0.5">Delivery: {row.delivery_pillar}</div>}
    </div>
  )},
  { key: 'contact_name', label: 'Contact' },
  { key: 'company_name', label: 'Company' },
  { key: 'amount', label: 'Amount', render: v => v ? `₹${parseFloat(v).toLocaleString()}` : '—' },
  { key: 'stage', label: 'Stage', render: v => <Badge variant={stageBadge[v] || 'secondary'}>{v}</Badge> },
  { key: 'probability', label: 'Probability', render: v => v != null ? `${v}%` : '—' },
  { key: 'close_date', label: 'Close Date', render: v => formatDate(v) },
  { key: 'id', label: '', render: (v, row) => (
    <button onClick={() => onNotif(row)} className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1">
      <Mail className="w-3 h-3" /> Emails
    </button>
  )},
]

function DealForm({ deal, onSave, onClose, profiles = [] }) {
  const empty = { title: '', contact_name: '', company_name: '', amount: '', stage: 'Qualification', probability: '', close_date: '', notes: '', deal_owner: '', type: '', lead_source: '', campaign_source: '', candidate_name: '', recruiter_name: '', client_spoc: '', sourcer: '', credit_sharing: '', candidate_management: '', delivery_pillar: '', delivery_pillar_id: '' }
  const [form, setForm] = useState(deal || empty)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleDeliveryPillar = (profileId) => {
    const p = profiles.find(p => p.id === profileId)
    set('delivery_pillar_id', profileId)
    set('delivery_pillar', p?.full_name || '')
  }

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Deal Information</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Label>Deal Name *</Label><Input value={form.title} onChange={e => set('title', e.target.value)} /></div>
        <div><Label>Company / Account</Label><Input value={form.company_name || ''} onChange={e => set('company_name', e.target.value)} /></div>
        <div><Label>Deal Owner</Label><Input value={form.deal_owner || ''} onChange={e => set('deal_owner', e.target.value)} /></div>
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
        <div><Label>Contact Name</Label><Input value={form.contact_name || ''} onChange={e => set('contact_name', e.target.value)} /></div>
        <div><Label>Candidate Name</Label><Input value={form.candidate_name || ''} onChange={e => set('candidate_name', e.target.value)} /></div>
        <div><Label>Lead Source</Label><Input value={form.lead_source || ''} onChange={e => set('lead_source', e.target.value)} /></div>
        <div><Label>Campaign Source</Label><Input value={form.campaign_source || ''} onChange={e => set('campaign_source', e.target.value)} /></div>
      </div>

      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">Recruitment Details</p>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Recruiter Name</Label><Input value={form.recruiter_name || ''} onChange={e => set('recruiter_name', e.target.value)} /></div>
        <div><Label>Client SPOC</Label><Input value={form.client_spoc || ''} onChange={e => set('client_spoc', e.target.value)} /></div>
        <div><Label>Sourcer</Label><Input value={form.sourcer || ''} onChange={e => set('sourcer', e.target.value)} /></div>
        <div><Label>Credit Sharing (%)</Label><Input type="number" min="0" max="100" value={form.credit_sharing || ''} onChange={e => set('credit_sharing', e.target.value)} /></div>
        <div className="col-span-2"><Label>Candidate Management</Label><Input value={form.candidate_management || ''} onChange={e => set('candidate_management', e.target.value)} /></div>
      </div>

      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2 flex items-center gap-1">
        Delivery Pillar <span className="text-green-600">(triggers email when deal is Won)</span>
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Assign Delivery Pillar</Label>
          {profiles.length > 0 ? (
            <Select value={form.delivery_pillar_id || ''} onValueChange={handleDeliveryPillar}>
              <SelectTrigger><SelectValue placeholder="Select team member…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">— None —</SelectItem>
                {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <Input value={form.delivery_pillar || ''} onChange={e => set('delivery_pillar', e.target.value)} placeholder="Enter delivery person name" />
          )}
        </div>
      </div>

      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">Description</p>
      <div><textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} className="w-full border rounded-md p-2 text-sm min-h-[70px] bg-background" placeholder="Notes / description…" /></div>

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

function EmailNotifications({ dealId }) {
  const { isAdmin } = useAuthStore()
  const qc = useQueryClient()
  const { toast } = useToast()
  const { data: notifs = [], isLoading } = useQuery({
    queryKey: ['deal-notifs', dealId],
    queryFn: () => api.get(`/api/deals/${dealId}/notifications`),
    enabled: !!dealId,
  })

  const retryMutation = useMutation({
    mutationFn: (notifId) => api.post(`/api/deals/notifications/${notifId}/retry`, {}),
    onSuccess: () => { qc.invalidateQueries(['deal-notifs', dealId]); toast({ title: 'Retry queued' }) },
    onError: (e) => toast({ title: 'Retry failed', description: e.message, variant: 'destructive' }),
  })

  const statusIcon = { sent: <CheckCircle className="w-3.5 h-3.5 text-green-500" />, failed: <XCircle className="w-3.5 h-3.5 text-red-500" />, pending: <Clock className="w-3.5 h-3.5 text-yellow-500" /> }
  const statusColor = { sent: 'bg-green-50 text-green-700 border-green-200', failed: 'bg-red-50 text-red-700 border-red-200', pending: 'bg-yellow-50 text-yellow-700 border-yellow-200' }

  if (isLoading) return null
  if (!notifs.length) return <p className="text-xs text-muted-foreground">No email notifications yet.</p>

  return (
    <div className="space-y-2">
      {notifs.map(n => (
        <div key={n.id} className={`flex items-start gap-2 p-2 rounded-lg border text-xs ${statusColor[n.status] || ''}`}>
          <div className="mt-0.5">{statusIcon[n.status]}</div>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{n.subject}</div>
            <div className="text-[11px] opacity-70">To: {n.recipient_email} · {n.sent_at ? new Date(n.sent_at).toLocaleString() : 'Not sent yet'}</div>
            {n.error_message && <div className="text-[11px] text-red-600 mt-0.5">Error: {n.error_message}</div>}
          </div>
          {n.status === 'failed' && isAdmin() && (
            <button onClick={() => retryMutation.mutate(n.id)} className="ml-auto shrink-0 p-1 hover:bg-white/50 rounded" title="Retry">
              <RefreshCw className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

export default function Deals() {
  const [viewMode, setViewMode] = useState('list')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [notifDeal, setNotifDeal] = useState(null)
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data: deals = [], isLoading } = useQuery({ queryKey: ['deals'], queryFn: () => api.get('/api/deals') })
  const { data: profiles = [] } = useQuery({ queryKey: ['profiles'], queryFn: () => api.get('/api/profiles') })

  const saveMutation = useMutation({
    mutationFn: (data) => data.id ? api.put(`/api/deals/${data.id}`, data) : api.post('/api/deals', { ...data, id: generateId() }),
    onSuccess: (saved) => {
      qc.invalidateQueries(['deals'])
      setModalOpen(false)
      setEditing(null)
      toast({ title: editing ? 'Deal updated' : 'Deal created', description: editing ? undefined : 'Email notification sent to accounts team.' })
    },
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
          columns={makeColumns(setNotifDeal)}
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
          <DealForm deal={editing} onSave={(data) => saveMutation.mutate(data)} onClose={() => setModalOpen(false)} profiles={profiles} />
        </DialogContent>
      </Dialog>

      {/* Email Notifications panel */}
      <Dialog open={!!notifDeal} onOpenChange={() => setNotifDeal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Mail className="w-4 h-4" /> Email Notifications</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground mb-2">Deal: <span className="font-medium text-foreground">{notifDeal?.title}</span></div>
          <EmailNotifications dealId={notifDeal?.id} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
