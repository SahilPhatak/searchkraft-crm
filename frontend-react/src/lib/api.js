import { supabase } from './supabase'

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://searchkraft-crm.onrender.com'

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

export async function apiFetch(path, options = {}) {
  const token = await getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(BACKEND_URL + path, { ...options, headers })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }

  return res.json()
}

// Convenience wrappers
export const api = {
  get: (path) => apiFetch(path),
  post: (path, body) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => apiFetch(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => apiFetch(path, { method: 'DELETE' }),
}
