// Shared building blocks ported from production public/index.html.
// Every page uses these, so a fix here fixes it everywhere.
import { useEffect, useMemo, useState } from 'react'
import { badgeClass } from '@/lib/format'
import { useUiStore } from '@/store/uiStore'

// ---- Status badge (production badge()) ----
export function Badge({ status }) {
  if (!status) return <span className="badge badge-gray">—</span>
  return <span className={'badge ' + badgeClass(status)}>{status}</span>
}

// ---- Table action icons (production ICON_EDIT / ICON_TRASH) ----
export const IconEdit = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
)
export const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
)

// ---- Centered modal (production #modal-overlay) ----
export function Modal({ title, onClose, onSave, saving, saveLabel = 'Save', hideSave, children, width }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="modal-overlay" id="modal-overlay" style={{ display: 'flex' }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" id="modal-box" style={width ? { maxWidth: width } : undefined}>
        <div className="modal-header">
          <h3 id="modal-title">{title}</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" id="modal-body">{children}</div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          {!hideSave && <button className="btn btn-primary" id="modal-save" onClick={onSave} disabled={saving}>{saving ? 'Saving…' : saveLabel}</button>}
        </div>
      </div>
    </div>
  )
}

// ---- Full-page record form (production #lead-form-overlay, Zoho style) ----
export function FullPageForm({ title, onCancel, onSave, onSaveAndNew, saving, children }) {
  return (
    <div id="lead-form-overlay" className="lead-form-overlay" style={{ display: 'flex' }}>
      <div className="lead-form-topbar">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <div className="lf-title">{title}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          {onSaveAndNew && <button className="btn btn-secondary" onClick={onSaveAndNew} disabled={saving}>Save and New</button>}
          <button className="btn btn-primary" onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
      <div className="lead-form-body">{children}</div>
    </div>
  )
}

// ---- Pagination (production renderPagination) ----
export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  const btn = (disabled) => ({ padding: '4px 12px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--surface2)', color: 'var(--fg)', fontSize: '12px', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.4 : 1 })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderTop: '1px solid var(--border)', justifyContent: 'flex-end', background: 'var(--surface)' }}>
      <span style={{ fontSize: '12px', color: 'var(--fg2)', marginRight: '8px' }}>Page {page} of {totalPages}</span>
      <button onClick={() => onChange(page - 1)} disabled={page <= 1} style={btn(page <= 1)}>← Prev</button>
      <button onClick={() => onChange(page + 1)} disabled={page >= totalPages} style={btn(page >= totalPages)}>Next →</button>
    </div>
  )
}

/** Paging state that resets to page 1 when the filtered list changes size via search. */
export function usePaged(rows, pageSize, resetKey) {
  const [page, setPage] = useState(1)
  useEffect(() => { setPage(1) }, [resetKey])
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const cur = Math.min(page, totalPages)
  const pageRows = useMemo(() => rows.slice((cur - 1) * pageSize, cur * pageSize), [rows, cur, pageSize])
  const from = rows.length ? (cur - 1) * pageSize + 1 : 0
  const to = Math.min(cur * pageSize, rows.length)
  return { page: cur, setPage, totalPages, pageRows, from, to }
}

// ---- Row selection for bulk actions ----
export function useRowSelection(visibleIds) {
  const [selected, setSelected] = useState(() => new Set())
  // drop selections that are no longer visible (filtered out / deleted)
  const key = visibleIds.join(',')
  useEffect(() => { setSelected((s) => new Set([...s].filter((id) => visibleIds.includes(id)))) }, [key]) // eslint-disable-line react-hooks/exhaustive-deps
  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const all = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id))
  const some = selected.size > 0 && !all
  const toggleAll = () => setSelected(all ? new Set() : new Set(visibleIds))
  const clear = () => setSelected(new Set())
  return { selected, toggle, toggleAll, all, some, clear, ids: [...selected] }
}

