-- SearchKraft CRM — Super Admin: allow role updates on profiles
-- Run this in Supabase Dashboard → SQL Editor

-- Allow any authenticated user to update profiles
-- (Super Admin role-check is enforced in app logic)
-- The existing policy only allows users to update their OWN profile — extend it:

drop policy if exists "Users can update own profile" on public.profiles;

-- Users can update their own profile (name, phone, title, dept, avatar, color)
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Super Admin / Admin can update ANY profile (for role assignment)
-- We identify Super Admins by checking their own profile row
create policy "Admins can update any profile"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('Super Admin', 'Admin')
    )
  );
