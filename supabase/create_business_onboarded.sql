-- Business Onboarded table
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.business_onboarded (
  id              BIGSERIAL PRIMARY KEY,
  client_name     TEXT NOT NULL,
  position_desc   TEXT NOT NULL,
  num_positions   INTEGER DEFAULT 1,
  source          TEXT,          -- Farming | New | Retention | Renewal
  status          TEXT DEFAULT 'Active',  -- Active | Hold | Closed Internally | Closed by Customer
  fixed_ctc       NUMERIC(10,2), -- LPA
  pct             NUMERIC(6,2),  -- % commercial
  revenue_per_pos BIGINT,        -- calculated: fixed_ctc * 100000 * pct / 100
  total_revenue   BIGINT,        -- revenue_per_pos * num_positions
  delivery_poc    TEXT,
  sales_poc       TEXT,
  notes           TEXT,
  start_date      DATE,
  closure_month   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.business_onboarded ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read/write (adjust as needed)
CREATE POLICY "Allow all" ON public.business_onboarded
  FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.business_onboarded;
