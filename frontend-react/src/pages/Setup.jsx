import { useState } from 'react'
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
import { useAuthStore } from '@/store/authStore'

const roles = ['admin', 'manager', 'sales_rep', 'viewer']
const roleColors = { admin: 'destructive', owner: 'destructive', manager: 'warning', sales_rep: 'info', viewer: 'secondary' }

const columns = [
  { key: 'full_name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role', render: (v) => <Badge variant={roleColors[v] || 'secondary'} className="capitalize text-xs">{v}</Badge> },
  { key: 'is_active', label: 'Status', render: (v) => <Badge variant={v ? 'success' : 'secondary'}>{v ? 'Active' : 'Inactive'}</Badge> },
]

export function Setup() {
  const { isAdmin, profile } = useAuthStore()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ full_name: '', role: 'sales_rep', is_active: true })

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => api.get('/api/profiles'),
    enabled: isAdmin(),
  })

  const updateUser = useMutation({
    mutationFn: (d) => api.put(`/api/profiles/${editing.id}`, d),
    onSuccess: () => { qc.invalidateQueries(['profiles']); close() },
  })

  const close = () => { setOpen(false); setEditing(null); setForm({ full_name: '', role: 'sales_rep', is_active: true }) }

  if (!isAdmin()) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <p>You need admin or owner permissions to access this page.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>User Management</CardTitle></CardHeader>
        <CardContent>
          <DataTable
            data={users}
            columns={columns}
            onEdit={(row) => { setEditing(row); setForm({ full_name: row.full_name, role: row.role, is_active: row.is_active }); setOpen(true) }}
            searchFields={['full_name', 'email']}
            title="Users"
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(v) => { if (!v) close() }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); updateUser.mutate(form) }} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roles.map((r) => <SelectItem key={r} value={r} className="capitalize">{r.replace(/_/g, ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={String(form.is_active)} onValueChange={(v) => setForm({ ...form, is_active: v === 'true' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>Cancel</Button>
              <Button type="submit" disabled={updateUser.isPending}>{updateUser.isPending ? 'Saving…' : 'Save'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
