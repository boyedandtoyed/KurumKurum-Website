# Auth Setup — KurumKurum

Everything in the code is done. To make login/registration actually work, complete
these **one-time steps in your Supabase dashboard** and fill in `.env.local`.

## 1. Fill in environment variables

Open `.env.local` (already created in the project root) and paste values from
**Supabase Dashboard → Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...        # "anon public" key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...            # "service_role" key (keep secret)
```

Restart `npm run dev` after editing env files.

## 2. Create the profiles table

In **Supabase Dashboard → SQL Editor**, paste and run the contents of
[`supabase/profiles.sql`](../supabase/profiles.sql). This creates the `profiles`
table, row-level security policies, and the trigger that auto-creates a profile
whenever someone signs up.

## 3. Confirm email confirmation is on

**Authentication → Providers → Email** → make sure **"Confirm email"** is enabled
(it is by default). New users will get a confirmation link before they can sign in.

## 4. Enable Google sign-in

1. Create OAuth credentials in the
   [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services →
   Credentials → **OAuth client ID** (type: Web application).
2. Under **Authorized redirect URIs**, add:
   `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
3. In **Supabase → Authentication → Providers → Google**, toggle it on and paste the
   **Client ID** and **Client Secret** from Google.

## 5. Set redirect URLs

In **Supabase → Authentication → URL Configuration**:

- **Site URL:** `http://localhost:3000` for dev (use your real domain in production).
- **Redirect URLs:** add both
  - `http://localhost:3000/auth/callback`
  - `https://YOUR-DOMAIN/auth/callback` (production)

> The app sends users through `/auth/callback`, which exchanges the link/OAuth code
> for a session and then forwards them back to where they started.

## How it works (for reference)

| Piece | File |
|-------|------|
| Login / register / Google UI + logic | `app/login/page.tsx` |
| OAuth + email-confirm landing route | `app/auth/callback/route.ts` |
| Session cookie refresh | `middleware.ts` |
| Auth-aware navbar (name + Sign Out) | `components/shop/Navbar.tsx` |
| Profiles table + signup trigger | `supabase/profiles.sql` |

## Quick test

1. `npm run dev`, go to `/login`, click **Register**, create an account.
2. You'll see a "check your email" message → open the email → click the link.
3. The link lands on `/auth/callback` and logs you in; the navbar shows **Hi, <name>**.
4. Sign out, then sign back in with the same credentials.
5. Try **Continue with Google**.

## Not included (future work)

- Admin route protection using `is_admin` (admin pages still show demo data).
- Password reset / forgot-password flow.
- Attaching the logged-in user to checkout/orders.

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
