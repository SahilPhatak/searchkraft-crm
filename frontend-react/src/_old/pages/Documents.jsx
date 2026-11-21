import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'

const DOC_TYPES = ['Contract','Proposal','Invoice','NDA','SOW','Report','Other']
const OWNER_OPTIONS = ['Samyadeep','Vikram','Sahil','Urmila']

function DocModal({ doc, onClose, onSave, saving }) {
  const [f, setF] = useState(doc ? { ...doc } : {
    title: '', type: '', owner: '', relatedTo: '', description: '', url: ''
  })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 500 }}>
        <div className="modal-hdr">
          <span>{doc ? 'Edit Document' : 'Add Document'}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
          <div className="lf-field" style={{ gridColumn: '1/-1' }}>
            <label>Document Title *</label>
            <input type="text" value={f.title || ''} onChange={e => set('title', e.target.value)} />
          </div>
          <div className="lf-field">
            <label>Type</label>
            <select value={f.type || ''} onChange={e => set('type', e.target.value)}>
              <option value="">-None-</option>
              {DOC_TYPES.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="lf-field">
            <label>Owner</label>
            <select value={f.owner || ''} onChange={e => set('owner', e.target.value)}>
              <option value="">-None-</option>
              {OWNER_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="lf-field" style={{ gridColumn: '1/-1' }}>
            <label>Related To (Account / Deal)</label>
            <input type="text" value={f.relatedTo || f.related_to || ''} onChange={e => set('relatedTo', e.target.value)} />
          </div>
          <div className="lf-field" style={{ gridColumn: '1/-1' }}>
            <label>URL / Link</label>
            <input type="url" placeholder="https://" value={f.url || ''} onChange={e => set('url', e.target.value)} />
          </div>
          <div className="lf-field" style={{ gridColumn: '1/-1' }}>
            <label>Description</label>
            <textarea value={f.description || ''} onChange={e => set('description', e.target.value)} rows={3} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="crm-toolbar-btn" onClick={onClose}>Cancel</button>
          <button className="crm-btn-primary" disabled={!f.title || saving} onClick={() => onSave(f)}>
            {saving ? 'Saving…' : 'Save Document'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Documents() {
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['documents'], queryFn: () => api.get('/api/documents')
  })

  const saveMutation = useMutation({
    mutationFn: d => d.id ? api.put(`/api/documents/${d.id}`, d) : api.post('/api/documents', d),
    onSuccess: (_, vars) => {
      qc.invalidateQueries(['documents'])
      setModal(null)
      toast({ title: vars.id ? 'Document updated' : 'Document added' })
    },
    onError: e => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/api/documents/${id}`),
    onSuccess: () => { qc.invalidateQueries(['documents']); toast({ title: 'Document deleted' }) },
    onError: e => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const filtered = useMemo(() => {
    if (!search) return docs
    const q = search.toLowerCase()
    return docs.filter(d =>
      (d.title || '').toLowerCase().includes(q) ||
      (d.type || '').toLowerCase().includes(q) ||
      (d.relatedTo || d.related_to || '').toLowerCase().includes(q)
    )
  }, [docs, search])

  return (
    <div className="crm-page-wrap">
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-color)', padding: '0 20px', background: 'var(--surface)', flexShrink: 0 }}>
        <button className="crm-subtab active">All Documents</button>
      </div>

      <div className="crm-toolbar">
        <div style={{ flex: 1 }} />
        <div className="crm-search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ opacity: 0.45, flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input placeholder="Search documents…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="crm-btn-primary" onClick={() => setModal('create')}>+ Add Document</button>
      </div>

      <div className="crm-tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Related To</th>
              <th>Owner</th>
              <th>Link</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--fg3)' }}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7}>
                <div className="empty-state">
                  <div className="empty-state-icon">📄</div>
                  <div>{search ? 'No documents match your search' : 'No documents yet'}</div>
                  {!search && <button className="crm-btn-primary" onClick={() => setModal('create')}>+ Add Document</button>}
                </div>
              </td></tr>
            ) : filtered.map(d => (
              <tr key={d.id}>
                <td className="name-cell" onClick={() => setModal(d)}>{d.title || '—'}</td>
                <td>{d.type ? <span className="badge badge-purple">{d.type}</span> : '—'}</td>
                <td>{d.relatedTo || d.related_to || '—'}</td>
                <td>{d.owner || '—'}</td>
                <td>
                  {d.url ? (
                    <a href={d.url} target="_blank" rel="noopener noreferrer"
                      style={{ color: 'var(--sk-accent)', fontSize: 12, textDecoration: 'none' }}
                      onClick={e => e.stopPropagation()}>
                      🔗 Open
                    </a>
                  ) : '—'}
                </td>
                <td><span className="mono">{(d.created_at || '').slice(0, 10) || '—'}</span></td>
                <td>
                  <div className="row-actions">
                    <button className="row-act-btn" onClick={() => setModal(d)}>Edit</button>
                    <button className="row-act-btn del" onClick={() => window.confirm('Delete this document?') && deleteMutation.mutate(d.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="crm-tbl-footer">
        <span>Total Records <strong style={{ color: 'var(--fg)' }}>{filtered.length}</strong>
          {search && <span style={{ marginLeft: 6, color: 'var(--fg3)' }}>(filtered from {docs.length})</span>}
        </span>
      </div>

      {modal && (
        <DocModal
          doc={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={d => saveMutation.mutate(d)}
          saving={saveMutation.isPending}
        />
      )}
    </div>
  )
}
