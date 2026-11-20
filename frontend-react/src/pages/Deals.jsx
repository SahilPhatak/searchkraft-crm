import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'

const DEAL_STAGES = ['Prospect','Proposal Sent','Negotiation','Interview Scheduled','Offer Extended','Joined','Absconded','Declined','On Hold']
const WON_STAGES = new Set(['Joined','Closed Won'])
const LOST_STAGES = new Set(['Absconded','Declined','Closed Lost'])
const OWNER_OPTIONS = ['Samyadeep','Vikram','Sahil','Urmila']

const STAGE_BADGE = {
  joined: 'badge-green', 'closed won': 'badge-green',
  absconded: 'badge-red', declined: 'badge-red', 'closed lost': 'badge-red',
  'on hold': 'badge-gray',
  prospect: 'badge-blue',
  'proposal sent': 'badge-purple',
  negotiation: 'badge-amber',
  'interview scheduled': 'badge-purple',
  'offer extended': 'badge-amber',
}

function stageBadge(s) {
  const key = (s || '').toLowerCase()
  return <span className={`badge ${STAGE_BADGE[key] || 'badge-gray'}`}>{s || '—'}</span>
}

function fmt(n) {
  if (!n) return '—'
  return '₹' + Number(n).toLocaleString('en-IN')
}

function DealModal({ deal, onClose, onSave, saving }) {
  const [f, setF] = useState(deal ? { ...deal } : {
    name: '', companyName: '', owner: '', stage: 'Prospect',
    amount: '', closeDate: '', probability: 10,
    source: '', recruiterName: '', clientSpoc: '', description: ''
  })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const expectedRevenue = Math.round((Number(f.amount) || 0) * (Number(f.probability) || 0) / 100)

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 600 }}>
        <div className="modal-hdr">
          <span>{deal ? 'Edit Deal' : 'Create Deal'}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
          <div className="lf-field" style={{ gridColumn: '1/-1' }}>
            <label>Deal Name *</label>
            <input type="text" value={f.name || ''} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="lf-field">
            <label>Company / Account *</label>
            <input type="text" value={f.companyName || ''} onChange={e => set('companyName', e.target.value)} />
          </div>
          <div className="lf-field">
            <label>Stage</label>
            <select value={f.stage || 'Prospect'} onChange={e => set('stage', e.target.value)}>
              {DEAL_STAGES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="lf-field">
            <label>Amount (₹)</label>
            <input type="number" min="0" value={f.amount || ''} onChange={e => set('amount', e.target.value)} />
          </div>
          <div className="lf-field">
            <label>Probability (%)</label>
            <input type="number" min="0" max="100" value={f.probability ?? 10} onChange={e => set('probability', e.target.value)} />
          </div>
          <div className="lf-field">
            <label>Expected Revenue</label>
            <input type="text" value={expectedRevenue ? `₹${expectedRevenue.toLocaleString('en-IN')}` : '—'} readOnly style={{ background: 'var(--surface2)', color: 'var(--fg3)' }} />
          </div>
          <div className="lf-field">
            <label>Closing Date</label>
            <input type="date" value={f.closeDate || f.close_date || ''} onChange={e => set('closeDate', e.target.value)} />
          </div>
          <div className="lf-field">
            <label>Deal Owner</label>
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
            <label>Description</label>
            <textarea value={f.description || ''} onChange={e => set('description', e.target.value)} rows={2} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="crm-toolbar-btn" onClick={onClose}>Cancel</button>
          <button className="crm-btn-primary" disabled={!f.name || !f.companyName || saving} onClick={() => onSave(f)}>
            {saving ? 'Saving…' : 'Save Deal'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Deals() {
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [modal, setModal] = useState(null)
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['deals'], queryFn: () => api.get('/api/deals')
  })

  const saveMutation = useMutation({
    mutationFn: d => d.id ? api.put(`/api/deals/${d.id}`, d) : api.post('/api/deals', d),
    onSuccess: (_, vars) => {
      qc.invalidateQueries(['deals'])
      qc.invalidateQueries(['deals-nav'])
      setModal(null)
      toast({ title: vars.id ? 'Deal updated' : 'Deal created' })
    },
    onError: e => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/api/deals/${id}`),
    onSuccess: () => { qc.invalidateQueries(['deals']); qc.invalidateQueries(['deals-nav']); toast({ title: 'Deal deleted' }) },
    onError: e => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const filtered = useMemo(() => {
    return deals.filter(d => {
      if (stageFilter && d.stage !== stageFilter) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (d.name || '').toLowerCase().includes(q) ||
        (d.companyName || d.company_name || '').toLowerCase().includes(q) ||
        (d.owner || '').toLowerCase().includes(q)
    })
  }, [deals, search, stageFilter])

  return (
    <div className="crm-page-wrap">
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-color)', padding: '0 20px', background: 'var(--surface)', flexShrink: 0 }}>
        <button className="crm-subtab active">All Deals</button>
      </div>

      <div className="crm-toolbar">
        <select
          className="crm-toolbar-btn"
          value={stageFilter}
          onChange={e => setStageFilter(e.target.value)}
          style={{ cursor: 'pointer' }}
        >
          <option value="">All Stages</option>
          {DEAL_STAGES.map(s => <option key={s}>{s}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <div className="crm-search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ opacity: 0.45, flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input placeholder="Search deals…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="crm-btn-primary" onClick={() => setModal('create')}>+ Create Deal</button>
      </div>

      <div className="crm-tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Deal Name</th>
              <th>Account</th>
              <th>Stage</th>
              <th>Amount</th>
              <th>Close Date</th>
              <th>Owner</th>
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
                  <div className="empty-state-icon">💼</div>
                  <div>{search || stageFilter ? 'No deals match your filter' : 'No deals yet'}</div>
                  {!search && !stageFilter && <button className="crm-btn-primary" onClick={() => setModal('create')}>+ Create Deal</button>}
                </div>
              </td></tr>
            ) : filtered.map(d => (
              <tr key={d.id}>
                <td className="name-cell" onClick={() => setModal(d)}>{d.name || '—'}</td>
                <td>{d.companyName || d.company_name || '—'}</td>
                <td>{stageBadge(d.stage)}</td>
                <td><span className="mono">{fmt(d.amount || d.value)}</span></td>
                <td>{d.closeDate || d.close_date || '—'}</td>
                <td>{d.owner || '—'}</td>
                <td>{d.recruiterName || d.recruiter_name || '—'}</td>
                <td>
                  <div className="row-actions">
                    <button className="row-act-btn" onClick={() => setModal(d)}>Edit</button>
                    <button className="row-act-btn del" onClick={() => window.confirm('Delete this deal?') && deleteMutation.mutate(d.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="crm-tbl-footer">
        <span>Total Records <strong style={{ color: 'var(--fg)' }}>{filtered.length}</strong>
          {(search || stageFilter) && <span style={{ marginLeft: 6, color: 'var(--fg3)' }}>(filtered from {deals.length})</span>}
        </span>
        <span style={{ color: 'var(--fg3)' }}>
          Total Value: <strong style={{ color: 'var(--fg)' }}>{fmt(filtered.reduce((s, d) => s + (Number(d.amount || d.value) || 0), 0))}</strong>
        </span>
      </div>

      {modal && (
        <DealModal
          deal={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={d => saveMutation.mutate(d)}
          saving={saveMutation.isPending}
        />
      )}
    </div>
  )
}
