import { supabase } from "@/lib/supabase";
import type { CanvasItem, Outfit } from "@/hooks/useOutfits";

interface OutfitRow {
  id: string;
  name: string;
  created_at: string;
}

interface OutfitItemRow {
  outfit_id: string;
  wardrobe_item_id: string;
  x: number | string | null;
  y: number | string | null;
  width: number | string | null;
  height: number | string | null;
  rotation: number | string | null;
  z_index: number | null;
}

interface ClosetItemRow {
  id: string;
  category: string | null;
  image_path: string | null;
}

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }
  return supabase;
}

function toNumber(value: number | string | null | undefined, fallback: number): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export async function getOrCreateSupabaseUserId(): Promise<string | null> {
  const client = requireSupabase();

  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) {
    // "Auth session missing" is expected for first-time visitors.
    const isMissingSession =
      sessionError.message?.toLowerCase().includes("session") &&
      sessionError.message?.toLowerCase().includes("missing");

    if (!isMissingSession) {
      throw sessionError;
    }
  }
  if (sessionData.session?.user?.id) {
    return sessionData.session.user.id;
  }

  const { data: userData, error: userError } = await client.auth.getUser();
  if (!userError && userData.user?.id) {
    return userData.user.id;
  }

  // No implicit sign-in fallback. The user must authenticate via UI (e.g., magic link).
  return null;
}

async function ensureWardrobe(userId: string): Promise<string> {
  const client = requireSupabase();

  const rpcResult = await client.rpc("ensure_user_wardrobe", { p_user_id: userId });
  if (!rpcResult.error && typeof rpcResult.data === "string" && rpcResult.data.length > 0) {
    return rpcResult.data;
  }

  // Fallback in case RPC isn't present.
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

export async function listSupabaseOutfits(userId: string): Promise<Outfit[]> {
  const client = requireSupabase();

  const outfitsResult = await client
    .from("outfits")
    .select("id, name, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (outfitsResult.error) {
    throw outfitsResult.error;
  }

  const outfitRows = (outfitsResult.data ?? []) as OutfitRow[];
  if (outfitRows.length === 0) {
    return [];
  }

  const outfitIds = outfitRows.map((row) => row.id);

  const outfitItemsResult = await client
    .from("outfit_items")
    .select("outfit_id, wardrobe_item_id, x, y, width, height, rotation, z_index")
    .in("outfit_id", outfitIds);

  if (outfitItemsResult.error) {
    throw outfitItemsResult.error;
  }

  const outfitItemRows = (outfitItemsResult.data ?? []) as OutfitItemRow[];
  const closetItemIds = [...new Set(outfitItemRows.map((row) => row.wardrobe_item_id))];

  let closetItemsById = new Map<string, ClosetItemRow>();
  if (closetItemIds.length > 0) {
    const closetItemsResult = await client
      .from("wardrobe_items")
      .select("id, category, image_path")
      .in("id", closetItemIds);

    if (closetItemsResult.error) {
      throw closetItemsResult.error;
    }

    closetItemsById = new Map(
      ((closetItemsResult.data ?? []) as ClosetItemRow[]).map((item) => [item.id, item]),
    );
  }

  const itemsByOutfit = new Map<string, CanvasItem[]>();

  for (const row of outfitItemRows) {
    const closetItem = closetItemsById.get(row.wardrobe_item_id);
    if (!closetItem) continue;

    const canvasItem: CanvasItem = {
      id: row.wardrobe_item_id,
      imageUrl: closetItem.image_path ?? "",
      category: closetItem.category ?? "unknown",
      x: toNumber(row.x, 40),
      y: toNumber(row.y, 40),
      width: toNumber(row.width, 80),
      height: toNumber(row.height, 80),
      rotation: toNumber(row.rotation, 0),
      zIndex: row.z_index ?? 0,
    };

    const existing = itemsByOutfit.get(row.outfit_id) ?? [];
    existing.push(canvasItem);
    itemsByOutfit.set(row.outfit_id, existing);
  }

  return outfitRows.map((outfit) => ({
    id: outfit.id,
    name: outfit.name,
    timestamp: outfit.created_at,
    // Not part of current Supabase schema; kept for app compatibility.
    userPhoto: null,
    canvasItems: (itemsByOutfit.get(outfit.id) ?? []).sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)),
  }));
}

