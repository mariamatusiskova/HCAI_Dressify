import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createId } from "@/lib/id";
import { describeUnknownError } from "@/lib/error";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  DEFAULT_WARDROBE_FOLDER_COLOR,
  type WardrobeFolderColor,
} from "@/lib/wardrobeFolders";
import { getOrCreateSupabaseUserId } from "@/services/outfitsSupabase";
import {
  createSupabaseWardrobeFolder,
  deleteSupabaseWardrobeFolder,
  deleteSupabaseWardrobeFolderAssignment,
  listSupabaseWardrobeFolderAssignments,
  listSupabaseWardrobeFolders,
  updateSupabaseWardrobeFolder,
  upsertSupabaseWardrobeFolderAssignment,
  type WardrobeFolderAssignmentRecord,
  type WardrobeFolderRecord,
} from "@/services/wardrobeFoldersSupabase";

interface ItemWithId {
  id: string;
}

export interface WardrobeFolder {
  id: string;
  name: string;
  color: WardrobeFolderColor;
  coverImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export type WardrobeFolderPatch = Partial<
  Pick<WardrobeFolder, "name" | "color" | "coverImageUrl">
>;

const FOLDERS_STORAGE_KEY = "dressify-wardrobe-folders";
const ASSIGNMENTS_STORAGE_KEY = "dressify-wardrobe-folder-assignments";

function isWardrobeFolderColor(value: unknown): value is WardrobeFolderColor {
  return ["rose", "amber", "emerald", "sky", "violet", "stone"].includes(
    String(value),
  );
}

function normalizeFolder(
  raw:
    | (Partial<WardrobeFolder> & { created_at?: string; updated_at?: string })
    | null,
): WardrobeFolder | null {
  if (!raw?.id || !raw.name) return null;

  const createdAt = raw.createdAt ?? raw.created_at ?? new Date().toISOString();
  const updatedAt = raw.updatedAt ?? raw.updated_at ?? createdAt;

  return {
    id: raw.id,
    name: raw.name,
    color: isWardrobeFolderColor(raw.color)
      ? raw.color
      : DEFAULT_WARDROBE_FOLDER_COLOR,
    coverImageUrl: raw.coverImageUrl ?? null,
    createdAt,
    updatedAt,
  };
}

function readFolders(): WardrobeFolder[] {
  try {
    const stored = localStorage.getItem(FOLDERS_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((folder) => normalizeFolder(folder))
      .filter(Boolean) as WardrobeFolder[];
  } catch {
    return [];
  }
}

function writeFolders(folders: WardrobeFolder[]) {
  localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
}

function readAssignments(): Record<string, string> {
  try {
    const stored = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function writeAssignments(assignments: Record<string, string>) {
  localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments));
}

function sanitizeAssignments(
  assignments: Record<string, string>,
  itemIds: Set<string>,
  folderIds: Set<string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(assignments).filter(
      ([itemId, folderId]) => itemIds.has(itemId) && folderIds.has(folderId),
    ),
  );
}

function fromSupabaseFolder(record: WardrobeFolderRecord): WardrobeFolder {
  return {
    id: record.id,
    name: record.name,
    color: record.color ?? DEFAULT_WARDROBE_FOLDER_COLOR,
    coverImageUrl: record.cover_image_url ?? null,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function fromSupabaseAssignments(
  records: WardrobeFolderAssignmentRecord[],
  itemIds: Set<string>,
  folderIds: Set<string>,
): Record<string, string> {
  return sanitizeAssignments(
    Object.fromEntries(
      records.map((record) => [record.wardrobe_item_id, record.folder_id]),
    ),
    itemIds,
    folderIds,
  );
}

function sortFolders(folders: WardrobeFolder[]) {
  return [...folders].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function useWardrobeFolders<TItem extends ItemWithId>(items: TItem[]) {
  const [folders, setFolders] = useState<WardrobeFolder[]>(() => readFolders());
  const [assignments, setAssignments] = useState<Record<string, string>>(() =>
    readAssignments(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isCloudSyncEnabled, setIsCloudSyncEnabled] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const hasInitializedRef = useRef(false);

  const itemIds = useMemo(() => new Set(items.map((item) => item.id)), [items]);

  useEffect(() => {
    let mounted = true;
    let authUnsubscribe: (() => void) | null = null;

    const initialize = async () => {
      if (mounted && !hasInitializedRef.current) {
        setIsLoading(true);
      }

      const localFolders = readFolders();
      const localAssignments = readAssignments();

      if (!isSupabaseConfigured) {
        if (mounted) {
          const localFolderIds = new Set(
            localFolders.map((folder) => folder.id),
          );
          const nextAssignments = sanitizeAssignments(
            localAssignments,
            itemIds,
            localFolderIds,
          );
          setFolders(localFolders);
          setAssignments(nextAssignments);
          setIsCloudSyncEnabled(false);
          setUserId(null);
          setSyncError(null);
          hasInitializedRef.current = true;
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
          setSyncError("Folder boards are saved locally until you sign in.");
          hasInitializedRef.current = true;
          setIsLoading(false);
          return;
        }

        let remoteFolderRecords =
          await listSupabaseWardrobeFolders(resolvedUserId);
        let remoteAssignmentRecords =
          await listSupabaseWardrobeFolderAssignments(resolvedUserId);

        // First-time cloud migration: when the cloud has no folders yet, lift existing
        // local boards into Supabase and preserve item assignments where item ids match.
        if (remoteFolderRecords.length === 0 && localFolders.length > 0) {
          const localToRemoteFolderId = new Map<string, string>();

          for (const localFolder of localFolders) {
            const created = await createSupabaseWardrobeFolder(resolvedUserId, {
              name: localFolder.name,
              color: localFolder.color,
              coverImageUrl: localFolder.coverImageUrl,
            });
            localToRemoteFolderId.set(localFolder.id, created.id);
          }

          for (const [itemId, localFolderId] of Object.entries(
            localAssignments,
          )) {
            const folderId = localToRemoteFolderId.get(localFolderId);
            if (!folderId || !itemIds.has(itemId)) continue;
            await upsertSupabaseWardrobeFolderAssignment(
              resolvedUserId,
              itemId,
              folderId,
            );
          }

          remoteFolderRecords =
            await listSupabaseWardrobeFolders(resolvedUserId);
          remoteAssignmentRecords =
            await listSupabaseWardrobeFolderAssignments(resolvedUserId);
        }

        const remoteFolders = sortFolders(
          remoteFolderRecords.map(fromSupabaseFolder),
        );
        const remoteFolderIds = new Set(
          remoteFolders.map((folder) => folder.id),
        );
        const remoteAssignments = fromSupabaseAssignments(
          remoteAssignmentRecords,
          itemIds,
          remoteFolderIds,
        );

        writeFolders(remoteFolders);
        writeAssignments(remoteAssignments);

        if (!mounted) return;
        setUserId(resolvedUserId);
        setFolders(remoteFolders);
        setAssignments(remoteAssignments);
        setIsCloudSyncEnabled(true);
        setSyncError(null);
      } catch (error) {
        if (!mounted) return;
        const message = describeUnknownError(error, "Unknown Supabase error");
        const localFolderIds = new Set(localFolders.map((folder) => folder.id));
        const nextAssignments = sanitizeAssignments(
          localAssignments,
          itemIds,
          localFolderIds,
        );
        setFolders(localFolders);
        setAssignments(nextAssignments);
        setIsCloudSyncEnabled(false);
        setUserId(null);
        setSyncError(
          `Folder sync failed (${message}). Folder boards are saved locally on this device.`,
        );
      } finally {
        if (mounted) {
          hasInitializedRef.current = true;
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
  }, [itemIds]);

  useEffect(() => {
    const folderIds = new Set(folders.map((folder) => folder.id));

    setAssignments((prev) => {
      const next = sanitizeAssignments(prev, itemIds, folderIds);
      const hasChanges =
        Object.keys(prev).length !== Object.keys(next).length ||
        Object.entries(prev).some(
          ([itemId, folderId]) => next[itemId] !== folderId,
        );

      if (!hasChanges) {
        return prev;
      }

      writeAssignments(next);
      return next;
    });
  }, [folders, itemIds]);

  const createFolder = useCallback(
    async (
      name: string,
      color: WardrobeFolderColor = DEFAULT_WARDROBE_FOLDER_COLOR,
    ) => {
      const trimmedName = name.trim();
      if (!trimmedName) return null;

      const existingFolder = folders.find(
        (folder) => folder.name.toLowerCase() === trimmedName.toLowerCase(),
      );
      if (existingFolder) {
        return existingFolder;
      }

      const now = new Date().toISOString();
      let nextFolder: WardrobeFolder = {
        id: createId(),
        name: trimmedName,
        color,
        coverImageUrl: null,
        createdAt: now,
        updatedAt: now,
      };

      if (isCloudSyncEnabled && userId) {
        try {
          nextFolder = fromSupabaseFolder(
            await createSupabaseWardrobeFolder(userId, {
              name: trimmedName,
              color,
              coverImageUrl: null,
            }),
          );
          setSyncError(null);
        } catch (error) {
          const message = describeUnknownError(error, "Unknown Supabase error");
          setSyncError(
            `Could not sync new folder (${message}). Saved locally for now.`,
          );
        }
      }

      setFolders((prev) => {
        const next = sortFolders([nextFolder, ...prev]);
        writeFolders(next);
        return next;
      });

      return nextFolder;
    },
    [folders, isCloudSyncEnabled, userId],
  );

  const updateFolder = useCallback(
    async (folderId: string, patch: WardrobeFolderPatch) => {
      const nextPatch: WardrobeFolderPatch = {
        ...patch,
        name: patch.name?.trim() || undefined,
      };
      const updatedAt = new Date().toISOString();

      setFolders((prev) => {
        const next = sortFolders(
          prev.map((folder) =>
            folder.id === folderId
              ? {
                  ...folder,
                  ...nextPatch,
                  updatedAt,
                }
              : folder,
          ),
        );
        writeFolders(next);
        return next;
      });

      if (isCloudSyncEnabled && userId) {
        try {
          await updateSupabaseWardrobeFolder(userId, folderId, {
            ...(nextPatch.name ? { name: nextPatch.name } : {}),
            ...(nextPatch.color ? { color: nextPatch.color } : {}),
            ...("coverImageUrl" in nextPatch
              ? { cover_image_url: nextPatch.coverImageUrl ?? null }
              : {}),
          });
          setSyncError(null);
        } catch (error) {
          const message = describeUnknownError(error, "Unknown Supabase error");
          setSyncError(`Could not sync folder update (${message}).`);
        }
      }
    },
    [isCloudSyncEnabled, userId],
  );

  const deleteFolder = useCallback(
    async (folderId: string) => {
      setFolders((prev) => {
        const next = prev.filter((folder) => folder.id !== folderId);
        writeFolders(next);
        return next;
      });

      setAssignments((prev) => {
        const next = Object.fromEntries(
          Object.entries(prev).filter(
            ([, assignedFolderId]) => assignedFolderId !== folderId,
          ),
        );
        writeAssignments(next);
        return next;
      });

      if (isCloudSyncEnabled && userId) {
        try {
          await deleteSupabaseWardrobeFolder(userId, folderId);
          setSyncError(null);
        } catch (error) {
          const message = describeUnknownError(error, "Unknown Supabase error");
          setSyncError(`Could not sync folder delete (${message}).`);
        }
      }
    },
    [isCloudSyncEnabled, userId],
  );

  const assignItemToFolder = useCallback(
    async (itemId: string, folderId: string | null) => {
      setAssignments((prev) => {
        const next = { ...prev };
        if (!folderId) {
          delete next[itemId];
        } else {
          next[itemId] = folderId;
        }
        writeAssignments(next);
        return next;
      });

      if (isCloudSyncEnabled && userId) {
        try {
          if (folderId) {
            await upsertSupabaseWardrobeFolderAssignment(
              userId,
              itemId,
              folderId,
            );
          } else {
            await deleteSupabaseWardrobeFolderAssignment(userId, itemId);
          }
          setSyncError(null);
        } catch (error) {
          const message = describeUnknownError(error, "Unknown Supabase error");
          setSyncError(`Could not sync folder move (${message}).`);
        }
      }
    },
    [isCloudSyncEnabled, userId],
  );

  const getAssignedFolderId = useCallback(
    (itemId: string) => assignments[itemId] ?? null,
    [assignments],
  );

  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const item of items) {
      const folderId = assignments[item.id];
      if (!folderId) continue;
      counts[folderId] = (counts[folderId] ?? 0) + 1;
    }

    return counts;
  }, [assignments, items]);

  return {
    folders,
    assignments,
    folderCounts,
    createFolder,
    updateFolder,
    deleteFolder,
    assignItemToFolder,
    getAssignedFolderId,
    isLoading,
    isCloudSyncEnabled,
    syncError,
    userId,
  };
}