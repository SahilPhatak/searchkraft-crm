import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useCollection } from '@/lib/data'
import { PAGE_TITLES } from '@/lib/constants'
import { getUserId, isAdminOrAbove } from '@/lib/permissions'
import { initials } from '@/lib/format'

// Markup ported 1:1 from production public/index.html (div.topbar, lines 111–268).
const hoverBg = (bg) => ({
  onMouseEnter: (e) => { e.currentTarget.style.background = bg },
  onMouseLeave: (e) => { e.currentTarget.style.background = 'none' },
})

const CREATE_ITEMS = [
  ['lead', 'Lead'], ['contact', 'Contact'], ['company', 'Account'], ['deal', 'Deal'],
  ['campaign', 'Campaign'], ['task', 'Task'], ['meeting', 'Meeting'], ['call', 'Call'],
]
const CREATE_TARGET = { lead: 'leads', contact: 'contacts', company: 'companies', deal: 'deals', campaign: 'commercial', task: 'tasks', meeting: 'activities', call: 'activities' }

const APPS = [
  { icon: '📊', label: 'Dashboard', page: 'dashboard' },
  { icon: '🎯', label: 'Leads', page: 'leads' },
  { icon: '👥', label: 'Contacts', page: 'contacts' },
  { icon: '🏢', label: 'Accounts', page: 'companies' },
  { icon: '💼', label: 'Deals', page: 'deals' },
  { icon: '✅', label: 'Tasks', page: 'tasks' },
  { icon: '📅', label: 'Calendar', page: 'calendar' },
  { icon: '📣', label: 'Campaigns', page: 'campaigns' },
  { icon: '⚙️', label: 'Settings', page: 'personal-settings' },
]

