import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'

const OWNER_OPTIONS = ['Samyadeep','Vikram','Sahil','Urmila']
const DELIVERY_OPTIONS = ['Samyadeep','Vikram']
const INDUSTRY_OPTIONS = ['Technology','Finance','Healthcare','Education','Manufacturing','Retail','Real Estate','Media','Consulting','Other']
const STATUS_OPTIONS = ['Active','Inactive']

const STATUS_BADGE = { active: 'badge-green', inactive: 'badge-gray' }

function statusBadge(s) {
  const key = (s || '').toLowerCase()
  return <span className={`badge ${STATUS_BADGE[key] || 'badge-gray'}`}>{s || 'Active'}</span>
}

function CompanyModal({ company, onClose, onSave, saving }) {
  const [f, setF] = useState(company ? { ...company } : {
    name: '', industry: '', website: '', phone: '',
    bdOwner: '', deliveryPillar: '', status: 'Active',
    billingCity: '', billingCountry: ''
  })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 580 }}>
        <div className="modal-hdr">
          <span>{company ? 'Edit Account' : 'Create Account'}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
          <div className="lf-field" style={{ gridColumn: '1/-1' }}>
            <label>Account Name *</label>
            <input type="text" value={f.name || ''} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="lf-field">
            <label>Industry</label>
            <select value={f.industry || ''} onChange={e => set('industry', e.target.value)}>
              <option value="">-None-</option>
              {INDUSTRY_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="lf-field">
            <label>Status</label>
            <select value={f.status || 'Active'} onChange={e => set('status', e.target.value)}>
              {STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="lf-field">
            <label>Phone</label>
            <input type="tel" value={f.phone || ''} onChange={e => set('phone', e.target.value)} />
          </div>
          <div className="lf-field">
            <label>Website</label>
            <input type="url" placeholder="https://" value={f.website || ''} onChange={e => set('website', e.target.value)} />
          </div>
          <div className="lf-field">
            <label>BD Owner</label>
            <select value={f.bdOwner || f.owner || ''} onChange={e => set('bdOwner', e.target.value)}>
              <option value="">-None-</option>
              {OWNER_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="lf-field">
            <label>Delivery Pillar</label>
            <select value={f.deliveryPillar || f.delivery_pillar || ''} onChange={e => set('deliveryPillar', e.target.value)}>
              <option value="">-None-</option>
              {DELIVERY_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="lf-field">
            <label>City</label>
            <input type="text" value={f.billingCity || f.city || ''} onChange={e => set('billingCity', e.target.value)} />
          </div>
          <div className="lf-field">
            <label>Country</label>
            <input type="text" value={f.billingCountry || f.country || ''} onChange={e => set('billingCountry', e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="crm-toolbar-btn" onClick={onClose}>Cancel</button>
          <button className="crm-btn-primary" disabled={!f.name || saving} onClick={() => onSave(f)}>
            {saving ? 'Saving…' : 'Save Account'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Companies() {
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies'], queryFn: () => api.get('/api/companies')
  })

  const saveMutation = useMutation({
    mutationFn: d => d.id ? api.put(`/api/companies/${d.id}`, d) : api.post('/api/companies', d),
    onSuccess: (_, vars) => {
      qc.invalidateQueries(['companies'])
      setModal(null)
      toast({ title: vars.id ? 'Account updated' : 'Account created' })
    },
    onError: e => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/api/companies/${id}`),
    onSuccess: () => { qc.invalidateQueries(['companies']); toast({ title: 'Account deleted' }) },
    onError: e => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const filtered = useMemo(() => {
    if (!search) return companies
    const q = search.toLowerCase()
    return companies.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.industry || '').toLowerCase().includes(q) ||
      (c.billingCity || c.city || '').toLowerCase().includes(q) ||
      (c.bdOwner || c.owner || '').toLowerCase().includes(q)
    )
  }, [companies, search])

  return (
    <div className="crm-page-wrap">
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-color)', padding: '0 20px', background: 'var(--surface)', flexShrink: 0 }}>
        <button className="crm-subtab active">All Accounts</button>
      </div>

      <div className="crm-toolbar">
        <div style={{ flex: 1 }} />
        <div className="crm-search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ opacity: 0.45, flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input placeholder="Search accounts…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="crm-btn-primary" onClick={() => setModal('create')}>+ Create Account</button>
      </div>

      <div className="crm-tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Account Name</th>
              <th>Industry</th>
              <th>City</th>
              <th>Status</th>
              <th>BD Owner</th>
              <th>Delivery Pillar</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--fg3)' }}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7}>
                <div className="empty-state">
                  <div className="empty-state-icon">🏢</div>
                  <div>{search ? 'No accounts match your search' : 'No accounts yet'}</div>
                  {!search && <button className="crm-btn-primary" onClick={() => setModal('create')}>+ Create Account</button>}
                </div>
              </td></tr>
            ) : filtered.map(c => (
              <tr key={c.id}>
                <td className="name-cell" onClick={() => setModal(c)}>{c.name || '—'}</td>
                <td>{c.industry || '—'}</td>
                <td>{c.billingCity || c.city || '—'}</td>
                <td>{statusBadge(c.status)}</td>
                <td>{c.bdOwner || c.owner || '—'}</td>
                <td>{c.deliveryPillar || c.delivery_pillar || '—'}</td>
                <td>
                  <div className="row-actions">
                    <button className="row-act-btn" onClick={() => setModal(c)}>Edit</button>
                    <button className="row-act-btn del" onClick={() => window.confirm('Delete this account?') && deleteMutation.mutate(c.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="crm-tbl-footer">
        <span>Total Records <strong style={{ color: 'var(--fg)' }}>{filtered.length}</strong>
          {search && <span style={{ marginLeft: 6, color: 'var(--fg3)' }}>(filtered from {companies.length})</span>}
        </span>
      </div>

      {modal && (
        <CompanyModal
          company={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={d => saveMutation.mutate(d)}
          saving={saveMutation.isPending}
        />
      )}
    </div>
  )
}
