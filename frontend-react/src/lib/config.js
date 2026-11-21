// Connection settings — identical to production (public/index.html).
// Only the Supabase ANON key lives in the frontend (it is public by design).
// The service-role key and SMTP settings stay on the backend (Render env vars).
// Values can be overridden per environment with Vercel env vars.

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://yeidlmkdwyiqavkxnlhs.supabase.co'

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllaWRsbWtkd3lpcWF2a3hubGhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0MjE0OTAsImV4cCI6MjEwODk5NzQ5MH0.7yBHL273FCl9oQYmhxET5QKn3AbW44yh7Zxr2nrb2LE'

export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'https://searchkraft-crm.onrender.com'
