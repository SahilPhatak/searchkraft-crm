import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { setData } from '@/lib/data'
import { normRecord, normBORecord } from '@/lib/normalize'

// Port of production startRealtimeSync(): one Supabase Realtime channel per CRM table.
// When another user inserts/updates/deletes a record we patch the cache in place;
// every page reading that collection re-renders automatically.
const TABLE_MAP = {
  leads: { key: 'leads', norm: normRecord },
  contacts: { key: 'contacts', norm: normRecord },
  companies: { key: 'companies', norm: normRecord },
  deals: { key: 'deals', norm: normRecord },
  tasks: { key: 'tasks', norm: normRecord },
  activities: { key: 'activities', norm: normRecord },
  documents: { key: 'documents', norm: normRecord },
  business_onboarded: { key: 'businessOnboarded', norm: normBORecord },
}

function handlePayload(payload) {
  try {
    const info = TABLE_MAP[payload.table]
    if (!info) return
    if (payload.eventType === 'INSERT') {
      const rec = info.norm(payload.new)
      setData(info.key, (arr) => (arr.find((r) => r.id === rec.id) ? arr : [rec, ...arr]))
    } else if (payload.eventType === 'UPDATE') {
      const rec = info.norm(payload.new)
      setData(info.key, (arr) => (arr.some((r) => r.id === rec.id) ? arr.map((r) => (r.id === rec.id ? rec : r)) : [rec, ...arr]))
    } else if (payload.eventType === 'DELETE') {
      const rid = payload.old && payload.old.id
      if (rid) setData(info.key, (arr) => arr.filter((r) => r.id !== rid))
    }
  } catch (e) {
    console.warn('Realtime patch error:', e)
  }
}

export function useRealtimeSync(enabled) {
  useEffect(() => {
    if (!enabled) return
    const channels = Object.keys(TABLE_MAP).map((tbl) =>
      supabase
        .channel('crm-' + tbl)
        .on('postgres_changes', { event: '*', schema: 'public', table: tbl }, handlePayload)
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') console.warn('[RT] channel error:', tbl)
        }),
    )
    return () => channels.forEach((ch) => supabase.removeChannel(ch))
  }, [enabled])
}
