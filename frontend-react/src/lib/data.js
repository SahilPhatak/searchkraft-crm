// ============================================================
// Data layer — replaces production's global DB cache + load() + upsert().
// Same backend routes, same payload format, same lead→contact sync, same audit log.
//
// Cold-start safety (the blank-page fix, built in):
//   • an EMPTY array from a waking Render instance never replaces data we already have
//   • a FAILED request keeps the last good data (React Query keeps it on error)
//   • retries with backoff while Render wakes up
// ============================================================
import { QueryClient, useQuery } from '@tanstack/react-query'
import { apiFetch, ROUTES } from './api'
import { normRecord, normBORecord } from './normalize'
import { uid } from './format'
import { showToast } from './toast'
import { canDo } from './permissions'
import { getLoggedInUser } from '@/store/authStore'

export const COLLECTIONS = ['leads', 'contacts', 'companies', 'deals', 'tasks', 'activities', 'users', 'documents', 'audit', 'businessOnboarded']

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: Infinity,
      retry: 3,
      retryDelay: (n) => Math.min(2000 * 2 ** n, 15000), // 2s, 4s, 8s — covers Render cold start
      refetchOnWindowFocus: false, // handled by the throttled visibility refresh in AppLayout
      refetchOnReconnect: true,
    },
  },
})

function normalizeRows(key, rows) {
  if (key === 'businessOnboarded') return rows.map(normBORecord)
  if (key === 'audit') {
    return rows
      .map((r) => ({ id: r.id, ts: r.created_at, user: r.user_name, action: r.action, module: r.module, record: r.record_name }))
      .sort((a, b) => (b.ts || '').localeCompare(a.ts || ''))
      .slice(0, 500)
  }
  return rows.map(normRecord)
}

export async function fetchCollection(key) {
  const rows = await apiFetch(ROUTES[key])
  const incoming = Array.isArray(rows) ? rows : []
  const prev = queryClient.getQueryData([key])
  // Cold-start guard: never replace a non-empty cache with an empty response
  if (incoming.length === 0 && Array.isArray(prev) && prev.length > 0) return prev
  return normalizeRows(key, incoming)
}

const queryOptions = (key) => ({
  queryKey: [key],
  queryFn: () => fetchCollection(key),
  refetchInterval: 5 * 60 * 1000, // production polls every 5 minutes as a realtime fallback
})

/** Read a collection in a component. Always returns an array (never undefined). */
export function useCollection(key) {
  const q = useQuery(queryOptions(key))
  return { ...q, data: q.data || [] }
}

/** Non-hook read of the current cache (for event handlers). */
export const getData = (key) => queryClient.getQueryData([key]) || []
export const setData = (key, updater) =>
  queryClient.setQueryData([key], (old) => (typeof updater === 'function' ? updater(old || []) : updater))

/**
 * Initial load after sign-in. Resolves even if some modules fail (they keep retrying in
 * background). Capped at 75s so a fully-down backend can't trap users on the loading screen.
 */
export async function loadAllData() {
  const cap = new Promise((resolve) => setTimeout(() => resolve('timeout'), 75000))
  const all = loadAllDataUncapped()
  const r = await Promise.race([all, cap])
  if (r === 'timeout') {
    showToast('Server is slow to respond — showing what has loaded so far.', '#d97706')
    return Object.fromEntries(COLLECTIONS.map((k) => [k, getData(k)]))
  }
  return r
}

async function loadAllDataUncapped() {
  const results = await Promise.all(
    COLLECTIONS.map((key) =>
      queryClient.fetchQuery(queryOptions(key)).catch((e) => {
        console.error(`load failed for [${key}]:`, e.message)
        if (key === 'businessOnboarded') showToast('Business Onboarded load failed: ' + e.message, '#dc2626')
        return getData(key)
      }),
    ),
  )
  return Object.fromEntries(COLLECTIONS.map((k, i) => [k, results[i]]))
}

/** Background refresh of everything (visibility change, manual refresh). Never blanks the UI. */
export function refreshAll() {
  return Promise.all(COLLECTIONS.map((key) => queryClient.invalidateQueries({ queryKey: [key] })))
}

export function clearAllData() {
  queryClient.clear()
}

// ---------------------------------------------------------------------------
// Writes — port of production upsert()/toSupabase()/deleteCRMRecord()/audit()
// ---------------------------------------------------------------------------
const SUPA_TABLE = {
  companies: 'companies', contacts: 'contacts', leads: 'leads',
  deals: 'deals', tasks: 'tasks', activities: 'activities',
  documents: 'documents', users: 'profiles', audit: 'audit_logs',
}

