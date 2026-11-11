-- ============================================================
-- SearchKraft CRM — MASTER SCHEMA
-- Run this file top-to-bottom in Supabase SQL Editor
-- to recreate the entire database from scratch
-- Last updated: 2026-11-06
-- ============================================================

-- ─── 1. PROFILES ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  name        text not null,
  email       text not null,
  role        text not null default 'User',
  title       text,
  dept        text,
  phone       text,
  avatar      text,
  color       text default '#1a56db',
  status      text default 'active',
  online      boolean default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table public.profiles enable row level security;

-- ─── 2. LEADS ────────────────────────────────────────────────────────────────
create table if not exists public.leads (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  email               text,
  phone               text,
  company             text,
  title               text,
  source              text,
  stage               text default 'New',
  rating              int,
  value               numeric,
  notes               text,
  owner               text,
  owner_id            uuid references public.profiles(id),
  -- Extended columns
  salutation          text,
  first_name          text,
  last_name           text,
  email2              text,
  website             text,
  skype               text,
  twitter             text,
  industry            text,
  num_employees       integer,
  annual_revenue      numeric,
  email_opt_out       boolean default false,
  handover_date       date,
  followup_date       date,
  followup_status     text,
  followup_notes      text,
  lane                text,
  source_sd           text,
  lead_type           text,
  month               text,
  handover_done       boolean default false,
  client_name         text,
  compensation        text,
  client_type         text,
  delivery_poc        text,
  agreement           text,
  num_positions       integer,
  commercials_signed  boolean default false,
  country             text,
  addr_line1          text,
  street              text,
  city                text,
  state               text,
  zip                 text,
  description         text,
  won_at              timestamptz,
  lost_at             timestamptz,
  lost_reason         text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);
alter table public.leads enable row level security;

-- ─── 3. CONTACTS ─────────────────────────────────────────────────────────────
create table if not exists public.contacts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text,
  phone       text,
  title       text,
  dept        text,
  company     text,
  company_id  uuid,
  owner       text,
  owner_id    uuid references public.profiles(id),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table public.contacts enable row level security;
-- Unique email constraint for upsert in trigger
alter table public.contacts add constraint contacts_email_key unique (email) deferrable initially deferred;

-- ─── 4. COMPANIES (ACCOUNTS) ─────────────────────────────────────────────────
create table if not exists public.companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  industry    text,
  website     text,
  phone       text,
  employees   int,
  revenue     numeric,
  address     text,
  city        text,
  state       text,
  country     text default 'India',
  status      text default 'Active',
  bd_owner    text,
  owner_id    uuid references public.profiles(id),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table public.companies enable row level security;
-- Unique name constraint for upsert in trigger
alter table public.companies add constraint companies_name_key unique (name) deferrable initially deferred;

