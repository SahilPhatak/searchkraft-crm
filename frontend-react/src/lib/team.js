// Team / owner helpers — port of production getTeamNames(), getCurrentUser(), getCompanyName().
// IMPORTANT: production stores the owner on records as the user's FIRST name ("Sahil"),
// so every owner dropdown and filter here uses first names too.
import { useCollection } from './data'
import { useAuthStore } from '@/store/authStore'

const TEAM_MEMBERS = ['Sahil', 'Priya', 'Rahul', 'Neha', 'Arjun'] // production fallback when no users loaded

export const firstName = (name) => (name || '').split(' ')[0]

export function getTeamNames(users) {
  return users && users.length ? users.map((u) => firstName(u.name)) : TEAM_MEMBERS
}

export function useTeamNames() {
  const { data: users } = useCollection('users')
  return getTeamNames(users)
}

/** Logged-in user's first name (production getCurrentUser()) */
export function useCurrentUserName() {
  const user = useAuthStore((s) => s.user)
  return user ? firstName(user.name) : ''
}

export function getCompanyName(companies, id) {
  return companies.find((c) => c.id === id)?.name || ''
}
