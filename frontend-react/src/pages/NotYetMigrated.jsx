import { PAGE_TITLES } from '@/lib/constants'

// Shown on the preview for pages that have not been ported yet, so testers can tell
// "not built yet" apart from "broken". Removed once every page is migrated.
const PHASE = {
  leads: 2, contacts: 2, companies: 2, deals: 2,
  'business-onboarded': 3, tasks: 3, activities: 3, documents: 3, 'my-day': 3,
  dashboard: 4, reports: 4, calendar: 4,
  team: 5, audit: 5, setup: 5, 'personal-settings': 5, commercial: 5,
}

export function NotYetMigrated({ page }) {
  return (
    <div className="page page-pad active" id={'page-' + page}>
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--fg2)' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🚧</div>
        <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--fg)', marginBottom: '6px' }}>{PAGE_TITLES[page] || page}</div>
        <div style={{ fontSize: '13px' }}>This page is being moved to the new frontend (Phase {PHASE[page] || '—'}).</div>
        <div style={{ fontSize: '13px', marginTop: '4px', opacity: 0.7 }}>Use the live CRM for this section until then.</div>
      </div>
    </div>
  )
}
