CREATE OR REPLACE FUNCTION sync_won_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_company_name TEXT;
  v_full_name    TEXT;
  v_now          TIMESTAMPTZ := NOW();
BEGIN
  IF NEW.stage <> 'Won' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.stage = 'Won' THEN
    RETURN NEW;
  END IF;

  v_full_name := TRIM(
    COALESCE(NEW.salutation || ' ', '') ||
    COALESCE(NEW.first_name, '') || ' ' ||
    COALESCE(NEW.last_name, '')
  );
  IF v_full_name = '' THEN
    v_full_name := COALESCE(NEW.client_name, NEW.name, '');
  END IF;

  IF NEW.email IS NOT NULL AND NEW.email <> '' THEN
    INSERT INTO contacts (id, name, email, phone, title, company, owner, created_at, updated_at)
    VALUES (gen_random_uuid(), v_full_name, NEW.email, NEW.phone, NEW.title, COALESCE(NEW.company, NEW.client_name), NEW.owner, v_now, v_now)
    ON CONFLICT (email)
    DO UPDATE SET
      name       = EXCLUDED.name,
      phone      = COALESCE(EXCLUDED.phone,   contacts.phone),
      title      = COALESCE(EXCLUDED.title,   contacts.title),
      company    = COALESCE(EXCLUDED.company, contacts.company),
      owner      = COALESCE(EXCLUDED.owner,   contacts.owner),
      updated_at = v_now
    WHERE contacts.email = EXCLUDED.email;
  ELSE
    IF v_full_name <> '' THEN
      INSERT INTO contacts (id, name, phone, title, company, owner, created_at, updated_at)
      VALUES (gen_random_uuid(), v_full_name, NEW.phone, NEW.title, COALESCE(NEW.company, NEW.client_name), NEW.owner, v_now, v_now)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  v_company_name := COALESCE(NEW.company, NEW.client_name, '');
  IF v_company_name <> '' THEN
    INSERT INTO companies (id, name, industry, website, phone, country, city, state, bd_owner, owner_id, status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_company_name, NEW.industry, NEW.website, NEW.phone, NEW.country, NEW.city, NEW.state, NEW.owner, NEW.owner_id, 'Active', v_now, v_now)
    ON CONFLICT (name)
    DO UPDATE SET
      industry   = COALESCE(companies.industry, EXCLUDED.industry),
      website    = COALESCE(companies.website,  EXCLUDED.website),
      phone      = COALESCE(companies.phone,    EXCLUDED.phone),
      country    = COALESCE(companies.country,  EXCLUDED.country),
      city       = COALESCE(companies.city,     EXCLUDED.city),
      state      = COALESCE(companies.state,    EXCLUDED.state),
      bd_owner   = COALESCE(companies.bd_owner, EXCLUDED.bd_owner),
      status     = COALESCE(companies.status,   'Active'),
      updated_at = v_now
    WHERE companies.name = EXCLUDED.name;
  END IF;

  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS trg_won_lead_sync ON leads;
CREATE TRIGGER trg_won_lead_sync
  AFTER INSERT OR UPDATE OF stage ON leads
  FOR EACH ROW EXECUTE FUNCTION sync_won_lead();

DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'contacts_email_key' AND conrelid = 'contacts'::regclass
  ) THEN
    ALTER TABLE contacts ADD CONSTRAINT contacts_email_key UNIQUE (email);
  END IF;
END $do$;

DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'companies_name_key' AND conrelid = 'companies'::regclass
  ) THEN
    ALTER TABLE companies ADD CONSTRAINT companies_name_key UNIQUE (name);
  END IF;
END $do$;