export function Topbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const page = location.pathname.replace(/^\//, '') || 'dashboard'
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const { data: users } = useCollection('users')
  const {
    mode, setMode, toggleSidebar, toggleMobileNav, openPanel, togglePanel, closePanels,
    dashView, setDashView, topbarSearch, setTopbarSearch, requestCreate,
  } = useUiStore()
  const [createQuery, setCreateQuery] = useState('')
  const createInputRef = useRef(null)
  const refs = { user: useRef(null), apps: useRef(null), create: useRef(null), view: useRef(null) }
  const btnRefs = { user: useRef(null), apps: useRef(null), create: useRef(null), view: useRef(null) }

  // Close any open panel on outside click (production document click handlers)
  useEffect(() => {
    if (!openPanel) return
    const onDoc = (e) => {
      const p = refs[openPanel]?.current, b = btnRefs[openPanel]?.current
      if (p && !p.contains(e.target) && b && !b.contains(e.target)) closePanels()
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [openPanel]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (openPanel === 'create') { setCreateQuery(''); setTimeout(() => createInputRef.current?.focus(), 0) }
  }, [openPanel])

  const firstName = user ? user.name.split(' ')[0] : ''
  const userInitials = user ? user.avatar || initials(user.name) : ''
  const userId = getUserId(user, users)
  const isDashboard = page === 'dashboard'
  const viewLabels = { classic: 'Classic View', user: (firstName || 'My') + "'s Home", manager: "Manager's Home" }

  const goto = (p) => { closePanels(); navigate('/' + p) }
  const openPersonalSettings = () => {
    closePanels()
    navigate(isAdminOrAbove(user) ? '/setup' : '/personal-settings') // admins go to Setup (production)
  }
  const createPanelOpen = (type) => {
    closePanels()
    const target = CREATE_TARGET[type]
    if (target) navigate('/' + target)
    requestCreate(type)
  }
  const pillStyle = (active) => ({ background: active ? '#4A7FE8' : 'none', color: active ? '#fff' : 'var(--fg2)' })

  return (
    <div className="topbar">
      {/* Desktop sidebar toggle (always visible on desktop) */}
      <button id="desktop-sidebar-toggle" onClick={toggleSidebar} title="Toggle sidebar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '8px', color: 'var(--fg2)', flexShrink: '0', transition: 'background 0.15s' }} {...hoverBg('var(--surface2)')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
      </button>
      {/* Hamburger for mobile (hidden on desktop) */}
      <button className="mob-hamburger" onClick={toggleMobileNav} title="Menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
      </button>
      {/* View switcher (replaces plain title on dashboard) */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1', minWidth: '0' }}>
        <div className="topbar-title" id="topbar-title" style={{ display: isDashboard ? 'none' : '' }}>
          {PAGE_TITLES[page] || page}
        </div>
        {/* Dashboard view dropdown — visible only on dashboard */}
        <div id="view-switcher" style={{ display: isDashboard ? 'flex' : 'none', alignItems: 'center', gap: '6px', marginLeft: '10px' }}>
          <button id="view-switcher-btn" ref={btnRefs.view} onClick={(e) => { e.stopPropagation(); togglePanel('view') }} style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '5px 12px', fontSize: '13px', fontWeight: '600', color: 'var(--fg)', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'border-color 0.15s' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" id="view-switcher-icon" style={{ flexShrink: '0' }}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
            <span id="view-switcher-label">{viewLabels[dashView]}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 9 12 15 6 9" /></svg>
          </button>
          {/* Dropdown */}
          <div id="view-dropdown" ref={refs.view} style={{ display: openPanel === 'view' ? 'block' : 'none', position: 'absolute', top: '42px', left: '0', width: '240px', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', zIndex: '600', overflow: 'hidden', padding: '6px 0' }}>
            <div style={{ padding: '6px 14px 4px', fontSize: '11px', fontWeight: '700', color: 'var(--fg3)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>Dashboard View</div>
            {[
              ['classic', 'Classic View', <svg key="i" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="5" rx="1" /><rect x="3" y="11" width="8" height="10" rx="1" /><rect x="14" y="11" width="7" height="10" rx="1" /></svg>],
              ['user', (firstName || 'My') + "'s Home", <svg key="i" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>],
              ['manager', "Manager's Home", <svg key="i" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>],
            ].map(([v, label, icon]) => (
              <div key={v} className={'view-opt' + (dashView === v ? ' active' : '')} id={'vopt-' + v} onClick={() => setDashView(v)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', cursor: 'pointer', fontSize: '13px', color: 'var(--fg2)', transition: 'background 0.12s' }}>
                {icon}
                <span id={v === 'user' ? 'vopt-user-label' : undefined}>{label}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" style={{ marginLeft: 'auto', display: dashView === v ? '' : 'none' }}><polyline points="20 6 9 17 4 12" /></svg>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="topbar-actions">
        {/* Search */}
        <div className="topbar-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input type="text" placeholder="Search records" id="topbar-search-input" value={topbarSearch} onChange={(e) => setTopbarSearch(e.target.value)} />
        </div>
        {/* + Add */}
        <button className="tb-btn-plus" id="create-panel-btn" ref={btnRefs.create} title="Create new record" onClick={(e) => { e.stopPropagation(); togglePanel('create') }}>+</button>
        {/* Create Records Panel */}
        <div id="create-panel" ref={refs.create} style={{ display: openPanel === 'create' ? 'block' : 'none', position: 'fixed', top: '54px', left: '50%', transform: 'translateX(-50%)', width: '720px', maxWidth: '96vw', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: '16px', boxShadow: '0 16px 56px rgba(0,0,0,0.22)', zIndex: '700', overflow: 'hidden' }}>
          <div style={{ display: 'flex', minHeight: '380px' }}>
            {/* Left: Create Records */}
            <div style={{ flex: '1', padding: '22px 20px', borderRight: '1px solid var(--border)', minWidth: '0' }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--fg)', marginBottom: '14px' }}>Create Records</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1.5px solid var(--accent)', borderRadius: '8px', padding: '8px 12px', marginBottom: '14px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--fg3)" strokeWidth="2.2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                <input ref={createInputRef} id="create-panel-search" type="text" placeholder="Search" value={createQuery} onChange={(e) => setCreateQuery(e.target.value)} style={{ border: 'none', outline: 'none', background: 'none', fontSize: '13px', color: 'var(--fg)', flex: '1', minWidth: '0' }} />
              </div>
              <div id="create-panel-list">
                {[...CREATE_ITEMS, [null, 'Product'], [null, 'Price Book']].map(([type, label]) => {
                  const term = createQuery.toLowerCase().trim()
                  const hidden = term && !('+ ' + label).toLowerCase().includes(term)
                  return (
                    <div key={label} className={'cr-item' + (type ? '' : ' cr-disabled') + (hidden ? ' cr-hidden' : '')} onClick={type ? () => createPanelOpen(type) : undefined}>
                      <span className="cr-plus">+</span>{' '}{label}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
        {/* Calendar */}
        <button className="tb-btn" title="Calendar" onClick={() => goto('calendar')}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
        </button>
        {/* Settings */}
        <button className="tb-btn" title="Settings" onClick={openPersonalSettings}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
        </button>
        <div className="tb-divider" />
        {/* User avatar */}
        <div className="tb-avatar" ref={btnRefs.user} title={user ? user.name + ' · ' + userId : ''} onClick={(e) => { e.stopPropagation(); togglePanel('user') }} id="tb-avatar-btn" style={{ background: `linear-gradient(135deg,${user?.color || '#1a56db'},${user?.color || '#1a56db'}cc)` }}>
          {userInitials}
          <div className="tb-avatar-badge" />
        </div>
        {/* User Panel */}
        <div id="user-panel" ref={refs.user} style={{ display: openPanel === 'user' ? 'block' : 'none', position: 'absolute', top: '54px', right: '12px', width: '320px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', boxShadow: '0 12px 40px rgba(0,0,0,0.35)', zIndex: '500', overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg,#4A7FE8 0%,#3155C4 100%)', padding: '20px 18px 18px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0', border: '2px solid rgba(255,255,255,0.5)' }}>
                <span id="up-user-initials" style={{ fontSize: '18px', fontWeight: '800', color: user?.color || '#1a56db' }}>{userInitials}</span>
              </div>
              <div style={{ flex: '1', minWidth: '0' }}>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '2px' }} id="up-user-name">{user?.name}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', marginBottom: '3px' }} id="up-user-id">User ID: {userId}</div>
                <span id="up-user-role" style={{ display: 'inline-block', fontSize: '11px', fontWeight: '700', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)', borderRadius: '12px', padding: '2px 9px', color: '#fff' }}>{user?.role || 'User'}</span>
                <div style={{ marginTop: '8px' }}>
                  <select style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', color: '#fff', fontSize: '12px', padding: '4px 8px', cursor: 'pointer', outline: 'none', width: '100%' }}>
                    <option style={{ color: '#000' }}>Searchkraft AI Labs Private L...</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          {/* Mode */}
          <div style={{ margin: '14px 14px 0', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--fg)', marginBottom: '10px' }}>Mode</div>
            <div style={{ display: 'flex', gap: '4px', background: 'var(--surface2)', borderRadius: '20px', padding: '3px' }}>
              <button onClick={() => setMode('light')} id="mode-day" style={{ flex: '1', padding: '6px 0', borderRadius: '16px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', transition: 'all 0.2s', ...pillStyle(mode === 'light') }}>☀️ Day</button>
              <button onClick={() => setMode('dark')} id="mode-night" style={{ flex: '1', padding: '6px 0', borderRadius: '16px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', transition: 'all 0.2s', ...pillStyle(mode === 'dark') }}>🌙 Night</button>
            </div>
          </div>
          {/* Take a Tour */}
          <div style={{ margin: '10px 14px 0', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px' }}>
            <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onMouseOver={(e) => { e.currentTarget.style.background = 'var(--surface2)' }} onMouseOut={(e) => { e.currentTarget.style.background = '' }}>
              <span style={{ fontSize: '18px' }}>🧭</span>
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--fg)' }}>Take a Tour</span>
              <svg style={{ marginLeft: 'auto', opacity: '0.4' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </div>
          </div>
          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px 14px', marginTop: '4px', borderTop: '1px solid var(--border)' }}>
            <button onClick={openPersonalSettings} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500', color: 'var(--accent)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
              {' '}My Account{' '}
            </button>
            <button onClick={() => { closePanels(); signOut() }} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500', color: '#ef4444' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
              {' '}Sign Out{' '}
            </button>
          </div>
        </div>
        {/* Grid / apps */}
        <button className="tb-btn" title="Apps" ref={btnRefs.apps} onClick={(e) => { e.stopPropagation(); togglePanel('apps') }} id="apps-panel-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
        </button>
        {/* Apps quick-launch panel */}
        <div id="apps-panel" ref={refs.apps} style={{ display: openPanel === 'apps' ? 'block' : 'none', position: 'absolute', top: '54px', right: '12px', width: '300px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', boxShadow: '0 12px 40px rgba(0,0,0,0.18)', zIndex: '500', padding: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--fg)', marginBottom: '12px' }}>Quick Navigation</div>
          <div id="apps-panel-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {APPS.map((a) => (
              <div key={a.page} onClick={() => (a.page === 'personal-settings' ? openPersonalSettings() : goto(a.page))} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', padding: '10px 6px', borderRadius: '10px', cursor: 'pointer', background: 'var(--bg)', border: '1px solid var(--border)' }} onMouseOver={(e) => { e.currentTarget.style.background = 'var(--surface2)' }} onMouseOut={(e) => { e.currentTarget.style.background = 'var(--bg)' }}>
                <span style={{ fontSize: '20px' }}>{a.icon}</span>
                <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--fg2)', textAlign: 'center' }}>{a.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
