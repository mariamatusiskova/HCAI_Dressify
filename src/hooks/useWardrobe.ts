import { useState, useEffect, useCallback } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { createId } from "@/lib/id";
import { describeUnknownError } from "@/lib/error";
import { getOrCreateSupabaseUserId } from "@/services/outfitsSupabase";
import {
  createSupabaseWardrobeItem,
  deleteSupabaseWardrobeItem,
  listSupabaseWardrobeItems,
  updateSupabaseWardrobeItemName,
  type WardrobeItemRecord,
} from "@/services/wardrobeSupabase";

export interface WardrobeItem {
  id: string;
  category: string;
  imageUrl: string;
  createdAt: string;
  tags: string[];
  name?: string | null;
}

export interface AddWardrobeResult {
  item: WardrobeItem;
  savedToCloud: boolean;
  cloudError?: string;
  alreadyExists?: boolean;
}

const STORAGE_KEY = "dressify-wardrobe-items";

function readLocalWardrobe(): WardrobeItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item) => ({
      ...item,
      name: normalizeWardrobeItemName(item.name),
      tags: Array.isArray(item.tags) ? item.tags : [],
    }));
  } catch {
    return [];
  }
}

function writeLocalWardrobe(items: WardrobeItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function normalizeWardrobeItemName(name?: string | null) {
  const trimmed = name?.trim();
  return trimmed ? trimmed : null;
}

function findExistingWardrobeItem(items: WardrobeItem[], category: string, imageUrl: string) {
  return items.find((item) => item.category === category && item.imageUrl === imageUrl) ?? null;
}

function fromSupabaseRecord(record: WardrobeItemRecord): WardrobeItem {
  return {
    id: record.id,
    category: record.category ?? "unknown",
    imageUrl: record.image_path ?? record.thumb_path ?? "",
    createdAt: record.created_at,
    tags: record.tags ?? [],
    name: normalizeWardrobeItemName(record.name),
  };
}

export function useWardrobe() {
  const [items, setItems] = useState<WardrobeItem[]>(() => readLocalWardrobe());
  const [isLoading, setIsLoading] = useState(true);
  const [isCloudSyncEnabled, setIsCloudSyncEnabled] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let authUnsubscribe: (() => void) | null = null;

    const initialize = async () => {
      if (mounted) {
        setIsLoading(true);
      }

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
            "Supabase is configured but no auth session is available. Wardrobe is being saved locally only.",
          );
          setIsLoading(false);
          return;
        }

        const remoteItems = await listSupabaseWardrobeItems(resolvedUserId);
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
        setSyncError(`Supabase wardrobe sync failed (${message}). Using local mode.`);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
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
    async (category: string, imageUrl: string, name?: string | null): Promise<AddWardrobeResult> => {
      const normalizedName = normalizeWardrobeItemName(name);
      const existingItem = findExistingWardrobeItem(items, category, imageUrl);
      if (existingItem) {
        return {
          item: existingItem,
          savedToCloud: isCloudSyncEnabled,
          alreadyExists: true,
        };
      }

      if (isSupabaseConfigured) {
        const resolvedUserId = userId ?? (await getOrCreateSupabaseUserId());

        if (resolvedUserId) {
          try {
            const created = await createSupabaseWardrobeItem(resolvedUserId, category, imageUrl, normalizedName);
            const item = fromSupabaseRecord(created);
            setUserId(resolvedUserId);
            setIsCloudSyncEnabled(true);
            setSyncError(null);
            setItems((prev) => [item, ...prev]);
            return { item, savedToCloud: true };
          } catch (error) {
            const message = describeUnknownError(error, "Unknown Supabase error");
            setIsCloudSyncEnabled(false);
            setSyncError(`Supabase wardrobe insert failed (${message}). Saved locally.`);
            const item: WardrobeItem = {
              id: createId(),
              category,
              imageUrl,
              createdAt: new Date().toISOString(),
              tags: [],
              name: normalizedName,
            };

            setItems((prev) => {
              const updated = [item, ...prev];
              writeLocalWardrobe(updated);
              return updated;
            });

            return { item, savedToCloud: false, cloudError: message };
          }
        } else {
          setIsCloudSyncEnabled(false);
          setSyncError(
            "Supabase is configured but no auth session is available. Wardrobe is being saved locally only.",
          );
        }
      }

      const item: WardrobeItem = {
        id: createId(),
        category,
        imageUrl,
        createdAt: new Date().toISOString(),
        tags: [],
        name: normalizedName,
      };

      setItems((prev) => {
        const updated = [item, ...prev];
        writeLocalWardrobe(updated);
        return updated;
      });

      return { item, savedToCloud: false };
    },
    [isCloudSyncEnabled, items, userId]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      if (isCloudSyncEnabled && userId) {
        await deleteSupabaseWardrobeItem(userId, id);
        setItems((prev) => prev.filter((item) => item.id !== id));
        return;
      }

      setItems((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        writeLocalWardrobe(updated);
        return updated;
      });
    },
    [isCloudSyncEnabled, userId]
  );

  const updateItemName = useCallback(
    async (id: string, name: string | null) => {
      const normalizedName = normalizeWardrobeItemName(name);

      if (isCloudSyncEnabled && userId) {
        try {
          const updatedRecord = await updateSupabaseWardrobeItemName(userId, id, normalizedName);
          const updatedItem = fromSupabaseRecord(updatedRecord);
          setItems((prev) => prev.map((item) => (item.id === id ? updatedItem : item)));
          setSyncError(null);
          return updatedItem;
        } catch (error) {
          const message = describeUnknownError(error, "Unknown Supabase error");
          setIsCloudSyncEnabled(false);
          setSyncError(`Supabase wardrobe rename failed (${message}). Saved locally.`);
        }
      }

      const updatedAt = new Date().toISOString();
      let updatedItem: WardrobeItem | null = null;

      setItems((prev) => {
        const updated = prev.map((item) => {
          if (item.id !== id) return item;
          updatedItem = {
            ...item,
            name: normalizedName,
            createdAt: item.createdAt || updatedAt,
          };
          return updatedItem;
        });
        writeLocalWardrobe(updated);
        return updated;
      });

      return updatedItem;
    },
    [isCloudSyncEnabled, userId]
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
