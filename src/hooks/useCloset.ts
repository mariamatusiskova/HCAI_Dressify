import { useState, useEffect, useCallback } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { createId } from "@/lib/id";
import { describeUnknownError } from "@/lib/error";
import { getOrCreateSupabaseUserId } from "@/services/outfitsSupabase";
import {
  createSupabaseClosetItem,
  deleteSupabaseClosetItem,
  listSupabaseClosetItems,
  updateSupabaseClosetItemName,
  type ClosetItemRecord,
} from "@/services/closetSupabase";

export interface ClosetItem {
  id: string;
  category: string;
  imageUrl: string;
  createdAt: string;
  tags: string[];
  name?: string | null;
}

export interface AddClosetResult {
  item: ClosetItem;
  savedToCloud: boolean;
  cloudError?: string;
  alreadyExists?: boolean;
}

const STORAGE_KEY = "dressify-wardrobe-items";

function readLocalCloset(): ClosetItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item) => ({
      ...item,
      name: normalizeClosetItemName(item.name),
      tags: Array.isArray(item.tags) ? item.tags : [],
    }));
  } catch {
    return [];
  }
}

function writeLocalCloset(items: ClosetItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function normalizeClosetItemName(name?: string | null) {
  const trimmed = name?.trim();
  return trimmed ? trimmed : null;
}

function findExistingClosetItem(items: ClosetItem[], category: string, imageUrl: string) {
  return items.find((item) => item.category === category && item.imageUrl === imageUrl) ?? null;
}

function fromSupabaseRecord(record: ClosetItemRecord): ClosetItem {
  return {
    id: record.id,
    category: record.category ?? "unknown",
    imageUrl: record.image_path ?? record.thumb_path ?? "",
    createdAt: record.created_at,
    tags: record.tags ?? [],
    name: normalizeClosetItemName(record.name),
  };
}

export function useCloset() {
  const [items, setItems] = useState<ClosetItem[]>(() => readLocalCloset());
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
            "Supabase is configured but no auth session is available. Closet is being saved locally only.",
          );
          setIsLoading(false);
          return;
        }

        const remoteItems = await listSupabaseClosetItems(resolvedUserId);
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
        setSyncError(`Supabase closet sync failed (${message}). Using local mode.`);
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
    async (category: string, imageUrl: string, name?: string | null): Promise<AddClosetResult> => {
      const normalizedName = normalizeClosetItemName(name);
      const existingItem = findExistingClosetItem(items, category, imageUrl);
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
            const created = await createSupabaseClosetItem(resolvedUserId, category, imageUrl, normalizedName);
            const item = fromSupabaseRecord(created);
            setUserId(resolvedUserId);
            setIsCloudSyncEnabled(true);
            setSyncError(null);
            setItems((prev) => [item, ...prev]);
            return { item, savedToCloud: true };
          } catch (error) {
            const message = describeUnknownError(error, "Unknown Supabase error");
            setIsCloudSyncEnabled(false);
            setSyncError(`Supabase closet insert failed (${message}). Saved locally.`);
            const item: ClosetItem = {
              id: createId(),
              category,
              imageUrl,
              createdAt: new Date().toISOString(),
              tags: [],
              name: normalizedName,
            };

            setItems((prev) => {
              const updated = [item, ...prev];
              writeLocalCloset(updated);
              return updated;
            });

            return { item, savedToCloud: false, cloudError: message };
          }
        } else {
          setIsCloudSyncEnabled(false);
          setSyncError(
            "Supabase is configured but no auth session is available. Closet is being saved locally only.",
          );
        }
      }

      const item: ClosetItem = {
        id: createId(),
        category,
        imageUrl,
        createdAt: new Date().toISOString(),
        tags: [],
        name: normalizedName,
      };

      setItems((prev) => {
        const updated = [item, ...prev];
        writeLocalCloset(updated);
        return updated;
      });

      return { item, savedToCloud: false };
    },
    [isCloudSyncEnabled, items, userId]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      if (isCloudSyncEnabled && userId) {
        await deleteSupabaseClosetItem(userId, id);
        setItems((prev) => prev.filter((item) => item.id !== id));
        return;
      }

      setItems((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        writeLocalCloset(updated);
        return updated;
      });
    },
    [isCloudSyncEnabled, userId]
  );

  const updateItemName = useCallback(
    async (id: string, name: string | null) => {
      const normalizedName = normalizeClosetItemName(name);

      if (isCloudSyncEnabled && userId) {
        try {
          const updatedRecord = await updateSupabaseClosetItemName(userId, id, normalizedName);
          const updatedItem = fromSupabaseRecord(updatedRecord);
          setItems((prev) => prev.map((item) => (item.id === id ? updatedItem : item)));
          setSyncError(null);
          return updatedItem;
        } catch (error) {
          const message = describeUnknownError(error, "Unknown Supabase error");
          setIsCloudSyncEnabled(false);
          setSyncError(`Supabase closet rename failed (${message}). Saved locally.`);
        }
      }

      const updatedAt = new Date().toISOString();
      let updatedItem: ClosetItem | null = null;

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
        writeLocalCloset(updated);
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
