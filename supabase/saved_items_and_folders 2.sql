-- ============================================================================
-- Saved AI items + outfit folders
-- ----------------------------------------------------------------------------
-- Adds the tables, indexes, and RLS policies needed by the new Saved page so
-- saved AI items and saved outfits each get their own collection boards,
-- mirroring the wardrobe / wardrobe_folders / wardrobe_folder_items setup.
--
-- Safe to run multiple times: every statement uses IF NOT EXISTS / CREATE OR
-- REPLACE. Run this in the Supabase SQL Editor (or via `supabase db push`)
-- after the existing wardrobe + outfits schema is already in place.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Saved AI items
-- ---------------------------------------------------------------------------
-- One row per "saved" AI-generated piece. Independent from wardrobe_items so
-- AI saves and personal photos can never collide on the same row.
create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text,
  image_path text,
  prompt text,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists saved_items_user_created_idx
  on public.saved_items (user_id, created_at desc);

alter table public.saved_items enable row level security;

drop policy if exists "saved_items_select_own" on public.saved_items;
create policy "saved_items_select_own"
  on public.saved_items for select
  using (auth.uid() = user_id);

drop policy if exists "saved_items_insert_own" on public.saved_items;
create policy "saved_items_insert_own"
  on public.saved_items for insert
  with check (auth.uid() = user_id);

drop policy if exists "saved_items_update_own" on public.saved_items;
create policy "saved_items_update_own"
  on public.saved_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "saved_items_delete_own" on public.saved_items;
create policy "saved_items_delete_own"
  on public.saved_items for delete
  using (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- 2) Saved-item collection boards
-- ---------------------------------------------------------------------------
create table if not exists public.saved_item_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text,
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saved_item_folders_user_updated_idx
  on public.saved_item_folders (user_id, updated_at desc);

alter table public.saved_item_folders enable row level security;

drop policy if exists "saved_item_folders_select_own" on public.saved_item_folders;
create policy "saved_item_folders_select_own"
  on public.saved_item_folders for select
  using (auth.uid() = user_id);

drop policy if exists "saved_item_folders_insert_own" on public.saved_item_folders;
create policy "saved_item_folders_insert_own"
  on public.saved_item_folders for insert
  with check (auth.uid() = user_id);

drop policy if exists "saved_item_folders_update_own" on public.saved_item_folders;
create policy "saved_item_folders_update_own"
  on public.saved_item_folders for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "saved_item_folders_delete_own" on public.saved_item_folders;
create policy "saved_item_folders_delete_own"
  on public.saved_item_folders for delete
  using (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- 3) Saved-item ↔ folder link table
-- ---------------------------------------------------------------------------
-- A saved item can live in at most one collection at a time, so the primary
-- key on (user_id, saved_item_id) keeps the relation a one-to-one mapping
-- per user (matching the wardrobe_folder_items pattern).
create table if not exists public.saved_item_folder_items (
  user_id uuid not null references auth.users (id) on delete cascade,
  folder_id uuid not null references public.saved_item_folders (id) on delete cascade,
  saved_item_id uuid not null references public.saved_items (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, saved_item_id)
);

create index if not exists saved_item_folder_items_folder_idx
  on public.saved_item_folder_items (user_id, folder_id);

alter table public.saved_item_folder_items enable row level security;

drop policy if exists "saved_item_folder_items_select_own" on public.saved_item_folder_items;
create policy "saved_item_folder_items_select_own"
  on public.saved_item_folder_items for select
  using (auth.uid() = user_id);

drop policy if exists "saved_item_folder_items_insert_own" on public.saved_item_folder_items;
create policy "saved_item_folder_items_insert_own"
  on public.saved_item_folder_items for insert
  with check (auth.uid() = user_id);

drop policy if exists "saved_item_folder_items_update_own" on public.saved_item_folder_items;
create policy "saved_item_folder_items_update_own"
  on public.saved_item_folder_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "saved_item_folder_items_delete_own" on public.saved_item_folder_items;
create policy "saved_item_folder_items_delete_own"
  on public.saved_item_folder_items for delete
  using (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- 4) Outfit collection boards
-- ---------------------------------------------------------------------------
create table if not exists public.outfit_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text,
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists outfit_folders_user_updated_idx
  on public.outfit_folders (user_id, updated_at desc);

alter table public.outfit_folders enable row level security;

drop policy if exists "outfit_folders_select_own" on public.outfit_folders;
create policy "outfit_folders_select_own"
  on public.outfit_folders for select
  using (auth.uid() = user_id);

drop policy if exists "outfit_folders_insert_own" on public.outfit_folders;
create policy "outfit_folders_insert_own"
  on public.outfit_folders for insert
  with check (auth.uid() = user_id);

drop policy if exists "outfit_folders_update_own" on public.outfit_folders;
create policy "outfit_folders_update_own"
  on public.outfit_folders for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "outfit_folders_delete_own" on public.outfit_folders;
create policy "outfit_folders_delete_own"
  on public.outfit_folders for delete
  using (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- 5) Outfit ↔ folder link table
-- ---------------------------------------------------------------------------
create table if not exists public.outfit_folder_items (
  user_id uuid not null references auth.users (id) on delete cascade,
  folder_id uuid not null references public.outfit_folders (id) on delete cascade,
  outfit_id uuid not null references public.outfits (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, outfit_id)
);

create index if not exists outfit_folder_items_folder_idx
  on public.outfit_folder_items (user_id, folder_id);

alter table public.outfit_folder_items enable row level security;

drop policy if exists "outfit_folder_items_select_own" on public.outfit_folder_items;
create policy "outfit_folder_items_select_own"
  on public.outfit_folder_items for select
  using (auth.uid() = user_id);

drop policy if exists "outfit_folder_items_insert_own" on public.outfit_folder_items;
create policy "outfit_folder_items_insert_own"
  on public.outfit_folder_items for insert
  with check (auth.uid() = user_id);

drop policy if exists "outfit_folder_items_update_own" on public.outfit_folder_items;
create policy "outfit_folder_items_update_own"
  on public.outfit_folder_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "outfit_folder_items_delete_own" on public.outfit_folder_items;
create policy "outfit_folder_items_delete_own"
  on public.outfit_folder_items for delete
  using (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- 6) updated_at triggers
-- ---------------------------------------------------------------------------
-- Keep updated_at in sync on the folder tables so the app can sort by recent
-- activity without the client having to set it explicitly.
create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists saved_item_folders_set_updated_at on public.saved_item_folders;
create trigger saved_item_folders_set_updated_at
  before update on public.saved_item_folders
  for each row execute function public.set_updated_at_timestamp();

drop trigger if exists outfit_folders_set_updated_at on public.outfit_folders;
create trigger outfit_folders_set_updated_at
  before update on public.outfit_folders
  for each row execute function public.set_updated_at_timestamp();

drop trigger if exists saved_items_set_updated_at on public.saved_items;
create trigger saved_items_set_updated_at
  before update on public.saved_items
  for each row execute function public.set_updated_at_timestamp();
