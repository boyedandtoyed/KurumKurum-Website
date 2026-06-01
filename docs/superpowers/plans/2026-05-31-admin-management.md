# Admin Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/admin` the operational control surface for KurumKurum — manage products/inventory/prices, run the full orders pipeline (schema → checkout writes orders → admin order management), manage admin users, and protect all admin surfaces — with no hand-written SQL for day-to-day work.

**Architecture:** Admin pages stay client components but perform all writes through guarded Next.js Route Handlers under `/api/admin/*`. Each route verifies the caller is an admin (server session + `profiles.is_admin`) before using the service-role Supabase client to write, so the service key never reaches the browser and security lives in explicit code. Money and inventory logic is extracted into pure libs that are unit-tested; UI wiring is verified via build/lint/manual passes. Orders are created as `pending` with no payment (Stripe deferred).

**Tech Stack:** Next.js 14 App Router, TypeScript, Supabase (`@supabase/ssr` + `@supabase/supabase-js`), Tailwind, Framer Motion, React Hot Toast, Zustand. Tests via Vitest (added in Task 1).

---

## Reference: Existing Patterns (read before starting)

- Anon browser client: `lib/supabase/client.ts` → `createClient()`
- Server client (reads cookies/session): `lib/supabase/server.ts` → `await createClient()`
- Service client (bypasses RLS): `lib/supabase/service.ts` → `createServiceClient()`
- Product read query shape: `app/shop/page.tsx:26-32` (`.select("*, category:categories(id, name, slug)")`)
- Shipping calc: `lib/shipping.ts` → `calculateShipping(totalWeightGrams, orderTotal)` returns `{ cost, ... }`
- Cart store: `store/cartStore.ts` → `useCartStore()`; items are `{ product, quantity }`; has `clearCart()`
- Types: `types/index.ts` (`Product`, `Order`, `OrderItem`, `ShippingAddress`, `Profile`)
- Existing profiles SQL: `supabase/profiles.sql`

---

## File Structure

**New files:**
- `vitest.config.ts` — test runner config with `@` alias
- `supabase/admin-and-orders.sql` — schema migration (run once in dashboard)
- `lib/orders/calculateOrder.ts` — pure order-total calculation
- `lib/orders/calculateOrder.test.ts`
- `lib/inventory/stock.ts` — pure stock-decrement / in_stock derivation
- `lib/inventory/stock.test.ts`
- `lib/auth/requireAdmin.ts` — server-side admin guard helper
- `app/api/admin/products/route.ts` — POST create product
- `app/api/admin/products/[id]/route.ts` — PATCH / DELETE product
- `app/api/admin/orders/[id]/route.ts` — PATCH order status/tracking
- `app/api/admin/admins/route.ts` — GET list / POST promote
- `app/api/admin/admins/[id]/route.ts` — DELETE revoke
- `app/api/orders/route.ts` — POST create order (public)
- `app/checkout/confirmation/page.tsx` — minimal order confirmation

**Modified files:**
- `package.json` — add `test` script + Vitest devDeps
- `types/index.ts` — add `stock_quantity` to `Product`
- `app/admin/layout.tsx` — admin route guard
- `app/admin/products/page.tsx` — wire to DB
- `app/checkout/page.tsx` — place order on submit
- `app/admin/orders/page.tsx` — real orders + detail + status
- `app/admin/admins/page.tsx` — real admins + promote/revoke
- `app/admin/page.tsx` — real dashboard aggregates
- `docs/AUTH_SETUP.md` — document the two one-time setup steps

---

## Task 1: Test Infrastructure (Vitest)

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Install Vitest**

Run: `npm install -D vitest`
Expected: vitest added to devDependencies, no errors.

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 3: Add the `test` script to `package.json`**

In the `"scripts"` block, add a `test` line so it reads:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run"
  },
```

- [ ] **Step 4: Verify the runner works (no tests yet)**

Run: `npm test`
Expected: Vitest runs and reports "No test files found" (exit 0 or a clean "no tests" message). This confirms config loads.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest test runner"
```

---

## Task 2: Schema Migration + Product Type

**Files:**
- Create: `supabase/admin-and-orders.sql`
- Modify: `types/index.ts:7-23`

- [ ] **Step 1: Create `supabase/admin-and-orders.sql`**

```sql
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
```

- [ ] **Step 2: Add `stock_quantity` to the `Product` type**

In `types/index.ts`, the `Product` interface (lines 7-23) — add `stock_quantity` after `in_stock`:

```ts
export interface Product {
  id: string;
  name: string;
  brand: string;
  category_id: string;
  category?: Category;
  weight_grams: number;
  weight_label: string;
  unit_type: string;
  price: number;
  description: string;
  image_url: string;
  in_stock: boolean;
  stock_quantity: number;
  is_featured?: boolean;
  created_at: string;
  slug?: string;
}
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No new errors from `types/index.ts`. (Pre-existing unrelated errors, if any, are out of scope — note them but don't fix.)

- [ ] **Step 4: Commit**

```bash
git add supabase/admin-and-orders.sql types/index.ts
git commit -m "feat: add orders schema + product stock_quantity (SQL + types)"
```

> **NOTE (one-time, manual):** After this task, run `supabase/admin-and-orders.sql` once in the Supabase SQL Editor before the order/admin features can read/write data. Documented in Task 13.

---

## Task 3: Order Totals Library (TDD)

**Files:**
- Create: `lib/orders/calculateOrder.test.ts`
- Create: `lib/orders/calculateOrder.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/orders/calculateOrder.test.ts
import { describe, it, expect } from "vitest";
import { calculateOrderTotals } from "./calculateOrder";

