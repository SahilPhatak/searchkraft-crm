const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKETS = {
  RESUMES:          'resumes',
  CLIENT_DOCUMENTS: 'client-documents',
  OFFER_LETTERS:    'offer-letters',
};

module.exports = { supabase, BUCKETS };
