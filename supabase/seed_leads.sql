-- ============================================================
-- SearchKraft CRM — SEED LEADS DATA
-- Run this in Supabase SQL Editor to populate initial leads
-- ============================================================
-- NOTE: This uses fixed UUIDs so you can re-run safely (upsert).
-- Companies and contacts are also seeded as a dependency.
-- ============================================================

-- ─── 1. SEED COMPANIES ───────────────────────────────────────
insert into public.companies (id, name, industry, website, city, country, status, bd_owner, created_at, updated_at)
values
  ('a1000000-0000-0000-0000-000000000001', 'Tata Consultancy Services', 'IT Services',       'tcs.com',       'Mumbai',    'India', 'Active',  'Vikram',    now(), now()),
  ('a1000000-0000-0000-0000-000000000002', 'Infosys Ltd',               'IT Services',       'infosys.com',   'Bengaluru', 'India', 'Active',  'Samyadeep', now(), now()),
  ('a1000000-0000-0000-0000-000000000003', 'HDFC Bank',                 'Banking & Finance', 'hdfcbank.com',  'Mumbai',    'India', 'Prospect','Sahil',      now(), now()),
  ('a1000000-0000-0000-0000-000000000004', 'Flipkart',                  'E-Commerce',        'flipkart.com',  'Bengaluru', 'India', 'Active',  'Vikram',    now(), now()),
  ('a1000000-0000-0000-0000-000000000005', 'Ola Cabs',                  'Mobility Tech',     'olacabs.com',   'Bengaluru', 'India', 'Prospect','Urmila',     now(), now()),
  ('a1000000-0000-0000-0000-000000000006', 'Zomato',                    'Food Tech',         'zomato.com',    'Gurugram',  'India', 'Active',  'Samyadeep', now(), now()),
  ('a1000000-0000-0000-0000-000000000007', 'PhonePe',                   'Fintech',           'phonepe.com',   'Bengaluru', 'India', 'Active',  'Sahil',      now(), now()),
  ('a1000000-0000-0000-0000-000000000008', 'Swiggy',                    'Food Tech',         'swiggy.com',    'Bengaluru', 'India', 'Prospect','Urmila',     now(), now()),
  ('a1000000-0000-0000-0000-000000000009', 'Meesho',                    'E-Commerce',        'meesho.com',    'Bengaluru', 'India', 'Prospect','Vikram',    now(), now()),
  ('a1000000-0000-0000-0000-000000000010', 'Razorpay',                  'Fintech',           'razorpay.com',  'Bengaluru', 'India', 'Active',  'Samyadeep', now(), now())
on conflict (name) do update set
  industry   = excluded.industry,
  website    = excluded.website,
  city       = excluded.city,
  status     = excluded.status,
  updated_at = now();

-- ─── 2. SEED CONTACTS ────────────────────────────────────────
insert into public.contacts (id, name, email, phone, title, company, company_id, owner, created_at, updated_at)
values
  ('b1000000-0000-0000-0000-000000000001', 'Anita Sharma',  'anita@tcs.com',      '9876543210', 'VP HR',          'Tata Consultancy Services', 'a1000000-0000-0000-0000-000000000001', 'Vikram',    now(), now()),
  ('b1000000-0000-0000-0000-000000000002', 'Rohan Mehta',   'rohan@infosys.com',  '9876543211', 'TA Head',        'Infosys Ltd',               'a1000000-0000-0000-0000-000000000002', 'Samyadeep', now(), now()),
  ('b1000000-0000-0000-0000-000000000003', 'Deepa Nair',    'deepa@hdfc.com',     '9876543212', 'HR Director',    'HDFC Bank',                 'a1000000-0000-0000-0000-000000000003', 'Sahil',     now(), now()),
  ('b1000000-0000-0000-0000-000000000004', 'Kiran Patel',   'kiran@flipkart.com', '9876543213', 'Talent Manager', 'Flipkart',                  'a1000000-0000-0000-0000-000000000004', 'Vikram',    now(), now()),
  ('b1000000-0000-0000-0000-000000000005', 'Meera Joshi',   'meera@ola.com',      '9876543214', 'HR Manager',     'Ola Cabs',                  'a1000000-0000-0000-0000-000000000005', 'Urmila',    now(), now()),
  ('b1000000-0000-0000-0000-000000000006', 'Suresh Kumar',  'suresh@zomato.com',  '9876543215', 'VP People',      'Zomato',                    'a1000000-0000-0000-0000-000000000006', 'Samyadeep', now(), now()),
  ('b1000000-0000-0000-0000-000000000007', 'Priti Shah',    'priti@phonepe.com',  '9876543216', 'TA Lead',        'PhonePe',                   'a1000000-0000-0000-0000-000000000007', 'Sahil',     now(), now())
