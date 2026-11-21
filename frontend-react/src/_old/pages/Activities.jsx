import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'

const OWNER_OPTIONS = ['Samyadeep','Vikram','Sahil','Urmila']
const TYPE_OPTIONS = ['Call','Email','Meeting','LinkedIn']

const TYPE_BADGE = {
  call: 'badge-blue', email: 'badge-green',
  meeting: 'badge-purple', linkedin: 'badge-amber',
}

function typeBadge(t) {
  const key = (t || '').toLowerCase()
  return <span className={`badge ${TYPE_BADGE[key] || 'badge-gray'}`}>{t || '—'}</span>
}

function ActivityModal({ activity, onClose, onSave, saving }) {
  const today = new Date().toISOString().slice(0, 10)
  const [f, setF] = useState(activity ? { ...activity } : {
    type: 'Call', date: today, time: '', summary: '',
    contact: '', company: '', owner: ''
  })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 500 }}>
        <div className="modal-hdr">
          <span>{activity ? 'Edit Activity' : 'Log Activity'}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
          <div className="lf-field">
            <label>Type</label>
            <select value={f.type || 'Call'} onChange={e => set('type', e.target.value)}>
              {TYPE_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="lf-field">
            <label>Date</label>
            <input type="date" value={(f.date || '').slice(0, 10)} onChange={e => set('date', e.target.value)} />
          </div>
          <div className="lf-field">
            <label>Time</label>
            <input type="time" value={(f.time || '').slice(0, 5)} onChange={e => set('time', e.target.value)} />
          </div>
          <div className="lf-field">
            <label>Owner</label>
            <select value={f.owner || ''} onChange={e => set('owner', e.target.value)}>
              <option value="">-None-</option>
              {OWNER_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="lf-field" style={{ gridColumn: '1/-1' }}>
            <label>Summary *</label>
            <textarea value={f.summary || f.subject || ''} onChange={e => set('summary', e.target.value)} rows={3} />
          </div>
          <div className="lf-field">
            <label>Contact</label>
            <input type="text" value={f.contact || ''} onChange={e => set('contact', e.target.value)} />
          </div>
          <div className="lf-field">
            <label>Company</label>
            <input type="text" value={f.company || ''} onChange={e => set('company', e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="crm-toolbar-btn" onClick={onClose}>Cancel</button>
          <button className="crm-btn-primary" disabled={!(f.summary || f.subject) || saving} onClick={() => onSave(f)}>
            {saving ? 'Saving…' : 'Save Activity'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Activities() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [modal, setModal] = useState(null)
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities'], queryFn: () => api.get('/api/activities')
  })

  const saveMutation = useMutation({
    mutationFn: d => d.id ? api.put(`/api/activities/${d.id}`, d) : api.post('/api/activities', d),
    onSuccess: (_, vars) => {
      qc.invalidateQueries(['activities'])
      setModal(null)
      toast({ title: vars.id ? 'Activity updated' : 'Activity logged' })
    },
    onError: e => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/api/activities/${id}`),
    onSuccess: () => { qc.invalidateQueries(['activities']); toast({ title: 'Activity deleted' }) },
    onError: e => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const filtered = useMemo(() => {
    return activities.filter(a => {
      if (typeFilter && (a.type || '').toLowerCase() !== typeFilter.toLowerCase()) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (a.summary || a.subject || '').toLowerCase().includes(q) ||
        (a.contact || '').toLowerCase().includes(q) ||
        (a.company || '').toLowerCase().includes(q) ||
        (a.owner || '').toLowerCase().includes(q)
    })
  }, [activities, search, typeFilter])

  return (
    <div className="crm-page-wrap">
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-color)', padding: '0 20px', background: 'var(--surface)', flexShrink: 0 }}>
        <button className="crm-subtab active">All Activities</button>
      </div>

      <div className="crm-toolbar">
        <select className="crm-toolbar-btn" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ cursor: 'pointer' }}>
          <option value="">All Types</option>
          {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <div className="crm-search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ opacity: 0.45, flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input placeholder="Search activities…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="crm-btn-primary" onClick={() => setModal('create')}>+ Log Activity</button>
      </div>

      <div className="crm-tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Summary</th>
              <th>Contact</th>
              <th>Company</th>
              <th>Date</th>
              <th>Owner</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--fg3)' }}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7}>
                <div className="empty-state">
                  <div className="empty-state-icon">📞</div>
                  <div>{search || typeFilter ? 'No activities match your filter' : 'No activities logged yet'}</div>
                  {!search && !typeFilter && <button className="crm-btn-primary" onClick={() => setModal('create')}>+ Log Activity</button>}
                </div>
              </td></tr>
            ) : filtered.map(a => (
              <tr key={a.id}>
                <td>{typeBadge(a.type)}</td>
                <td className="name-cell" style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  onClick={() => setModal(a)} title={a.summary || a.subject}>
                  {a.summary || a.subject || '—'}
                </td>
                <td>{a.contact || '—'}</td>
                <td>{a.company || '—'}</td>
                <td><span className="mono">{(a.date || '').slice(0, 10) || '—'}</span></td>
                <td>{a.owner || '—'}</td>
                <td>
                  <div className="row-actions">
                    <button className="row-act-btn" onClick={() => setModal(a)}>Edit</button>
                    <button className="row-act-btn del" onClick={() => window.confirm('Delete this activity?') && deleteMutation.mutate(a.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="crm-tbl-footer">
        <span>Total Records <strong style={{ color: 'var(--fg)' }}>{filtered.length}</strong>
          {(search || typeFilter) && <span style={{ marginLeft: 6, color: 'var(--fg3)' }}>(filtered from {activities.length})</span>}
        </span>
      </div>

      {modal && (
        <ActivityModal
          activity={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={d => saveMutation.mutate(d)}
          saving={saveMutation.isPending}
        />
      )}
    </div>
  )
}