describe("calculateOrderTotals", () => {
  it("sums line subtotals from price * quantity", () => {
    const totals = calculateOrderTotals([
      { price: 4.99, weight_grams: 200, quantity: 2 },
      { price: 1.99, weight_grams: 75, quantity: 1 },
    ]);
    expect(totals.subtotal).toBe(11.97);
  });

  it("sums total weight in grams", () => {
    const totals = calculateOrderTotals([
      { price: 4.99, weight_grams: 200, quantity: 2 },
      { price: 1.99, weight_grams: 75, quantity: 1 },
    ]);
    expect(totals.totalWeightGrams).toBe(475);
  });

  it("adds shipping for light orders under $150 (base $9.99)", () => {
    const totals = calculateOrderTotals([
      { price: 4.99, weight_grams: 200, quantity: 1 },
    ]);
    expect(totals.shippingCost).toBe(9.99);
    expect(totals.totalAmount).toBe(14.98);
  });

  it("gives free shipping at $150+ subtotal", () => {
    const totals = calculateOrderTotals([
      { price: 75, weight_grams: 500, quantity: 2 },
    ]);
    expect(totals.shippingCost).toBe(0);
    expect(totals.totalAmount).toBe(150);
  });

  it("rounds money to 2 decimals", () => {
    const totals = calculateOrderTotals([
      { price: 0.1, weight_grams: 10, quantity: 3 },
    ]);
    expect(totals.subtotal).toBe(0.3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot find module `./calculateOrder` / `calculateOrderTotals is not a function`.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/orders/calculateOrder.ts
import { calculateShipping } from "@/lib/shipping";

export interface OrderLineInput {
  price: number;
  weight_grams: number;
  quantity: number;
}

export interface OrderTotals {
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  totalWeightGrams: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function calculateOrderTotals(lines: OrderLineInput[]): OrderTotals {
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const totalWeightGrams = lines.reduce(
    (sum, l) => sum + l.weight_grams * l.quantity,
    0
  );
  const shipping = calculateShipping(totalWeightGrams, subtotal);
  return {
    subtotal: round2(subtotal),
    shippingCost: round2(shipping.cost),
    totalAmount: round2(subtotal + shipping.cost),
    totalWeightGrams,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS — all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/orders/calculateOrder.ts lib/orders/calculateOrder.test.ts
git commit -m "feat: add order totals calculation lib"
```

---

## Task 4: Inventory Library (TDD)

**Files:**
- Create: `lib/inventory/stock.test.ts`
- Create: `lib/inventory/stock.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/inventory/stock.test.ts
import { describe, it, expect } from "vitest";
import { findInsufficientStock, nextStock, deriveInStock } from "./stock";

describe("findInsufficientStock", () => {
  it("returns lines where requested exceeds available", () => {
    const short = findInsufficientStock([
      { product_id: "a", name: "A", requested: 2, available: 5 },
      { product_id: "b", name: "B", requested: 3, available: 1 },
    ]);
    expect(short).toHaveLength(1);
    expect(short[0].product_id).toBe("b");
  });

  it("returns empty when all lines have enough stock", () => {
    const short = findInsufficientStock([
      { product_id: "a", name: "A", requested: 5, available: 5 },
    ]);
    expect(short).toEqual([]);
  });
});

describe("nextStock", () => {
  it("subtracts requested from available", () => {
    expect(nextStock(10, 3)).toBe(7);
  });
  it("floors at zero", () => {
    expect(nextStock(2, 5)).toBe(0);
  });
});

describe("deriveInStock", () => {
  it("is false when stock is zero regardless of explicit flag", () => {
    expect(deriveInStock(0, true)).toBe(false);
  });
  it("defaults to true when stock is positive and no explicit flag", () => {
    expect(deriveInStock(5)).toBe(true);
  });
  it("honors an explicit false even when stock is positive", () => {
    expect(deriveInStock(5, false)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot find module `./stock`.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/inventory/stock.ts
export interface StockCheckItem {
  product_id: string;
  name: string;
  requested: number;
  available: number;
}

export function findInsufficientStock(
  items: StockCheckItem[]
): StockCheckItem[] {
  return items.filter((i) => i.requested > i.available);
}

export function nextStock(available: number, requested: number): number {
  return Math.max(0, available - requested);
}

export function deriveInStock(
  stockQuantity: number,
  explicit?: boolean
): boolean {
  if (stockQuantity <= 0) return false;
  return explicit ?? true;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS — all stock tests green (plus Task 3 tests still green).

- [ ] **Step 5: Commit**

```bash
git add lib/inventory/stock.ts lib/inventory/stock.test.ts
git commit -m "feat: add inventory stock lib"
```

---

## Task 5: Admin Guard + Route Protection

**Files:**
- Create: `lib/auth/requireAdmin.ts`
- Modify: `app/admin/layout.tsx`

- [ ] **Step 1: Create the admin guard helper**

```ts
// lib/auth/requireAdmin.ts
import { createClient } from "@/lib/supabase/server";

export interface AdminContext {
  userId: string;
  fullName: string | null;
}

/**
 * Returns the admin context if the current session belongs to an admin,
 * otherwise null. Used by the admin layout (pages) and every /api/admin/*
 * route (data) for defense in depth.
 */
export async function getAdminContext(): Promise<AdminContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, full_name")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return null;
  return { userId: user.id, fullName: profile.full_name };
}
```

- [ ] **Step 2: Protect the admin layout**

Replace the entire contents of `app/admin/layout.tsx` with:

```tsx
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { getAdminContext } from "@/lib/auth/requireAdmin";

export const metadata = {
  title: "Admin — KurumKurum",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminContext();
  if (!admin) {
    redirect("/login?redirect=/admin");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Verify build compiles**

Run: `npm run build`
Expected: Build succeeds. (Auth gate can't be exercised without a running DB; verified manually in Task 13.)

- [ ] **Step 4: Commit**

```bash
git add lib/auth/requireAdmin.ts app/admin/layout.tsx
git commit -m "feat: protect /admin behind is_admin guard"
```

---

## Task 6: Admin Product API Routes

**Files:**
- Create: `app/api/admin/products/route.ts`
- Create: `app/api/admin/products/[id]/route.ts`

- [ ] **Step 1: Create the create-product route**

```ts
// app/api/admin/products/route.ts
import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth/requireAdmin";
import { createServiceClient } from "@/lib/supabase/service";
import { deriveInStock } from "@/lib/inventory/stock";

export async function POST(req: Request) {
  const admin = await getAdminContext();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  if (!body?.name || !body?.brand || !body?.category_id) {
    return NextResponse.json(
      { error: "name, brand and category_id are required" },
      { status: 400 }
    );
  }

  const stockQuantity = Number(body.stock_quantity ?? 0);
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: body.name,
      brand: body.brand,
      category_id: body.category_id,
      weight_grams: Number(body.weight_grams ?? 0),
      weight_label: body.weight_label ?? "",
      unit_type: body.unit_type ?? "",
      price: Number(body.price ?? 0),
      description: body.description ?? "",
      image_url: body.image_url ?? "",
      slug: body.slug || null,
      stock_quantity: stockQuantity,
      in_stock: deriveInStock(stockQuantity, body.in_stock),
    })
    .select("*, category:categories(id, name, slug)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ product: data }, { status: 201 });
}
```

- [ ] **Step 2: Create the update/delete route**

```ts
// app/api/admin/products/[id]/route.ts
import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth/requireAdmin";
import { createServiceClient } from "@/lib/supabase/service";
import { deriveInStock } from "@/lib/inventory/stock";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminContext();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const update: Record<string, unknown> = {};

  for (const field of [
    "name",
    "brand",
    "category_id",
    "weight_label",
    "unit_type",
    "description",
    "image_url",
    "slug",
  ]) {
    if (field in body) update[field] = body[field];
  }
  if ("weight_grams" in body) update.weight_grams = Number(body.weight_grams);
  if ("price" in body) update.price = Number(body.price);

  // Stock + in_stock are kept consistent: stock drives availability.
  if ("stock_quantity" in body) {
    const stock = Number(body.stock_quantity);
    update.stock_quantity = stock;
    update.in_stock = deriveInStock(stock, body.in_stock);
  } else if ("in_stock" in body) {
    update.in_stock = body.in_stock;
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("products")
    .update(update)
    .eq("id", params.id)
    .select("*, category:categories(id, name, slug)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ product: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminContext();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Verify build compiles**

Run: `npm run build`
Expected: Build succeeds; the three new route handlers compile.

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/products
git commit -m "feat: add guarded admin product API routes"
```

---

## Task 7: Wire `/admin/products` to the Database

**Files:**
- Modify: `app/admin/products/page.tsx`

This replaces local demo state with live data + API calls. The modal/table markup stays; only data flow changes.

- [ ] **Step 1: Replace imports + demo constants with live state**

At the top of `app/admin/products/page.tsx`, replace the import block and the `INITIAL_PRODUCTS` / `CATEGORIES` / `EMPTY_FORM` constants (lines 1-91) with:

```tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { Product, Category } from "@/types";

const EMPTY_FORM: Omit<Product, "id" | "created_at"> = {
  name: "",
  brand: "",
  category_id: "",
  weight_grams: 0,
  weight_label: "",
  unit_type: "bag",
  price: 0,
  description: "",
  image_url: "",
  in_stock: true,
  stock_quantity: 0,
  slug: "",
};
```

- [ ] **Step 2: Replace component state + handlers**

Replace the state declarations and the `openAdd`/`openEdit`/`handleSubmit`/`handleDelete`/`toggleStock` handlers (lines 93-152 in the original) with:

```tsx
export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: prods }, { data: cats }] = await Promise.all([
        supabase
          .from("products")
          .select("*, category:categories(id, name, slug)")
          .order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("name"),
      ]);
      setProducts(prods ?? []);
      setCategories(cats ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const openAdd = () => {
    setEditingProduct(null);
    setForm({ ...EMPTY_FORM, category_id: categories[0]?.id ?? "" });
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      brand: product.brand,
      category_id: product.category_id,
      weight_grams: product.weight_grams,
      weight_label: product.weight_label,
      unit_type: product.unit_type,
      price: product.price,
      description: product.description,
      image_url: product.image_url,
      in_stock: product.in_stock,
      stock_quantity: product.stock_quantity ?? 0,
      slug: product.slug ?? "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : "/api/admin/products";
      const res = await fetch(url, {
        method: editingProduct ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Save failed");

      const saved = json.product as Product;
      setProducts((prev) =>
        editingProduct
          ? prev.map((p) => (p.id === saved.id ? saved : p))
          : [saved, ...prev]
      );
      toast.success(editingProduct ? "Product updated" : "Product added");
      setShowModal(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const prev = products;
    setProducts((p) => p.filter((x) => x.id !== id));
    setDeleteConfirm(null);
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setProducts(prev);
      toast.error("Delete failed");
    } else {
      toast.success("Product deleted");
    }
  };

  const toggleStock = async (product: Product) => {
    const next = !product.in_stock;
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, in_stock: next } : p))
    );
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ in_stock: next }),
    });
    if (!res.ok) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, in_stock: product.in_stock } : p
        )
      );
      toast.error("Could not update stock");
    }
  };
```

- [ ] **Step 3: Update category lookups, the stock toggle call, and add a Stock column**

In the table body, the category cell currently uses `CATEGORIES.find(...)`. Change it to use the live `categories` state:

```tsx
                  <td className="px-6 py-4">
                    <span className="text-xs bg-saffron/10 text-saffron font-semibold px-2 py-1 rounded-full">
                      {categories.find((c) => c.id === product.category_id)
                        ?.name ?? product.category_id}
                    </span>
                  </td>
```

Add a **Stock** column header after the `Weight` header:

```tsx
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal/40">
                  Stock
                </th>
```

Add the matching cell after the weight cell (before the In-Stock toggle cell):

```tsx
                  <td className="px-6 py-4 text-sm text-charcoal/60">
                    {product.stock_quantity ?? 0}
                  </td>
```

Change the toggle button's onClick from `() => toggleStock(product.id)` to `() => toggleStock(product)`.

- [ ] **Step 4: Update the Category select + add a Stock field in the modal**

In the modal form, the Category `<select>` currently maps over `CATEGORIES`. Change it to map over `categories`:

```tsx
                      <select
                        value={form.category_id}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, category_id: e.target.value }))
                        }
                        className="w-full px-4 py-2.5 border border-charcoal/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-saffron bg-white"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
