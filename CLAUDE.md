# KurumKurum Website — Architecture Guide

## Project Overview

KurumKurum is an e-commerce website for a specialty food brand. Built with Next.js 14 App Router, Supabase (PostgreSQL), Stripe for payments, and deployed on Vercel.

**Domain:** kurumkurum.com  
**Git user:** KurumKurum

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14.2.35 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3.4.1 + custom brand colors |
| Animation | Framer Motion 12.40.0 |
| State | Zustand 5.0.13 (cart) + React hooks |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| Payments | Stripe (v22.1.1 backend, @stripe/stripe-js v9.6.0) |
| Email | Resend 6.12.3 |
| Fonts | Playfair Display (headings) + DM Sans (body) via next/font |
| Notifications | React Hot Toast 2.6.0 |
| Deployment | Vercel |

---

## Directory Structure

```
app/                        # Next.js App Router
  layout.tsx                # Root layout — fonts, metadata, providers
  page.tsx                  # Homepage
  globals.css               # Global styles
  shop/                     # Product listing page
  checkout/                 # Multi-step checkout
  login/                    # Auth page (placeholder, not wired)
  admin/                    # Admin dashboard (protected)
    layout.tsx              # Admin layout wrapper
    page.tsx                # Dashboard with stats
    products/               # Product CRUD
    orders/                 # Order list
    admins/                 # Admin user management

components/
  shop/                     # Customer-facing UI
    Navbar.tsx              # Sticky header, search, cart icon
    Footer.tsx              # Footer with newsletter signup
    ProductCard.tsx         # Product tile (image, brand, name, price, add-to-cart)
    CartDrawer.tsx          # Right-side slide-out cart panel
    HeroCarousel.tsx        # 3-slide auto-rotating banner (4s interval)
    SearchBar.tsx           # Live debounced search (300ms) via Supabase
    AnnouncementBar.tsx     # Top promotional banner
  admin/
    AdminSidebar.tsx        # Dark sidebar navigation
  ui/
    Badge.tsx               # Status badge
    Button.tsx              # Reusable button (primary / secondary / outline)

lib/
  supabase/
    client.ts               # Browser client (anon key, for client components)
    server.ts               # Server client (with cookies, for server components)
    service.ts              # Service client (service role key, for admin ops)
  shipping.ts               # Shipping cost calculation logic

store/
  cartStore.ts              # Zustand cart store (persisted to localStorage as "kurumkurum-cart")

types/
  index.ts                  # Shared TypeScript types: Product, Order, CartItem, etc.

public/
  logo.svg                  # Brand logo (used in Navbar and Footer)
```

---

## Routing

**Public routes:**
- `/` — Homepage: hero carousel, category grid, featured products, value props
- `/shop` — Product listing with client-side filtering (category, brand, price) and sorting
- `/login` — Sign in / register (UI only, Google OAuth button not wired yet)
- `/checkout` — 3-step form: contact → shipping → payment
- `/product/[slug]` — Product detail page (not yet created)

**Admin routes:**
- `/admin` — Dashboard (hardcoded demo stats)
- `/admin/products` — Product management (local state, not database-connected yet)
- `/admin/orders` — Order list (local state)
- `/admin/admins` — Admin user management (local state)

---

## Data Layer

### Supabase Clients

Three separate clients exist for different contexts — always use the right one:

- `lib/supabase/client.ts` — Use in `"use client"` components
- `lib/supabase/server.ts` — Use in Server Components and Route Handlers (reads cookies)
- `lib/supabase/service.ts` — Use for admin operations that bypass Row Level Security

### Fetch Patterns

- **Homepage:** Fetches products with `is_featured = true`, falls back to newest
- **Shop page:** Fetches all products + categories on mount, filters client-side
- **SearchBar:** Supabase `ilike` on `name` and `brand` fields with 300ms debounce
- **Admin pages:** Currently local state only (no database writes implemented)
- **Cart:** Zustand with `persist` middleware → localStorage

---

## State Management

Cart state lives in `store/cartStore.ts` (Zustand). Access via `useCartStore()` anywhere without prop drilling.

Key cart methods:
- `addItem(product, quantity)` / `removeItem(id)` / `updateQuantity(id, qty)`
- `totalPrice()` / `totalWeightGrams()` / `totalItems()` — computed
- `isOpen` / `openCart()` / `closeCart()` — controls CartDrawer

Persisted under localStorage key `"kurumkurum-cart"`.

---

## Shipping Logic (`lib/shipping.ts`)

Tiered shipping calculation:
- Free shipping on orders ≥ $150
- Otherwise: $9.99 base + $10 per additional 69-lb box
- Includes weight conversion utilities (grams → lbs/kg)
- Returns warnings when approaching weight limits

---

## Brand / Styling

**Custom Tailwind colors:**
```
primary / saffron  →  #C85A17  (orange-brown, main brand color)
background / cream →  #F7F4EB  (light cream)
foreground / charcoal → #2B2D2F (dark text)
accent / crimson   →  #9B1B30  (secondary, used for highlights)
```

**Fonts:**
- `font-playfair` — Playfair Display (headings, display text)
- default `font-sans` — DM Sans (body copy)

Animations use Framer Motion throughout: `whileInView` stagger on product grids, `whileHover` on cards, spring-based CartDrawer entry/exit.

---

## Environment Variables

Defined in `.env.local` (template at `.env.local.example`):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
ADMIN_EMAIL_LIST
NEXT_PUBLIC_SITE_URL
```

---

## What Is and Isn't Implemented

**Fully working:**
- Homepage with Supabase-backed featured products
- Shop page with live filtering and sorting
- Real-time search via Supabase
- Shopping cart with localStorage persistence
- Checkout UI (3-step form, shipping calculation)
- Admin dashboard layout and navigation

**Partially implemented (UI exists, backend not wired):**
- Stripe payment — config and package installed, not called in checkout yet
- Resend email — package installed, not triggered anywhere
- Authentication — login page exists, no session/OAuth flow
- Admin CRUD — UI built with local state, no Supabase writes

**Not yet built:**
- `/product/[slug]` product detail page
- Order creation to database
- Order confirmation page and history
- Admin route protection (auth guard)
- Stripe webhook handler
- Email notifications (order confirmed, shipped, etc.)

---

## Key Conventions

- All interactive components are `"use client"` — no server actions used yet
- Images use Next.js `<Image>` with fallback to `placehold.co`
- Remote image domains whitelisted in `next.config.mjs`: `placehold.co` and Supabase storage
- Tailwind is the only styling mechanism — no CSS Modules or styled-components
- TypeScript strict mode is enabled; all shared types in `types/index.ts`
- ESLint uses `next/core-web-vitals` + `next/typescript` configs
