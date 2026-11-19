import { Menu, Bell, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/store/appStore'
import { useLocation } from 'react-router-dom'

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
  '/setup':      'Setup & Users',
}

export function Header() {
  const { toggleSidebar } = useAppStore()
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'SearchKraft CRM'

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={toggleSidebar}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <h1 className="text-xl font-semibold">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="w-64 pl-8"
          />
        </div>
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
