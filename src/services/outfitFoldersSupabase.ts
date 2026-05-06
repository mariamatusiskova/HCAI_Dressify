import { supabase } from "@/lib/supabase";
import type { ClosetFolderColor } from "@/lib/closetFolders";

// Folders for saved outfits. Same shape as wardrobe_folders /
// wardrobe_folder_items so the UI can reuse the collection palette and
// drag-and-drop UX.
export interface OutfitFolderRecord {
  id: string;
  user_id: string;
  name: string;
  color: ClosetFolderColor | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface OutfitFolderAssignmentRecord {
  folder_id: string;
  outfit_id: string;
  user_id: string;
  created_at: string;
}

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }
  return supabase;
}

export async function listSupabaseOutfitFolders(
  userId: string,
): Promise<OutfitFolderRecord[]> {
  const client = requireSupabase();

  const result = await client
    .from("outfit_folders")
    .select("id, user_id, name, color, cover_image_url, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []) as OutfitFolderRecord[];
}

export async function listSupabaseOutfitFolderAssignments(
  userId: string,
): Promise<OutfitFolderAssignmentRecord[]> {
  const client = requireSupabase();

  const result = await client
    .from("outfit_folder_items")
    .select("folder_id, outfit_id, user_id, created_at")
    .eq("user_id", userId);

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []) as OutfitFolderAssignmentRecord[];
}

export async function createSupabaseOutfitFolder(
  userId: string,
  input: {
    name: string;
    color: ClosetFolderColor;
    coverImageUrl?: string | null;
  },
): Promise<OutfitFolderRecord> {
  const client = requireSupabase();

  const inserted = await client
    .from("outfit_folders")
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
    throw inserted.error ?? new Error("Failed to create outfit collection");
  }

  return inserted.data as OutfitFolderRecord;
}

export async function updateSupabaseOutfitFolder(
  userId: string,
  folderId: string,
  patch: Partial<
    Pick<OutfitFolderRecord, "name" | "color" | "cover_image_url">
  >,
): Promise<void> {
  const client = requireSupabase();

  const result = await client
    .from("outfit_folders")
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

export async function deleteSupabaseOutfitFolder(
  userId: string,
  folderId: string,
): Promise<void> {
  const client = requireSupabase();

  const result = await client
    .from("outfit_folders")
    .delete()
    .eq("id", folderId)
    .eq("user_id", userId);

  if (result.error) {
    throw result.error;
  }
}

export async function upsertSupabaseOutfitFolderAssignment(
  userId: string,
  outfitId: string,
  folderId: string,
): Promise<void> {
  const client = requireSupabase();

  const result = await client.from("outfit_folder_items").upsert(
    {
      user_id: userId,
      folder_id: folderId,
      outfit_id: outfitId,
      created_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,outfit_id",
    },
  );

  if (result.error) {
    throw result.error;
  }
}

export async function deleteSupabaseOutfitFolderAssignment(
  userId: string,
  outfitId: string,
): Promise<void> {
  const client = requireSupabase();

  const result = await client
    .from("outfit_folder_items")
    .delete()
    .eq("user_id", userId)
    .eq("outfit_id", outfitId);

  if (result.error) {
    throw result.error;
  }
}

export async function updateSupabaseOutfitName(
  userId: string,
  outfitId: string,
  name: string,
): Promise<void> {
  const client = requireSupabase();

  const result = await client
    .from("outfits")
    .update({ name: name.trim() })
    .eq("id", outfitId)
    .eq("user_id", userId);

  if (result.error) {
    throw result.error;
  }
}
