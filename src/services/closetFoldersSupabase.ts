import { supabase } from "@/lib/supabase";
import type { ClosetFolderColor } from "@/lib/closetFolders";

export interface ClosetFolderRecord {
  id: string;
  user_id: string;
  name: string;
  color: ClosetFolderColor | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClosetFolderAssignmentRecord {
  folder_id: string;
  wardrobe_item_id: string;
  user_id: string;
  created_at: string;
}

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }
  return supabase;
}

export async function listSupabaseClosetFolders(
  userId: string,
): Promise<ClosetFolderRecord[]> {
  const client = requireSupabase();

  const result = await client
    .from("wardrobe_folders")
    .select("id, user_id, name, color, cover_image_url, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []) as ClosetFolderRecord[];
}

export async function listSupabaseClosetFolderAssignments(
  userId: string,
): Promise<ClosetFolderAssignmentRecord[]> {
  const client = requireSupabase();

  const result = await client
    .from("wardrobe_folder_items")
    .select("folder_id, wardrobe_item_id, user_id, created_at")
    .eq("user_id", userId);

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []) as ClosetFolderAssignmentRecord[];
}

export async function createSupabaseClosetFolder(
  userId: string,
  input: {
    name: string;
    color: ClosetFolderColor;
    coverImageUrl?: string | null;
  },
): Promise<ClosetFolderRecord> {
  const client = requireSupabase();

  const inserted = await client
    .from("wardrobe_folders")
    .insert({
      user_id: userId,
      name: input.name,
      color: input.color,
      cover_image_url: input.coverImageUrl ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id, user_id, name, color, cover_image_url, created_at, updated_at")
    .single();

  if (inserted.error || !inserted.data) {
    throw inserted.error ?? new Error("Failed to create wardrobe collection");
  }

  return inserted.data as ClosetFolderRecord;
}

export async function updateSupabaseClosetFolder(
  userId: string,
  folderId: string,
  patch: Partial<
    Pick<ClosetFolderRecord, "name" | "color" | "cover_image_url">
  >,
): Promise<void> {
  const client = requireSupabase();

  const result = await client
    .from("wardrobe_folders")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", folderId)
    .eq("user_id", userId);

  if (result.error) {
    throw result.error;
  }
}

export async function deleteSupabaseClosetFolder(
  userId: string,
  folderId: string,
): Promise<void> {
  const client = requireSupabase();

  const result = await client
    .from("wardrobe_folders")
    .delete()
    .eq("id", folderId)
    .eq("user_id", userId);

  if (result.error) {
    throw result.error;
  }
}

export async function upsertSupabaseClosetFolderAssignment(
  userId: string,
  wardrobeItemId: string,
  folderId: string,
): Promise<void> {
  const client = requireSupabase();

  const result = await client.from("wardrobe_folder_items").upsert(
    {
      user_id: userId,
      folder_id: folderId,
      wardrobe_item_id: wardrobeItemId,
      created_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,wardrobe_item_id",
    },
  );

  if (result.error) {
    throw result.error;
  }
}

export async function deleteSupabaseClosetFolderAssignment(
  userId: string,
  wardrobeItemId: string,
): Promise<void> {
  const client = requireSupabase();

  const result = await client
    .from("wardrobe_folder_items")
    .delete()
    .eq("user_id", userId)
    .eq("wardrobe_item_id", wardrobeItemId);

  if (result.error) {
    throw result.error;
  }
}