```

Add a **Stock Quantity** field inside the `grid` of form fields (next to Price):

```tsx
                    <FormField label="Stock Quantity" required>
                      <input
                        type="number"
                        value={form.stock_quantity}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            stock_quantity: Number(e.target.value),
                          }))
                        }
                        required
                        min={0}
                        className="w-full px-4 py-2.5 border border-charcoal/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-saffron"
                        placeholder="e.g. 50"
                      />
                    </FormField>
```

Change the submit button's disabled/label to reflect saving state:

```tsx
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 px-5 py-3 bg-saffron text-white font-semibold rounded-xl hover:bg-[#d07a0b] transition-colors text-sm disabled:opacity-60"
                    >
                      {saving
                        ? "Saving…"
                        : editingProduct
                        ? "Save Changes"
                        : "Add Product"}
                    </button>
```

- [ ] **Step 5: Confirm React Hot Toast has a Toaster mounted**

Run: `grep -rn "Toaster" app/layout.tsx components` (or use the Grep tool for `Toaster`).
- If a `<Toaster />` is already mounted (e.g. in `app/layout.tsx`), do nothing.
- If not, add it to `app/layout.tsx`: import `{ Toaster } from "react-hot-toast"` and render `<Toaster position="top-right" />` inside the body, alongside `{children}`.

- [ ] **Step 6: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: Build and lint succeed.

- [ ] **Step 7: Commit**

```bash
git add app/admin/products/page.tsx app/layout.tsx
git commit -m "feat: wire admin products page to Supabase (CRUD + stock)"
```

---

## Task 8: Public Order Creation Route

**Files:**
- Create: `app/api/orders/route.ts`

- [ ] **Step 1: Create the order route**

```ts
// app/api/orders/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { calculateOrderTotals } from "@/lib/orders/calculateOrder";
import { findInsufficientStock, nextStock } from "@/lib/inventory/stock";

interface OrderRequestItem {
  product_id: string;
  quantity: number;
}

export async function POST(req: Request) {
  const body = await req.json();
  const items: OrderRequestItem[] = body?.items ?? [];
  const contact = body?.contact ?? {};
  const address = body?.shipping_address ?? {};

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }
  if (!contact.email || !contact.name) {
    return NextResponse.json(
      { error: "Contact name and email are required" },
      { status: 400 }
    );
  }

  const service = createServiceClient();

  // Load authoritative product data (price, weight, stock) from the DB.
  const ids = items.map((i) => i.product_id);
  const { data: products, error: prodErr } = await service
    .from("products")
    .select("id, name, brand, price, weight_grams, stock_quantity, image_url")
    .in("id", ids);

  if (prodErr) {
    return NextResponse.json({ error: prodErr.message }, { status: 500 });
  }

  const byId = new Map((products ?? []).map((p) => [p.id, p]));
  for (const item of items) {
    if (!byId.has(item.product_id)) {
      return NextResponse.json(
        { error: `Product ${item.product_id} no longer exists` },
        { status: 400 }
      );
    }
  }

  // Stock check.
  const short = findInsufficientStock(
    items.map((i) => {
      const p = byId.get(i.product_id)!;
      return {
        product_id: i.product_id,
        name: p.name,
        requested: i.quantity,
        available: p.stock_quantity,
      };
    })
  );
  if (short.length > 0) {
    return NextResponse.json(
      {
        error: `Not enough stock for: ${short
          .map((s) => s.name)
          .join(", ")}`,
      },
      { status: 409 }
    );
  }

  // Server-authoritative totals (never trust client money).
  const totals = calculateOrderTotals(
    items.map((i) => {
      const p = byId.get(i.product_id)!;
      return { price: p.price, weight_grams: p.weight_grams, quantity: i.quantity };
    })
  );

  // Optional logged-in user.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Insert the order.
  const { data: order, error: orderErr } = await service
    .from("orders")
    .insert({
      user_id: user?.id ?? null,
      guest_email: contact.email,
      guest_phone: contact.phone ?? null,
      guest_name: contact.name,
      shipping_address: address,
      status: "pending",
      total_amount: totals.totalAmount,
      total_weight_grams: totals.totalWeightGrams,
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    return NextResponse.json(
      { error: orderErr?.message ?? "Could not create order" },
      { status: 500 }
    );
  }

  // 2. Insert order items.
  const { error: itemsErr } = await service.from("order_items").insert(
    items.map((i) => {
      const p = byId.get(i.product_id)!;
      return {
        order_id: order.id,
        product_id: i.product_id,
        quantity: i.quantity,
        price_at_purchase: p.price,
        product_snapshot: p,
      };
    })
  );
  if (itemsErr) {
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });
  }

  // 3. Decrement stock (sequential; floors at 0, updates in_stock).
  for (const item of items) {
    const p = byId.get(item.product_id)!;
    const remaining = nextStock(p.stock_quantity, item.quantity);
    await service
      .from("products")
      .update({ stock_quantity: remaining, in_stock: remaining > 0 })
      .eq("id", item.product_id);
  }

  return NextResponse.json({ orderId: order.id }, { status: 201 });
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/api/orders/route.ts
git commit -m "feat: add public order creation route with stock decrement"
```

---

## Task 9: Wire Checkout to Place Orders + Confirmation

**Files:**
- Modify: `app/checkout/page.tsx`
- Create: `app/checkout/confirmation/page.tsx`

- [ ] **Step 1: Add imports + place-order handler to checkout**

In `app/checkout/page.tsx`, update the imports (lines 1-9) to add router, toast, and `clearCart`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Navbar from "@/components/shop/Navbar";
import { useCartStore } from "@/store/cartStore";
import { calculateShipping } from "@/lib/shipping";
```

