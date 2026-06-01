-- ============================================================
-- KurumKurum — admin management: stock column + orders schema
-- Run this ONCE in Supabase Dashboard → SQL Editor.
-- ============================================================

-- 1. Products: numeric stock tracking
alter table public.products
  add column if not exists stock_quantity integer not null default 0;

-- 2. Orders
create table if not exists public.orders (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references auth.users(id) on delete set null,
  guest_email        text,
  guest_phone        text,
  guest_name         text,
  shipping_address   jsonb not null,
  status             text not null default 'pending'
                       check (status in ('pending','processing','shipped','delivered')),
  tracking_number    text,
  total_amount       numeric(10,2) not null,
  total_weight_grams integer not null default 0,
  stripe_payment_id  text,
  created_at         timestamptz not null default now()
);

-- 3. Order items
create table if not exists public.order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders(id) on delete cascade,
  product_id        uuid references public.products(id) on delete set null,
  quantity          integer not null,
  price_at_purchase numeric(10,2) not null,
  product_snapshot  jsonb not null
);

-- 4. RLS on orders / order_items.
--    Admin reads/writes go through the SERVICE client (bypasses RLS).
--    These policies only cover the customer-facing anon/auth client.
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Customers insert their own orders" on public.orders;
create policy "Customers insert their own orders"
  on public.orders for insert
  with check (user_id is null or auth.uid() = user_id);

drop policy if exists "Customers read their own orders" on public.orders;
create policy "Customers read their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

drop policy if exists "Customers insert their own order items" on public.order_items;
create policy "Customers insert their own order items"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.user_id is null or o.user_id = auth.uid())
    )
  );

-- 5. Close the is_admin self-promotion hole on profiles.
--    Replace the broad owner-update policy with one that forbids a user
--    flipping their own is_admin. (Admin promotion happens via the service
--    client in the guarded /api/admin/admins route.)
drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and is_admin = (select p.is_admin from public.profiles p where p.id = auth.uid())
  );
