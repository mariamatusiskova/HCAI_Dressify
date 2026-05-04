-- Fix: ensure every table the app deletes from has an RLS DELETE policy
-- that lets the authenticated user delete their own rows.
-- Idempotent: drops and recreates each policy.
--
-- Run this in Supabase Dashboard → SQL Editor if "delete in the UI doesn't
-- actually remove the row from Supabase".

-- ---------- wardrobe ----------
alter table public.wardrobe_items enable row level security;
drop policy if exists "wardrobe_items_delete_own" on public.wardrobe_items;
create policy "wardrobe_items_delete_own" on public.wardrobe_items
  for delete using (auth.uid() = user_id);

alter table public.wardrobe_folders enable row level security;
drop policy if exists "wardrobe_folders_delete_own" on public.wardrobe_folders;
create policy "wardrobe_folders_delete_own" on public.wardrobe_folders
  for delete using (auth.uid() = user_id);

alter table public.wardrobe_folder_items enable row level security;
drop policy if exists "wardrobe_folder_items_delete_own" on public.wardrobe_folder_items;
create policy "wardrobe_folder_items_delete_own" on public.wardrobe_folder_items
  for delete using (auth.uid() = user_id);

-- ---------- outfits ----------
alter table public.outfits enable row level security;
drop policy if exists "outfits_delete_own" on public.outfits;
create policy "outfits_delete_own" on public.outfits
  for delete using (auth.uid() = user_id);

alter table public.outfit_items enable row level security;
drop policy if exists "outfit_items_delete_own" on public.outfit_items;
create policy "outfit_items_delete_own" on public.outfit_items
  for delete using (
    exists (
      select 1 from public.outfits o
      where o.id = outfit_items.outfit_id
        and o.user_id = auth.uid()
    )
  );

alter table public.outfit_folders enable row level security;
drop policy if exists "outfit_folders_delete_own" on public.outfit_folders;
create policy "outfit_folders_delete_own" on public.outfit_folders
  for delete using (auth.uid() = user_id);

alter table public.outfit_folder_items enable row level security;
drop policy if exists "outfit_folder_items_delete_own" on public.outfit_folder_items;
create policy "outfit_folder_items_delete_own" on public.outfit_folder_items
  for delete using (auth.uid() = user_id);

-- ---------- saved AI items ----------
alter table public.saved_items enable row level security;
drop policy if exists "saved_items_delete_own" on public.saved_items;
create policy "saved_items_delete_own" on public.saved_items
  for delete using (auth.uid() = user_id);

alter table public.saved_item_folders enable row level security;
drop policy if exists "saved_item_folders_delete_own" on public.saved_item_folders;
create policy "saved_item_folders_delete_own" on public.saved_item_folders
  for delete using (auth.uid() = user_id);

alter table public.saved_item_folder_items enable row level security;
drop policy if exists "saved_item_folder_items_delete_own" on public.saved_item_folder_items;
create policy "saved_item_folder_items_delete_own" on public.saved_item_folder_items
  for delete using (auth.uid() = user_id);

-- ---------- system prompts ----------
alter table public.system_prompts enable row level security;
drop policy if exists "system_prompts_delete_own" on public.system_prompts;
create policy "system_prompts_delete_own" on public.system_prompts
  for delete using (auth.uid() = user_id);
