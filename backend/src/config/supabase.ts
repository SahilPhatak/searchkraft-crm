import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.SUPABASE_URL!;
const supabaseKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Storage bucket names
export const BUCKETS = {
  RESUMES:         'resumes',
  CLIENT_DOCUMENTS:'client-documents',
  OFFER_LETTERS:   'offer-letters',
} as const;
