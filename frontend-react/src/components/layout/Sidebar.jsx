import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Tags, Users, Building2, DollarSign, CheckSquare,
  Activity, FileText, Briefcase, Settings, Calendar, LogOut, X,
  BarChart2, Shield, UserCircle, Sun, Moon, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function Sidebar() {
  const { signOut, profile, isAdmin } = useAuthStore()
  const { sidebarOpen, toggleSidebar, toggleTheme, theme } = useUiStore()
  const navigate = useNavigate()

  const { data: leads = [] } = useQuery({ queryKey: ['leads-nav'], queryFn: () => api.get('/api/leads'), staleTime: 60000 })
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks-nav'], queryFn: () => api.get('/api/tasks'), staleTime: 60000 })
  const { data: deals = [] } = useQuery({ queryKey: ['deals-nav'], queryFn: () => api.get('/api/deals'), staleTime: 60000 })

  const newLeads = leads.filter(l => l.status === 'new').length
  const pendingTasks = tasks.filter(t => t.status !== 'completed').length
  const openDeals = deals.filter(d => !['Won','Lost'].includes(d.stage)).length

  const badges = { '/leads': newLeads, '/tasks': pendingTasks, '/deals': openDeals }

  const isAdminUser = profile?.role === 'admin' || profile?.role === 'owner'

  const navItems = [
    { label: 'Dashboard',   icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Leads',       icon: Tags,            to: '/leads' },
    { label: 'Contacts',    icon: Users,           to: '/contacts' },
    { label: 'Companies',   icon: Building2,       to: '/companies' },
    { label: 'Deals',       icon: DollarSign,      to: '/deals' },
    { label: 'Tasks',       icon: CheckSquare,     to: '/tasks' },
    { label: 'Activities',  icon: Activity,        to: '/activities' },
    { label: 'Documents',   icon: FileText,        to: '/documents' },
    { label: 'Business',    icon: Briefcase,       to: '/business' },
    { label: 'Calendar',    icon: Calendar,        to: '/calendar' },
    { label: 'Reports',     icon: BarChart2,       to: '/reports' },
    ...(isAdminUser ? [
      { label: 'Team',      icon: Users,           to: '/team' },
      { label: 'Audit Log', icon: Shield,          to: '/audit' },
      { label: 'Setup',     icon: Settings,        to: '/setup' },
    ] : [])
  ]

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={toggleSidebar} />
      )}

      <aside className={cn(
        'fixed inset-y-0 left-0 z-30 flex w-56 flex-col bg-gray-900 text-white transition-transform duration-300 md:relative md:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-gray-700/70">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0">SK</div>
            <span className="font-semibold text-sm">SearchKraft CRM</span>
          </div>
          <button className="md:hidden text-gray-400 hover:text-white" onClick={toggleSidebar}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {navItems.map(({ label, icon: Icon, to }) => {
            const badge = badges[to]
            return (
              <NavLink key={to} to={to}
                className={({ isActive }) => cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors mb-0.5',
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                )}
                onClick={() => { if (window.innerWidth < 768) toggleSidebar() }}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{label}</span>
                {badge > 0 && (
                  <span className="ml-auto text-[10px] font-bold bg-blue-500 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-700/70 p-3">
          <NavLink to="/settings" className={({ isActive }) => cn(
            'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors mb-1',
            isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          )}>
            <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {profile?.full_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate text-white">{profile?.full_name || 'User'}</p>
              <p className="text-[10px] text-gray-400 capitalize">{profile?.role || 'member'}</p>
            </div>
            <ChevronRight className="w-3 h-3 text-gray-500 flex-shrink-0" />
          </NavLink>
          <div className="flex gap-1">
            <button onClick={toggleTheme} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
              {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
              {theme === 'light' ? 'Dark' : 'Light'}
            </button>
            <button onClick={handleSignOut} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