on conflict (email) do update set
  name       = excluded.name,
  phone      = coalesce(excluded.phone, contacts.phone),
  title      = coalesce(excluded.title, contacts.title),
  company    = coalesce(excluded.company, contacts.company),
  updated_at = now();

-- ─── 3. SEED LEADS ───────────────────────────────────────────
insert into public.leads (
  id, name, company, stage, value, owner,
  source, lead_type, source_sd,
  first_name, last_name, email, phone,
  industry, notes,
  created_at, updated_at
) values
  (
    'c1000000-0000-0000-0000-000000000001',
    'Senior Engineers Mandate – TCS',
    'Tata Consultancy Services',
    'Qualified',
    800000,
    'Vikram',
    'Referral', 'Inbound', 'Client Referral',
    'Anita', 'Sharma', 'anita@tcs.com', '9876543210',
    'IT Services',
    'TCS looking for 5 senior backend engineers. Java/Spring Boot expertise required. Urgent mandate.',
    now() - interval '15 days', now() - interval '2 days'
  ),
  (
    'c1000000-0000-0000-0000-000000000002',
    'Data Science Team Build – Infosys',
    'Infosys Ltd',
    'Proposal Sent',
    1200000,
    'Samyadeep',
    'LinkedIn', 'Outbound', 'LinkedIn Outreach',
    'Rohan', 'Mehta', 'rohan@infosys.com', '9876543211',
    'IT Services',
    'Build a 10-member data science team. ML, Python, NLP skills needed. 3-month hiring timeline.',
    now() - interval '20 days', now() - interval '1 day'
  ),
  (
    'c1000000-0000-0000-0000-000000000003',
    'Risk & Compliance Roles – HDFC',
    'HDFC Bank',
    'New',
    600000,
    'Sahil',
    'Cold Call', 'Inbound', 'Direct Call',
    'Deepa', 'Nair', 'deepa@hdfc.com', '9876543212',
    'Banking & Finance',
    'HDFC Bank requires 4 Risk Analysts and 2 Compliance Officers. BFSI background preferred.',
    now() - interval '5 days', now() - interval '5 days'
  ),
  (
    'c1000000-0000-0000-0000-000000000004',
    'Product Managers x3 – Flipkart',
    'Flipkart',
    'Won',
    900000,
    'Vikram',
    'Referral', 'Inbound', 'Client Referral',
    'Kiran', 'Patel', 'kiran@flipkart.com', '9876543213',
    'E-Commerce',
    'Placed 3 PMs for Flipkart commerce team. All joined successfully. Great client relationship.',
    now() - interval '45 days', now() - interval '10 days'
  ),
  (
    'c1000000-0000-0000-0000-000000000005',
    'Driver App Engineers – Ola',
    'Ola Cabs',
    'Contacted',
    400000,
    'Urmila',
    'LinkedIn', 'Outbound', 'LinkedIn Outreach',
    'Meera', 'Joshi', 'meera@ola.com', '9876543214',
    'Mobility Tech',
    'Ola needs Android/Kotlin developers for driver-partner app. 3 openings. Mid-senior level.',
    now() - interval '8 days', now() - interval '3 days'
  ),
  (
    'c1000000-0000-0000-0000-000000000006',
    'Growth & Marketing Team – Zomato',
    'Zomato',
    'Negotiation',
    750000,
    'Samyadeep',
    'Website', 'Inbound', 'Website Inquiry',
    'Suresh', 'Kumar', 'suresh@zomato.com', '9876543215',
    'Food Tech',
    'Zomato growth team expansion. Looking for performance marketers and data analysts. 6 total roles.',
    now() - interval '12 days', now() - interval '1 day'
  ),
  (
    'c1000000-0000-0000-0000-000000000007',
    'Payments Backend Engineers – PhonePe',
    'PhonePe',
    'Qualified',
    1100000,
    'Sahil',
    'Referral', 'Inbound', 'Client Referral',
    'Priti', 'Shah', 'priti@phonepe.com', '9876543216',
    'Fintech',
    'PhonePe needs 8 backend engineers for payments infrastructure. Java microservices. Urgent.',
    now() - interval '7 days', now() - interval '1 day'
  ),
  (
    'c1000000-0000-0000-0000-000000000008',
    'Operations Leadership – Swiggy',
    'Swiggy',
    'Proposal Sent',
    500000,
    'Urmila',
    'Cold Email', 'Outbound', 'Cold Email',
    'Nikhil', 'Verma', 'nikhil@swiggy.com', '9876543217',
    'Food Tech',
    'Swiggy ops team needs 2 city leads and 1 regional head. P&L ownership required. Major metro roles.',
    now() - interval '18 days', now() - interval '5 days'
  ),
  (
    'c1000000-0000-0000-0000-000000000009',
    'Category Managers – Meesho',
    'Meesho',
    'New',
    350000,
    'Vikram',
    'LinkedIn', 'Outbound', 'LinkedIn Outreach',
    'Ritika', 'Singh', 'ritika@meesho.com', '9876543218',
    'E-Commerce',
    'Meesho expanding in Tier 2/3 cities. Need 3 category managers with FMCG or e-com background.',
    now() - interval '3 days', now() - interval '3 days'
  ),
  (
    'c1000000-0000-0000-0000-000000000010',
    'DevOps & SRE Team – Razorpay',
    'Razorpay',
    'Contacted',
    680000,
    'Samyadeep',
    'Event', 'Inbound', 'Industry Event',
    'Arjun', 'Kapoor', 'arjun@razorpay.com', '9876543219',
    'Fintech',
    'Met at SREcon. Razorpay needs 4 SREs and 2 DevOps engineers for cloud infra scaling.',
    now() - interval '10 days', now() - interval '2 days'
  ),
  (
    'c1000000-0000-0000-0000-000000000011',
    'Sales Team Expansion – Freshworks',
    'Freshworks',
    'Qualified',
    420000,
    'Vikram',
    'Referral', 'Outbound', 'Partner Referral',
    'Kavitha', 'Reddy', 'kavitha@freshworks.com', '9876543220',
    'SaaS / Software',
    'Freshworks scaling inside sales for SMB segment. 5 AEs + 2 SDRs. SaaS selling experience a must.',
    now() - interval '14 days', now() - interval '4 days'
  ),
  (
    'c1000000-0000-0000-0000-000000000012',
    'Finance & Accounting Roles – Paytm',
    'Paytm',
    'Lost',
    300000,
    'Urmila',
    'Cold Call', 'Outbound', 'Direct Call',
    'Rahul', 'Bose', 'rahul.b@paytm.com', '9876543221',
    'Fintech',
    'Lost to competitor. Client went with a larger agency. Keep warm for future mandates.',
    now() - interval '30 days', now() - interval '15 days'
  )
on conflict (id) do update set
  name        = excluded.name,
  company     = excluded.company,
  stage       = excluded.stage,
  value       = excluded.value,
  owner       = excluded.owner,
  notes       = excluded.notes,
  updated_at  = now();

-- ─── VERIFY ─────────────────────────────────────────────────
select
  count(*) filter (where stage = 'New')           as new_leads,
  count(*) filter (where stage = 'Contacted')     as contacted,
  count(*) filter (where stage = 'Qualified')     as qualified,
  count(*) filter (where stage = 'Proposal Sent') as proposal_sent,
  count(*) filter (where stage = 'Negotiation')   as negotiation,
  count(*) filter (where stage = 'Won')           as won,
  count(*) filter (where stage = 'Lost')          as lost,
  count(*)                                         as total
from public.leads
where id like 'c10000%';
