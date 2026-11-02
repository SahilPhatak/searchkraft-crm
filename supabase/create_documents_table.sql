-- Create documents table for the Documents module
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  client_id       uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  client_name     text,
  category        text,
  stage           text DEFAULT 'Draft',
  status          text DEFAULT 'Pending',
  file_type       text,
  file_size       text,
  file_url        text,
  uploaded_by     text,
  owner_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  description     text,
  reference_number text,
  start_date      date,
  expiry_date     date,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Index for quick lookup by client
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON public.documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);

-- RLS: only authenticated users can access
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_select" ON public.documents
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "documents_insert" ON public.documents
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "documents_update" ON public.documents
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "documents_delete" ON public.documents
  FOR DELETE USING (auth.role() = 'authenticated');

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_documents_updated_at ON public.documents;
CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add to Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;

-- Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'documents' AND table_schema = 'public'
ORDER BY ordinal_position;
