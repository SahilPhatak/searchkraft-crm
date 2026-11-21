import { create } from 'zustand'

// UI state — port of production setMode()/setAccent()/toggleSidebar()/mobile nav/
// dashboard view switcher. Uses production's localStorage keys so existing
// user preferences carry over unchanged.
const ls = {
  get: (k) => { try { return localStorage.getItem(k) } catch (e) { return null } },
  set: (k, v) => { try { localStorage.setItem(k, v) } catch (e) {} },
  del: (k) => { try { localStorage.removeItem(k) } catch (e) {} },
}

function applyMode(mode) {
  const root = document.documentElement
  if (mode === 'dark') root.setAttribute('data-theme', 'dark')
  else if (mode === 'light') root.setAttribute('data-theme', 'light')
  else root.removeAttribute('data-theme')
}

// Startup order matches production exactly:
//  1) user-panel Day/Night (sk_mode) + accent are applied while the script loads
//  2) loadPrefs() on DOMContentLoaded then applies the Personal Settings theme
//     (sk-theme, default 'auto' = follow system) and accessibility classes.
//     Note: as in production, step 2 overrides step 1 after a reload.
const initialMode = ls.get('sk_mode') || 'light'
applyMode(initialMode)
const initialAccent = ls.get('sk_accent')
if (initialAccent) document.documentElement.style.setProperty('--accent', initialAccent)

export function applyTheme(theme) { applyMode(theme) } // production applyTheme(): same mapping
export function loadPrefs() {
  try {
    applyTheme(ls.get('sk-theme') || 'auto')
    const prefs = JSON.parse(ls.get('sk-prefs') || '{}')
    const cl = document.documentElement.classList
    if (prefs.compact) cl.add('compact')
    if (prefs.largeText) cl.add('large-text')
    if (prefs.reduceMotion) cl.add('reduce-motion')
  } catch (e) {}
}
loadPrefs()

export const useUiStore = create((set, get) => ({
  mode: initialMode,
  setMode: (mode) => { applyMode(mode); ls.set('sk_mode', mode); set({ mode }) },
  setAccent: (color) => { document.documentElement.style.setProperty('--accent', color); ls.set('sk_accent', color) },

  // Desktop sidebar fully shown/hidden (production: #sidebar.app-visible)
  sidebarHidden: ls.get('sk_sidebar_hidden') === '1',
  mobileNavOpen: false,
  toggleSidebar: () => {
    if (window.innerWidth <= 860) { set({ mobileNavOpen: !get().mobileNavOpen }); return }
    const hidden = !get().sidebarHidden
    if (hidden) ls.set('sk_sidebar_hidden', '1'); else ls.del('sk_sidebar_hidden')
    set({ sidebarHidden: hidden })
  },
  toggleMobileNav: () => set({ mobileNavOpen: !get().mobileNavOpen }),
  closeMobileNav: () => set({ mobileNavOpen: false }),

  // Topbar panels (only one open at a time, like production)
  openPanel: null, // 'user' | 'apps' | 'create' | 'view' | null
  togglePanel: (name) => set({ openPanel: get().openPanel === name ? null : name }),
  closePanels: () => set({ openPanel: null }),

  // Dashboard view switcher (production currentDashView, default 'user')
  dashView: 'user',
  setDashView: (dashView) => set({ dashView, openPanel: null }),

  // Topbar global search box text (pages read this to filter, like handleTopbarSearch)
  topbarSearch: '',
  setTopbarSearch: (topbarSearch) => set({ topbarSearch }),

  // A record form requested from the Create panel / Quick add: { type, defaults } | null
  pendingCreate: null,
  requestCreate: (type, defaults) => set({ pendingCreate: { type, defaults, at: Date.now() }, openPanel: null }),
  clearPendingCreate: () => set({ pendingCreate: null }),
}))
