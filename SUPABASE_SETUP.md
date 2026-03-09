# Supabase Setup

This project now supports Supabase-backed outfit persistence using:

- `outfits`
- `outfit_items`
- `wardrobe`
- `wardrobe_items`
- `ensure_user_wardrobe(p_user_id uuid)`
- `create_wardrobe_on_user_creation` trigger

## 1) Configure environment

Copy `.env.example` to `.env` and set values:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Notes:
- Vite only exposes vars with approved prefixes to the browser app.
- This app supports both `VITE_*` and legacy `APP_*` prefixes.

## 2) Apply database schema

In Supabase SQL Editor, run:

- `supabase/schema.sql`

This creates/updates tables, indexes, policies, and functions matching the attached schema images.

## 3) Run the app

```bash
npm install
npm run dev
```

## 4) Enable at least one auth method

This app now includes an in-app auth panel (left sidebar) with:

- Magic link email sign-in
- Sign out

Enable email auth in Supabase:

- `Auth -> Providers -> Email -> Enable`
- Set your Site URL / Redirect URL so magic links return to your app URL.
- For GitHub Pages deployments, add:
  - `https://<your-username>.github.io/<repo-name>/`

## Runtime behavior

- If Supabase is configured and auth session is available, outfits/wardrobe sync to Supabase.
- If no Supabase session is available, the app falls back to localStorage mode.
- Header status shows sync target separately:
  - `Outfits: Supabase|Local`
  - `Wardrobe: Supabase|Local`
- `userPhoto` is still local-only in current schema (no dedicated DB column in `outfits`).
