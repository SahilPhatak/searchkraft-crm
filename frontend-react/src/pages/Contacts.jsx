import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'

const OWNER_OPTIONS = ['Samyadeep','Vikram','Sahil','Urmila']
const SOURCE_OPTIONS = ['Cold Call','Email','Existing Client','Partner','Conference','Trade Show','Web Site','Word of Mouth','LinkedIn','Referral','Other']

function ContactModal({ contact, onClose, onSave, saving }) {
  const [f, setF] = useState(contact ? { ...contact } : {
    firstName: '', lastName: '', email: '', phone: '', mobile: '',
    companyName: '', title: '', owner: '', leadSource: ''
  })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 580 }}>
        <div className="modal-hdr">
          <span>{contact ? 'Edit Contact' : 'Create Contact'}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
          <div className="lf-field">
            <label>First Name</label>
            <input type="text" value={f.firstName || ''} onChange={e => set('firstName', e.target.value)} />
          </div>
          <div className="lf-field">
            <label>Last Name *</label>
            <input type="text" value={f.lastName || ''} onChange={e => set('lastName', e.target.value)} />
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
            <label>Title</label>
            <input type="text" value={f.title || ''} onChange={e => set('title', e.target.value)} />
          </div>
          <div className="lf-field">
            <label>Account Name</label>
            <input type="text" value={f.companyName || ''} onChange={e => set('companyName', e.target.value)} />
          </div>
          <div className="lf-field">
            <label>Owner</label>
            <select value={f.owner || ''} onChange={e => set('owner', e.target.value)}>
              <option value="">-None-</option>
              {OWNER_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="lf-field">
            <label>Lead Source</label>
            <select value={f.leadSource || ''} onChange={e => set('leadSource', e.target.value)}>
              <option value="">-None-</option>
              {SOURCE_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="crm-toolbar-btn" onClick={onClose}>Cancel</button>
          <button className="crm-btn-primary" disabled={!f.lastName || saving} onClick={() => onSave(f)}>
            {saving ? 'Saving…' : 'Save Contact'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Contacts() {
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'], queryFn: () => api.get('/api/contacts')
  })

  const saveMutation = useMutation({
    mutationFn: d => d.id ? api.put(`/api/contacts/${d.id}`, d) : api.post('/api/contacts', d),
    onSuccess: (_, vars) => {
      qc.invalidateQueries(['contacts'])
      setModal(null)
      toast({ title: vars.id ? 'Contact updated' : 'Contact created' })
    },
    onError: e => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/api/contacts/${id}`),
    onSuccess: () => { qc.invalidateQueries(['contacts']); toast({ title: 'Contact deleted' }) },
    onError: e => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const filtered = useMemo(() => {
    if (!search) return contacts
    const q = search.toLowerCase()
    return contacts.filter(c =>
      (c.name || `${c.firstName || ''} ${c.lastName || ''}`).toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.companyName || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q)
    )
  }, [contacts, search])

  const displayName = c => c.name || [c.firstName, c.lastName].filter(Boolean).join(' ') || '—'

  return (
    <div className="crm-page-wrap">
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-color)', padding: '0 20px', background: 'var(--surface)', flexShrink: 0 }}>
        <button className="crm-subtab active">All Contacts</button>
      </div>

      <div className="crm-toolbar">
        <div style={{ flex: 1 }} />
        <div className="crm-search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ opacity: 0.45, flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input placeholder="Search contacts…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="crm-btn-primary" onClick={() => setModal('create')}>+ Create Contact</button>
      </div>

      <div className="crm-tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Account</th>
              <th>Title</th>
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
                  <div className="empty-state-icon">👤</div>
                  <div>{search ? 'No contacts match your search' : 'No contacts yet'}</div>
                  {!search && <button className="crm-btn-primary" onClick={() => setModal('create')}>+ Create Contact</button>}
                </div>
              </td></tr>
            ) : filtered.map(c => (
              <tr key={c.id}>
                <td className="name-cell" onClick={() => setModal(c)}>{displayName(c)}</td>
                <td>{c.email || '—'}</td>
                <td>{c.phone || c.mobile || '—'}</td>
                <td>{c.companyName || '—'}</td>
                <td>{c.title || '—'}</td>
                <td>{c.owner || '—'}</td>
                <td>
                  <div className="row-actions">
                    <button className="row-act-btn" onClick={() => setModal(c)}>Edit</button>
                    <button className="row-act-btn del" onClick={() => window.confirm('Delete this contact?') && deleteMutation.mutate(c.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="crm-tbl-footer">
        <span>Total Records <strong style={{ color: 'var(--fg)' }}>{filtered.length}</strong>
          {search && <span style={{ marginLeft: 6, color: 'var(--fg3)' }}>(filtered from {contacts.length})</span>}
        </span>
      </div>

      {modal && (
        <ContactModal
          contact={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={d => saveMutation.mutate(d)}
          saving={saveMutation.isPending}
        />
      )}
    </div>
  )
}
