-- Dressify Supabase schema
-- Matches the table/function/index structure shown in the attached screenshots.

create extension if not exists "pgcrypto";

create table if not exists public.wardrobe (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_wardrobe_user_id_unique on public.wardrobe(user_id);
create index if not exists idx_wardrobe_user_id on public.wardrobe(user_id);

create table if not exists public.wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  subcategory text,
  image_path text,
  thumb_path text,
  color text,
  brand text,
  size text,
  material text,
  notes text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  wardrobe_id uuid not null references public.wardrobe(id) on delete cascade
);

create index if not exists idx_wardrobe_items_user_id on public.wardrobe_items(user_id);
create index if not exists idx_wardrobe_items_wardrobe_id on public.wardrobe_items(wardrobe_id);
create index if not exists wardrobe_items_user_category_idx on public.wardrobe_items(user_id, category);
create index if not exists wardrobe_items_tags_gin_idx on public.wardrobe_items using gin(tags);

create table if not exists public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists outfits_user_id_idx on public.outfits(user_id);

create table if not exists public.outfit_items (
  outfit_id uuid not null references public.outfits(id) on delete cascade,
  wardrobe_item_id uuid not null references public.wardrobe_items(id) on delete restrict,
  x numeric,
  y numeric,
  width numeric,
  height numeric,
  rotation numeric,
  z_index int4 default 0,
  primary key (outfit_id, wardrobe_item_id)
);

create index if not exists outfit_items_wardrobe_item_idx on public.outfit_items(wardrobe_item_id);

create or replace function public.ensure_user_wardrobe(p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wardrobe_id uuid;
begin
  select id into v_wardrobe_id
  from public.wardrobe
  where user_id = p_user_id
  limit 1;

  if v_wardrobe_id is null then
    insert into public.wardrobe (user_id)
    values (p_user_id)
    returning id into v_wardrobe_id;
  end if;

  return v_wardrobe_id;
end;
$$;

create or replace function public.create_wardrobe_on_user_creation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.ensure_user_wardrobe(new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_wardrobe on auth.users;
create trigger on_auth_user_created_create_wardrobe
  after insert on auth.users
  for each row execute function public.create_wardrobe_on_user_creation();

alter table public.wardrobe enable row level security;
alter table public.wardrobe_items enable row level security;
alter table public.outfits enable row level security;
alter table public.outfit_items enable row level security;

drop policy if exists "wardrobe_select_own" on public.wardrobe;
create policy "wardrobe_select_own" on public.wardrobe
  for select using (auth.uid() = user_id);

drop policy if exists "wardrobe_insert_own" on public.wardrobe;
create policy "wardrobe_insert_own" on public.wardrobe
  for insert with check (auth.uid() = user_id);

drop policy if exists "wardrobe_update_own" on public.wardrobe;
create policy "wardrobe_update_own" on public.wardrobe
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "wardrobe_delete_own" on public.wardrobe;
create policy "wardrobe_delete_own" on public.wardrobe
  for delete using (auth.uid() = user_id);

drop policy if exists "wardrobe_items_select_own" on public.wardrobe_items;
create policy "wardrobe_items_select_own" on public.wardrobe_items
  for select using (auth.uid() = user_id);

drop policy if exists "wardrobe_items_insert_own" on public.wardrobe_items;
create policy "wardrobe_items_insert_own" on public.wardrobe_items
  for insert with check (auth.uid() = user_id);

drop policy if exists "wardrobe_items_update_own" on public.wardrobe_items;
create policy "wardrobe_items_update_own" on public.wardrobe_items
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "wardrobe_items_delete_own" on public.wardrobe_items;
create policy "wardrobe_items_delete_own" on public.wardrobe_items
  for delete using (auth.uid() = user_id);

drop policy if exists "outfits_select_own" on public.outfits;
create policy "outfits_select_own" on public.outfits
  for select using (auth.uid() = user_id);

drop policy if exists "outfits_insert_own" on public.outfits;
create policy "outfits_insert_own" on public.outfits
  for insert with check (auth.uid() = user_id);

drop policy if exists "outfits_update_own" on public.outfits;
create policy "outfits_update_own" on public.outfits
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "outfits_delete_own" on public.outfits;
create policy "outfits_delete_own" on public.outfits
  for delete using (auth.uid() = user_id);

drop policy if exists "outfit_items_select_own" on public.outfit_items;
create policy "outfit_items_select_own" on public.outfit_items
  for select using (
    exists (
      select 1
      from public.outfits o
      where o.id = outfit_id
        and o.user_id = auth.uid()
    )
  );

drop policy if exists "outfit_items_insert_own" on public.outfit_items;
create policy "outfit_items_insert_own" on public.outfit_items
  for insert with check (
    exists (
      select 1
      from public.outfits o
      where o.id = outfit_id
        and o.user_id = auth.uid()
    )
  );

drop policy if exists "outfit_items_update_own" on public.outfit_items;
create policy "outfit_items_update_own" on public.outfit_items
  for update using (
    exists (
      select 1
      from public.outfits o
      where o.id = outfit_id
        and o.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.outfits o
      where o.id = outfit_id
        and o.user_id = auth.uid()
    )
  );

drop policy if exists "outfit_items_delete_own" on public.outfit_items;
create policy "outfit_items_delete_own" on public.outfit_items
  for delete using (
    exists (
      select 1
      from public.outfits o
      where o.id = outfit_id
        and o.user_id = auth.uid()
    )
  );

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.wardrobe to anon, authenticated;
grant select, insert, update, delete on table public.wardrobe_items to anon, authenticated;
grant select, insert, update, delete on table public.outfits to anon, authenticated;
grant select, insert, update, delete on table public.outfit_items to anon, authenticated;
grant execute on function public.ensure_user_wardrobe(uuid) to anon, authenticated;

-- User-editable system prompts
create table if not exists public.system_prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  content text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists system_prompts_user_id_idx on public.system_prompts(user_id);
create unique index if not exists system_prompts_user_name_unique on public.system_prompts(user_id, name);

alter table public.system_prompts enable row level security;

drop policy if exists "system_prompts_select_own" on public.system_prompts;
create policy "system_prompts_select_own" on public.system_prompts
  for select using (auth.uid() = user_id);

drop policy if exists "system_prompts_insert_own" on public.system_prompts;
create policy "system_prompts_insert_own" on public.system_prompts
  for insert with check (auth.uid() = user_id);

drop policy if exists "system_prompts_update_own" on public.system_prompts;
create policy "system_prompts_update_own" on public.system_prompts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "system_prompts_delete_own" on public.system_prompts;
create policy "system_prompts_delete_own" on public.system_prompts
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on table public.system_prompts to anon, authenticated;
