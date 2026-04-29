import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { createId } from "@/lib/id";
import { describeUnknownError } from "@/lib/error";
import { getOrCreateSupabaseUserId } from "@/services/outfitsSupabase";
import {
  createSupabaseSavedItem,
  deleteSupabaseSavedItem,
  listSupabaseSavedItems,
  updateSupabaseSavedItemName,
  type SavedItemRecord,
} from "@/services/savedItemsSupabase";
import {
  normalizeClothingCategory,
  type ClothingCategory,
} from "@/lib/clothingCategory";

// Mirrors useWardrobe but for AI-generated pieces the user marked as "saved".
// Each saved item carries the original prompt + category in addition to a
// custom display name so the saved page can support edit/rename + filtering.
export interface SavedAiItem {
  id: string;
  category: ClothingCategory;
  imageUrl: string;
  prompt: string;
  name?: string | null;
  savedAt: string;
}

export interface AddSavedItemResult {
  item: SavedAiItem;
  savedToCloud: boolean;
  cloudError?: string;
  alreadyExists?: boolean;
}

const STORAGE_KEY = "dressify-saved-generated-items";

function normalizeName(name?: string | null) {
  const trimmed = name?.trim();
  return trimmed ? trimmed : null;
}

function readLocalSavedItems(): SavedAiItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((raw): SavedAiItem | null => {
        if (!raw) return null;
        const id = raw.id ?? raw.savedId;
        const imageUrl = raw.imageUrl;
        if (!id || typeof imageUrl !== "string") return null;

        return {
          id,
          category: normalizeClothingCategory(raw.category, raw.prompt),
          imageUrl,
          prompt: typeof raw.prompt === "string" ? raw.prompt : "",
          name: normalizeName(raw.name),
          savedAt: typeof raw.savedAt === "string" ? raw.savedAt : new Date().toISOString(),
        };
      })
      .filter((item): item is SavedAiItem => Boolean(item));
  } catch {
    return [];
  }
}

