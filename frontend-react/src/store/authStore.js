import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { apiFetch } from '@/lib/api'
import { initials } from '@/lib/format'
import { loadAllData, clearAllData } from '@/lib/data'

// Port of production's auth flow (public/index.html: onAuthStateChange, onSignedIn,
// submitNewPassword, doSignOut).
//
// status:
//   'booting'     – waiting for Supabase INITIAL_SESSION (production: auth-loading screen)
//   'signedOut'   – show login page
//   'setPassword' – first login, must set a password (production: set-password-screen)
//   'loadingData' – signed in, fetching CRM data (loading screen stays up — no blank page)
//   'ready'       – app shown
let _suppressAuthChange = false
export const suppressAuthChange = (v) => { _suppressAuthChange = v }

export const useAuthStore = create((set, get) => ({
  status: 'booting',
  user: null, // production LOGGED_IN_USER shape
  pendingUser: null,
  _initialized: false,

  initialize: () => {
    if (get()._initialized) return
    set({ _initialized: true })
    supabase.auth.onAuthStateChange((event, session) => {
      if (_suppressAuthChange) return // admin is creating a new user — ignore
      if (event === 'SIGNED_OUT') {
        set({ user: null, status: 'signedOut' })
      } else if (session && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        // defer out of the auth callback (supabase-js deadlocks if we await inside it)
        setTimeout(() => get().onSignedIn(session.user), 0)
      } else if (event === 'INITIAL_SESSION' && !session) {
        set({ status: 'signedOut' })
      }
    })
  },

  onSignedIn: async (authUser) => {
    // Ignore duplicate sign-in events while we are already entering / inside the app
    const st = get().status
    if (st === 'loadingData' || st === 'setPassword' || (st === 'ready' && get().user?.id === authUser.id)) return
    const meta = authUser.user_metadata || {}
    let user = {
      id: authUser.id, supaId: authUser.id,
      name: meta.name || meta.full_name || authUser.email.split('@')[0],
      email: authUser.email,
      role: meta.role || 'User',
      title: meta.title || '',
      dept: meta.dept || '',
      color: meta.color || '#1a56db',
      status: 'active', online: true,
    }
    user.avatar = initials(user.name)
    set({ status: 'loadingData' })

    try {
      const profile = await apiFetch('/api/profiles/' + authUser.id).catch(() => null)
      if (profile && profile.id) {
        user = {
          id: profile.id, supaId: profile.id,
          name: profile.name || user.name,
          email: profile.email || authUser.email,
          role: profile.role || user.role,
          title: profile.title || '',
          dept: profile.dept || '',
          avatar: profile.avatar || user.avatar,
          color: profile.color || user.color,
          status: profile.status || 'active',
          custom_perms: profile.custom_perms || null,
          force_password_change: profile.force_password_change || false,
          online: true,
        }
        if (profile.force_password_change) {
          set({ status: 'setPassword', pendingUser: user })
          return
        }
      }
    } catch (e) { /* profiles table may not exist yet — use auth metadata */ }

    await get()._enterApp(user)
  },

  // Loading screen stays visible until data is in — same as the production blank-page fix
  _enterApp: async (user) => {
    set({ user, status: 'loadingData' })
    const data = await loadAllData()
    // Re-apply custom perms from DB (production does this after load)
    const me = (data.users || []).find((u) => u.id === user.id || u.email === user.email)
    if (me && me.custom_perms) user = { ...user, custom_perms: me.custom_perms }
    set({ user, status: 'ready' })
  },

  submitNewPassword: async (password) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
    const { data: { user: pwUser } } = await supabase.auth.getUser()
    if (pwUser) {
      await apiFetch('/api/profiles/' + pwUser.id, {
        method: 'PUT',
        body: JSON.stringify({ force_password_change: false, updated_at: new Date().toISOString() }),
      }).catch(() => {})
    }
    const user = { ...get().pendingUser, force_password_change: false }
    set({ pendingUser: null })
    await get()._enterApp(user)
  },

  signOut: async () => {
    clearAllData()
    set({ user: null })
    await supabase.auth.signOut()
    set({ status: 'signedOut' })
  },

  // Called by Setup/Team when the logged-in user's own perms are edited
  updateUser: (patch) => set((s) => ({ user: s.user ? { ...s.user, ...patch } : s.user })),
}))

// Non-hook accessor for plain functions (permissions, audit)
export const getLoggedInUser = () => useAuthStore.getState().user
