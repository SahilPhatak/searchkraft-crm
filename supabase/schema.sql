-- SearchKraft CRM — Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor

-- ─── USERS PROFILE TABLE ─────────────────────────────────────────────────────
-- Extends Supabase auth.users with CRM profile info
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  name        text not null,
  email       text not null,
  role        text not null default 'User',   -- Super Admin, Admin, Manager, User, Restricted
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
create policy "Users can read all profiles"   on public.profiles for select using (auth.role() = 'authenticated');
create policy "Users can update own profile"  on public.profiles for update using (auth.uid() = id);
create policy "Service role can insert"       on public.profiles for insert with check (true);

-- ─── LEADS ───────────────────────────────────────────────────────────────────
create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text,
  phone       text,
  company     text,
  title       text,
  source      text,
  stage       text default 'New',
  rating      int,
  value       numeric,
  notes       text,
  owner       text,
  owner_id    uuid references public.profiles(id),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table public.leads enable row level security;
create policy "Auth users can do all on leads" on public.leads for all using (auth.role() = 'authenticated');

-- ─── CONTACTS ────────────────────────────────────────────────────────────────
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
create policy "Auth users can do all on contacts" on public.contacts for all using (auth.role() = 'authenticated');

-- ─── COMPANIES (ACCOUNTS) ────────────────────────────────────────────────────
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
create policy "Auth users can do all on companies" on public.companies for all using (auth.role() = 'authenticated');

-- ─── DEALS ───────────────────────────────────────────────────────────────────
create table if not exists public.deals (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  stage       text default 'Prospecting',
  value       numeric,
  currency    text default 'INR',
  close_date  date,
  probability int,
  source      text,
  notes       text,
  contact     text,
  contact_id  uuid references public.contacts(id),
  company     text,
  company_id  uuid references public.companies(id),
  owner       text,
  owner_id    uuid references public.profiles(id),
  won_at      timestamptz,
  lost_at     timestamptz,
  lost_reason text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table public.deals enable row level security;
create policy "Auth users can do all on deals" on public.deals for all using (auth.role() = 'authenticated');

-- ─── TASKS ───────────────────────────────────────────────────────────────────
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  due_date    date,
  status      text default 'Pending',
  priority    text default 'Normal',
  owner       text,
  owner_id    uuid references public.profiles(id),
  lead_id     uuid references public.leads(id),
  contact_id  uuid references public.contacts(id),
  deal_id     uuid references public.deals(id),
  completed_at timestamptz,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table public.tasks enable row level security;
create policy "Auth users can do all on tasks" on public.tasks for all using (auth.role() = 'authenticated');

-- ─── ACTIVITIES ──────────────────────────────────────────────────────────────
create table if not exists public.activities (
  id          uuid primary key default gen_random_uuid(),
  type        text not null,   -- Call, Meeting, Email, Note
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
create policy "Auth users can do all on activities" on public.activities for all using (auth.role() = 'authenticated');

-- ─── AUDIT LOG ───────────────────────────────────────────────────────────────
create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  action      text not null,   -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT
  module      text not null,
  record_id   uuid,
  record_name text,
  user_name   text,
  user_id     uuid references public.profiles(id),
  created_at  timestamptz default now()
);
alter table public.audit_logs enable row level security;
create policy "Auth users can read audit" on public.audit_logs for select using (auth.role() = 'authenticated');
create policy "Auth users can insert audit" on public.audit_logs for insert with check (auth.role() = 'authenticated');

-- ─── AUTO-UPDATE updated_at ──────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger set_leads_updated_at     before update on public.leads     for each row execute function public.set_updated_at();
create trigger set_contacts_updated_at  before update on public.contacts  for each row execute function public.set_updated_at();
create trigger set_companies_updated_at before update on public.companies for each row execute function public.set_updated_at();
create trigger set_deals_updated_at     before update on public.deals     for each row execute function public.set_updated_at();
create trigger set_tasks_updated_at     before update on public.tasks     for each row execute function public.set_updated_at();

-- ─── AUTO-CREATE PROFILE ON SIGNUP ───────────────────────────────────────────
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

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
