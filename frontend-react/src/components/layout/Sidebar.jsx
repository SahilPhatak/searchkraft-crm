import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

// Nav structure exactly matching old HTML UI
const NAV_SECTIONS = [
  {
    section: null,
    items: [
      { label: 'Home',    icon: '⌂',  to: '/dashboard' },
      { label: 'Reports', icon: '📊', to: '/reports' },
    ],
  },
  {
    section: 'Sales',
    items: [
      { label: 'Leads',               icon: '◎',  to: '/leads',     badge: 'leads' },
      { label: 'Contacts',            icon: '👤', to: '/contacts',  badge: 'contacts' },
      { label: 'Accounts',            icon: '🏢', to: '/companies', badge: 'companies' },
      { label: 'Deals',               icon: '💼', to: '/deals',     badge: 'deals' },
      { label: 'Business Onboarded',  icon: '🤝', to: '/business',  badge: 'business' },
      { label: 'Documents',           icon: '📄', to: '/documents', badge: 'documents' },
    ],
  },
  {
    section: 'Activities',
    items: [
      { label: 'Tasks',          icon: '✓',  to: '/tasks',      badge: 'tasks' },
      { label: 'Calls & Meetings', icon: '📞', to: '/activities', badge: 'activities' },
    ],
  },
  {
    section: 'Admin',
    items: [
      { label: 'Team',      icon: '👥', to: '/team',     adminOnly: true },
      { label: 'Audit Log', icon: '🔍', to: '/audit',    adminOnly: true },
      { label: 'Setup',     icon: '⚙',  to: '/setup',    adminOnly: true },
    ],
  },
]

export function Sidebar() {
  const { signOut, profile } = useAuthStore()
  const { sidebarOpen, toggleSidebar } = useUiStore()
  const navigate = useNavigate()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner'

  const { data: leads = [] } = useQuery({ queryKey: ['leads-nav'], queryFn: () => api.get('/api/leads'), staleTime: 60000 })
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks-nav'], queryFn: () => api.get('/api/tasks'), staleTime: 60000 })
  const { data: deals = [] } = useQuery({ queryKey: ['deals-nav'], queryFn: () => api.get('/api/deals'), staleTime: 60000 })

  const badges = {
    leads:   leads.filter(l => l.status === 'new').length,
    tasks:   tasks.filter(t => t.status !== 'completed').length,
    deals:   deals.filter(d => !['Won','Lost','closed_won','closed_lost'].includes(d.stage)).length,
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const userInitial = profile?.full_name?.[0]?.toUpperCase() || '?'

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          id="mobile-nav-overlay"
          onClick={toggleSidebar}
          style={{ display: 'block', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 900 }}
        />
      )}

      <nav
        id="sidebar"
        className={sidebarOpen ? 'mobile-open app-visible' : 'app-visible'}
      >
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">SK</div>
          <div className="sidebar-logo-text">
            <div className="brand-sub">SearchKraft</div>
            <div className="brand-main">CRM</div>
          </div>
        </div>

        {/* Nav sections */}
        {NAV_SECTIONS.map(({ section, items }) => {
          const visibleItems = isAdmin ? items : items.filter(i => !i.adminOnly)
          if (visibleItems.length === 0) return null
          return (
            <div key={section || '__top__'} className="nav-section">
              {section && <div className="nav-section-label">{section}</div>}
              {visibleItems.map(({ label, icon, to, badge }) => {
                const badgeCount = badge ? (badges[badge] || 0) : 0
                return (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => { if (window.innerWidth < 861) toggleSidebar() }}
                    className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  >
                    <span className="icon">{icon}</span>
                    <span className="label"> {label}</span>
                    {badgeCount > 0 && (
                      <span className="nav-badge">{badgeCount > 99 ? '99+' : badgeCount}</span>
                    )}
                  </NavLink>
                )
              })}
            </div>
          )
        })}

        {/* Footer: user + sign out */}
        <div style={{ marginTop: 'auto', padding: '12px 8px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <NavLink
            to="/settings"
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            style={{ marginBottom: 4 }}
          >
            <span style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#e74c3c,#c0392b)',
              color: '#fff', fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{userInitial}</span>
            <span className="label" style={{ flex: 1, fontSize: 12 }}>
              <span style={{ display: 'block', color: '#fff', fontWeight: 600 }}>{profile?.full_name || 'User'}</span>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, textTransform: 'capitalize' }}>{profile?.role || 'member'}</span>
            </span>
          </NavLink>
          <button
            onClick={handleSignOut}
            className="nav-item"
            style={{ width: '100%', fontSize: 12, color: 'rgba(255,255,255,0.55)' }}
          >
            <span className="icon" style={{ fontSize: 13 }}>⬡</span>
            <span className="label"> Sign out</span>
          </button>
        </div>
      </nav>
    </>
  )
}
