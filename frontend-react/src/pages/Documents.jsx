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
import { supabase } from '@/lib/supabase'
import { Upload, Paperclip, FileText, ExternalLink } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

const types = ['proposal', 'contract', 'invoice', 'report', 'presentation', 'nda', 'agreement', 'other']
const categories = ['sales', 'legal', 'finance', 'marketing', 'hr', 'technical', 'other']

const columns = [
  { key: 'name', label: 'Name', render: (v, row) => (
    <div>
      <div className="font-medium text-sm">{v}</div>
      {row.description && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{row.description}</div>}
    </div>
  )},
  { key: 'type', label: 'Type', render: (v) => <Badge variant="secondary" className="capitalize text-xs">{v}</Badge> },
  { key: 'category', label: 'Category', render: (v) => v ? <span className="capitalize text-xs text-muted-foreground">{v}</span> : '—' },
  { key: 'file_url', label: 'File', render: (v) => v ? (
    <a href={v} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs">
      <ExternalLink className="w-3 h-3" /> View
    </a>
  ) : '—' },
  { key: 'created_at', label: 'Created', render: (v) => formatDate(v) },
]

const empty = { name: '', type: 'proposal', category: 'sales', file_url: '', description: '' }

export function Documents() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const { data = [], isLoading } = useQuery({ queryKey: ['documents'], queryFn: () => api.get('/api/documents') })

  const save = useMutation({
    mutationFn: (d) => editing
      ? api.put(`/api/documents/${editing.id}`, d)
      : api.post('/api/documents', { ...d, id: generateId() }),
    onSuccess: () => { qc.invalidateQueries(['documents']); close(); toast({ title: editing ? 'Document updated' : 'Document saved' }) },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const remove = useMutation({
    mutationFn: (id) => api.delete(`/api/documents/${id}`),
    onSuccess: () => { qc.invalidateQueries(['documents']); toast({ title: 'Document deleted' }) },
  })

  const handleUpload = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `documents/${generateId()}.${ext}`
      const { data: upload, error } = await supabase.storage.from('documents').upload(path, file, { upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)
      setForm(f => ({ ...f, file_url: publicUrl, name: f.name || file.name.replace(`.${ext}`, '') }))
      toast({ title: 'File uploaded!', description: file.name })
    } catch (err) {
      // Fallback: store a fake URL if storage isn't set up
      toast({ title: 'Upload info', description: 'Supabase Storage bucket "documents" may not be set up. Enter file URL manually.', variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  const close = () => { setOpen(false); setEditing(null); setForm(empty) }

  return (
    <>
      <DataTable
        data={data} columns={columns}
        onAdd={() => setOpen(true)}
        onEdit={(row) => { setEditing(row); setForm({ ...row }); setOpen(true) }}
        onDelete={(row) => { if (confirm(`Delete "${row.name}"?`)) remove.mutate(row.id) }}
        searchFields={['name', 'type', 'category', 'description']}
        title="Documents" isLoading={isLoading}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) close() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Document' : 'Add Document'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Document Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{types.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category || 'other'} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* File upload */}
            <div>
              <Label>File Upload / URL</Label>
              <div className="mt-1 space-y-2">
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary hover:bg-muted/30 transition-colors"
                >
                  <Upload className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-xs text-muted-foreground">
                    {uploading ? 'Uploading…' : 'Click to upload file'}
                  </div>
                  <input ref={fileRef} type="file" className="hidden" onChange={e => handleUpload(e.target.files?.[0])} />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-px flex-1 bg-border" /> or paste URL <div className="h-px flex-1 bg-border" />
                </div>
                <Input
                  placeholder="https://example.com/file.pdf"
                  value={form.file_url || ''}
                  onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                />
                {form.file_url && (
                  <a href={form.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    <ExternalLink className="w-3 h-3" /> Preview file
                  </a>
                )}
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="flex min-h-[70px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>Cancel</Button>
              <Button onClick={() => save.mutate(form)} disabled={save.isPending || !form.name}>{save.isPending ? 'Saving…' : 'Save'}</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