// Exact columns that exist in each Supabase table (production SUPA_COLS)
const SUPA_COLS = {
  leads: ['id','name','email','phone','company','title','source','stage','value','notes',
    'owner','owner_id','created_at','updated_at','salutation','first_name','last_name','email2',
    'website','skype','twitter','industry','num_employees','annual_revenue','email_opt_out',
    'handover_date','followup_date','lane','source_sd','lead_type','lead_category','month','handover_done','client_name',
    'compensation','client_type','delivery_poc','agreement','num_positions','commercials_signed',
    'followup_status','followup_notes',
    'country','addr_line1','street','city','state','zip','lat','lng','description'],
  contacts: ['id','name','email','phone','title','dept','company','company_id','owner','owner_id','created_at','updated_at'],
  companies: ['id','name','industry','website','phone','employees','revenue','address','city','state','country','status','bd_owner','owner_id','created_at','updated_at',
    'fax','account_site','parent_account','account_number','ticker_symbol','account_type','ownership','annual_revenue','sic_code','delivery_pillar','lane',
    'billing_country','billing_flat','billing_street','billing_city','billing_state','billing_zip','billing_lat','billing_lng',
    'shipping_country','shipping_flat','shipping_street','shipping_city','shipping_state','shipping_zip','shipping_lat','shipping_lng','description'],
  deals: ['id','name','stage','amount','value','expected_revenue','currency','close_date','probability','source','notes','contact','contact_id','company','company_id','owner','owner_id','won_at','lost_at','lost_reason','candidate_name','contact_name','next_step','campaign','deal_type','recruiter_name','client_spoc','sourcer','credit_sharing','candidate_mgmt','client_poc','client_poc_email','client_poc_designation','created_at','updated_at'],
  tasks: ['id','title','type','description','due_date','status','priority','owner','owner_id','lead_id','contact_id','deal_id','related_to','completed_at','created_at','updated_at'],
  activities: ['id','type','subject','summary','description','date','time','duration','outcome','owner','owner_id','contact','lead_id','contact_id','deal_id','created_at','updated_at'],
  documents: ['id','name','client_id','client_name','category','stage','status','file_type','file_size','file_url','uploaded_by','owner_id','description','reference_number','start_date','expiry_date','created_at','updated_at'],
  profiles: ['id','name','email','role','title','dept','phone','avatar','color','status','online','created_at','updated_at'],
}

const CAMEL_TO_SNAKE = {
  createdAt:'created_at', updatedAt:'updated_at', closeDate:'close_date',
  dueDate:'due_date', companyId:'company_id', companyName:'company',
  contactId:'contact_id', ownerId:'owner_id', leadId:'lead_id',
  dealId:'deal_id', bdOwner:'bd_owner', handoverDate:'handover_date',
  followupDate:'followup_date', firstName:'first_name', lastName:'last_name',
  numEmployees:'num_employees', annualRevenue:'annual_revenue',
  emailOptOut:'email_opt_out', addrLine1:'addr_line1', handoverDone:'handover_done',
  clientName:'client_name', clientType:'client_type', deliveryPOC:'delivery_poc',
  numPositions:'num_positions', commercialsSigned:'commercials_signed',
  sourceSD:'source_sd', leadType:'lead_type', wonAt:'won_at', lostAt:'lost_at', lostReason:'lost_reason',
  followupStatus:'followup_status', followupNotes:'followup_notes',
  candidateName:'candidate_name', contactName:'contact_name', nextStep:'next_step',
  dealType:'deal_type', recruiterName:'recruiter_name', clientSpoc:'client_spoc',
  creditSharing:'credit_sharing', candidateMgmt:'candidate_mgmt',
  clientPoc:'client_poc', clientPocEmail:'client_poc_email', clientPocDesignation:'client_poc_designation',
  completedAt:'completed_at', expectedRevenue:'expected_revenue', relatedTo:'related_to',
  clientId:'client_id', fileType:'file_type', fileSize:'file_size',
  fileUrl:'file_url', uploadedBy:'uploaded_by', referenceNumber:'reference_number',
  startDate:'start_date', expiryDate:'expiry_date',
}

const FLOAT_COLS = new Set(['probability','amount','value','expected_revenue','lat','lng','annual_revenue','revenue'])

/** camelCase app record → whitelisted snake_case payload (production toSupabase) */
export function toSupabase(collection, data) {
  const tbl = SUPA_TABLE[collection]
  const allowed = SUPA_COLS[tbl] || SUPA_COLS[collection] || null
  const d = {}
  Object.entries(data).forEach(([k, v]) => {
    const sk = CAMEL_TO_SNAKE[k] || k
    if (!allowed || allowed.includes(sk)) {
      if (v !== undefined && v !== null && v !== '') d[sk] = FLOAT_COLS.has(sk) ? parseFloat(v) : v
      else if (v === false || v === 0) d[sk] = v
    }
  })
  return d
}

/** Best-effort audit log write (production audit()) */
export function audit(action, module, record) {
  const user = getLoggedInUser()
  const entry = {
    id: uid(), ts: new Date().toISOString(),
    user: user ? user.name : 'System', action, module, record: record || '',
  }
  setData('audit', (arr) => [entry, ...arr].slice(0, 500))
  apiFetch('/api/audit', {
    method: 'POST',
    body: JSON.stringify({
      id: entry.id, user_name: entry.user, user_id: user ? user.supaId || null : null,
      action, module, record_name: entry.record, created_at: entry.ts,
    }),
  }).catch((e) => console.warn('Audit log write:', e.message))
}

