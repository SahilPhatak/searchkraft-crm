import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config'

// Same Supabase project + anon key as production. Used for auth, realtime,
// storage and Google Calendar token storage — exactly as production does.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
