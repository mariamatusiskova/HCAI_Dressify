import { useState, useEffect, useCallback } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { createId } from "@/lib/id";
import { describeUnknownError } from "@/lib/error";
import { getOrCreateSupabaseUserId } from "@/services/outfitsSupabase";
import {
  createSupabaseWardrobeItem,
  deleteSupabaseWardrobeItem,
  listSupabaseWardrobeItems,
  type WardrobeItemRecord,
} from "@/services/wardrobeSupabase";

export interface WardrobeItem {
  id: string;
  category: string;
  imageUrl: string;
  createdAt: string;
  tags: string[];
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
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function writeLocalWardrobe(items: WardrobeItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
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
    async (category: string, imageUrl: string): Promise<AddWardrobeResult> => {
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
            const created = await createSupabaseWardrobeItem(resolvedUserId, category, imageUrl);
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

  return {
    items,
    addItem,
    deleteItem,
    isLoading,
    isCloudSyncEnabled,
    syncError,
    userId,
  };
}
