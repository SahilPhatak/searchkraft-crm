import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useCollection } from '@/lib/data'

// Port of production nav badges: count records created AFTER the user last visited
// that section. Same localStorage keys as production (sk_seen_<uid>_<section>) so
// badge state carries over seamlessly when users switch to the React app.
const SECTIONS = {
  leads: 'leads', contacts: 'contacts', companies: 'companies', deals: 'deals',
  tasks: 'tasks', activities: 'activities', documents: 'documents',
  'business-onboarded': 'businessOnboarded',
}

const seenKey = (user, section) => `sk_seen_${user ? user.supaId || user.id || user.email : 'anon'}_${section}`

export function markSectionSeen(user, section) {
  try { localStorage.setItem(seenKey(user, section), new Date().toISOString()) } catch (e) {}
  window.dispatchEvent(new Event('sk-seen-changed'))
}

function countNew(records, user, section) {
  try {
    const seenAt = localStorage.getItem(seenKey(user, section))
    if (!seenAt) return 0 // never visited → pre-existing records don't trigger a badge
    return records.filter((r) => (r.createdAt || r.created_at || '') > seenAt).length
  } catch (e) { return 0 }
}

export function useNavBadges() {
  const user = useAuthStore((s) => s.user)
  const [, setTick] = useState(0)
  useEffect(() => {
    const h = () => setTick((t) => t + 1)
    window.addEventListener('sk-seen-changed', h)
    return () => window.removeEventListener('sk-seen-changed', h)
  }, [])
  const data = {
    leads: useCollection('leads').data,
    contacts: useCollection('contacts').data,
    companies: useCollection('companies').data,
    deals: useCollection('deals').data,
    tasks: useCollection('tasks').data,
    activities: useCollection('activities').data,
    documents: useCollection('documents').data,
    businessOnboarded: useCollection('businessOnboarded').data,
  }
  const counts = {}
  Object.entries(SECTIONS).forEach(([section, key]) => { counts[section] = countNew(data[key], user, section) })
  const markSeen = useCallback((section) => markSectionSeen(user, section), [user])
  return { counts, markSeen }
}
