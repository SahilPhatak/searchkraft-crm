import { useEffect, useRef } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { useNavBadges } from '@/hooks/useNavBadges'
import { refreshAll } from '@/lib/data'
import { usePermissions } from '@/lib/permissions'
import { showToast } from '@/lib/toast'
import { useUiStore } from '@/store/uiStore'

// Production layout: <nav id="sidebar"> + <div id="main"> (topbar + .content#content-area).
const BADGE_PAGES = ['leads', 'contacts', 'companies', 'deals', 'tasks', 'activities', 'documents', 'business-onboarded']

export function AppLayout() {
  const location = useLocation()
  const page = location.pathname.replace(/^\//, '') || 'dashboard'
  const { markSeen } = useNavBadges()
  const perms = usePermissions()
  const closePanels = useUiStore((s) => s.closePanels)

  useRealtimeSync(true)

  // Visiting a section clears its "new" badge (production markSectionSeen)
  useEffect(() => {
    if (BADGE_PAGES.includes(page)) markSeen(page)
    closePanels()
    window.scrollTo(0, 0)
  }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  // Background refresh when the tab becomes visible — throttled to once per 90s and
  // never re-renders with empty data (production visibilitychange handler)
  const lastRefresh = useRef(Date.now())
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== 'visible') return
      if (Date.now() - lastRefresh.current < 90000) return
      lastRefresh.current = Date.now()
      refreshAll().catch((e) => console.warn('[visibilitychange] background refresh failed:', e.message))
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // Route guard (production navigateTo → hasPageAccess)
  const denied = !perms.hasPageAccess(page)
  useEffect(() => { if (denied) showToast("You don't have permission to access this section.", '#dc2626') }, [denied])
  if (denied) return <Navigate to="/dashboard" replace />

  return (
    <>
      <Sidebar />
      <div id="main">
        <Topbar />
        <div className="content" id="content-area">
          <Outlet />
        </div>
      </div>
    </>
  )
}
