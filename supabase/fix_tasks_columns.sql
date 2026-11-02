-- Fix tasks table: add missing columns so due dates and type save properly
-- Run this in the Supabase SQL Editor

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS related_to text;

-- Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'tasks' AND table_schema = 'public'
ORDER BY ordinal_position;
