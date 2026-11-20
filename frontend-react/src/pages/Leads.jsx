import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'

const STATUS_OPTIONS = ['New','Contacted','Qualified','Proposal','Negotiation','Won','Lost']
const SOURCE_OPTIONS = ['Cold Call','Email','Existing Client','Partner','Conference','Trade Show','Web Site','Word of Mouth','LinkedIn','Referral','Other']
const OWNER_OPTIONS = ['Samyadeep','Vikram','Sahil','Urmila']
const INDUSTRY_OPTIONS = ['Technology','Finance','Healthcare','Education','Manufacturing','Retail','Real Estate','Media','Consulting','Other']

function SectionHeader({ title }) {
  return (
    <div style={{
      gridColumn: '1/-1', background: '#1e3a5f', color: '#fff',
      fontWeight: 700, fontSize: 12, letterSpacing: '0.5px',
      padding: '7px 12px', borderRadius: 6, marginTop: 6
    }}>{title}</div>
  )
}

const STATUS_BADGE = {
  new: 'badge-blue', contacted: 'badge-purple', qualified: 'badge-amber',
  proposal: 'badge-purple', negotiation: 'badge-amber',
  won: 'badge-green', lost: 'badge-red',
}

function statusBadge(s) {
  const key = (s || '').toLowerCase()
  return <span className={`badge ${STATUS_BADGE[key] || 'badge-gray'}`}>{s || '—'}</span>
}

