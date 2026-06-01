# Design: Functional Login & Account Creation

**Date:** 2026-05-31
**Status:** Approved

## Goal

Make the existing login/register UI (`app/login/page.tsx`) fully functional using
Supabase Auth, with email/password **and** Google OAuth, email confirmation required,
a real `profiles` table, and an auth-aware Navbar.

## Current State

- Next.js 14 (App Router) + Supabase (`@supabase/ssr`). Clients already exist in
  `lib/supabase/` (`client.ts`, `server.ts`, `service.ts`).
- `app/login/page.tsx` is UI-only — `handleSubmit` just `console.log`s. Has email,
  password, register toggle + name field, and a Google button with no handler.
- `Profile` type exists in `types/index.ts` (`id`, `full_name`, `phone`, `is_admin`,
  `created_at`).
- Supabase project has `products` and `categories` tables only — no user table.
- No `.env.local`, no `middleware.ts`. Navbar always shows "Sign In".
- Admin pages and checkout use demo/static data — **out of scope** for this task.

## Decisions

- **Auth methods:** Email/password + Google OAuth.
- **Email confirmation:** Required.
- **Post-login redirect:** Back to the page the user came from (`?redirect=` param).
- **Navbar:** Update to reflect auth state (name + Sign Out when logged in).
- **Profile creation:** Database trigger (Approach A), not client-side insert.
  Rationale: with email confirmation required, there is no authenticated session
  immediately after `signUp()`, so an RLS-protected client insert would fail. A
  trigger on `auth.users` insert is the official Supabase pattern and avoids
  loosening security.

## Components

### 1. Database (SQL run in Supabase dashboard)
- `public.profiles`: `id uuid PK references auth.users(id) on delete cascade`,
  `full_name text`, `phone text`, `is_admin boolean default false`,
  `created_at timestamptz default now()`.
- RLS enabled: users can `select`/`update` their own row (`auth.uid() = id`).
- `handle_new_user()` trigger function + `on_auth_user_created` trigger: inserts a
  `profiles` row on new `auth.users`, reading `full_name` from
  `new.raw_user_meta_data`.

### 2. Environment
- `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### 3. Auth wiring — `app/login/page.tsx`
- Register: `supabase.auth.signUp({ email, password, options: { data: { full_name },
  emailRedirectTo } })` → show "check your email" confirmation message.
- Login: `supabase.auth.signInWithPassword()` → on success `router.push(redirect)`.
- Google: `supabase.auth.signInWithOAuth({ provider: 'google', options: {
  redirectTo: <callback>?redirect=... } })`.
- Loading + inline error states.

### 4. Auth callback — `app/auth/callback/route.ts`
- Route handler that exchanges the `code` for a session
  (`exchangeCodeForSession`) for both email-confirmation links and Google OAuth,
  then redirects to the `redirect` target (default `/`).

### 5. Middleware — `middleware.ts`
- Standard `@supabase/ssr` session refresh on each request so server components see
  a valid session. Uses `createServerClient` with cookie get/set wired to the
  `NextResponse`.

### 6. Navbar — `components/shop/Navbar.tsx`
- On mount, read auth state via browser client + subscribe to `onAuthStateChange`.
- Logged out: "Sign In" link with `?redirect=<current path>`.
- Logged in: show name/account + Sign Out (`supabase.auth.signOut()`).

## Manual Supabase Dashboard Steps (documented for the user)
1. Run the SQL (section 1).
2. Authentication → Providers → enable Google, add Google OAuth client ID/secret.
3. Authentication → URL Configuration → add Site URL + callback redirect URLs.
4. Confirm "Confirm email" is enabled (Authentication → Providers → Email).

## Out of Scope
- Admin route protection / `is_admin` gating (admin pages still use demo data).
- Password reset / forgot-password flow.
- Wiring checkout to the logged-in user.

## Testing
- Manual: register → receive confirmation email → confirm → log in → Navbar shows
  name → sign out. Google sign-in round-trip. `npm run build` / lint passes.
