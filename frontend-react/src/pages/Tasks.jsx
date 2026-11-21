import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'

const OWNER_OPTIONS = ['Samyadeep','Vikram','Sahil','Urmila']
const TYPE_OPTIONS = ['Follow-up','BD Call','Client Update','Admin','Interview','Offer','Other']
const STATUS_OPTIONS = ['Pending','In Progress','Done']

const STATUS_BADGE = { pending: 'badge-amber', 'in progress': 'badge-blue', done: 'badge-green', completed: 'badge-green' }

function statusBadge(s) {
  const key = (s || '').toLowerCase()
  return <span className={`badge ${STATUS_BADGE[key] || 'badge-gray'}`}>{s || 'Pending'}</span>
}

function isOverdue(task) {
  if (!task.dueDate && !task.due_date) return false
  const status = (task.status || '').toLowerCase()
  if (status === 'done' || status === 'completed') return false
  return new Date(task.dueDate || task.due_date) < new Date()
}

function TaskModal({ task, onClose, onSave, saving }) {
  const [f, setF] = useState(task ? { ...task } : {
    title: '', type: 'Follow-up', owner: '', relatedTo: '',
    dueDate: '', status: 'Pending'
  })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 480 }}>
        <div className="modal-hdr">
          <span>{task ? 'Edit Task' : 'Add Task'}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
          <div className="lf-field" style={{ gridColumn: '1/-1' }}>
            <label>Task *</label>
            <input type="text" value={f.title || ''} onChange={e => set('title', e.target.value)} />
          </div>
          <div className="lf-field">
            <label>Type</label>
            <select value={f.type || 'Follow-up'} onChange={e => set('type', e.target.value)}>
              {TYPE_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="lf-field">
            <label>Owner</label>
            <select value={f.owner || ''} onChange={e => set('owner', e.target.value)}>
              <option value="">-None-</option>
              {OWNER_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="lf-field">
            <label>Due Date</label>
            <input type="date" value={f.dueDate || f.due_date || ''} onChange={e => set('dueDate', e.target.value)} />
          </div>
          <div className="lf-field">
            <label>Status</label>
            <select value={f.status || 'Pending'} onChange={e => set('status', e.target.value)}>
              {STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="lf-field" style={{ gridColumn: '1/-1' }}>
            <label>Related To</label>
            <input type="text" value={f.relatedTo || f.related_to || ''} onChange={e => set('relatedTo', e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="crm-toolbar-btn" onClick={onClose}>Cancel</button>
          <button className="crm-btn-primary" disabled={!f.title || saving} onClick={() => onSave(f)}>
            {saving ? 'Saving…' : 'Save Task'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Tasks() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal] = useState(null)
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'], queryFn: () => api.get('/api/tasks')
  })

  const saveMutation = useMutation({
    mutationFn: d => d.id ? api.put(`/api/tasks/${d.id}`, d) : api.post('/api/tasks', d),
    onSuccess: (_, vars) => {
      qc.invalidateQueries(['tasks'])
      qc.invalidateQueries(['tasks-nav'])
      setModal(null)
      toast({ title: vars.id ? 'Task updated' : 'Task created' })
    },
    onError: e => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/api/tasks/${id}`),
    onSuccess: () => { qc.invalidateQueries(['tasks']); qc.invalidateQueries(['tasks-nav']); toast({ title: 'Task deleted' }) },
    onError: e => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (statusFilter && (t.status || '').toLowerCase() !== statusFilter.toLowerCase()) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (t.title || '').toLowerCase().includes(q) ||
        (t.owner || '').toLowerCase().includes(q) ||
        (t.relatedTo || t.related_to || '').toLowerCase().includes(q)
    })
  }, [tasks, search, statusFilter])

  const markDone = task => {
    saveMutation.mutate({ ...task, status: 'Done' })
  }

  return (
    <div className="crm-page-wrap">
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-color)', padding: '0 20px', background: 'var(--surface)', flexShrink: 0 }}>
        <button className="crm-subtab active">All Tasks</button>
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
          <input placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="crm-btn-primary" onClick={() => setModal('create')}>+ Add Task</button>
      </div>

      <div className="crm-tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>Type</th>
              <th>Owner</th>
              <th>Related To</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--fg3)' }}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7}>
                <div className="empty-state">
                  <div className="empty-state-icon">✓</div>
                  <div>{search || statusFilter ? 'No tasks match your filter' : 'No tasks yet'}</div>
                  {!search && !statusFilter && <button className="crm-btn-primary" onClick={() => setModal('create')}>+ Add Task</button>}
                </div>
              </td></tr>
            ) : filtered.map(t => (
              <tr key={t.id} style={isOverdue(t) ? { background: 'rgba(239,68,68,0.04)' } : {}}>
                <td className="name-cell" onClick={() => setModal(t)}>
                  {t.title || '—'}
                  {isOverdue(t) && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--red)', fontWeight: 600 }}>OVERDUE</span>}
                </td>
                <td>{t.type || '—'}</td>
                <td>{t.owner || '—'}</td>
                <td>{t.relatedTo || t.related_to || '—'}</td>
                <td>{t.dueDate || t.due_date || '—'}</td>
                <td>{statusBadge(t.status)}</td>
                <td>
                  <div className="row-actions">
                    {(t.status || '').toLowerCase() !== 'done' && (
                      <button className="row-act-btn" onClick={() => markDone(t)} style={{ color: 'var(--green)' }}>✓ Done</button>
                    )}
                    <button className="row-act-btn" onClick={() => setModal(t)}>Edit</button>
                    <button className="row-act-btn del" onClick={() => window.confirm('Delete this task?') && deleteMutation.mutate(t.id)}>Del</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="crm-tbl-footer">
        <span>Total Records <strong style={{ color: 'var(--fg)' }}>{filtered.length}</strong>
          {(search || statusFilter) && <span style={{ marginLeft: 6, color: 'var(--fg3)' }}>(filtered from {tasks.length})</span>}
        </span>
        <span style={{ color: 'var(--fg3)' }}>
          Pending: <strong style={{ color: 'var(--amber)' }}>{tasks.filter(t => (t.status || '').toLowerCase() !== 'done' && (t.status || '').toLowerCase() !== 'completed').length}</strong>
        </span>
      </div>

      {modal && (
        <TaskModal
          task={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={d => saveMutation.mutate(d)}
          saving={saveMutation.isPending}
        />
      )}
    </div>
  )
}
