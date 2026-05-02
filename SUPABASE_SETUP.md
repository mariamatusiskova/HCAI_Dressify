# Supabase Setup

This project now supports Supabase-backed outfit persistence using:

- `outfits`
- `outfit_items`
- `wardrobe`
- `wardrobe_items`
- `wardrobe_folders` / `wardrobe_folder_items`
- `saved_items` / `saved_item_folders` / `saved_item_folder_items`
- `outfit_folders` / `outfit_folder_items`
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

- Email/password sign-in
- Email/password account creation
- Sign out

Enable email auth in Supabase:

- `Auth -> Providers -> Email -> Enable`
- If email confirmation is enabled, set your Site URL / Redirect URL so confirmation links return to your app URL.
- For GitHub Pages deployments, add:
  - `https://<your-username>.github.io/<repo-name>/`

## Runtime behavior

- If Supabase is configured and auth session is available, outfits/wardrobe sync to Supabase.
- If no Supabase session is available, the app falls back to localStorage mode.
- Header status shows sync target separately:
  - `Outfits: Supabase|Local`
  - `Wardrobe: Supabase|Local`
- `userPhoto` is still local-only in current schema (no dedicated DB column in `outfits`).

## Saved AI items + collection boards

The Saved page now mirrors the Wardrobe page: AI items can be stored in
collections, renamed, and dragged into folder boards. To enable cloud sync,
add the following tables alongside the existing wardrobe schema:

```sql
-- Saved AI items (the user's "saved" generated pieces).
create table if not exists saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text,
  image_path text,
  prompt text,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
create index if not exists saved_items_user_idx on saved_items (user_id, created_at desc);

-- Folder boards for saved AI items.
create table if not exists saved_item_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text,
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists saved_item_folder_items (
  user_id uuid not null references auth.users (id) on delete cascade,
  folder_id uuid not null references saved_item_folders (id) on delete cascade,
  saved_item_id uuid not null references saved_items (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, saved_item_id)
);

-- Folder boards for saved outfits.
create table if not exists outfit_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text,
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists outfit_folder_items (
  user_id uuid not null references auth.users (id) on delete cascade,
  folder_id uuid not null references outfit_folders (id) on delete cascade,
  outfit_id uuid not null references outfits (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, outfit_id)
);
```

Enable RLS on each new table and add `auth.uid() = user_id` policies for
`select / insert / update / delete`, matching the existing wardrobe folder
policies. If Supabase is not configured (or the user is signed out), the app
falls back to localStorage and shows a toast warning.

## Replicate image-edit Edge Function (required for "Edit with prompt")

The "edit with prompt" feature on a saved/AI item runs through a Supabase
Edge Function that talks to Replicate, so it works on GitHub Pages without a
local Python backend.

### Deploy the function

```bash
# one-time: install Supabase CLI
npm install -g supabase

# from the project root, log in and link to your project
supabase login
supabase link --project-ref <your-project-ref>

# deploy the function
supabase functions deploy replicate-image-edit
```

### Set the Replicate API token

In the Supabase Dashboard:

1. Go to `Project Settings` → `Edge Functions` → `Secrets`
2. Add a secret:
   - Name: `REPLICATE_API_TOKEN`
   - Value: your Replicate API token from <https://replicate.com/account/api-tokens>

The token is read inside the function via `Deno.env.get("REPLICATE_API_TOKEN")`.

### CORS / auth notes

- The function emits `Access-Control-Allow-Origin: *`, so any origin can call it.
- Supabase verifies the user's JWT by default; the frontend uses
  `supabase.functions.invoke()` which forwards the logged-in user's session
  token automatically. If you ever see a 401 from the function, sign out and
  back in to refresh the token.

## GitHub Pages deployment checklist

For the live site to work, make sure these GitHub repository secrets exist
under `Settings → Secrets and variables → Actions`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The deploy workflow (`.github/workflows/deploy-pages.yml`) injects them at
build time. No backend URL is needed any more — background removal runs in
the browser via `@imgly/background-removal`.
