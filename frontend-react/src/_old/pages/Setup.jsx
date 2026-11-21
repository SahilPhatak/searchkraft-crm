import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/components/ui/use-toast'
import { Settings, Users, Shield, Layers, Zap, Lock, CheckCircle, XCircle } from 'lucide-react'

const roleOptions = ['member', 'manager', 'admin', 'owner']
const statusOptions = ['active', 'inactive', 'pending']
const roleBadge = { member: 'secondary', manager: 'info', admin: 'warning', owner: 'destructive' }
const statusBadge = { active: 'success', inactive: 'secondary', pending: 'warning' }

const TABS = [
  { id: 'home', label: 'Setup', icon: Settings },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'roles', label: 'Roles & Profiles', icon: Shield },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'modules', label: 'Modules & Fields', icon: Layers },
  { id: 'automation', label: 'Automation', icon: Zap },
]

const MODULES = ['Leads','Contacts','Companies','Deals','Tasks','Activities','Documents','Business','Reports','Calendar']
const PERMISSIONS = ['view','create','edit','delete']

const DEFAULT_ROLE_PERMS = {
  owner: { leads: ['view','create','edit','delete'], contacts: ['view','create','edit','delete'], companies: ['view','create','edit','delete'], deals: ['view','create','edit','delete'], tasks: ['view','create','edit','delete'] },
  admin: { leads: ['view','create','edit','delete'], contacts: ['view','create','edit','delete'], companies: ['view','create','edit'], deals: ['view','create','edit','delete'], tasks: ['view','create','edit','delete'] },
  manager: { leads: ['view','create','edit'], contacts: ['view','create','edit'], companies: ['view','create'], deals: ['view','create','edit'], tasks: ['view','create','edit'] },
  member: { leads: ['view','create'], contacts: ['view','create'], companies: ['view'], deals: ['view','create'], tasks: ['view','create'] },
}

function HomeTab() {
  const { profile } = useAuthStore()
  const { data: users = [] } = useQuery({ queryKey: ['profiles'], queryFn: () => api.get('/api/profiles') })
  const cards = [
    { label: 'Total Users', value: users.length, icon: '👥', color: 'text-blue-500' },
    { label: 'Active Users', value: users.filter(u => u.status === 'active' || !u.status).length, icon: '✅', color: 'text-green-500' },
    { label: 'Admins', value: users.filter(u => u.role === 'admin' || u.role === 'owner').length, icon: '🔐', color: 'text-purple-500' },
    { label: 'Your Role', value: profile?.role || 'member', icon: '👤', color: 'text-orange-500' },
  ]
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-lg font-bold">System Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <Card key={i}><CardContent className="p-5">
            <div className="text-2xl mb-2">{c.icon}</div>
            <div className={`text-2xl font-bold capitalize ${c.color}`}>{c.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{c.label}</div>
          </CardContent></Card>
        ))}
      </div>
      <Card><CardContent className="p-5">
        <h3 className="font-semibold mb-3">Quick Setup Checklist</h3>
        <div className="space-y-2">
          {[
            { label: 'Team members added', done: users.length > 0 },
            { label: 'Admin role assigned', done: users.some(u => u.role === 'admin' || u.role === 'owner') },
            { label: 'Profile complete', done: !!(profile?.full_name) },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              {item.done ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
              <span className={item.done ? '' : 'text-muted-foreground'}>{item.label}</span>
            </div>
          ))}
        </div>
      </CardContent></Card>
    </div>
  )
}

