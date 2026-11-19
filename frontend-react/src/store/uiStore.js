import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUiStore = create(
  persist(
    (set, get) => ({
      theme: 'light', // 'light' | 'dark'
      sidebarOpen: true,
      globalSearchOpen: false,
      createPanelOpen: false,

      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light'
        set({ theme: next })
        document.documentElement.setAttribute('data-theme', next)
        if (next === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      },

      setTheme: (theme) => {
        set({ theme })
        document.documentElement.setAttribute('data-theme', theme)
        if (theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      },

      toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
      openGlobalSearch: () => set({ globalSearchOpen: true }),
      closeGlobalSearch: () => set({ globalSearchOpen: false }),
      openCreatePanel: () => set({ createPanelOpen: true }),
      closeCreatePanel: () => set({ createPanelOpen: false }),
    }),
    {
      name: 'sk-ui-store',
      partialize: (s) => ({ theme: s.theme }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          if (state.theme === 'dark') {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }
      },
    }
  )
)
