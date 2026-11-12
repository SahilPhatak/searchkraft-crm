-- ============================================================
-- SearchKraft CRM — Fix All Missing Columns
-- Run this ONCE in Supabase SQL Editor
-- This safely adds any missing columns without touching existing data
-- ============================================================

-- ─── LEADS: missing columns ──────────────────────────────────
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lead_type          text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS month              text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS handover_done      boolean DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS client_name        text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS compensation       text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS client_type        text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS delivery_poc       text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS agreement          text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS num_positions      integer;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS commercials_signed boolean DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS followup_status    text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS followup_notes     text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source_sd          text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lane               text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS salutation         text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS first_name         text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_name          text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS email2             text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS website            text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS skype              text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS twitter            text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS industry           text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS num_employees      integer;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS annual_revenue     numeric;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS email_opt_out      boolean DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS handover_date      date;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS followup_date      date;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS country            text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS addr_line1         text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS street             text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS city               text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS state              text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS zip                text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS description        text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS updated_at         timestamptz DEFAULT now();

-- ─── ACTIVITIES: missing columns ─────────────────────────────
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS summary    text;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS contact    text;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS company    text;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS time       text;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.activities ALTER COLUMN subject DROP NOT NULL;

-- ─── PROFILES: Google Calendar token storage ─────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gcal_token        text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gcal_email        text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gcal_token_expiry timestamptz;

-- ─── DEALS: missing columns ───────────────────────────────────
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS candidate_name text;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS contact_name   text;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS next_step      text;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS campaign       text;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS deal_type      text;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS updated_at     timestamptz DEFAULT now();

-- ─── Notify Supabase to refresh schema cache ─────────────────
NOTIFY pgrst, 'reload schema';
