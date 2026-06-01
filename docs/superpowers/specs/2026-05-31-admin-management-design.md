# Admin Management — Design Spec

**Date:** 2026-05-31
**Status:** Approved for spec review
**Goal:** Make the `/admin` panel the operational control surface for KurumKurum — managing products, inventory, prices, orders, and admin users entirely through the UI, with no hand-written SQL or Supabase-dashboard work for day-to-day operations.

---

## Background / Current State

- `products` + `categories` tables are live in Supabase (read by shop, homepage, search via the anon client).
- `profiles` table exists with an `is_admin` boolean and RLS. Email/password + Google auth is wired (`app/login`, `app/auth/callback`, `middleware.ts`).
- `lib/supabase/service.ts` provides a service-role client for operations that bypass RLS.
- **All `/admin` pages are demo-only React local state** — no database reads or writes.
- **No `orders` / `order_items` tables exist**, and checkout does not persist orders.
- **No admin route protection** — anyone can visit `/admin`.
- Stripe is installed but not wired; this project does **not** add real payments.

## Decisions (from brainstorming)

| Decision | Choice |
|----------|--------|
| Scope | Everything in one project: admin protection + products + full orders pipeline |
| Inventory | Numeric `stock_quantity` per product; auto out-of-stock at 0; decrement on order |
| Payment | None. Orders are created as `pending` without a charge. Stripe deferred. |
| Admin designation | Manage via the `/admin/admins` UI (promote/revoke by email); first admin bootstrapped manually once |
| Write path | **Option A** — Next.js Route Handlers + service client, guarded by a server-side admin check |

## Non-Goals

- Stripe / real payment processing.
- Email notifications (Resend).
- Password reset flow.
- `/product/[slug]` detail page.
- Customer-facing order history UI (beyond a minimal confirmation view).

---

## Architecture

### Write path — Route Handlers + service client (Option A)

Admin pages stay `"use client"` and call internal API routes. Each admin route:

1. Reads the session via the **server client** (`lib/supabase/server.ts`).
2. Loads the caller's `profiles.is_admin`. If missing/false → respond `403`.
3. Only then uses the **service client** (`lib/supabase/service.ts`) to perform the write.

The service-role key never reaches the browser. Security logic is explicit in code (not solely in RLS). This matches the existing "three clients" design.

A shared helper centralizes the guard:

```
lib/auth/requireAdmin.ts
  requireAdmin(): Promise<{ user, profile } | NextResponse(403)>
```

Used at the top of every `/api/admin/*` route.

### Routes

```
app/api/admin/products/route.ts        POST   create product
app/api/admin/products/[id]/route.ts   PATCH  update (price, stock, fields, in_stock)
                                       DELETE delete product
app/api/admin/orders/[id]/route.ts     PATCH  update status / tracking_number
app/api/admin/admins/route.ts          GET    list admins
                                       POST   promote by email
app/api/admin/admins/[id]/route.ts     DELETE revoke admin
app/api/orders/route.ts                POST   create order (PUBLIC — no admin guard)
```

`POST /api/orders` is the only non-admin route — it serves checkout for both logged-in users and guests.

### Admin route protection

Convert `app/admin/layout.tsx` into an async Server Component:

- Get the session (server client). If no user → `redirect("/login?redirect=/admin")`.
- Load `profiles.is_admin`. If not admin → `redirect("/login?redirect=/admin")` (or a lightweight "not authorized" view).
- Otherwise render `<AdminSidebar />` + children.

Every `/api/admin/*` route independently re-checks via `requireAdmin()` (defense in depth — the layout guard protects pages, the route guard protects data).

---

## Schema Changes

Delivered as `supabase/admin-and-orders.sql`, run once in the Supabase SQL Editor (same pattern as `profiles.sql`).

### products

```sql
alter table public.products
  add column if not exists stock_quantity integer not null default 0;
```

`in_stock` is kept and maintained as a derived truth: writes set `in_stock = (stock_quantity > 0)`. Admins can still force `in_stock = false` while stock > 0 (e.g. temporarily hide), but stock reaching 0 always forces it false.

### orders

Matches `Order` in `types/index.ts`:

```sql
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
```

### order_items

Matches `OrderItem` in `types/index.ts`:

```sql
create table if not exists public.order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders(id) on delete cascade,
  product_id        uuid references public.products(id) on delete set null,
  quantity          integer not null,
  price_at_purchase numeric(10,2) not null,
  product_snapshot  jsonb not null
);
```

### RLS

