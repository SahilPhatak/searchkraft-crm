import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/data'
import { useAuthStore } from '@/store/authStore'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Login } from '@/pages/Login'
import { SetPassword } from '@/pages/SetPassword'
import { NotYetMigrated } from '@/pages/NotYetMigrated'

// Hash routing (#/leads, #/deals …) — identical URLs to production, so existing
// bookmarks and shared links keep working after the switch.
const PAGES = [
  'dashboard', 'reports', 'leads', 'contacts', 'companies', 'deals', 'business-onboarded',
  'documents', 'tasks', 'activities', 'team', 'audit', 'setup', 'calendar', 'my-day',
  'commercial', 'personal-settings',
]

// Pages move from NotYetMigrated to their real component as each phase lands.
const PAGE_COMPONENTS = {}

function Gate() {
  const status = useAuthStore((s) => s.status)
  const initialize = useAuthStore((s) => s.initialize)
  useEffect(() => { initialize() }, [initialize])

  if (status === 'booting') return <LoadingScreen />
  if (status === 'loadingData') return <LoadingScreen message="Loading your data…" />
  if (status === 'signedOut') return <Login />
  if (status === 'setPassword') return <SetPassword />

  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        {PAGES.map((p) => {
          const C = PAGE_COMPONENTS[p]
          return <Route key={p} path={p} element={C ? <C /> : <NotYetMigrated page={p} />} />
        })}
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Gate />
      </HashRouter>
    </QueryClientProvider>
  )
}
