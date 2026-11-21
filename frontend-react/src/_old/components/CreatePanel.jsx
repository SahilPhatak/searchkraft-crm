import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useUiStore } from '@/store/uiStore'
import { api } from '@/lib/api'
import { generateId } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { X, Tags, User, Building2, Briefcase, CheckSquare } from 'lucide-react'

const TYPES = [
  { id: 'lead', label: 'Lead', icon: Tags, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { id: 'contact', label: 'Contact', icon: User, color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  { id: 'company', label: 'Company', icon: Building2, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  { id: 'deal', label: 'Deal', icon: Briefcase, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  { id: 'task', label: 'Task', icon: CheckSquare, color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' },
]

function QuickForm({ type, onClose }) {
  const [form, setForm] = useState({})
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const qc = useQueryClient()
  const { toast } = useToast()

  const mutation = useMutation({
    mutationFn: (data) => {
      const id = generateId()
      const paths = { lead: '/api/leads', contact: '/api/contacts', company: '/api/companies', deal: '/api/deals', task: '/api/tasks' }
      return api.post(paths[type], { ...data, id })
    },
    onSuccess: () => {
      qc.invalidateQueries([type + 's'])
      qc.invalidateQueries(['leads','contacts','companies','deals','tasks'])
      toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} created!` })
      onClose()
    },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const handleSave = () => {
    if (type === 'lead' && !form.name) return
    if (type === 'contact' && !form.name) return
    if (type === 'company' && !form.name) return
    if (type === 'deal' && !form.title) return
    if (type === 'task' && !form.title) return
    mutation.mutate(form)
  }

  if (type === 'lead') return (
    <div className="space-y-3">
      <div><Label className="text-xs">Name *</Label><Input className="h-8 text-sm" value={form.name||''} onChange={e => set('name', e.target.value)} /></div>
      <div><Label className="text-xs">Email</Label><Input className="h-8 text-sm" value={form.email||''} onChange={e => set('email', e.target.value)} /></div>
      <div><Label className="text-xs">Company</Label><Input className="h-8 text-sm" value={form.company||''} onChange={e => set('company', e.target.value)} /></div>
      <div>
        <Label className="text-xs">Status</Label>
        <Select value={form.status||'new'} onValueChange={v => set('status', v)}>
          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>{['new','contacted','qualified','proposal','won','lost'].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <Button size="sm" className="w-full" onClick={handleSave} disabled={mutation.isPending}>Create Lead</Button>
    </div>
  )

  if (type === 'contact') return (
    <div className="space-y-3">
      <div><Label className="text-xs">Name *</Label><Input className="h-8 text-sm" value={form.name||''} onChange={e => set('name', e.target.value)} /></div>
      <div><Label className="text-xs">Email</Label><Input className="h-8 text-sm" value={form.email||''} onChange={e => set('email', e.target.value)} /></div>
      <div><Label className="text-xs">Phone</Label><Input className="h-8 text-sm" value={form.phone||''} onChange={e => set('phone', e.target.value)} /></div>
      <div><Label className="text-xs">Company</Label><Input className="h-8 text-sm" value={form.company||''} onChange={e => set('company', e.target.value)} /></div>
      <Button size="sm" className="w-full" onClick={handleSave} disabled={mutation.isPending}>Create Contact</Button>
    </div>
  )

  if (type === 'company') return (
    <div className="space-y-3">
      <div><Label className="text-xs">Company Name *</Label><Input className="h-8 text-sm" value={form.name||''} onChange={e => set('name', e.target.value)} /></div>
      <div><Label className="text-xs">Industry</Label><Input className="h-8 text-sm" value={form.industry||''} onChange={e => set('industry', e.target.value)} /></div>
      <div><Label className="text-xs">Website</Label><Input className="h-8 text-sm" value={form.website||''} onChange={e => set('website', e.target.value)} /></div>
      <Button size="sm" className="w-full" onClick={handleSave} disabled={mutation.isPending}>Create Company</Button>
    </div>
  )

  if (type === 'deal') return (
    <div className="space-y-3">
      <div><Label className="text-xs">Deal Name *</Label><Input className="h-8 text-sm" value={form.title||''} onChange={e => set('title', e.target.value)} /></div>
      <div><Label className="text-xs">Amount (₹)</Label><Input className="h-8 text-sm" type="number" value={form.amount||''} onChange={e => set('amount', e.target.value)} /></div>
      <div>
        <Label className="text-xs">Stage</Label>
        <Select value={form.stage||'Qualification'} onValueChange={v => set('stage', v)}>
          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>{['Qualification','Proposal','Negotiation','Won','Lost'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <Button size="sm" className="w-full" onClick={handleSave} disabled={mutation.isPending}>Create Deal</Button>
    </div>
  )

  if (type === 'task') return (
    <div className="space-y-3">
      <div><Label className="text-xs">Task Title *</Label><Input className="h-8 text-sm" value={form.title||''} onChange={e => set('title', e.target.value)} /></div>
      <div><Label className="text-xs">Due Date</Label><Input className="h-8 text-sm" type="date" value={form.due_date||''} onChange={e => set('due_date', e.target.value)} /></div>
      <div>
        <Label className="text-xs">Priority</Label>
        <Select value={form.priority||'medium'} onValueChange={v => set('priority', v)}>
          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>{['low','medium','high'].map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <Button size="sm" className="w-full" onClick={handleSave} disabled={mutation.isPending}>Create Task</Button>
    </div>
  )
}

export function CreatePanel() {
  const { createPanelOpen, closeCreatePanel } = useUiStore()
  const [activeType, setActiveType] = useState('lead')

  if (!createPanelOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/30 backdrop-blur-sm" onClick={closeCreatePanel}>
      <div className="bg-background border-l h-full w-72 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <span className="font-semibold text-sm">Quick Create</span>
          <button onClick={closeCreatePanel} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-1 p-3 border-b overflow-x-auto flex-shrink-0">
          {TYPES.map(({ id, label, icon: Icon, color }) => (
            <button key={id} onClick={() => setActiveType(id)}
              className={`flex flex-col items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors flex-shrink-0 ${activeType === id ? color : 'hover:bg-muted text-muted-foreground'}`}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          <QuickForm type={activeType} onClose={closeCreatePanel} />
        </div>
      </div>
    </div>
  )
}
