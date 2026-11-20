-- Add missing columns to deals table
-- These fields are collected in the deal form but were missing from the schema

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS recruiter_name   text,
  ADD COLUMN IF NOT EXISTS client_spoc      text,
  ADD COLUMN IF NOT EXISTS sourcer          text,
  ADD COLUMN IF NOT EXISTS credit_sharing   numeric,
  ADD COLUMN IF NOT EXISTS candidate_mgmt   text,
  ADD COLUMN IF NOT EXISTS description      text,
  ADD COLUMN IF NOT EXISTS candidate_name   text,
  ADD COLUMN IF NOT EXISTS contact_name     text,
  ADD COLUMN IF NOT EXISTS next_step        text,
  ADD COLUMN IF NOT EXISTS campaign         text,
  ADD COLUMN IF NOT EXISTS deal_type        text;
