import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: true,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      set({ session, user: session.user })
      await get().fetchProfile(session.user.id)
    }
    set({ loading: false })

    supabase.auth.onAuthStateChange(async (event, session) => {
      set({ session, user: session?.user || null })
      if (session?.user) {
        await get().fetchProfile(session.user.id)
      } else {
        set({ profile: null })
      }
    })
  },

  fetchProfile: async (userId) => {
    try {
      const profile = await api.get(`/api/profiles/${userId}`)
      set({ profile })
    } catch (err) {
      console.error('Failed to fetch profile:', err)
    }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null, session: null })
  },

  isAdmin: () => {
    const { profile } = get()
    return profile?.role === 'admin' || profile?.role === 'owner'
  },
}))
