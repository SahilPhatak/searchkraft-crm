-- SearchKraft CRM — Team-wide RLS: all authenticated users can read all team data
-- Run this in Supabase Dashboard → SQL Editor
-- This allows everyone to see all leads, deals, contacts, companies, tasks, activities
-- (required for shared dashboard revenue, pipeline, etc.)

-- ======= LEADS =======
drop policy if exists "leads_select" on public.leads;
drop policy if exists "leads_insert" on public.leads;
drop policy if exists "leads_update" on public.leads;
drop policy if exists "leads_delete" on public.leads;
drop policy if exists "Users can view own leads" on public.leads;
drop policy if exists "Users can create leads" on public.leads;
drop policy if exists "Users can update own leads" on public.leads;
drop policy if exists "Users can delete own leads" on public.leads;

create policy "Team can view all leads" on public.leads for select using (auth.uid() is not null);
create policy "Team can create leads" on public.leads for insert with check (auth.uid() is not null);
create policy "Team can update leads" on public.leads for update using (auth.uid() is not null);
create policy "Team can delete leads" on public.leads for delete using (auth.uid() is not null);

-- ======= DEALS =======
drop policy if exists "deals_select" on public.deals;
drop policy if exists "deals_insert" on public.deals;
drop policy if exists "deals_update" on public.deals;
drop policy if exists "deals_delete" on public.deals;
drop policy if exists "Users can view own deals" on public.deals;
drop policy if exists "Users can create deals" on public.deals;
drop policy if exists "Users can update own deals" on public.deals;
drop policy if exists "Users can delete own deals" on public.deals;

create policy "Team can view all deals" on public.deals for select using (auth.uid() is not null);
create policy "Team can create deals" on public.deals for insert with check (auth.uid() is not null);
create policy "Team can update deals" on public.deals for update using (auth.uid() is not null);
create policy "Team can delete deals" on public.deals for delete using (auth.uid() is not null);

-- ======= CONTACTS =======
drop policy if exists "contacts_select" on public.contacts;
drop policy if exists "contacts_insert" on public.contacts;
drop policy if exists "contacts_update" on public.contacts;
drop policy if exists "contacts_delete" on public.contacts;
drop policy if exists "Users can view own contacts" on public.contacts;
drop policy if exists "Users can create contacts" on public.contacts;
drop policy if exists "Users can update own contacts" on public.contacts;
drop policy if exists "Users can delete own contacts" on public.contacts;

create policy "Team can view all contacts" on public.contacts for select using (auth.uid() is not null);
create policy "Team can create contacts" on public.contacts for insert with check (auth.uid() is not null);
create policy "Team can update contacts" on public.contacts for update using (auth.uid() is not null);
create policy "Team can delete contacts" on public.contacts for delete using (auth.uid() is not null);

-- ======= COMPANIES =======
drop policy if exists "companies_select" on public.companies;
drop policy if exists "companies_insert" on public.companies;
drop policy if exists "companies_update" on public.companies;
drop policy if exists "companies_delete" on public.companies;
drop policy if exists "Users can view own companies" on public.companies;
drop policy if exists "Users can create companies" on public.companies;
drop policy if exists "Users can update own companies" on public.companies;
drop policy if exists "Users can delete own companies" on public.companies;

create policy "Team can view all companies" on public.companies for select using (auth.uid() is not null);
create policy "Team can create companies" on public.companies for insert with check (auth.uid() is not null);
create policy "Team can update companies" on public.companies for update using (auth.uid() is not null);
create policy "Team can delete companies" on public.companies for delete using (auth.uid() is not null);

-- ======= TASKS =======
drop policy if exists "tasks_select" on public.tasks;
drop policy if exists "tasks_insert" on public.tasks;
drop policy if exists "tasks_update" on public.tasks;
drop policy if exists "tasks_delete" on public.tasks;
drop policy if exists "Users can view own tasks" on public.tasks;
drop policy if exists "Users can create tasks" on public.tasks;
drop policy if exists "Users can update own tasks" on public.tasks;
drop policy if exists "Users can delete own tasks" on public.tasks;

create policy "Team can view all tasks" on public.tasks for select using (auth.uid() is not null);
create policy "Team can create tasks" on public.tasks for insert with check (auth.uid() is not null);
create policy "Team can update tasks" on public.tasks for update using (auth.uid() is not null);
create policy "Team can delete tasks" on public.tasks for delete using (auth.uid() is not null);

-- ======= ACTIVITIES =======
drop policy if exists "activities_select" on public.activities;
drop policy if exists "activities_insert" on public.activities;
drop policy if exists "activities_update" on public.activities;
drop policy if exists "activities_delete" on public.activities;
drop policy if exists "Users can view own activities" on public.activities;
drop policy if exists "Users can create activities" on public.activities;
drop policy if exists "Users can update own activities" on public.activities;
drop policy if exists "Users can delete own activities" on public.activities;

create policy "Team can view all activities" on public.activities for select using (auth.uid() is not null);
create policy "Team can create activities" on public.activities for insert with check (auth.uid() is not null);
create policy "Team can update activities" on public.activities for update using (auth.uid() is not null);
create policy "Team can delete activities" on public.activities for delete using (auth.uid() is not null);

-- ======= PROFILES (already done in migrate_super_admin.sql but repeat safely) =======
drop policy if exists "Admins can update any profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "profiles_select" on public.profiles;

create policy "Team can view all profiles" on public.profiles for select using (auth.uid() is not null);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Admins can update any profile" on public.profiles for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Super Admin', 'Admin')));
