-- Fix deals table: add amount column and copy value -> amount
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Add amount column if it doesn't exist
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS amount numeric default 0;

-- Step 2: Add expected_revenue column if it doesn't exist  
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS expected_revenue numeric default 0;

-- Step 3: Copy existing value -> amount for all deals where amount is null/0
UPDATE public.deals SET amount = value WHERE (amount IS NULL OR amount = 0) AND value IS NOT NULL AND value != 0;

-- Step 4: Copy expected_revenue from value*probability if missing
UPDATE public.deals SET expected_revenue = ROUND(amount * COALESCE(probability, 10) / 100) 
WHERE expected_revenue IS NULL OR expected_revenue = 0;

-- Verify
SELECT id, name, value, amount, expected_revenue, stage FROM public.deals LIMIT 10;
