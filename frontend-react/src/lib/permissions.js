// Port of production role helpers (public/index.html: isSuperAdmin, canDo, hasPageAccess…)
import { ROLE_PERMS } from './constants'
import { useAuthStore, getLoggedInUser } from '@/store/authStore'

export const isSuperAdmin = (u = getLoggedInUser()) => !!u && u.role === 'Super Admin'
export const isAdminOrAbove = (u = getLoggedInUser()) => !!u && ['Super Admin', 'Admin'].includes(u.role)
export const isManagerOrAbove = (u = getLoggedInUser()) => !!u && ['Super Admin', 'Admin', 'Manager'].includes(u.role)

export function canDo(module, action, u = getLoggedInUser()) {
  if (!u) return false
  if (isSuperAdmin(u)) return true // Super Admin always has full access
  // Per-user custom permissions override role defaults
  if (u.custom_perms && u.custom_perms[module] !== undefined) {
    return (u.custom_perms[module] || []).includes(action)
  }
  const perms = ROLE_PERMS[u.role || 'User'] || ROLE_PERMS['User']
  return (perms[module] || []).includes(action)
}

export function getEffectivePerms(u) {
  if (!u) return {}
  if (u.role === 'Super Admin') return ROLE_PERMS['Super Admin']
  if (u.custom_perms) return u.custom_perms
  return ROLE_PERMS[u.role] || ROLE_PERMS['User']
}

const ADMIN_ONLY_PAGES = ['audit', 'setup', 'team']
const MODULE_PAGES = ['leads', 'contacts', 'accounts', 'deals', 'reports', 'activities', 'documents']

// Note: production checks the literal page name, so 'companies' is not gated here (same behaviour).
export function hasPageAccess(page, u = getLoggedInUser()) {
  if (ADMIN_ONLY_PAGES.includes(page) && !isAdminOrAbove(u)) return false
  if (MODULE_PAGES.includes(page) && !canDo(page, 'view', u)) return false
  return true
}

/** Hook: re-renders when the logged-in user (role/perms) changes. */
export function usePermissions() {
  const user = useAuthStore((s) => s.user)
  return {
    user,
    canDo: (m, a) => canDo(m, a, user),
    isSuperAdmin: () => isSuperAdmin(user),
    isAdminOrAbove: () => isAdminOrAbove(user),
    isManagerOrAbove: () => isManagerOrAbove(user),
    hasPageAccess: (p) => hasPageAccess(p, user),
  }
}

/** Production getUserId(): 'SK-0001' style id based on position in the team list. */
export function getUserId(user, users) {
  const idx = (users || []).findIndex((u) => u.id === user?.id)
  return 'SK-' + String(idx + 1).padStart(4, '0')
}
