-- Email notifications tracking table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS email_notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id           UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('deal_created', 'deal_won_delivery')),
  recipient_email   TEXT NOT NULL,
  subject           TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message     TEXT,
  sent_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent duplicate sent notifications for the same deal+type
CREATE UNIQUE INDEX IF NOT EXISTS email_notifications_sent_unique
  ON email_notifications (deal_id, notification_type)
  WHERE status = 'sent';

-- Index for deal lookups
CREATE INDEX IF NOT EXISTS email_notifications_deal_id_idx ON email_notifications (deal_id);

-- Also add delivery_pillar fields to deals if not present
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS delivery_pillar        TEXT,
  ADD COLUMN IF NOT EXISTS delivery_pillar_id     UUID,
  ADD COLUMN IF NOT EXISTS deal_owner             TEXT,
  ADD COLUMN IF NOT EXISTS type                   TEXT,
  ADD COLUMN IF NOT EXISTS expected_revenue       NUMERIC,
  ADD COLUMN IF NOT EXISTS next_step              TEXT,
  ADD COLUMN IF NOT EXISTS lead_source            TEXT,
  ADD COLUMN IF NOT EXISTS campaign_source        TEXT,
  ADD COLUMN IF NOT EXISTS candidate_name         TEXT,
  ADD COLUMN IF NOT EXISTS recruiter_name         TEXT,
  ADD COLUMN IF NOT EXISTS client_spoc            TEXT,
  ADD COLUMN IF NOT EXISTS sourcer                TEXT,
  ADD COLUMN IF NOT EXISTS credit_sharing         NUMERIC,
  ADD COLUMN IF NOT EXISTS candidate_management   TEXT;
