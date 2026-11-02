-- Enable Supabase Realtime for all CRM tables
-- Run this once in the Supabase SQL Editor

-- Add tables to the supabase_realtime publication so Postgres sends WAL events
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.companies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;

-- Verify
SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
