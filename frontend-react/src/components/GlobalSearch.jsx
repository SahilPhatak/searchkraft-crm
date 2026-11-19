import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useUiStore } from '@/store/uiStore'
import { Search, X, User, Building2, Briefcase, Tags, FileText, CheckSquare, Zap } from 'lucide-react'

const ICONS = {
  leads: Tags,
  contacts: User,
  companies: Building2,
  deals: Briefcase,
  tasks: CheckSquare,
  activities: Zap,
  documents: FileText,
}

export function GlobalSearch() {
  const { globalSearchOpen, closeGlobalSearch } = useUiStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const { data: leads = [] } = useQuery({ queryKey: ['leads-gs'], queryFn: () => api.get('/api/leads'), enabled: globalSearchOpen })
  const { data: contacts = [] } = useQuery({ queryKey: ['contacts-gs'], queryFn: () => api.get('/api/contacts'), enabled: globalSearchOpen })
  const { data: companies = [] } = useQuery({ queryKey: ['companies-gs'], queryFn: () => api.get('/api/companies'), enabled: globalSearchOpen })
  const { data: deals = [] } = useQuery({ queryKey: ['deals-gs'], queryFn: () => api.get('/api/deals'), enabled: globalSearchOpen })
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks-gs'], queryFn: () => api.get('/api/tasks'), enabled: globalSearchOpen })

  useEffect(() => {
    if (globalSearchOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setResults([])
    }
  }, [globalSearchOpen])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const q = query.toLowerCase()
    const all = [
      ...leads.filter(l => (l.name||'').toLowerCase().includes(q) || (l.email||'').toLowerCase().includes(q) || (l.company||'').toLowerCase().includes(q)).slice(0,3).map(l => ({ ...l, _type: 'leads', _label: l.name, _sub: l.company || l.email, _route: '/leads' })),
      ...contacts.filter(c => (c.name||'').toLowerCase().includes(q) || (c.email||'').toLowerCase().includes(q)).slice(0,3).map(c => ({ ...c, _type: 'contacts', _label: c.name, _sub: c.email, _route: '/contacts' })),
      ...companies.filter(c => (c.name||'').toLowerCase().includes(q)).slice(0,3).map(c => ({ ...c, _type: 'companies', _label: c.name, _sub: c.industry, _route: '/companies' })),
      ...deals.filter(d => (d.title||'').toLowerCase().includes(q) || (d.company_name||'').toLowerCase().includes(q)).slice(0,3).map(d => ({ ...d, _type: 'deals', _label: d.title, _sub: d.stage, _route: '/deals' })),
      ...tasks.filter(t => (t.title||'').toLowerCase().includes(q)).slice(0,3).map(t => ({ ...t, _type: 'tasks', _label: t.title, _sub: t.status, _route: '/tasks' })),
    ]
    setResults(all.slice(0, 10))
  }, [query, leads, contacts, companies, deals, tasks])

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (globalSearchOpen) closeGlobalSearch()
        else useUiStore.getState().openGlobalSearch()
      }
      if (e.key === 'Escape' && globalSearchOpen) closeGlobalSearch()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [globalSearchOpen, closeGlobalSearch])

  if (!globalSearchOpen) return null

  const handleSelect = (item) => {
    navigate(item._route)
    closeGlobalSearch()
    setQuery('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm" onClick={closeGlobalSearch}>
      <div className="bg-background border rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search leads, contacts, deals…"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
          {query && <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-mono opacity-60">ESC</kbd>
        </div>

        {query && results.length === 0 && (
          <div className="p-6 text-sm text-muted-foreground text-center">No results for "{query}"</div>
        )}

        {results.length > 0 && (
          <div className="max-h-72 overflow-y-auto py-1">
            {results.map((item, i) => {
              const Icon = ICONS[item._type] || FileText
              return (
                <button key={i} onClick={() => handleSelect(item)}
                  className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-muted/50 text-left transition-colors">
                  <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{item._label}</div>
                    <div className="text-xs text-muted-foreground truncate">{item._type} {item._sub ? `· ${item._sub}` : ''}</div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {!query && (
          <div className="p-4">
            <div className="text-xs text-muted-foreground mb-2 font-medium">Quick Links</div>
            <div className="grid grid-cols-3 gap-1">
              {[['Leads','/leads'], ['Contacts','/contacts'], ['Companies','/companies'], ['Deals','/deals'], ['Tasks','/tasks'], ['Reports','/reports']].map(([label, route]) => (
                <button key={label} onClick={() => { navigate(route); closeGlobalSearch() }}
                  className="text-xs py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted text-left transition-colors">
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
