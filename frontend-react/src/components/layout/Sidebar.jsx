import { useLocation, useNavigate } from 'react-router-dom'
import { useUiStore } from '@/store/uiStore'
import { usePermissions } from '@/lib/permissions'
import { useNavBadges } from '@/hooks/useNavBadges'
import { showToast } from '@/lib/toast'

// Markup ported 1:1 from production public/index.html (<nav id="sidebar">, lines 41–103).
// Visibility rules = production applyNavPermissions().
const SECTIONS = [
  { label: null, items: [
    { page: 'dashboard', icon: '⌂', label: 'Home' },
    { page: 'reports', icon: '📊', label: 'Reports' },
  ] },
  { label: 'Sales', items: [
    { page: 'leads', icon: '◎', label: 'Leads', badge: true },
    { page: 'contacts', icon: '👤', label: 'Contacts', badge: true },
    { page: 'companies', icon: '🏢', label: 'Accounts', badge: true },
    { page: 'deals', icon: '💼', label: 'Deals', badge: true },
    { page: 'business-onboarded', icon: '🤝', label: 'Business Onboarded', badge: true },
    { page: 'documents', icon: '📄', label: 'Documents', badge: true },
  ] },
  { label: 'Activities', items: [
    { page: 'tasks', icon: '✓', label: 'Tasks', badge: true },
    { page: 'activities', icon: '📞', label: 'Calls & Meetings', badge: true },
  ] },
  { label: 'Admin', items: [
    { page: 'team', icon: '👥', label: 'Team' },
    { page: 'audit', icon: '🔍', label: 'Audit Log' },
    { page: 'setup', icon: '⚙', label: 'Setup' },
  ] },
]

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const current = location.pathname.replace(/^\//, '') || 'dashboard'
  const { sidebarHidden, mobileNavOpen, closeMobileNav } = useUiStore()
  const perms = usePermissions()
  const { counts } = useNavBadges()

  const visible = (page) => {
    if (['audit', 'setup', 'team'].includes(page)) return perms.isAdminOrAbove()
    if (['leads', 'contacts', 'accounts', 'deals', 'reports', 'activities', 'documents'].includes(page)) return perms.canDo(page, 'view')
    return true
  }

  const go = (page) => {
    closeMobileNav()
    if (!perms.hasPageAccess(page)) { showToast("You don't have permission to access this section.", '#dc2626'); return }
    navigate('/' + page)
  }

  const cls = [sidebarHidden ? '' : 'app-visible', mobileNavOpen ? 'mobile-open' : ''].filter(Boolean).join(' ')

  return (
    <>
      <nav id="sidebar" className={cls}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">SK</div>
          <div className="sidebar-logo-text">
            <div className="brand-sub">SearchKraft</div>
            <div className="brand-main">CRM</div>
          </div>
        </div>
        {SECTIONS.map((sec, i) => (
          <div className="nav-section" key={i}>
            {sec.label && <div className="nav-section-label">{sec.label}</div>}
            {sec.items.map((it) => (
              <button key={it.page} className={'nav-item' + (current === it.page ? ' active' : '')} data-page={it.page} onClick={() => go(it.page)} style={visible(it.page) ? undefined : { display: 'none' }}>
                <span className="icon">{it.icon}</span><span className="label"> {it.label}</span>
                {it.badge && <span className="nav-badge" id={'nb-' + it.page}>{counts[it.page] > 0 ? counts[it.page] : ''}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>
      {/* Mobile nav overlay */}
      <div id="mobile-nav-overlay" onClick={closeMobileNav} style={{ display: mobileNavOpen ? 'block' : 'none' }} />
    </>
  )
}