function UsersTab() {
  const { profile: myProfile } = useAuthStore()
  const isAdmin = myProfile?.role === 'admin' || myProfile?.role === 'owner'
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ role: 'member', status: 'active', full_name: '' })
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data: users = [], isLoading } = useQuery({ queryKey: ['profiles'], queryFn: () => api.get('/api/profiles') })

  const updateMutation = useMutation({
    mutationFn: (data) => api.put(`/api/profiles/${data.id}`, data),
    onSuccess: () => { qc.invalidateQueries(['profiles']); setModalOpen(false); toast({ title: 'User updated' }) },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const openEdit = (user) => {
    setEditing(user)
    setForm({ role: user.role || 'member', status: user.status || 'active', full_name: user.full_name || '' })
    setModalOpen(true)
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Users</h2>
        <span className="text-sm text-muted-foreground">{users.length} members</span>
      </div>
      <Card><CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/30">
              <th className="text-left p-3 font-semibold">Name</th>
              <th className="text-left p-3 font-semibold">Email</th>
              <th className="text-left p-3 font-semibold">Role</th>
              <th className="text-left p-3 font-semibold">Status</th>
              {isAdmin && <th className="text-left p-3 font-semibold">Actions</th>}
            </tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading…</td></tr>}
              {users.map(user => (
                <tr key={user.id} className="border-b hover:bg-muted/20">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{user.full_name || '—'}</span>
                      {user.id === myProfile?.id && <Badge variant="outline" className="text-[10px] px-1">you</Badge>}
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{user.email || '—'}</td>
                  <td className="p-3"><Badge variant={roleBadge[user.role] || 'secondary'} className="capitalize">{user.role || 'member'}</Badge></td>
                  <td className="p-3"><Badge variant={statusBadge[user.status] || 'secondary'} className="capitalize">{user.status || 'active'}</Badge></td>
                  {isAdmin && <td className="p-3">
                    <Button variant="outline" size="sm" onClick={() => openEdit(user)} disabled={user.id === myProfile?.id && myProfile?.role === 'owner'}>
                      Edit
                    </Button>
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent></Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User — {editing?.full_name || editing?.email}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Full Name</Label><Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} /></div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{roleOptions.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{statusOptions.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate({ id: editing.id, ...form })}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function RolesTab() {
  const [selectedRole, setSelectedRole] = useState('admin')
  const perms = DEFAULT_ROLE_PERMS[selectedRole] || {}
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-bold">Roles & Profiles</h2>
      <div className="flex gap-2 flex-wrap">
        {roleOptions.map(r => (
          <Button key={r} variant={selectedRole === r ? 'default' : 'outline'} size="sm" className="capitalize" onClick={() => setSelectedRole(r)}>{r}</Button>
        ))}
      </div>
      <Card><CardContent className="p-0">
        <div className="p-3 border-b bg-muted/30">
          <span className="text-sm font-semibold capitalize">{selectedRole} Permissions</span>
          <span className="text-xs text-muted-foreground ml-2">(read-only reference)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b">
              <th className="text-left p-3 font-semibold">Module</th>
              {PERMISSIONS.map(p => <th key={p} className="text-center p-3 font-semibold capitalize">{p}</th>)}
            </tr></thead>
            <tbody>
              {Object.entries(perms).map(([mod, allowed]) => (
                <tr key={mod} className="border-b hover:bg-muted/20">
                  <td className="p-3 capitalize font-medium">{mod}</td>
                  {PERMISSIONS.map(p => (
                    <td key={p} className="p-3 text-center">
                      {allowed.includes(p)
                        ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                        : <XCircle className="w-4 h-4 text-muted-foreground/40 mx-auto" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent></Card>
    </div>
  )
}

function SecurityTab() {
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-bold">Security Settings</h2>
      <Card><CardContent className="p-5 space-y-4">
        <div>
          <h3 className="font-semibold mb-1">Session Security</h3>
          <p className="text-sm text-muted-foreground">Authentication is handled via Supabase JWT tokens. Sessions expire automatically after inactivity.</p>
        </div>
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-1">Password Policy</h3>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Minimum 8 characters required</div>
            <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Email verification on signup</div>
            <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Secure token-based authentication</div>
          </div>
        </div>
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-1">Data Security</h3>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> All data stored in Supabase (encrypted at rest)</div>
            <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> HTTPS enforced on all connections</div>
            <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Row-level security via service role backend</div>
          </div>
        </div>
      </CardContent></Card>
    </div>
  )
}

function ModulesTab() {
  const enabled = { leads: true, contacts: true, companies: true, deals: true, tasks: true, activities: true, documents: true, business: true, reports: true, calendar: true }
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-bold">Modules & Fields</h2>
      <Card><CardContent className="p-0">
        <div className="divide-y">
          {MODULES.map(mod => (
            <div key={mod} className="flex items-center justify-between p-4 hover:bg-muted/20">
              <div>
                <div className="font-medium">{mod}</div>
                <div className="text-xs text-muted-foreground">Standard CRM module</div>
              </div>
              <Badge variant={enabled[mod.toLowerCase()] ? 'success' : 'secondary'}>
                {enabled[mod.toLowerCase()] ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent></Card>
    </div>
  )
}

function AutomationTab() {
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-bold">Automation</h2>
      <Card><CardContent className="p-6 text-center">
        <div className="text-4xl mb-3">⚡</div>
        <h3 className="font-semibold mb-2">Workflow Automation</h3>
        <p className="text-sm text-muted-foreground">Configure automated workflows, triggers, and actions. Coming soon.</p>
      </CardContent></Card>
    </div>
  )
}

const TAB_CONTENT = { home: HomeTab, users: UsersTab, roles: RolesTab, security: SecurityTab, modules: ModulesTab, automation: AutomationTab }

export default function Setup() {
  const { profile } = useAuthStore()
  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner'
  const [activeTab, setActiveTab] = useState('home')
  const TabContent = TAB_CONTENT[activeTab] || HomeTab

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="rounded-xl border bg-muted/30 p-8 text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h2 className="text-lg font-semibold mb-1">Admin Access Required</h2>
          <p className="text-sm text-muted-foreground">Only admins and owners can access Setup.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-center border-b bg-background px-4 overflow-x-auto flex-shrink-0">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'}`}>
              <Icon className="w-3.5 h-3.5" />{tab.label}
            </button>
          )
        })}
      </div>
      <div className="flex-1 overflow-y-auto">
        <TabContent />
      </div>
    </div>
  )
}
