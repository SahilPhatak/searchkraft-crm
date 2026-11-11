-- Add Google Calendar token storage to profiles table
-- Run this in Supabase SQL Editor

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gcal_token text,
  ADD COLUMN IF NOT EXISTS gcal_email text,
  ADD COLUMN IF NOT EXISTS gcal_token_expiry timestamptz;
