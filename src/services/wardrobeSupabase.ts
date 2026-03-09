import { supabase } from "@/lib/supabase";

export interface WardrobeItemRecord {
  id: string;
  user_id: string;
  category: string | null;
  image_path: string | null;
  thumb_path: string | null;
  tags: string[] | null;
  created_at: string;
}

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }
  return supabase;
}

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
    .insert({ user_id: userId })
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
    .select("id, user_id, category, image_path, thumb_path, tags, created_at")
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
    })
    .select("id, user_id, category, image_path, thumb_path, tags, created_at")
    .single();

  if (inserted.error || !inserted.data) {
    throw inserted.error ?? new Error("Failed to create wardrobe item");
  }

  return inserted.data as WardrobeItemRecord;
}

export async function deleteSupabaseWardrobeItem(userId: string, itemId: string): Promise<void> {
  const client = requireSupabase();

  const result = await client
    .from("wardrobe_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", userId);

  if (result.error) {
    throw result.error;
  }
}

