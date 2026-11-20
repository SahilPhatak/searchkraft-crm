import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Toaster } from '@/components/ui/toaster'
import { GlobalSearch } from '@/components/GlobalSearch'
import { CreatePanel } from '@/components/CreatePanel'

export function AppLayout() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)', color: 'var(--fg)' }}>
      <Sidebar />
      <div className="main-wrap">
        <Header />
        <main className="content">
          <Outlet />
        </main>
      </div>
      <Toaster />
      <GlobalSearch />
      <CreatePanel />
    </div>
  )
}
