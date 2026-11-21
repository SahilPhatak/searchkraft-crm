import { supabase } from './supabase'
import { BACKEND_URL } from './config'

export { BACKEND_URL }

// Same route map as production (TABLE_TO_ROUTE in public/index.html)
export const ROUTES = {
  leads: '/api/leads',
  contacts: '/api/contacts',
  companies: '/api/companies',
  deals: '/api/deals',
  tasks: '/api/tasks',
  activities: '/api/activities',
  users: '/api/profiles',
  documents: '/api/documents',
  audit: '/api/audit',
  businessOnboarded: '/api/business-onboarded',
}

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

/**
 * Same contract as production apiFetch(): sends the Supabase JWT to the Express
 * backend on Render, throws Error(message) on non-2xx.
 * Extra: a request timeout so a sleeping Render instance can't hang the UI forever.
 */
export async function apiFetch(path, options = {}) {
  const { timeoutMs = 60000, ...fetchOpts } = options
  const token = await getToken()
  const headers = { 'Content-Type': 'application/json', ...(fetchOpts.headers || {}) }
  if (token) headers['Authorization'] = 'Bearer ' + token
  // Let the browser set multipart boundaries for uploads
  if (fetchOpts.body instanceof FormData) delete headers['Content-Type']

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(BACKEND_URL + path, { ...fetchOpts, headers, signal: ctrl.signal })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(err.error || res.statusText)
    }
    if (res.status === 204) return null
    return res.json()
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Server is taking too long to respond (it may be waking up). Please try again.')
    throw e
  } finally {
    clearTimeout(timer)
  }
}

export const api = {
  get: (path) => apiFetch(path),
  post: (path, body) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => apiFetch(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => apiFetch(path, { method: 'DELETE' }),
}
