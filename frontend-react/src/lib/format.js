// Formatting helpers — same output as production public/index.html
import { BADGE_MAP } from './constants'

export function fmt(n) {
  const num = Number(n) || 0
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

export function fmtDate(d) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) } catch (e) { return d }
}

export function today() {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}
export const isToday = (d) => d && d.slice(0, 10) === today()
export const isOverdue = (d) => d && d.slice(0, 10) < today()

// UUID v4 for Supabase compatibility (same as production uid())
export function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

export function initials(name) {
  return (name || '?').split(' ').map((p) => p[0]).join('').substring(0, 2).toUpperCase()
}

export function badgeClass(status) {
  return BADGE_MAP[status] || 'badge-gray'
}