-- ─── 5. DEALS ────────────────────────────────────────────────────────────────
create table if not exists public.deals (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  stage            text default 'Prospecting',
  value            numeric,
  amount           numeric default 0,
  expected_revenue numeric default 0,
  currency         text default 'INR',
  close_date       date,
  probability      int,
  source           text,
  notes            text,
  contact          text,
  contact_id       uuid references public.contacts(id),
  company          text,
  company_id       uuid references public.companies(id),
  owner            text,
  owner_id         uuid references public.profiles(id),
  won_at           timestamptz,
  lost_at          timestamptz,
  lost_reason      text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
alter table public.deals enable row level security;

-- ─── 6. TASKS ────────────────────────────────────────────────────────────────
create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  type         text,
  description  text,
  due_date     date,
  status       text default 'Pending',
  priority     text default 'Normal',
  related_to   text,
  owner        text,
  owner_id     uuid references public.profiles(id),
  lead_id      uuid references public.leads(id),
  contact_id   uuid references public.contacts(id),
  deal_id      uuid references public.deals(id),
  completed_at timestamptz,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
alter table public.tasks enable row level security;

-- ─── 7. ACTIVITIES ───────────────────────────────────────────────────────────
create table if not exists public.activities (
  id          uuid primary key default gen_random_uuid(),
  type        text not null,
  subject     text not null,
  description text,
  date        timestamptz default now(),
  duration    int,
  outcome     text,
  owner       text,
  owner_id    uuid references public.profiles(id),
  lead_id     uuid references public.leads(id),
  contact_id  uuid references public.contacts(id),
  deal_id     uuid references public.deals(id),
  created_at  timestamptz default now()
);
alter table public.activities enable row level security;

-- ─── 8. DOCUMENTS ────────────────────────────────────────────────────────────
create table if not exists public.documents (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  client_id        uuid references public.companies(id) on delete set null,
  client_name      text,
  category         text,
  stage            text default 'Draft',
  status           text default 'Pending',
  file_type        text,
  file_size        text,
  file_url         text,
  uploaded_by      text,
  owner_id         uuid references auth.users(id) on delete set null,
  description      text,
  reference_number text,
  start_date       date,
  expiry_date      date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
alter table public.documents enable row level security;
create index if not exists idx_documents_client_id  on public.documents(client_id);
create index if not exists idx_documents_created_at on public.documents(created_at desc);

-- ─── 9. AUDIT LOGS ───────────────────────────────────────────────────────────
create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  action      text not null,
  module      text not null,
  record_id   uuid,
  record_name text,
  user_name   text,
  user_id     uuid references public.profiles(id),
  created_at  timestamptz default now()
);
alter table public.audit_logs enable row level security;

-- ─── 10. FUNCTIONS ───────────────────────────────────────────────────────────

-- Auto-update updated_at on any table
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- Auto-create profile when new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, email, role, color, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'User'),
    coalesce(new.raw_user_meta_data->>'color', '#1a56db'),
    upper(substring(coalesce(new.raw_user_meta_data->>'name', new.email), 1, 2))
  );
  return new;
end;
$$;

-- Won lead → auto-sync to contacts + companies
create or replace function sync_won_lead()
returns trigger language plpgsql security definer
as $func$
declare
  v_company_name text;
  v_full_name    text;
  v_now          timestamptz := now();
begin
  if new.stage <> 'Won' then return new; end if;
  if tg_op = 'UPDATE' and old.stage = 'Won' then return new; end if;

  v_full_name := trim(
    coalesce(new.salutation || ' ', '') ||
    coalesce(new.first_name, '') || ' ' ||
    coalesce(new.last_name, '')
  );
  if v_full_name = '' then
    v_full_name := coalesce(new.client_name, new.name, '');
  end if;

  if new.email is not null and new.email <> '' then
    insert into contacts (id, name, email, phone, title, company, owner, created_at, updated_at)
    values (gen_random_uuid(), v_full_name, new.email, new.phone, new.title,
      coalesce(nullif(trim(new.client_name),''), nullif(trim(new.company),'')),
      new.owner, v_now, v_now)
    on conflict (email) do update set
      name       = excluded.name,
      phone      = coalesce(excluded.phone,   contacts.phone),
      title      = coalesce(excluded.title,   contacts.title),
      company    = coalesce(excluded.company, contacts.company),
      owner      = coalesce(excluded.owner,   contacts.owner),
      updated_at = v_now
    where contacts.email = excluded.email;
  else
    if v_full_name <> '' then
      insert into contacts (id, name, phone, title, company, owner, created_at, updated_at)
      values (gen_random_uuid(), v_full_name, new.phone, new.title,
        coalesce(nullif(trim(new.client_name),''), nullif(trim(new.company),'')),
        new.owner, v_now, v_now)
      on conflict do nothing;
    end if;
  end if;

  v_company_name := coalesce(nullif(trim(new.client_name),''), nullif(trim(new.company),''), '');
  if v_company_name <> '' then
    insert into companies (id, name, industry, website, phone, country, city, state, bd_owner, owner_id, status, created_at, updated_at)
    values (gen_random_uuid(), v_company_name, new.industry, new.website, new.phone,
      new.country, new.city, new.state, new.owner, new.owner_id, 'Active', v_now, v_now)
    on conflict (name) do update set
      industry   = coalesce(companies.industry, excluded.industry),
      website    = coalesce(companies.website,  excluded.website),
      phone      = coalesce(companies.phone,    excluded.phone),
      country    = coalesce(companies.country,  excluded.country),
      city       = coalesce(companies.city,     excluded.city),
      state      = coalesce(companies.state,    excluded.state),
      bd_owner   = coalesce(companies.bd_owner, excluded.bd_owner),
      status     = coalesce(companies.status,   'Active'),
      updated_at = v_now
    where companies.name = excluded.name;
  end if;

  return new;
