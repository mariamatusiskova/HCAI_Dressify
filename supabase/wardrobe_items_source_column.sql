-- ============================================================================
-- Distinguish user-uploaded wardrobe pieces from AI items synthesised when
-- saving an outfit
-- ----------------------------------------------------------------------------
-- The original schema reuses `wardrobe_items` for two different things:
--   1. real pieces the user uploaded a photo for (the wardrobe page), and
--   2. AI-generated canvas pieces, inserted on the fly so `outfit_items`
--      can reference them via wardrobe_item_id.
--
-- That made AI pieces leak into the wardrobe page. Adding a `source` column
-- lets us flag the implicit AI rows and filter them out of the wardrobe
-- list while keeping outfit references working.
--
-- Safe to run multiple times: the ALTER uses IF NOT EXISTS, the UPDATE only
-- backfills rows where source IS NULL, and the index is idempotent.
-- ============================================================================

-- 1. Add the column with a sensible default for legacy rows.
alter table public.wardrobe_items
  add column if not exists source text not null default 'wardrobe';

-- 2. Backfill any pre-existing rows: keep the 'wardrobe' default for known
--    user uploads. New AI inserts will set source='ai' explicitly.
update public.wardrobe_items
set source = 'wardrobe'
where source is null;

-- 3. Helpful index for the wardrobe list filter.
create index if not exists wardrobe_items_user_source_idx
  on public.wardrobe_items (user_id, source, created_at desc);
