import { Menu, Bell, Search, Sun, Moon, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocation } from 'react-router-dom'
import { useUiStore } from '@/store/uiStore'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

const pageTitles = {
  '/dashboard':  'Dashboard',
  '/leads':      'Leads',
  '/contacts':   'Contacts',
  '/companies':  'Companies',
  '/deals':      'Deals',
  '/tasks':      'Tasks',
  '/activities': 'Activities',
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
  const { toggleSidebar, openGlobalSearch, openCreatePanel, toggleTheme, theme } = useUiStore()
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'SearchKraft CRM'

  // Notification count — tasks overdue
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-notif'],
    queryFn: () => api.get('/api/tasks'),
    staleTime: 60000,
  })
  const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background px-4 md:px-5">
      <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={toggleSidebar}>
        <Menu className="h-4 w-4" />
      </Button>

      <h1 className="text-base font-semibold">{title}</h1>

      <div className="ml-auto flex items-center gap-1">
        {/* Search trigger */}
        <button
          onClick={openGlobalSearch}
          className="hidden md:flex items-center gap-2 h-8 px-3 rounded-md border bg-muted/40 text-sm text-muted-foreground hover:bg-muted transition-colors min-w-[180px]"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search…</span>
          <kbd className="ml-auto text-[10px] font-mono opacity-60 hidden lg:inline">⌘K</kbd>
        </button>
        <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={openGlobalSearch}>
          <Search className="h-4 w-4" />
        </Button>

        {/* Quick Create */}
        <Button variant="outline" size="sm" className="h-8 gap-1.5 hidden sm:flex" onClick={openCreatePanel}>
          <Plus className="w-3.5 h-3.5" /> Create
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden" onClick={openCreatePanel}>
          <Plus className="h-4 w-4" />
        </Button>

        {/* Theme toggle */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4" />
          {overdueTasks > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">
              {overdueTasks > 9 ? '9+' : overdueTasks}
            </span>
          )}
        </Button>
      </div>
    </header>
  )
}
