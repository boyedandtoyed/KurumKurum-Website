-- ============================================================
-- KurumKurum — add a default address to user profiles
-- Run this ONCE in Supabase Dashboard → SQL Editor.
-- ============================================================

-- Stored as JSONB with shape { street, city, state, zip } to mirror
-- orders.shipping_address (so it can autofill checkout later).
alter table public.profiles
  add column if not exists address jsonb;
