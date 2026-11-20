import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'

const OWNER_OPTIONS = ['Samyadeep','Vikram','Sahil','Urmila']
const STATUS_OPTIONS = ['Active','Completed','On Hold','Cancelled']

const STATUS_BADGE = {
  active: 'badge-green', completed: 'badge-blue',
  'on hold': 'badge-amber', cancelled: 'badge-red'
}

function statusBadge(s) {
  const key = (s || '').toLowerCase()
  return <span className={`badge ${STATUS_BADGE[key] || 'badge-gray'}`}>{s || 'Active'}</span>
}

function fmt(n) {
  if (!n) return '—'
  return '₹' + Number(n).toLocaleString('en-IN')
}

function BusinessModal({ record, onClose, onSave, saving }) {
  const [f, setF] = useState(record ? { ...record } : {
    clientName: '', companyName: '', owner: '', status: 'Active',
    positionTitle: '', startDate: '', joiningDate: '', salary: '',
    recruiterName: '', clientSpoc: '', notes: ''
  })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 600 }}>
        <div className="modal-hdr">
          <span>{record ? 'Edit Record' : 'Add Onboarded Business'}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
          <div className="lf-field">
            <label>Client / Candidate Name *</label>
            <input type="text" value={f.clientName || f.client_name || ''} onChange={e => set('clientName', e.target.value)} />
          </div>
          <div className="lf-field">
            <label>Company</label>
            <input type="text" value={f.companyName || f.company_name || ''} onChange={e => set('companyName', e.target.value)} />
          </div>
          <div className="lf-field">
            <label>Position Title</label>
            <input type="text" value={f.positionTitle || f.position_title || ''} onChange={e => set('positionTitle', e.target.value)} />
          </div>
          <div className="lf-field">
            <label>Status</label>
            <select value={f.status || 'Active'} onChange={e => set('status', e.target.value)}>
              {STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="lf-field">
            <label>Start Date</label>
            <input type="date" value={f.startDate || f.start_date || ''} onChange={e => set('startDate', e.target.value)} />
          </div>
          <div className="lf-field">
            <label>Joining Date</label>
            <input type="date" value={f.joiningDate || f.joining_date || ''} onChange={e => set('joiningDate', e.target.value)} />
          </div>
          <div className="lf-field">
            <label>Salary / CTC (₹)</label>
            <input type="number" min="0" value={f.salary || ''} onChange={e => set('salary', e.target.value)} />
          </div>
          <div className="lf-field">
            <label>Owner</label>
            <select value={f.owner || ''} onChange={e => set('owner', e.target.value)}>
              <option value="">-None-</option>
              {OWNER_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="lf-field">
            <label>Recruiter</label>
            <input type="text" value={f.recruiterName || f.recruiter_name || ''} onChange={e => set('recruiterName', e.target.value)} />
          </div>
          <div className="lf-field">
            <label>Client SPOC</label>
            <select value={f.clientSpoc || f.client_spoc || ''} onChange={e => set('clientSpoc', e.target.value)}>
              <option value="">-None-</option>
              {['Vikram','Samyadeep'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="lf-field" style={{ gridColumn: '1/-1' }}>
            <label>Notes</label>
            <textarea value={f.notes || ''} onChange={e => set('notes', e.target.value)} rows={2} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="crm-toolbar-btn" onClick={onClose}>Cancel</button>
          <button className="crm-btn-primary" disabled={!(f.clientName || f.client_name) || saving} onClick={() => onSave(f)}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Business() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal] = useState(null)
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['business'], queryFn: () => api.get('/api/business')
  })

  const saveMutation = useMutation({
    mutationFn: d => d.id ? api.put(`/api/business/${d.id}`, d) : api.post('/api/business', d),
    onSuccess: (_, vars) => {
      qc.invalidateQueries(['business'])
      setModal(null)
      toast({ title: vars.id ? 'Record updated' : 'Record added' })
    },
    onError: e => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/api/business/${id}`),
    onSuccess: () => { qc.invalidateQueries(['business']); toast({ title: 'Record deleted' }) },
    onError: e => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (statusFilter && (r.status || '').toLowerCase() !== statusFilter.toLowerCase()) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (r.clientName || r.client_name || '').toLowerCase().includes(q) ||
        (r.companyName || r.company_name || '').toLowerCase().includes(q) ||
        (r.positionTitle || r.position_title || '').toLowerCase().includes(q)
    })
  }, [records, search, statusFilter])

  return (
    <div className="crm-page-wrap">
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-color)', padding: '0 20px', background: 'var(--surface)', flexShrink: 0 }}>
        <button className="crm-subtab active">Business Onboarded</button>
      </div>

      <div className="crm-toolbar">
        <select className="crm-toolbar-btn" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ cursor: 'pointer' }}>
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <div className="crm-search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ opacity: 0.45, flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="crm-btn-primary" onClick={() => setModal('create')}>+ Add Record</button>
      </div>

      <div className="crm-tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Client / Candidate</th>
              <th>Company</th>
              <th>Position</th>
              <th>Status</th>
              <th>Joining Date</th>
              <th>Salary / CTC</th>
              <th>Recruiter</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--fg3)' }}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8}>
                <div className="empty-state">
                  <div className="empty-state-icon">🤝</div>
                  <div>{search || statusFilter ? 'No records match your filter' : 'No business onboarded yet'}</div>
                  {!search && !statusFilter && <button className="crm-btn-primary" onClick={() => setModal('create')}>+ Add Record</button>}
                </div>
              </td></tr>
            ) : filtered.map(r => (
              <tr key={r.id}>
                <td className="name-cell" onClick={() => setModal(r)}>{r.clientName || r.client_name || '—'}</td>
                <td>{r.companyName || r.company_name || '—'}</td>
                <td>{r.positionTitle || r.position_title || '—'}</td>
                <td>{statusBadge(r.status)}</td>
                <td><span className="mono">{r.joiningDate || r.joining_date || '—'}</span></td>
                <td><span className="mono">{fmt(r.salary)}</span></td>
                <td>{r.recruiterName || r.recruiter_name || '—'}</td>
                <td>
                  <div className="row-actions">
                    <button className="row-act-btn" onClick={() => setModal(r)}>Edit</button>
                    <button className="row-act-btn del" onClick={() => window.confirm('Delete this record?') && deleteMutation.mutate(r.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="crm-tbl-footer">
        <span>Total Records <strong style={{ color: 'var(--fg)' }}>{filtered.length}</strong>
          {(search || statusFilter) && <span style={{ marginLeft: 6, color: 'var(--fg3)' }}>(filtered from {records.length})</span>}
        </span>
      </div>

      {modal && (
        <BusinessModal
          record={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={d => saveMutation.mutate(d)}
          saving={saveMutation.isPending}
        />
      )}
    </div>
  )
}