Change the store destructure (line 14) to include `clearCart`, and add router + placing state right after `const [step, setStep] = useState<Step>(1);`:

```tsx
  const router = useRouter();
  const { items, totalPrice, totalWeightGrams, clearCart } = useCartStore();
  const [step, setStep] = useState<Step>(1);
  const [placing, setPlacing] = useState(false);
```

Add the handler just before the `if (items.length === 0)` guard:

```tsx
  const placeOrder = async () => {
    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact,
          shipping_address: { full_name: contact.name, ...address },
          items: items.map((i) => ({
            product_id: i.product.id,
            quantity: i.quantity,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not place order");
      clearCart();
      router.push(`/checkout/confirmation?order=${json.orderId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place order");
      setPlacing(false);
    }
  };
```

- [ ] **Step 2: Repurpose the Step 3 "Pay" button to place the order**

In the Step 3 block, change the pay button (around line 206) to call `placeOrder`:

```tsx
                  <button
                    onClick={placeOrder}
                    disabled={placing}
                    className="flex-1 py-3.5 bg-saffron text-white font-bold rounded-xl hover:bg-[#b34f14] transition-colors text-sm disabled:opacity-60"
                  >
                    {placing ? "Placing order…" : `Place Order — $${orderTotal.toFixed(2)}`}
                  </button>
