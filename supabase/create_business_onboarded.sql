-- Business Onboarded table
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS business_onboarded (
  id              BIGSERIAL PRIMARY KEY,
  client_name     TEXT NOT NULL,
  position_desc   TEXT NOT NULL,
  num_positions   INTEGER DEFAULT 1,
  source          TEXT,          -- Farming | New | Retention | Renewal
  status          TEXT DEFAULT 'Active',  -- Active | Hold | Closed Internally | Closed by Customer
  fixed_ctc       NUMERIC(10,2), -- Fixed CTC in LPA
  pct             NUMERIC(5,2),  -- Commercial percentage
  revenue_per_pos BIGINT,        -- Calculated: fixed_ctc × 100000 × pct/100 (in ₹)
  total_revenue   BIGINT,        -- revenue_per_pos × num_positions
  delivery_poc    TEXT,
  sales_poc       TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE business_onboarded ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY "Authenticated users can read business_onboarded"
  ON business_onboarded FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert
CREATE POLICY "Authenticated users can insert business_onboarded"
  ON business_onboarded FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update
CREATE POLICY "Authenticated users can update business_onboarded"
  ON business_onboarded FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete business_onboarded"
  ON business_onboarded FOR DELETE
  USING (auth.role() = 'authenticated');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE business_onboarded;
