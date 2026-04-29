import { supabase } from "@/lib/supabase";

export interface WardrobeItemRecord {
  id: string;
  user_id: string;
  category: string | null;
  image_path: string | null;
  thumb_path: string | null;
  tags: string[] | null;
  created_at: string;
  name?: string | null;
}

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }
  return supabase;
}

function normalizeName(name?: string | null) {
  const trimmed = name?.trim();
  return trimmed ? trimmed : null;
}

const WARDROBE_ITEM_SELECT = "id, user_id, category, image_path, thumb_path, tags, created_at, name";

async function ensureWardrobe(userId: string): Promise<string> {
  const client = requireSupabase();

  const rpcResult = await client.rpc("ensure_user_wardrobe", { p_user_id: userId });
  if (!rpcResult.error && typeof rpcResult.data === "string" && rpcResult.data.length > 0) {
    return rpcResult.data;
  }

  const existing = await client
    .from("wardrobe")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing.error) {
    throw existing.error;
  }
  if (existing.data?.id) {
    return existing.data.id as string;
  }

  const inserted = await client
    .from("wardrobe")
    .insert({
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (inserted.error || !inserted.data?.id) {
    throw inserted.error ?? new Error("Failed to create wardrobe");
  }

  return inserted.data.id as string;
}

export async function listSupabaseWardrobeItems(userId: string): Promise<WardrobeItemRecord[]> {
  const client = requireSupabase();

  const result = await client
    .from("wardrobe_items")
    .select(WARDROBE_ITEM_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []) as WardrobeItemRecord[];
}

export async function createSupabaseWardrobeItem(
  userId: string,
  category: string,
  imagePath: string,
  name?: string | null,
): Promise<WardrobeItemRecord> {
  const client = requireSupabase();
  const wardrobeId = await ensureWardrobe(userId);

  const inserted = await client
    .from("wardrobe_items")
    .insert({
      user_id: userId,
      wardrobe_id: wardrobeId,
      category,
      image_path: imagePath,
      thumb_path: imagePath,
      tags: [],
      name: normalizeName(name),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select(WARDROBE_ITEM_SELECT)
    .single();

  if (inserted.error || !inserted.data) {
    throw inserted.error ?? new Error("Failed to create wardrobe item");
  }

  return inserted.data as WardrobeItemRecord;
}

export async function updateSupabaseWardrobeItemName(
  userId: string,
  itemId: string,
  name: string | null,
): Promise<WardrobeItemRecord> {
  const client = requireSupabase();

  const updated = await client
    .from("wardrobe_items")
    .update({
      name: normalizeName(name),
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .eq("user_id", userId)
    .select(WARDROBE_ITEM_SELECT)
    .single();

  if (updated.error || !updated.data) {
    throw updated.error ?? new Error("Failed to update wardrobe item name");
  }

  return updated.data as WardrobeItemRecord;
}

export async function deleteSupabaseWardrobeItem(userId: string, itemId: string): Promise<void> {
  const client = requireSupabase();

  const assignmentDelete = await client
    .from("wardrobe_folder_items")
    .delete()
    .eq("user_id", userId)
    .eq("wardrobe_item_id", itemId);

  if (assignmentDelete.error) {
    throw assignmentDelete.error;
  }

  const result = await client
    .from("wardrobe_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", userId);

  if (result.error) {
    throw result.error;
  }
}
