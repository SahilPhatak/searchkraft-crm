import { useLocation, useNavigate } from 'react-router-dom'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'

const PAGE_TITLES = {
  '/dashboard':  'Home',
  '/leads':      'Leads',
  '/contacts':   'Contacts',
  '/companies':  'Accounts',
  '/deals':      'Deals',
  '/tasks':      'Tasks',
  '/activities': 'Calls & Meetings',
  '/documents':  'Documents',
  '/business':   'Business Onboarded',
  '/calendar':   'Calendar',
  '/setup':      'Setup',
  '/reports':    'Reports',
  '/team':       'Team',
  '/audit':      'Audit Log',
  '/settings':   'Personal Settings',
}

export function Header() {
  const { toggleSidebar, openGlobalSearch, openCreatePanel } = useUiStore()
  const { profile } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] || 'SearchKraft CRM'

  const userInitial = profile?.full_name?.[0]?.toUpperCase() || '?'

  return (
    <div className="topbar">
      {/* Desktop sidebar toggle */}
      <button
        className="tb-btn"
        style={{ display: 'flex' }}
        onClick={toggleSidebar}
        title="Toggle sidebar"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* Mobile hamburger */}
      <button className="mob-hamburger" onClick={toggleSidebar} title="Menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* Title */}
      <div className="topbar-title">{title}</div>

      {/* Right actions */}
      <div className="topbar-actions">
        {/* Search */}
        <div className="topbar-search" onClick={openGlobalSearch} style={{ cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ opacity: 0.5 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search records"
            readOnly
            onClick={openGlobalSearch}
            style={{ cursor: 'pointer' }}
          />
        </div>

        {/* + Create */}
        <button className="tb-btn-plus" title="Create new record" onClick={openCreatePanel}>+</button>

        {/* Calendar */}
        <button className="tb-btn" title="Calendar" onClick={() => navigate('/calendar')}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </button>

        {/* Settings */}
        <button className="tb-btn" title="Settings" onClick={() => navigate('/settings')}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>

        <div className="tb-divider" />

        {/* User avatar */}
        <div className="tb-avatar" onClick={() => navigate('/settings')} title="Profile settings">
          {userInitial}
          <div className="tb-avatar-badge" />
        </div>

        {/* Apps grid */}
        <button className="tb-btn" title="Apps">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
