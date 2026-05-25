#!/bin/bash
set -e

# ── Commit 1: Project setup ───────────────────────────────────────────────────
git add \
  tailwind.config.ts \
  app/globals.css \
  app/layout.tsx \
  next.config.mjs \
  package.json \
  package-lock.json \
  types/index.ts \
  lib/supabase/client.ts \
  lib/supabase/server.ts \
  lib/supabase/service.ts \
  lib/shipping.ts \
  store/cartStore.ts \
  .env.local.example

git commit -m "feat: project setup — tailwind brand colors, supabase clients, cart store, shipping lib"
git push

# ── Commit 2: UI components ───────────────────────────────────────────────────
git add \
  components/ui/Button.tsx \
  components/ui/Badge.tsx \
  components/shop/Navbar.tsx \
  components/shop/Footer.tsx \
  components/shop/ProductCard.tsx \
  components/shop/CartDrawer.tsx \
  components/shop/AnnouncementBar.tsx \
  components/shop/SearchBar.tsx \
  components/shop/HeroCarousel.tsx \
  components/admin/AdminSidebar.tsx

git commit -m "feat: UI components — navbar, footer, product card, cart drawer, search bar, hero carousel, announcement bar"
git push

# ── Commit 3: Pages ───────────────────────────────────────────────────────────
git add \
  app/page.tsx \
  app/shop/page.tsx \
  app/login/page.tsx \
  app/checkout/page.tsx \
  app/admin/layout.tsx \
  app/admin/page.tsx \
  app/admin/products/page.tsx \
  app/admin/orders/page.tsx \
  app/admin/admins/page.tsx

git commit -m "feat: all pages — homepage carousel, shop with filters, checkout with tiered shipping, admin dashboard"
git push

# ── Commit 4: Supabase live data + features ───────────────────────────────────
git add .
git commit -m "feat: supabase connected, 20 products, search, filters"
git push