const ROUTE_FOR = {
  companies: ROUTES.companies, contacts: ROUTES.contacts, leads: ROUTES.leads, deals: ROUTES.deals,
  tasks: ROUTES.tasks, activities: ROUTES.activities, documents: ROUTES.documents, users: ROUTES.users,
}

/**
 * Create or update a record (production upsert()).
 * Merges with the existing record so no fields get wiped on edit.
 * Throws on failure (caller keeps the form open, same as production).
 */
export async function saveRecord(collection, id, data) {
  const now = new Date().toISOString()
  const isNew = !id
  let merged
  if (!isNew) {
    const existing = getData(collection).find((r) => r.id === id) || {}
    merged = { ...existing, ...data, id, updatedAt: now, updated_at: now }
  } else {
    merged = { id: uid(), createdAt: now, created_at: now, updatedAt: now, updated_at: now, ...data }
  }
  const route = ROUTE_FOR[collection]
  const payload = toSupabase(collection, merged)
  try {
    if (isNew) await apiFetch(route, { method: 'POST', body: JSON.stringify(payload) })
    else await apiFetch(route + '/' + merged.id, { method: 'PUT', body: JSON.stringify(payload) })
  } catch (err) {
    console.error('API upsert error:', err.message, payload)
    showToast('⚠️ Save failed: ' + err.message, '#dc2626')
    throw err
  }
  const rec = normRecord(merged)
  setData(collection, (arr) => (isNew ? [rec, ...arr] : arr.map((r) => (r.id === rec.id ? rec : r))))
  audit(isNew ? 'Create' : 'Update', collection, data.name || data.title || merged.id)
  if (collection === 'leads') syncLeadToContact(rec)
  return rec
}

// Mirror a lead into contacts, matched on email (production syncLeadToContact)
function syncLeadToContact(lead) {
  if (!lead.email) return
  const now = new Date().toISOString()
  const contactData = {
    firstName: lead.firstName || '', lastName: lead.lastName || lead.clientName || '',
    name: lead.name || lead.clientName || [lead.firstName, lead.lastName].filter(Boolean).join(' '),
    email: lead.email, email2: lead.email2 || '', phone: lead.phone || '', title: lead.title || '',
    company: lead.company || lead.companyName || lead.clientName || '',
    industry: lead.industry || '', source: lead.source || '', owner: lead.owner || '',
    country: lead.country || '', city: lead.city || '', state: lead.state || '', zip: lead.zip || '',
    addrLine1: lead.addrLine1 || '', street: lead.street || '', description: lead.description || '',
    leadId: lead.id, syncedFromLead: true,
  }
  const existing = getData('contacts').find((c) => c.email && c.email.toLowerCase() === lead.email.toLowerCase())
  if (existing) {
    const merged = { ...existing, ...contactData, id: existing.id, updatedAt: now, updated_at: now }
    setData('contacts', (arr) => arr.map((c) => (c.id === existing.id ? normRecord(merged) : c)))
    apiFetch('/api/contacts/' + existing.id, { method: 'PUT', body: JSON.stringify(toSupabase('contacts', merged)) })
      .catch((e) => console.warn('Lead→Contact sync update failed:', e.message))
  } else {
    const newContact = { id: uid(), createdAt: now, created_at: now, updatedAt: now, updated_at: now, ...contactData }
    setData('contacts', (arr) => [normRecord(newContact), ...arr])
    apiFetch('/api/contacts', { method: 'POST', body: JSON.stringify(toSupabase('contacts', newContact)) })
      .catch((e) => console.warn('Lead→Contact sync create failed:', e.message))
  }
}

const DELETE_MODULE = { companies: 'accounts', contacts: 'contacts', leads: 'leads', deals: 'deals', tasks: 'tasks', activities: 'activities', documents: 'documents' }

/** Delete with permission check + confirm (production deleteCRMRecord). Returns true if deleted. */
export async function deleteRecord(collection, id, { skipConfirm = false } = {}) {
  const mod = DELETE_MODULE[collection] || collection
  if (!canDo(mod, 'delete')) {
    alert('Permission denied: you do not have delete access for this module.')
    return false
  }
  const rec = getData(collection).find((r) => r.id === id)
  const label = rec?.name || rec?.title || id
  if (!skipConfirm && !confirm(`Delete "${label}"? This cannot be undone.`)) return false
  setData(collection, (arr) => arr.filter((r) => r.id !== id))
  audit('Delete', collection, label)
  apiFetch(ROUTE_FOR[collection] + '/' + id, { method: 'DELETE' }).catch((e) => console.error('API delete error:', e.message))
  return true
}
