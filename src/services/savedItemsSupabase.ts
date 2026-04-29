import { supabase } from "@/lib/supabase";

// Mirrors wardrobeSupabase but persists "saved AI items" — pieces the user
// generated and chose to keep without uploading their own photo.
export interface SavedItemRecord {
  id: string;
  user_id: string;
  category: string | null;
  image_path: string | null;
  prompt: string | null;
  name: string | null;
  created_at: string;
  updated_at: string | null;
}

const SAVED_ITEM_SELECT =
  "id, user_id, category, image_path, prompt, name, created_at, updated_at";

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

export async function listSupabaseSavedItems(userId: string): Promise<SavedItemRecord[]> {
  const client = requireSupabase();

  const result = await client
    .from("saved_items")
    .select(SAVED_ITEM_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []) as SavedItemRecord[];
}

export async function createSupabaseSavedItem(
  userId: string,
  input: {
    category: string;
    imagePath: string;
    prompt?: string | null;
    name?: string | null;
  },
): Promise<SavedItemRecord> {
  const client = requireSupabase();

  const inserted = await client
    .from("saved_items")
    .insert({
      user_id: userId,
      category: input.category,
      image_path: input.imagePath,
      prompt: input.prompt ?? null,
      name: normalizeName(input.name),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select(SAVED_ITEM_SELECT)
    .single();

  if (inserted.error || !inserted.data) {
    throw inserted.error ?? new Error("Failed to create saved item");
  }

  return inserted.data as SavedItemRecord;
}

export async function updateSupabaseSavedItemName(
  userId: string,
  itemId: string,
  name: string | null,
): Promise<SavedItemRecord> {
  const client = requireSupabase();

  const updated = await client
    .from("saved_items")
    .update({
      name: normalizeName(name),
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .eq("user_id", userId)
    .select(SAVED_ITEM_SELECT)
    .single();

  if (updated.error || !updated.data) {
    throw updated.error ?? new Error("Failed to update saved item name");
  }

  return updated.data as SavedItemRecord;
}

export async function deleteSupabaseSavedItem(userId: string, itemId: string): Promise<void> {
  const client = requireSupabase();

  // Clean up any folder assignments first so we never leave dangling rows.
  const assignmentDelete = await client
    .from("saved_item_folder_items")
    .delete()
    .eq("user_id", userId)
    .eq("saved_item_id", itemId);

  if (assignmentDelete.error) {
    // Folder assignment table may legitimately not exist on older deployments.
    // Surface it as a warning rather than a hard failure.
    console.warn("Could not clean up saved-item folder assignment:", assignmentDelete.error.message);
  }

  const result = await client
    .from("saved_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", userId);

  if (result.error) {
    throw result.error;
  }
}