export async function createSupabaseOutfit(
  userId: string,
  name: string,
  canvasItems: CanvasItem[],
): Promise<Outfit> {
  const client = requireSupabase();

  const wardrobeId = await ensureWardrobe(userId);

  const outfitInsert = await client
    .from("outfits")
    .insert({
      user_id: userId,
      name,
      created_at: new Date().toISOString(),
    })
    .select("id, name, created_at")
    .single();

  if (outfitInsert.error || !outfitInsert.data) {
    throw outfitInsert.error ?? new Error("Failed to create outfit");
  }

  let savedCanvasItems: CanvasItem[] = [];

  if (canvasItems.length > 0) {
    const closetInsertPayload = canvasItems.map((item) => ({
      user_id: userId,
      wardrobe_id: wardrobeId,
      category: item.category,
      image_path: item.imageUrl,
      thumb_path: item.imageUrl,
      tags: [],
      // Wardrobe pieces dragged from the user's wardrobe stay marked as
      // 'wardrobe'; everything else (AI generations, freshly saved items)
      // is tagged 'ai' so listSupabaseClosetItems skips it. This stops
      // canvas-only pieces from leaking into the wardrobe page.
      source: item.source === "wardrobe" ? "wardrobe" : "ai",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const closetItemsInsert = await client
      .from("wardrobe_items")
      .insert(closetInsertPayload)
      .select("id, category, image_path");

    if (closetItemsInsert.error) {
      throw closetItemsInsert.error;
    }

    const insertedClosetItems = (closetItemsInsert.data ?? []) as ClosetItemRow[];
    if (insertedClosetItems.length !== canvasItems.length) {
      throw new Error("Failed to persist all wardrobe items");
    }

    const outfitItemsPayload = insertedClosetItems.map((closetItem, index) => {
      const source = canvasItems[index];
      return {
        outfit_id: outfitInsert.data.id,
        wardrobe_item_id: closetItem.id,
        x: source.x,
        y: source.y,
        width: source.width,
        height: source.height,
        rotation: source.rotation,
        z_index: source.zIndex,
      };
    });

    const outfitItemsInsert = await client.from("outfit_items").insert(outfitItemsPayload);
    if (outfitItemsInsert.error) {
      throw outfitItemsInsert.error;
    }

    savedCanvasItems = insertedClosetItems.map((closetItem, index) => {
      const source = canvasItems[index];
      return {
        ...source,
        id: closetItem.id,
        category: closetItem.category ?? source.category,
        imageUrl: closetItem.image_path ?? source.imageUrl,
      };
    });
  }

  return {
    id: outfitInsert.data.id,
    name: outfitInsert.data.name,
    timestamp: outfitInsert.data.created_at,
    userPhoto: null,
    canvasItems: savedCanvasItems,
  };
}

export async function deleteSupabaseOutfit(userId: string, outfitId: string): Promise<void> {
  const client = requireSupabase();

  const linkedItemsResult = await client
    .from("outfit_items")
    .select("wardrobe_item_id")
    .eq("outfit_id", outfitId);

  if (linkedItemsResult.error) {
    throw linkedItemsResult.error;
  }

  const linkedWardrobeIds = [...new Set((linkedItemsResult.data ?? []).map((row) => row.wardrobe_item_id as string))];

  const deleteOutfitItems = await client.from("outfit_items").delete().eq("outfit_id", outfitId);
  if (deleteOutfitItems.error) {
    throw deleteOutfitItems.error;
  }

  const deleteOutfit = await client.from("outfits").delete().eq("id", outfitId).eq("user_id", userId);
  if (deleteOutfit.error) {
    throw deleteOutfit.error;
  }

  if (linkedWardrobeIds.length > 0) {
    const deleteClosetItems = await client
      .from("wardrobe_items")
      .delete()
      .eq("user_id", userId)
      .in("id", linkedWardrobeIds);

    // Keep delete resilient if items are reused elsewhere.
    if (deleteClosetItems.error) {
      console.warn("Could not delete some wardrobe items:", deleteClosetItems.error.message);
    }
  }
}
