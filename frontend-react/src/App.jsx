import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { AppLayout } from '@/components/layout/AppLayout'

// Pages (mix of named + default exports)
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { Contacts } from '@/pages/Contacts'
import { Companies } from '@/pages/Companies'
import { Tasks } from '@/pages/Tasks'
import { Activities } from '@/pages/Activities'
import { Documents } from '@/pages/Documents'
import { Business } from '@/pages/Business'
import { Calendar } from '@/pages/Calendar'

// New pages (default exports)
import Leads from '@/pages/Leads'
import Deals from '@/pages/Deals'
import Setup from '@/pages/Setup'
import Reports from '@/pages/Reports'
import AuditLog from '@/pages/AuditLog'
import Team from '@/pages/Team'
import PersonalSettings from '@/pages/PersonalSettings'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 30, retry: 1 },
  },
})

function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppInitializer({ children }) {
  const { initialize } = useAuthStore()
  const { theme } = useUiStore()

  useEffect(() => {
    initialize()
  }, [])

  // Apply theme on mount
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return children
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppInitializer>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"  element={<Dashboard />} />
              <Route path="leads"      element={<Leads />} />
              <Route path="contacts"   element={<Contacts />} />
              <Route path="companies"  element={<Companies />} />
              <Route path="deals"      element={<Deals />} />
              <Route path="tasks"      element={<Tasks />} />
              <Route path="activities" element={<Activities />} />
              <Route path="documents"  element={<Documents />} />
              <Route path="business"   element={<Business />} />
              <Route path="calendar"   element={<Calendar />} />
              <Route path="setup"      element={<Setup />} />
              <Route path="reports"    element={<Reports />} />
              <Route path="audit"      element={<AuditLog />} />
              <Route path="team"       element={<Team />} />
              <Route path="settings"   element={<PersonalSettings />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AppInitializer>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