function writeLocalSavedItems(items: SavedAiItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function fromSupabaseRecord(record: SavedItemRecord): SavedAiItem {
  return {
    id: record.id,
    category: normalizeClothingCategory(record.category, record.prompt ?? undefined),
    imageUrl: record.image_path ?? "",
    prompt: record.prompt ?? "",
    name: normalizeName(record.name),
    savedAt: record.created_at,
  };
}

function findExisting(items: SavedAiItem[], imageUrl: string, prompt: string, category: string) {
  return (
    items.find(
      (item) => item.imageUrl === imageUrl && item.prompt === prompt && item.category === category,
    ) ?? null
  );
}

export function useSavedItems() {
  const [items, setItems] = useState<SavedAiItem[]>(() => readLocalSavedItems());
  const [isLoading, setIsLoading] = useState(true);
  const [isCloudSyncEnabled, setIsCloudSyncEnabled] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let authUnsubscribe: (() => void) | null = null;

    const initialize = async () => {
      if (mounted) setIsLoading(true);

      if (!isSupabaseConfigured) {
        if (mounted) {
          setIsCloudSyncEnabled(false);
          setUserId(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const resolvedUserId = await getOrCreateSupabaseUserId();
        if (!mounted) return;

        if (!resolvedUserId) {
          setIsCloudSyncEnabled(false);
          setUserId(null);
          setSyncError(
            "Supabase is configured but no auth session is available. Saved items are kept locally only.",
          );
          setIsLoading(false);
          return;
        }

        const remoteItems = await listSupabaseSavedItems(resolvedUserId);
        if (!mounted) return;

        setUserId(resolvedUserId);
        setItems(remoteItems.map(fromSupabaseRecord));
        setIsCloudSyncEnabled(true);
        setSyncError(null);
      } catch (error) {
        if (!mounted) return;
        const message = describeUnknownError(error, "Unknown Supabase error");
        setIsCloudSyncEnabled(false);
        setUserId(null);
        setSyncError(`Saved items sync failed (${message}). Using local mode.`);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void initialize();

    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(() => {
        void initialize();
      });
      authUnsubscribe = () => data.subscription.unsubscribe();
    }

    return () => {
      mounted = false;
      authUnsubscribe?.();
    };
  }, []);

  const addItem = useCallback(
    async (input: {
      category: string;
      imageUrl: string;
      prompt: string;
      name?: string | null;
    }): Promise<AddSavedItemResult> => {
      const normalizedCategory = normalizeClothingCategory(input.category, input.prompt);
      const normalizedName = normalizeName(input.name);
      const existing = findExisting(items, input.imageUrl, input.prompt, normalizedCategory);
      if (existing) {
        return {
          item: existing,
          savedToCloud: isCloudSyncEnabled,
          alreadyExists: true,
        };
      }

      if (isSupabaseConfigured) {
        const resolvedUserId = userId ?? (await getOrCreateSupabaseUserId());

        if (resolvedUserId) {
          try {
            const created = await createSupabaseSavedItem(resolvedUserId, {
              category: normalizedCategory,
              imagePath: input.imageUrl,
              prompt: input.prompt,
              name: normalizedName,
            });
            const item = fromSupabaseRecord(created);
            setUserId(resolvedUserId);
            setIsCloudSyncEnabled(true);
            setSyncError(null);
            setItems((prev) => [item, ...prev]);
            return { item, savedToCloud: true };
          } catch (error) {
            const message = describeUnknownError(error, "Unknown Supabase error");
            setIsCloudSyncEnabled(false);
            setSyncError(`Saved-item insert failed (${message}). Saved locally.`);
            const item: SavedAiItem = {
              id: createId(),
              category: normalizedCategory,
              imageUrl: input.imageUrl,
              prompt: input.prompt,
              name: normalizedName,
              savedAt: new Date().toISOString(),
            };

            setItems((prev) => {
              const updated = [item, ...prev];
              writeLocalSavedItems(updated);
              return updated;
            });

            return { item, savedToCloud: false, cloudError: message };
          }
        } else {
          setIsCloudSyncEnabled(false);
          setSyncError(
            "Supabase is configured but no auth session is available. Saved items kept locally only.",
          );
        }
      }

      const item: SavedAiItem = {
        id: createId(),
        category: normalizedCategory,
        imageUrl: input.imageUrl,
        prompt: input.prompt,
        name: normalizedName,
        savedAt: new Date().toISOString(),
      };

      setItems((prev) => {
        const updated = [item, ...prev];
        writeLocalSavedItems(updated);
        return updated;
      });

      return { item, savedToCloud: false };
    },
    [isCloudSyncEnabled, items, userId],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      if (isCloudSyncEnabled && userId) {
        try {
          await deleteSupabaseSavedItem(userId, id);
        } catch (error) {
          const message = describeUnknownError(error, "Unknown Supabase error");
          setSyncError(`Saved item delete failed (${message}).`);
          throw error;
        }
        setItems((prev) => prev.filter((item) => item.id !== id));
        return;
      }

      setItems((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        writeLocalSavedItems(updated);
        return updated;
      });
    },
    [isCloudSyncEnabled, userId],
  );

  const updateItemName = useCallback(
    async (id: string, name: string | null) => {
      const normalized = normalizeName(name);

      if (isCloudSyncEnabled && userId) {
        try {
          const updatedRecord = await updateSupabaseSavedItemName(userId, id, normalized);
          const updatedItem = fromSupabaseRecord(updatedRecord);
          setItems((prev) => prev.map((item) => (item.id === id ? updatedItem : item)));
          setSyncError(null);
          return updatedItem;
        } catch (error) {
          const message = describeUnknownError(error, "Unknown Supabase error");
          setIsCloudSyncEnabled(false);
          setSyncError(`Saved item rename failed (${message}). Saved locally.`);
        }
      }

      let updatedItem: SavedAiItem | null = null;
      setItems((prev) => {
        const updated = prev.map((item) => {
          if (item.id !== id) return item;
          updatedItem = { ...item, name: normalized };
          return updatedItem;
        });
        writeLocalSavedItems(updated);
        return updated;
      });
      return updatedItem;
    },
    [isCloudSyncEnabled, userId],
  );

  return {
    items,
    addItem,
    deleteItem,
    updateItemName,
    isLoading,
    isCloudSyncEnabled,
    syncError,
    userId,
  };
}
