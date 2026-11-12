-- Fix: sync_won_lead trigger was not updating industry on existing companies
-- The ON CONFLICT DO UPDATE was using coalesce(companies.industry, excluded.industry)
-- which kept the OLD value if it existed. Now industry from the lead always wins.

CREATE OR REPLACE FUNCTION sync_won_lead()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
AS $func$
DECLARE
  v_company_name text;
  v_full_name    text;
  v_now          timestamptz := now();
BEGIN
  IF new.stage <> 'Won' THEN RETURN new; END IF;
  IF tg_op = 'UPDATE' AND old.stage = 'Won' THEN RETURN new; END IF;

  -- Build contact full name
  v_full_name := trim(
    coalesce(new.salutation || ' ', '') ||
    coalesce(new.first_name, '') || ' ' ||
    coalesce(new.last_name, '')
  );
  IF v_full_name = '' THEN
    v_full_name := coalesce(new.client_name, new.name, '');
  END IF;

  -- Upsert contact
  IF new.email IS NOT NULL AND new.email <> '' THEN
    INSERT INTO contacts (id, name, email, phone, title, company, owner, created_at, updated_at)
    VALUES (gen_random_uuid(), v_full_name, new.email, new.phone, new.title,
      coalesce(nullif(trim(new.client_name),''), nullif(trim(new.company),'')),
      new.owner, v_now, v_now)
    ON CONFLICT (email) DO UPDATE SET
      name       = excluded.name,
      phone      = coalesce(excluded.phone,   contacts.phone),
      title      = coalesce(excluded.title,   contacts.title),
      company    = coalesce(excluded.company, contacts.company),
      owner      = coalesce(excluded.owner,   contacts.owner),
      updated_at = v_now
    WHERE contacts.email = excluded.email;
  ELSE
    IF v_full_name <> '' THEN
      INSERT INTO contacts (id, name, phone, title, company, owner, created_at, updated_at)
      VALUES (gen_random_uuid(), v_full_name, new.phone, new.title,
        coalesce(nullif(trim(new.client_name),''), nullif(trim(new.company),'')),
        new.owner, v_now, v_now)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Upsert company — industry always takes the lead's value (overwrite old)
  v_company_name := coalesce(nullif(trim(new.client_name),''), nullif(trim(new.company),''), '');
  IF v_company_name <> '' THEN
    INSERT INTO companies (id, name, industry, website, phone, country, city, state, bd_owner, owner_id, status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_company_name, new.industry, new.website, new.phone,
      new.country, new.city, new.state, new.owner, new.owner_id, 'Active', v_now, v_now)
    ON CONFLICT (name) DO UPDATE SET
      industry   = coalesce(excluded.industry,  companies.industry),  -- lead industry wins if set
      website    = coalesce(excluded.website,   companies.website),
      phone      = coalesce(excluded.phone,     companies.phone),
      country    = coalesce(excluded.country,   companies.country),
      city       = coalesce(excluded.city,      companies.city),
      state      = coalesce(excluded.state,     companies.state),
      bd_owner   = coalesce(excluded.bd_owner,  companies.bd_owner),
      status     = 'Active',
      updated_at = v_now
    WHERE companies.name = excluded.name;
  END IF;

  RETURN new;
END;
$func$;

-- Re-create trigger (function is replaced in-place, trigger stays)
DROP TRIGGER IF EXISTS trg_won_lead_sync ON leads;
CREATE TRIGGER trg_won_lead_sync
  AFTER INSERT OR UPDATE OF stage ON leads
  FOR EACH ROW EXECUTE FUNCTION sync_won_lead();

NOTIFY pgrst, 'reload schema';
