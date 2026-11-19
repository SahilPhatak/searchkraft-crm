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
import { Users, Mail, Shield, UserCheck } from 'lucide-react'

const roleOptions = ['member', 'manager', 'admin', 'owner']
const statusOptions = ['active', 'inactive', 'pending']

const roleBadge = { member: 'secondary', manager: 'info', admin: 'warning', owner: 'destructive' }
const statusBadge = { active: 'success', inactive: 'secondary', pending: 'warning' }

export default function Team() {
  const { profile: myProfile } = useAuthStore()
  const isAdmin = myProfile?.role === 'admin' || myProfile?.role === 'owner'
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ role: 'member', status: 'active' })
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => api.get('/api/profiles'),
  })

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

  const handleSave = () => {
    if (!editing) return
    updateMutation.mutate({ id: editing.id, ...form })
  }

  const activeCount = users.filter(u => u.status === 'active' || !u.status).length
  const adminCount = users.filter(u => u.role === 'admin' || u.role === 'owner').length

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Team Members</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><UserCheck className="w-4 h-4 text-green-500" />{activeCount} active</span>
          <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-blue-500" />{adminCount} admins</span>
          <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{users.length} total</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {roleOptions.map(role => (
          <Card key={role}>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground capitalize mb-1">{role}s</div>
              <div className="text-2xl font-bold">{users.filter(u => u.role === role).length}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Team Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/30">
                <th className="text-left p-3 font-semibold">Member</th>
                <th className="text-left p-3 font-semibold">Email</th>
                <th className="text-left p-3 font-semibold">Role</th>
                <th className="text-left p-3 font-semibold">Status</th>
                <th className="text-left p-3 font-semibold">Joined</th>
                {isAdmin && <th className="text-left p-3 font-semibold">Actions</th>}
              </tr></thead>
              <tbody>
                {isLoading && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading…</td></tr>}
                {users.map(user => (
                  <tr key={user.id} className="border-b hover:bg-muted/20">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                          {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{user.full_name || '—'}</div>
                          {user.id === myProfile?.id && <span className="text-[10px] text-primary">(you)</span>}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{user.email || '—'}</td>
                    <td className="p-3"><Badge variant={roleBadge[user.role] || 'secondary'} className="capitalize">{user.role || 'member'}</Badge></td>
                    <td className="p-3"><Badge variant={statusBadge[user.status] || 'secondary'} className="capitalize">{user.status || 'active'}</Badge></td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                    </td>
                    {isAdmin && (
                      <td className="p-3">
                        <Button variant="outline" size="sm" onClick={() => openEdit(user)} disabled={user.id === myProfile?.id}>
                          Edit Role
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
                {!isLoading && users.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No team members found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {!isAdmin && (
        <div className="text-sm text-muted-foreground text-center py-2">
          Contact an admin to manage roles and permissions.
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Member — {editing?.full_name || editing?.email}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Full Name</Label>
              <Input value={form.full_name || ''} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            </div>
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
            <Button onClick={handleSave} disabled={updateMutation.isPending}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
