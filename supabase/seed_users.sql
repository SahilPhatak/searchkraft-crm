-- SearchKraft CRM — Seed initial users
-- Run AFTER schema.sql in Supabase Dashboard → SQL Editor
-- This creates auth users + profiles for the initial team

-- NOTE: Supabase Auth users must be created via the Dashboard or Auth API.
-- Below inserts profile rows for users you create via Dashboard → Auth → Users
-- Password for all: SearchKraft@2024

-- After creating each user in Auth dashboard, run this to set their profile:

-- 1. First: go to Supabase Dashboard → Authentication → Users → Invite user (or Add user)
--    Create each of these emails with password: SearchKraft@2024
--    - vikram@searchkraft.in
--    - sahil@searchkraft.in
--    - poovizhi@searchkraft.in
--    - arjun@searchkraft.in
--    - priya@searchkraft.in

-- 2. Then run the UPDATE below to set their CRM roles/titles
--    (The trigger already created a basic profile on signup)

update public.profiles set
  name   = 'Vikram Sharma',
  role   = 'Super Admin',
  title  = 'CEO',
  dept   = 'Leadership',
  phone  = '91-9663212727',
  avatar = 'VS',
  color  = '#1a56db',
  status = 'active'
where email = 'vikram@searchkraft.in';

update public.profiles set
  name   = 'Sahil Phatak',
  role   = 'Super Admin',
  title  = 'Founder',
  dept   = 'Leadership',
  phone  = '91-9900000000',
  avatar = 'SP',
  color  = '#1a56db',
  status = 'active'
where email = 'sahil@searchkraft.in';

update public.profiles set
  name   = 'Poovizhi Devaraj',
  role   = 'Admin',
  title  = 'Manager',
  dept   = 'Sales',
  phone  = '91-9876543210',
  avatar = 'PD',
  color  = '#7c3aed',
  status = 'active'
where email = 'poovizhi@searchkraft.in';

update public.profiles set
  name   = 'Arjun Mehta',
  role   = 'Manager',
  title  = 'Sales Lead',
  dept   = 'Sales',
  phone  = '91-9900112233',
  avatar = 'AM',
  color  = '#059669',
  status = 'active'
where email = 'arjun@searchkraft.in';

update public.profiles set
  name   = 'Priya Nair',
  role   = 'User',
  title  = 'BDE',
  dept   = 'Sales',
  phone  = '91-9812345678',
  avatar = 'PN',
  color  = '#dc2626',
  status = 'active'
where email = 'priya@searchkraft.in';