/** Master checkbox with indeterminate state (production selectAll + _onRowCheckbox) */
export function MasterCheckbox({ selection }) {
  return (
    <input
      type="checkbox"
      style={{ accentColor: 'var(--accent)' }}
      checked={selection.all}
      ref={(el) => { if (el) el.indeterminate = selection.some }}
      onChange={selection.toggleAll}
    />
  )
}

// ---- Sticky bulk-action bar (production _updateBulkBar) ----
const barBtn = { background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.5)', color: '#fff', padding: '5px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }
const barSel = { background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.5)', color: '#fff', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', maxWidth: '140px' }

export function BulkActionBar({ count, owners, stages, onDelete, onAssign, onStage, onExport, onCancel }) {
  const [owner, setOwner] = useState('')
  const [stage, setStage] = useState('')
  if (!count) return null
  return (
    <div className="bulk-action-bar" style={{ position: 'sticky', bottom: '0', left: '0', right: '0', background: 'var(--accent)', color: '#fff', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '14px', fontSize: '13px', fontWeight: '600', zIndex: '100', borderTop: '2px solid rgba(255,255,255,0.3)', flexWrap: 'wrap' }}>
      <span style={{ fontWeight: '700' }}>{count} record{count > 1 ? 's' : ''} selected</span>
      {onDelete && <button onClick={onDelete} style={{ ...barBtn, background: 'rgba(239,68,68,0.3)', border: '1px solid rgba(239,68,68,0.6)' }}>🗑 Delete</button>}
      {onAssign && (
        <>
          <select value={owner} onChange={(e) => setOwner(e.target.value)} style={barSel}>
            <option value="">— Assign Owner —</option>
            {owners.map((o) => <option key={o} value={o} style={{ color: '#000' }}>{o}</option>)}
          </select>
          <button onClick={() => onAssign(owner)} style={barBtn}>👤 Assign</button>
        </>
      )}
      {onStage && stages?.length > 0 && (
        <>
          <select value={stage} onChange={(e) => setStage(e.target.value)} style={barSel}>
            <option value="">— Set Stage —</option>
            {stages.map((s) => <option key={s} value={s} style={{ color: '#000' }}>{s}</option>)}
          </select>
          <button onClick={() => onStage(stage)} style={barBtn}>📋 Apply Stage</button>
        </>
      )}
      {onExport && <button onClick={onExport} style={barBtn}>⬇ Export CSV</button>}
      <button onClick={onCancel} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', padding: '5px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>✕ Cancel</button>
    </div>
  )
}

/** Download rows as CSV (production _bulkExportCSV) */
export function exportCSV(module, rows) {
  if (!rows.length) return
  const cols = Object.keys(rows[0]).filter((k) => k !== 'id' && !k.startsWith('_'))
  const esc = (v) => '"' + String(v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : v).replace(/"/g, '""') + '"'
  const csv = [cols.map(esc).join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = `${module}_export_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}

/** Debounced value (production debounce(key, fn, 350)) */
export function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value)
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t) }, [value, ms])
  return v
}

/** Search text for a list page: its own box, kept in sync with the topbar search (production handleTopbarSearch). */
export function usePageSearch() {
  const topbar = useUiStore((s) => s.topbarSearch)
  const setTopbar = useUiStore((s) => s.setTopbarSearch)
  return [topbar, setTopbar]
}

/**
 * Opens a create form when the topbar "+" panel asked for this record type
 * (production createPanelOpen → navigateTo → openModal). Calls open(defaults) once.
 */
export function usePendingCreate(types, open) {
  const pending = useUiStore((s) => s.pendingCreate)
  const clear = useUiStore((s) => s.clearPendingCreate)
  useEffect(() => {
    if (pending && types.includes(pending.type)) { open(pending.type, pending.defaults); clear() }
  }, [pending]) // eslint-disable-line react-hooks/exhaustive-deps
}
