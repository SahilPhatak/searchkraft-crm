-- Add lane/domain column to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS lane text;

-- Update the won lead trigger to also sync lane to companies
CREATE OR REPLACE FUNCTION sync_won_lead()
RETURNS TRIGGER AS $$
BEGIN
  -- Only fire when stage is Won
  IF NEW.stage <> 'Won' THEN
    RETURN NEW;
  END IF;

  -- Upsert into companies: lead data wins over existing empty fields
  INSERT INTO companies (name, industry, city, country, phone, website, employees, lane, updated_at)
  VALUES (
    NEW.company,
    COALESCE(NEW.industry, ''),
    COALESCE(NEW.city, ''),
    COALESCE(NEW.country, ''),
    COALESCE(NEW.phone, ''),
    COALESCE(NEW.website, ''),
    COALESCE(NEW.num_employees, 0),
    COALESCE(NEW.lane, ''),
    NOW()
  )
  ON CONFLICT (name) DO UPDATE SET
    industry    = COALESCE(EXCLUDED.industry,    companies.industry),
    city        = COALESCE(EXCLUDED.city,        companies.city),
    country     = COALESCE(EXCLUDED.country,     companies.country),
    phone       = COALESCE(EXCLUDED.phone,       companies.phone),
    website     = COALESCE(EXCLUDED.website,     companies.website),
    employees   = COALESCE(EXCLUDED.employees,   companies.employees),
    lane        = COALESCE(EXCLUDED.lane,        companies.lane),
    updated_at  = NOW()
  WHERE companies.name = NEW.company;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger watching stage + industry + city + lane changes
DROP TRIGGER IF EXISTS trg_sync_won_lead ON leads;
CREATE TRIGGER trg_sync_won_lead
  AFTER INSERT OR UPDATE OF stage, industry, city, country, lane
  ON leads
  FOR EACH ROW
  EXECUTE FUNCTION sync_won_lead();