```

Also update the helper note below it (line 210) since there's no real charge yet:

```tsx
                <p className="text-[11px] text-charcoal/40 text-center">Payment is collected on delivery. No card is charged now.</p>
```

- [ ] **Step 3: Create the confirmation page**

```tsx
// app/checkout/confirmation/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/shop/Navbar";

export default function ConfirmationPage() {
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setOrderId(params.get("order"));
  }, []);

  return (
    <>
      <Navbar />
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <span className="text-6xl">🎉</span>
        <h1 className="font-playfair text-3xl font-bold text-charcoal">
          Order placed!
        </h1>
        <p className="text-charcoal/60 max-w-md">
          Thank you for your order. We&apos;ve received it and will start
          processing it shortly.
        </p>
        {orderId && (
          <p className="text-sm text-charcoal/50">
            Order reference:{" "}
            <span className="font-mono font-semibold text-charcoal">
              {orderId}
            </span>
          </p>
        )}
        <Link
          href="/shop"
          className="mt-2 px-6 py-3 bg-saffron text-white font-semibold rounded-xl hover:bg-[#b34f14] transition-colors text-sm"
        >
          Continue Shopping
        </Link>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: Both succeed.

- [ ] **Step 5: Commit**

```bash
git add app/checkout/page.tsx app/checkout/confirmation/page.tsx
git commit -m "feat: place orders from checkout + confirmation page"
```

---

## Task 10: Order Management — API + Page

**Files:**
- Create: `app/api/admin/orders/[id]/route.ts`
- Modify: `app/admin/orders/page.tsx`

- [ ] **Step 1: Create the order update route**

```ts
// app/api/admin/orders/[id]/route.ts
import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth/requireAdmin";
import { createServiceClient } from "@/lib/supabase/service";

const STATUSES = ["pending", "processing", "shipped", "delivered"];

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminContext();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const update: Record<string, unknown> = {};
  if ("status" in body) {
    if (!STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    update.status = body.status;
  }
  if ("tracking_number" in body) {
    update.tracking_number = body.tracking_number || null;
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .update(update)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ order: data });
}
```

- [ ] **Step 2: Rewrite the orders page with live data + detail + status control**

Replace the entire contents of `app/admin/orders/page.tsx` with:

```tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { Order, OrderItem } from "@/types";

const STATUSES = ["pending", "processing", "shipped", "delivered"] as const;

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [tracking, setTracking] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      setOrders((data as Order[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const openOrder = async (order: Order) => {
    setSelected(order);
    setTracking(order.tracking_number ?? "");
    const supabase = createClient();
    const { data } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id);
    setItems((data as OrderItem[]) ?? []);
  };

  const patchOrder = async (id: string, update: Partial<Order>) => {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Update failed");
      return;
    }
    const saved = json.order as Order;
    setOrders((prev) => prev.map((o) => (o.id === saved.id ? saved : o)));
    setSelected((cur) => (cur && cur.id === saved.id ? saved : cur));
    toast.success("Order updated");
  };

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="font-playfair text-3xl font-bold text-charcoal">Orders</h1>
        <p className="text-charcoal/50 mt-1">
          Manage and track all customer orders
        </p>
      </motion.div>

      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-charcoal/5">
                {["Order", "Customer", "Total", "Status", "Tracking", "Date"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal/40"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-charcoal/40">
                    Loading orders…
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-charcoal/40">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => openOrder(order)}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-saffron">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-charcoal">
                        {order.guest_name ?? "—"}
                      </p>
                      <p className="text-xs text-charcoal/40">
                        {order.guest_email ?? ""}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-charcoal">
                      ${order.total_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          STATUS_STYLES[order.status]
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-charcoal/60">
                      {order.tracking_number ?? (
                        <span className="text-charcoal/30 italic">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-charcoal/50">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 bg-black/40 z-40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl overflow-y-auto p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-playfair text-xl font-bold text-charcoal">
                  Order #{selected.id.slice(0, 8)}
                </h2>
                <button
                  onClick={() => setSelected(null)}
                  className="p-2 rounded-full hover:bg-charcoal/5"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1 mb-6 text-sm">
                <p className="font-medium text-charcoal">{selected.guest_name}</p>
                <p className="text-charcoal/60">{selected.guest_email}</p>
                <p className="text-charcoal/60">{selected.guest_phone}</p>
              </div>

              <div className="bg-cream rounded-xl p-4 mb-6 text-sm text-charcoal/70">
                <p className="font-semibold text-charcoal/80 mb-1">Ship to</p>
                <p>{selected.shipping_address?.street}</p>
                <p>
                  {selected.shipping_address?.city},{" "}
                  {selected.shipping_address?.state}{" "}
                  {selected.shipping_address?.zip}
                </p>
              </div>

              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-charcoal/40 mb-2">
                  Items
                </p>
                <div className="space-y-2">
                  {items.map((it) => (
                    <div
                      key={it.id}
                      className="flex justify-between text-sm text-charcoal/70"
                    >
                      <span>
                        {(it.product_snapshot?.name ?? "Product")} × {it.quantity}
                      </span>
                      <span className="font-semibold">
                        ${(it.price_at_purchase * it.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-3 pt-3 border-t border-charcoal/10 font-bold text-charcoal">
                  <span>Total</span>
                  <span>${selected.total_amount.toFixed(2)}</span>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal/40 mb-1.5">
                  Status
                </label>
                <select
                  value={selected.status}
                  onChange={(e) =>
                    patchOrder(selected.id, {
                      status: e.target.value as Order["status"],
                    })
                  }
                  className="w-full px-4 py-2.5 border border-charcoal/15 rounded-xl text-sm bg-white capitalize"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s} className="capitalize">
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal/40 mb-1.5">
                  Tracking Number
                </label>
                <div className="flex gap-2">
                  <input
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                    placeholder="e.g. USPS123…"
                    className="flex-1 px-4 py-2.5 border border-charcoal/15 rounded-xl text-sm"
                  />
                  <button
                    onClick={() =>
                      patchOrder(selected.id, { tracking_number: tracking })
                    }
                    className="px-4 py-2.5 bg-saffron text-white font-semibold rounded-xl text-sm hover:bg-[#d07a0b]"
                  >
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 3: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: Both succeed.

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/orders app/admin/orders/page.tsx
git commit -m "feat: admin order management (list, detail, status, tracking)"
```

---

## Task 11: Admin User Management — API + Page

**Files:**
- Create: `app/api/admin/admins/route.ts`
- Create: `app/api/admin/admins/[id]/route.ts`
- Modify: `app/admin/admins/page.tsx`

- [ ] **Step 1: Create the list + promote route**

```ts
// app/api/admin/admins/route.ts
import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth/requireAdmin";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET() {
  const admin = await getAdminContext();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const service = createServiceClient();
  const { data: profiles, error } = await service
    .from("profiles")
    .select("id, full_name, created_at")
    .eq("is_admin", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Attach emails from auth.users.
  const { data: userList } = await service.auth.admin.listUsers();
  const emailById = new Map(
    (userList?.users ?? []).map((u) => [u.id, u.email ?? ""])
  );

  const admins = (profiles ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    created_at: p.created_at,
    email: emailById.get(p.id) ?? "",
  }));

  return NextResponse.json({ admins });
}

export async function POST(req: Request) {
  const admin = await getAdminContext();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: userList } = await service.auth.admin.listUsers();
  const target = (userList?.users ?? []).find(
    (u) => u.email?.toLowerCase() === String(email).toLowerCase()
  );
  if (!target) {
    return NextResponse.json(
      { error: "No registered user with that email" },
      { status: 404 }
    );
  }

  const { error } = await service
    .from("profiles")
    .update({ is_admin: true })
    .eq("id", target.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Create the revoke route (guards against removing the last admin)**

```ts
// app/api/admin/admins/[id]/route.ts
import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth/requireAdmin";
import { createServiceClient } from "@/lib/supabase/service";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminContext();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const service = createServiceClient();
  const { count } = await service
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("is_admin", true);

  if ((count ?? 0) <= 1) {
    return NextResponse.json(
      { error: "Cannot remove the last admin" },
      { status: 400 }
    );
  }

  const { error } = await service
    .from("profiles")
    .update({ is_admin: false })
    .eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Rewrite the admins page**

Replace the entire contents of `app/admin/admins/page.tsx` with:

```tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

interface AdminUser {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string;
}

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);

  const load = async () => {
    const res = await fetch("/api/admin/admins");
    const json = await res.json();
    if (res.ok) setAdmins(json.admins);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const promote = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not add admin");
      toast.success("Admin added");
      setEmail("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add admin");
    } finally {
      setAdding(false);
    }
  };

  const revoke = async (id: string) => {
    const res = await fetch(`/api/admin/admins/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Could not remove admin");
      return;
    }
    toast.success("Admin removed");
    setAdmins((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="font-playfair text-3xl font-bold text-charcoal">
          Admin Users
        </h1>
        <p className="text-charcoal/50 mt-1">
          Manage who has access to the admin panel
        </p>
      </motion.div>

      <form onSubmit={promote} className="flex gap-3 mb-6 max-w-md">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="user@email.com"
          className="flex-1 px-4 py-2.5 border border-charcoal/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-saffron"
        />
        <button
          type="submit"
          disabled={adding}
          className="px-5 py-2.5 bg-saffron text-white font-semibold rounded-xl hover:bg-[#d07a0b] transition-colors text-sm disabled:opacity-60"
        >
          {adding ? "Adding…" : "Add Admin"}
        </button>
      </form>

      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-charcoal/5">
                {["Name", "Email", "Added", ""].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal/40"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-charcoal/40">
                    Loading…
                  </td>
                </tr>
              ) : (
                admins.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-charcoal">
                      {a.full_name ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-charcoal/70">
                      {a.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-charcoal/50">
                      {new Date(a.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => revoke(a.id)}
                        className="text-xs font-semibold text-crimson hover:text-[#7e1527] transition-colors px-2 py-1 rounded-lg hover:bg-crimson/5"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: Both succeed.

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/admins app/admin/admins/page.tsx
git commit -m "feat: admin user management (list, promote, revoke)"
```

---

## Task 12: Dashboard Real Aggregates

**Files:**
- Modify: `app/admin/page.tsx`

- [ ] **Step 1: Rewrite the dashboard to compute real stats**

Replace the entire contents of `app/admin/page.tsx` with:

```tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Order } from "@/types";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: ords }, { count }] = await Promise.all([
        supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true }),
      ]);
      setOrders((ords as Order[]) ?? []);
      setProductCount(count ?? 0);
      setLoading(false);
    }
    load();
  }, []);

  const revenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const pending = orders.filter((o) => o.status === "pending").length;

  const stats = [
    { label: "Total Orders", value: String(orders.length), icon: "📦" },
    { label: "Revenue", value: `$${revenue.toFixed(2)}`, icon: "💰" },
    { label: "Products", value: String(productCount), icon: "🛍️" },
    { label: "Pending Orders", value: String(pending), icon: "⏳" },
  ];

  const recent = orders.slice(0, 5);

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="font-playfair text-3xl font-bold text-charcoal">
          Dashboard
        </h1>
        <p className="text-charcoal/50 mt-1">
          Welcome back! Here&apos;s what&apos;s happening with KurumKurum.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-charcoal/5"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-3xl">{stat.icon}</span>
            </div>
            <p className="text-3xl font-bold text-charcoal mb-1">
              {loading ? "…" : stat.value}
            </p>
            <p className="text-sm text-charcoal/50">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-charcoal/5">
          <h2 className="font-playfair text-xl font-bold text-charcoal">
            Recent Orders
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {["Order", "Customer", "Total", "Status", "Date"].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal/40"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal/5">
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-charcoal/40">
                    {loading ? "Loading…" : "No orders yet."}
                  </td>
                </tr>
              ) : (
                recent.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-saffron">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-sm text-charcoal font-medium">
                      {order.guest_name ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-charcoal">
                      ${order.total_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          STATUS_STYLES[order.status]
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-charcoal/50">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: Both succeed.

- [ ] **Step 3: Commit**

```bash
git add app/admin/page.tsx
git commit -m "feat: real dashboard aggregates from orders + products"
```

---

## Task 13: Docs + Final Verification

**Files:**
- Modify: `docs/AUTH_SETUP.md`

- [ ] **Step 1: Document the one-time setup in `docs/AUTH_SETUP.md`**

Append a new section to `docs/AUTH_SETUP.md`:

```markdown

## Admin Management Setup (one-time)

After deploying the admin-management feature, do these once:

1. **Run the schema:** In **Supabase Dashboard → SQL Editor**, paste and run
   [`supabase/admin-and-orders.sql`](../supabase/admin-and-orders.sql). This adds
   `stock_quantity` to products, creates the `orders` / `order_items` tables, sets
   RLS, and closes the `is_admin` self-promotion hole.

2. **Bootstrap the first admin:** In **Supabase Dashboard → Table Editor →
   `profiles`**, find your own row and set `is_admin = true`. (Someone must be the
   first admin before the in-app "Admin Users" page can promote anyone else.)

After this, all product, order, and admin-user management happens from `/admin`.
No further SQL is needed for day-to-day work.
```

- [ ] **Step 2: Run the full automated test + build suite**

Run: `npm test && npm run build && npm run lint`
Expected: Tests pass (order totals + stock libs), build succeeds, lint clean.

- [ ] **Step 3: Manual end-to-end verification (requires the SQL run + a bootstrapped admin + `npm run dev`)**

Verify each, in order:
- [ ] Visiting `/admin` while logged out (or as a non-admin) redirects to `/login?redirect=/admin`.
- [ ] As the bootstrapped admin, `/admin/products` lists real DB products with a Stock column.
- [ ] Add a product → it appears in the table and in `/shop`.
- [ ] Edit a product's price + stock → change persists after refresh.
- [ ] Toggle a product out of stock → reflects on the shop card.
- [ ] Place an order from `/shop` → checkout → "Place Order" → lands on the confirmation page; cart clears.
- [ ] The ordered product's `stock_quantity` decreased by the quantity ordered.
- [ ] The new order appears in `/admin/orders` and on the dashboard; revenue/counts updated.
- [ ] Open the order, change status to "shipped", add a tracking number → persists after refresh.
- [ ] `/admin/admins` lists you; promote another registered user by email → they appear; remove them → they disappear; removing the last admin is blocked.
- [ ] Hitting `POST /api/admin/products` while logged out returns `403`.

- [ ] **Step 4: Commit**

```bash
git add docs/AUTH_SETUP.md
git commit -m "docs: document admin management one-time setup"
```

---

## Self-Review Notes (verification of this plan against the spec)

- **Admin access control** → Task 5 (guard + layout) + per-route checks in Tasks 6, 10, 11.
- **Numeric inventory** → Task 2 (column), Task 4 (logic), Tasks 6/7 (admin edits), Task 8 (decrement on order).
- **Orders pending, no payment** → Task 2 (schema default), Task 8 (status `pending`), Task 9 (no charge).
- **Admin-managed admins, manual first admin** → Task 11 + Task 13 bootstrap doc.
- **Write path = guarded route handlers + service client** → all `/api/admin/*` routes (Tasks 6, 10, 11) + public `/api/orders` (Task 8).
- **is_admin escalation fix** → Task 2 RLS policy.
- **Product management UI** → Task 7.
- **Order management UI** → Task 10.
- **Dashboard aggregates** → Task 12.
- **Testing (guard/totals/stock + manual)** → Tasks 1, 3, 4 (automated); Task 13 (manual matrix).
- **Type consistency:** `getAdminContext` (defined Task 5) used verbatim in Tasks 6/8/10/11; `calculateOrderTotals` (Task 3) used in Task 8; `findInsufficientStock`/`nextStock`/`deriveInStock` (Task 4) used in Tasks 6/8; `Product.stock_quantity` (Task 2) used in Tasks 7/8. Consistent.
- **Known limitation (documented):** order creation in Task 8 is sequential (insert order → items → decrement stock), not a single atomic transaction. Acceptable for v1 per spec; a Postgres RPC would make it atomic if concurrency becomes a concern.
