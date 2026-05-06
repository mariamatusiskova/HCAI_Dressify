import { supabase } from "@/lib/supabase";
import type { ClosetFolderColor } from "@/lib/closetFolders";

// Folders for the "Saved AI items" page. The schema mirrors
// wardrobe_folders / wardrobe_folder_items so the same color palette and
// drag-and-drop UX can be reused for saved generated items.
export interface SavedItemFolderRecord {
  id: string;
  user_id: string;
  name: string;
  color: ClosetFolderColor | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavedItemFolderAssignmentRecord {
  folder_id: string;
  saved_item_id: string;
  user_id: string;
  created_at: string;
}

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }
  return supabase;
}

export async function listSupabaseSavedItemFolders(
  userId: string,
): Promise<SavedItemFolderRecord[]> {
  const client = requireSupabase();

  const result = await client
    .from("saved_item_folders")
    .select("id, user_id, name, color, cover_image_url, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []) as SavedItemFolderRecord[];
}

export async function listSupabaseSavedItemFolderAssignments(
  userId: string,
): Promise<SavedItemFolderAssignmentRecord[]> {
  const client = requireSupabase();

  const result = await client
    .from("saved_item_folder_items")
    .select("folder_id, saved_item_id, user_id, created_at")
    .eq("user_id", userId);

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []) as SavedItemFolderAssignmentRecord[];
}

export async function createSupabaseSavedItemFolder(
  userId: string,
  input: {
    name: string;
    color: ClosetFolderColor;
    coverImageUrl?: string | null;
  },
): Promise<SavedItemFolderRecord> {
  const client = requireSupabase();

  const inserted = await client
    .from("saved_item_folders")
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
    throw inserted.error ?? new Error("Failed to create saved-item collection");
  }

  return inserted.data as SavedItemFolderRecord;
}

export async function updateSupabaseSavedItemFolder(
  userId: string,
  folderId: string,
  patch: Partial<
    Pick<SavedItemFolderRecord, "name" | "color" | "cover_image_url">
  >,
): Promise<void> {
  const client = requireSupabase();

  const result = await client
    .from("saved_item_folders")
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

export async function deleteSupabaseSavedItemFolder(
  userId: string,
  folderId: string,
): Promise<void> {
  const client = requireSupabase();

  const result = await client
    .from("saved_item_folders")
    .delete()
    .eq("id", folderId)
    .eq("user_id", userId);

  if (result.error) {
    throw result.error;
  }
}

export async function upsertSupabaseSavedItemFolderAssignment(
  userId: string,
  savedItemId: string,
  folderId: string,
): Promise<void> {
  const client = requireSupabase();

  const result = await client.from("saved_item_folder_items").upsert(
    {
      user_id: userId,
      folder_id: folderId,
      saved_item_id: savedItemId,
      created_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,saved_item_id",
    },
  );

  if (result.error) {
    throw result.error;
  }
}

export async function deleteSupabaseSavedItemFolderAssignment(
  userId: string,
  savedItemId: string,
): Promise<void> {
  const client = requireSupabase();

  const result = await client
    .from("saved_item_folder_items")
    .delete()
    .eq("user_id", userId)
    .eq("saved_item_id", savedItemId);

  if (result.error) {
    throw result.error;
  }
}
