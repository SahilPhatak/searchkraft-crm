-- Backfill: sync ALL existing Won leads into contacts + companies
-- Run once in Supabase → SQL Editor → New query → Run
-- Safe to run multiple times (uses ON CONFLICT ... DO UPDATE / DO NOTHING)

DO $do$
DECLARE
  r RECORD;
  v_company_name TEXT;
  v_full_name    TEXT;
  v_now          TIMESTAMPTZ := NOW();
BEGIN
  FOR r IN
    SELECT * FROM leads WHERE stage = 'Won'
  LOOP
    -- Build full name
    v_full_name := TRIM(
      COALESCE(r.salutation || ' ', '') ||
      COALESCE(r.first_name, '') || ' ' ||
      COALESCE(r.last_name, '')
    );
    IF v_full_name = '' THEN
      v_full_name := COALESCE(r.client_name, r.name, '');
    END IF;

    -- ── CONTACT upsert ──
    IF r.email IS NOT NULL AND r.email <> '' THEN
      INSERT INTO contacts (id, name, email, phone, title, company, owner, created_at, updated_at)
      VALUES (gen_random_uuid(), v_full_name, r.email, r.phone, r.title,
        COALESCE(NULLIF(TRIM(r.client_name),''), NULLIF(TRIM(r.company),'')),
        r.owner, v_now, v_now)
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
        VALUES (gen_random_uuid(), v_full_name, r.phone, r.title,
          COALESCE(NULLIF(TRIM(r.client_name),''), NULLIF(TRIM(r.company),'')),
          r.owner, v_now, v_now)
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;

    -- ── COMPANY (Account) upsert ──
    v_company_name := COALESCE(NULLIF(TRIM(r.client_name),''), NULLIF(TRIM(r.company),''), '');
    IF v_company_name <> '' THEN
      INSERT INTO companies (id, name, industry, website, phone, country, city, state, bd_owner, owner_id, status, created_at, updated_at)
      VALUES (gen_random_uuid(), v_company_name, r.industry, r.website, r.phone,
        r.country, r.city, r.state, r.owner, r.owner_id, 'Active', v_now, v_now)
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

  END LOOP;
END $do$;
