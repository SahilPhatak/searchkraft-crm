-- Migration: Add lead_type column to leads table
-- Run this in Supabase SQL Editor if upgrading an existing database

alter table public.leads
  add column if not exists lead_type text;

comment on column public.leads.lead_type is 'Inbound or Outbound';