function LeadModal({ lead, onClose, onSave, saving }) {
  const [f, setF] = useState(lead ? { ...lead } : {
    name: '', email: '', phone: '', mobile: '', company: '',
    title: '', website: '', industry: '', annual_revenue: '',
    linkedin: '', status: 'New', source: '', owner: '',
    converted: false, notes: ''
  })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 620 }}>
        <div className="modal-hdr">
          <span>{lead ? 'Edit Lead' : 'Create Lead'}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
          <SectionHeader title="LEAD INFORMATION" />

          <div className="lf-field" style={{ gridColumn: '1/-1' }}>
            <label>Lead Name *</label>
            <input type="text" value={f.name || ''} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="lf-field">
            <label>Title / Designation</label>
            <input type="text" value={f.title || ''} onChange={e => set('title', e.target.value)} />
          </div>
          <div className="lf-field">
            <label>Company</label>
            <input type="text" value={f.company || ''} onChange={e => set('company', e.target.value)} />
          </div>
          <div className="lf-field">
            <label>Email</label>
            <input type="email" value={f.email || ''} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="lf-field">
            <label>Phone</label>
            <input type="tel" value={f.phone || ''} onChange={e => set('phone', e.target.value)} />
          </div>
          <div className="lf-field">
            <label>Mobile</label>
            <input type="tel" value={f.mobile || ''} onChange={e => set('mobile', e.target.value)} />
          </div>
          <div className="lf-field">
            <label>LinkedIn</label>
            <input type="url" placeholder="https://linkedin.com/in/…" value={f.linkedin || ''} onChange={e => set('linkedin', e.target.value)} />
          </div>
          <div className="lf-field">
            <label>Website</label>
            <input type="url" placeholder="https://" value={f.website || ''} onChange={e => set('website', e.target.value)} />
          </div>
          <div className="lf-field">
            <label>Industry</label>
            <select value={f.industry || ''} onChange={e => set('industry', e.target.value)}>
              <option value="">-None-</option>
              {INDUSTRY_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="lf-field">
            <label>Annual Revenue (₹)</label>
            <input type="number" min="0" value={f.annual_revenue || ''} onChange={e => set('annual_revenue', e.target.value)} />
          </div>

          <SectionHeader title="LEAD STATUS" />

          <div className="lf-field">
            <label>Status</label>
            <select value={f.status || 'New'} onChange={e => set('status', e.target.value)}>
              {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="lf-field">
            <label>Lead Source</label>
            <select value={f.source || ''} onChange={e => set('source', e.target.value)}>
              <option value="">-None-</option>
              {SOURCE_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="lf-field">
            <label>Owner</label>
            <select value={f.owner || ''} onChange={e => set('owner', e.target.value)}>
              <option value="">-None-</option>
              {OWNER_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="lf-field" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20 }}>
            <input type="checkbox" id="converted-chk" checked={!!f.converted} onChange={e => set('converted', e.target.checked)} style={{ width: 'auto' }} />
            <label htmlFor="converted-chk" style={{ marginBottom: 0 }}>Converted</label>
          </div>

          <SectionHeader title="NOTES" />

          <div className="lf-field" style={{ gridColumn: '1/-1' }}>
            <label>Notes / Description</label>
            <textarea value={f.notes || f.description || ''} onChange={e => set('notes', e.target.value)} rows={3} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="crm-toolbar-btn" onClick={onClose}>Cancel</button>
          <button className="crm-btn-primary" disabled={!f.name || saving} onClick={() => onSave(f)}>
            {saving ? 'Saving…' : 'Save Lead'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Leads() {
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | 'create' | lead object
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'], queryFn: () => api.get('/api/leads')
  })

  const saveMutation = useMutation({
    mutationFn: d => d.id ? api.put(`/api/leads/${d.id}`, d) : api.post('/api/leads', d),
    onSuccess: (_, vars) => {
      qc.invalidateQueries(['leads'])
      qc.invalidateQueries(['leads-nav'])
      setModal(null)
      toast({ title: vars.id ? 'Lead updated' : 'Lead created' })
    },
    onError: e => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/api/leads/${id}`),
    onSuccess: () => { qc.invalidateQueries(['leads']); qc.invalidateQueries(['leads-nav']); toast({ title: 'Lead deleted' }) },
    onError: e => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const filtered = useMemo(() => {
    if (!search) return leads
    const q = search.toLowerCase()
    return leads.filter(l =>
      (l.name || '').toLowerCase().includes(q) ||
      (l.email || '').toLowerCase().includes(q) ||
      (l.company || '').toLowerCase().includes(q) ||
      (l.phone || '').includes(q)
    )
  }, [leads, search])

  const handleDelete = id => {
    if (!window.confirm('Delete this lead?')) return
    deleteMutation.mutate(id)
  }

  return (
    <div className="crm-page-wrap">
      {/* Sub-tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, borderBottom: '1px solid var(--border-color)', padding: '0 20px', background: 'var(--surface)', flexShrink: 0 }}>
        <button className="crm-subtab active">All Leads</button>
      </div>

      {/* Toolbar */}
      <div className="crm-toolbar">
        <div style={{ flex: 1 }} />
        <div className="crm-search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ opacity: 0.45, flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input placeholder="Search leads…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="crm-btn-primary" onClick={() => setModal('create')}>+ Create Lead</button>
      </div>

      {/* Table */}
      <div className="crm-tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Company</th>
              <th>Status</th>
              <th>Source</th>
              <th>Owner</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--fg3)' }}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-state-icon">◎</div>
                    <div>{search ? 'No leads match your search' : 'No leads yet'}</div>
                    {!search && <button className="crm-btn-primary" onClick={() => setModal('create')}>+ Create Lead</button>}
                  </div>
                </td>
              </tr>
            ) : filtered.map(lead => (
              <tr key={lead.id}>
                <td className="name-cell" onClick={() => setModal(lead)}>{lead.name || '—'}</td>
                <td>{lead.email || '—'}</td>
                <td>{lead.phone || '—'}</td>
                <td>{lead.company || '—'}</td>
                <td>{statusBadge(lead.status)}</td>
                <td>{lead.source || '—'}</td>
                <td>{lead.owner || '—'}</td>
                <td>
                  <div className="row-actions">
                    <button className="row-act-btn" onClick={() => setModal(lead)}>Edit</button>
                    <button className="row-act-btn del" onClick={() => handleDelete(lead.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="crm-tbl-footer">
        <span>Total Records <strong style={{ color: 'var(--fg)' }}>{filtered.length}</strong>
          {search && <span style={{ marginLeft: 6, color: 'var(--fg3)' }}>(filtered from {leads.length})</span>}
        </span>
      </div>

      {/* Modal */}
      {modal && (
        <LeadModal
          lead={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={d => saveMutation.mutate(d)}
          saving={saveMutation.isPending}
        />
      )}
    </div>
  )
}