end;
$func$;

-- ─── 11. TRIGGERS ────────────────────────────────────────────────────────────
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger set_leads_updated_at     before update on public.leads     for each row execute function public.set_updated_at();
create trigger set_contacts_updated_at  before update on public.contacts  for each row execute function public.set_updated_at();
create trigger set_companies_updated_at before update on public.companies for each row execute function public.set_updated_at();
create trigger set_deals_updated_at     before update on public.deals     for each row execute function public.set_updated_at();
create trigger set_tasks_updated_at     before update on public.tasks     for each row execute function public.set_updated_at();
create trigger set_documents_updated_at before update on public.documents for each row execute function public.set_updated_at();

drop trigger if exists trg_won_lead_sync on leads;
create trigger trg_won_lead_sync
  after insert or update of stage on leads
  for each row execute function sync_won_lead();

-- ─── 12. ROW LEVEL SECURITY POLICIES ─────────────────────────────────────────

-- Profiles
create policy "Team can view all profiles"    on public.profiles for select using (auth.uid() is not null);
create policy "Users can update own profile"  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Admins can update any profile" on public.profiles for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Super Admin','Admin')));
create policy "Service role can insert"       on public.profiles for insert with check (true);

-- Leads
create policy "Team can view all leads"   on public.leads for select using (auth.uid() is not null);
create policy "Team can create leads"     on public.leads for insert with check (auth.uid() is not null);
create policy "Team can update leads"     on public.leads for update using (auth.uid() is not null);
create policy "Team can delete leads"     on public.leads for delete using (auth.uid() is not null);

-- Contacts
create policy "Team can view all contacts"   on public.contacts for select using (auth.uid() is not null);
create policy "Team can create contacts"     on public.contacts for insert with check (auth.uid() is not null);
create policy "Team can update contacts"     on public.contacts for update using (auth.uid() is not null);
create policy "Team can delete contacts"     on public.contacts for delete using (auth.uid() is not null);

-- Companies
create policy "Team can view all companies"  on public.companies for select using (auth.uid() is not null);
create policy "Team can create companies"    on public.companies for insert with check (auth.uid() is not null);
create policy "Team can update companies"    on public.companies for update using (auth.uid() is not null);
create policy "Team can delete companies"    on public.companies for delete using (auth.uid() is not null);

-- Deals
create policy "Team can view all deals"  on public.deals for select using (auth.uid() is not null);
create policy "Team can create deals"    on public.deals for insert with check (auth.uid() is not null);
create policy "Team can update deals"    on public.deals for update using (auth.uid() is not null);
create policy "Team can delete deals"    on public.deals for delete using (auth.uid() is not null);

-- Tasks
create policy "Team can view all tasks"  on public.tasks for select using (auth.uid() is not null);
create policy "Team can create tasks"    on public.tasks for insert with check (auth.uid() is not null);
create policy "Team can update tasks"    on public.tasks for update using (auth.uid() is not null);
create policy "Team can delete tasks"    on public.tasks for delete using (auth.uid() is not null);

-- Activities
create policy "Team can view all activities"  on public.activities for select using (auth.uid() is not null);
create policy "Team can create activities"    on public.activities for insert with check (auth.uid() is not null);
create policy "Team can update activities"    on public.activities for update using (auth.uid() is not null);
create policy "Team can delete activities"    on public.activities for delete using (auth.uid() is not null);

-- Documents
create policy "documents_select" on public.documents for select using (auth.role() = 'authenticated');
create policy "documents_insert" on public.documents for insert with check (auth.role() = 'authenticated');
create policy "documents_update" on public.documents for update using (auth.role() = 'authenticated');
create policy "documents_delete" on public.documents for delete using (auth.role() = 'authenticated');

-- Audit logs
create policy "Auth users can read audit"   on public.audit_logs for select using (auth.role() = 'authenticated');
create policy "Auth users can insert audit" on public.audit_logs for insert with check (auth.role() = 'authenticated');

-- ─── 13. REALTIME ────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.leads;
alter publication supabase_realtime add table public.contacts;
alter publication supabase_realtime add table public.companies;
alter publication supabase_realtime add table public.deals;
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.activities;
alter publication supabase_realtime add table public.documents;
