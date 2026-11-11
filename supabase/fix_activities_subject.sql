-- Fix activities table: make subject nullable and default to summary
-- Run this in Supabase SQL Editor

-- Option 1: Make subject default to summary value (best fix)
ALTER TABLE public.activities
  ALTER COLUMN subject DROP NOT NULL;

-- Also set existing nulls to summary value
UPDATE public.activities
  SET subject = summary
  WHERE subject IS NULL AND summary IS NOT NULL;

-- Add a trigger to auto-fill subject from summary going forward
CREATE OR REPLACE FUNCTION public.fill_activity_subject()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.subject IS NULL OR NEW.subject = '' THEN
    NEW.subject := NEW.summary;
  END IF;
  IF NEW.summary IS NULL OR NEW.summary = '' THEN
    NEW.summary := NEW.subject;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fill_activity_subject ON public.activities;
CREATE TRIGGER trg_fill_activity_subject
  BEFORE INSERT OR UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.fill_activity_subject();
