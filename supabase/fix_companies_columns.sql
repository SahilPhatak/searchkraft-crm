-- Fix: Add all missing columns to companies table
-- Run in Supabase SQL Editor

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS fax              text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS account_site     text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS parent_account   text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS account_number   text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS ticker_symbol    text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS account_type     text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS ownership        text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS annual_revenue   numeric;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS sic_code         text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS delivery_pillar  text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS description      text;

-- Billing address fields
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS billing_country  text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS billing_flat     text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS billing_street   text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS billing_city     text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS billing_state    text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS billing_zip      text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS billing_lat      text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS billing_lng      text;

-- Shipping address fields
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS shipping_country text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS shipping_flat    text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS shipping_street  text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS shipping_city    text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS shipping_state   text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS shipping_zip     text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS shipping_lat     text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS shipping_lng     text;

NOTIFY pgrst, 'reload schema';