- **orders / order_items:** enable RLS. Customers may `insert` their own order (`user_id = auth.uid()` or a guest order with null user_id) and `select` their own. No public update/delete. Admin reads/writes go through the **service client**, which bypasses RLS.
- **profiles — close the escalation hole:** the current update policy lets a user set their own `is_admin`. Replace it with a policy that allows self-update of profile fields **except** `is_admin` (enforced via a trigger or a `with check` that compares `is_admin` to its old value). `is_admin` only ever changes through the guarded admins route (service client).

### Order creation logic (server, in `POST /api/orders`)

In a single flow:
1. Recompute `total_amount` and `total_weight_grams` **server-side** from current product prices/weights (never trust client totals).
2. Insert `orders` row (`status = 'pending'`).
3. Insert `order_items` (one per cart line, with `price_at_purchase` and `product_snapshot`).
4. Decrement each product's `stock_quantity` (floor at 0) and update `in_stock`.

Stock decrement + order insert should be resilient: if a product has insufficient stock, reject with a clear error before inserting. (A Postgres function/RPC is the clean way to make this atomic; acceptable fallback for v1 is sequential service-client writes with a pre-check.)

---

## Feature-by-Feature

### Product management — `/admin/products`

- On mount, fetch real products (`*, category:categories(...)`) and categories from Supabase via the anon client (same query shape as `app/shop/page.tsx`).
- Replace `INITIAL_PRODUCTS` and hardcoded `CATEGORIES`.
- Add a **Stock** field (`stock_quantity`) to the add/edit modal and a column in the table.
- Wire actions to admin routes:
  - Add → `POST /api/admin/products`
  - Edit (incl. price, stock) → `PATCH /api/admin/products/[id]`
  - Delete → `DELETE /api/admin/products/[id]`
  - Stock toggle → `PATCH` with `in_stock`
- Optimistic UI with rollback on error; toast feedback (React Hot Toast already in stack).

### Checkout → order creation

- On final checkout step submit: `POST /api/orders` with contact info, shipping address, and cart line items (product ids + quantities).
- Server computes totals, creates order + items, decrements stock, returns `{ orderId }`.
- Clear the cart store; show a minimal **order confirmation** (order id + summary). A simple `/checkout/confirmation` view or inline success state — kept minimal.

### Order management — `/admin/orders`

- Fetch real orders (newest first) — via a server component or `GET` through the admin layer.
- Table mirrors current demo layout. Row → detail panel/modal showing `order_items`, customer/guest info, shipping address.
- Update **status** (dropdown) and **tracking_number** → `PATCH /api/admin/orders/[id]`.

### Admin users — `/admin/admins`

- List profiles where `is_admin = true` (via `GET /api/admin/admins`).
- **Promote by email** → `POST /api/admin/admins` (looks up the profile by email, sets `is_admin = true`).
- **Revoke** → `DELETE /api/admin/admins/[id]` (guard against removing the last admin).
- First admin is bootstrapped manually once in the Supabase dashboard (documented).

### Dashboard — `/admin`

- Replace `DEMO_STATS` / `DEMO_ORDERS` with real aggregates:
  - Total orders, revenue (`sum(total_amount)`), product count, pending-order count.
  - Recent orders (latest 5) from the DB.

---

## Error Handling

- API routes return structured JSON errors with appropriate status codes (`401/403` auth, `400` validation, `409` insufficient stock, `500` unexpected).
- Client surfaces errors via toast; failed optimistic updates roll back.
- Totals and stock are always validated/recomputed server-side — the client is never trusted for money or inventory.

## Testing

- **Unit tests** (the logic worth protecting):
  - `requireAdmin` guard — allows admins, rejects non-admins/anonymous.
  - Order total + weight computation from line items.
  - Stock decrement (floors at 0; rejects when insufficient; flips `in_stock`).
- **Manual verification:** product CRUD round-trip, place an order end-to-end (stock decrements, order appears in `/admin/orders`), advance order status, promote/revoke an admin, non-admin blocked from `/admin` and from `/api/admin/*`.

## One-Time Setup (documented, not ongoing)

1. Run `supabase/admin-and-orders.sql` once in the Supabase SQL Editor.
2. Set `is_admin = true` on your own profile once in the Supabase dashboard to bootstrap the first admin.

After these two steps, all management happens through `/admin`.

---

## Implementation Order (phases)

1. Schema SQL + types (`stock_quantity`, confirm `Order`/`OrderItem` types).
2. `requireAdmin` helper + admin layout guard.
3. Product admin routes + wire `/admin/products` to DB.
4. `POST /api/orders` + checkout wiring + confirmation.
5. Order admin routes + `/admin/orders` real data + detail/status.
6. Admin-user routes + `/admin/admins`.
7. Dashboard real aggregates.
8. Tests for guard / totals / stock; manual end-to-end pass.
