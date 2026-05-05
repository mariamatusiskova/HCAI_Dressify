import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronRight,
  ArrowLeft,
  FolderPlus,
  ImageIcon,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import {
  useClosetFolders,
  type ClosetFolder,
} from "@/hooks/useClosetFolders";
import type { AddClosetResult, ClosetItem } from "@/hooks/useCloset";
import ItemCategoryBadge from "@/components/ItemCategoryBadge";
import {
  getClothingCategoryLabel,
  normalizeClothingCategory,
} from "@/lib/clothingCategory";
import {
  DEFAULT_CLOSET_FOLDER_COLOR,
  CLOSET_FOLDER_COLORS,
  getClosetFolderColorOption,
  type ClosetFolderColor,
} from "@/lib/closetFolders";
import { CANVAS_PIECE_MIME, type CanvasPiecePayload } from "@/components/CanvasEditor";

type ClosetCategory = "top" | "trousers" | "shoes";
type ClosetFilter = "all" | ClosetCategory;
type ClosetCollectionId = "__all__" | "__unsorted__" | string;
type CollectionBoardTab = "all" | "collections" | "unsorted";
type AddPhotoResult = ClosetItem | AddClosetResult | null | void;

interface ClosetLibraryProps {
  items: ClosetItem[];
  onAddToCanvas: (item: ClosetItem) => void;
  onDelete: (id: string) => void;
  onAddPhoto: (
    imageUrl: string,
    category: string,
    name?: string | null,
  ) => Promise<AddPhotoResult> | AddPhotoResult;
  onUpdateName: (id: string, name: string) => Promise<void> | void;
  isLoading?: boolean;
  variant?: "default" | "compact";
}

interface CollectionCard {
  id: ClosetCollectionId;
  title: string;
  description: string;
  count: number;
  isUserFolder: boolean;
  folder?: ClosetFolder;
}

const compactTabs: Array<{ value: ClosetFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "top", label: "Tops" },
  { value: "trousers", label: "Bottoms" },
  { value: "shoes", label: "Shoes" },
];

const collectionBoardTabs: Array<{ value: CollectionBoardTab; label: string }> =
  [
    { value: "all", label: "All" },
    { value: "collections", label: "Collections" },
    { value: "unsorted", label: "Unsorted" },
  ];

function getClosetItemTitle(category: string) {
  const normalized = normalizeClothingCategory(category);
  if (normalized === "trousers") return "Bottom piece";
  if (normalized === "shoes") return "Shoe pair";
  return "Top piece";
}

function getClosetItemSubtitle(category: string) {
  const normalized = normalizeClothingCategory(category);
  if (normalized === "trousers") return "Bottoms";
  if (normalized === "shoes") return "Shoes";
  return "Tops";
}

function getClosetItemDisplayName(item: ClosetItem) {
  const trimmedName = item.name?.trim();
  return trimmedName || getClosetItemTitle(item.category);
}

function getClosetItemNamePlaceholder(category: string) {
  const normalized = normalizeClothingCategory(category);
  if (normalized === "trousers") return "Dark straight-leg trousers";
  if (normalized === "shoes") return "Black leather loafers";
  return "White Marco Polo t-shirt";
}

function getClosetCollectionSummary(
  collectionId: ClosetCollectionId,
  folderName?: string,
) {
  if (collectionId === "__all__") {
    return {
      title: "All pieces",
      description: "Browse everything you saved for styling.",
    };
  }

  if (collectionId === "__unsorted__") {
    return {
      title: "Unsorted",
      description: "Fresh additions waiting to be filed into a collection.",
    };
  }

  return {
    title: folderName ?? "Collection",
    description: "A focused collection you can build outfits from quickly.",
  };
}

function getAddedClosetItem(result: AddPhotoResult): ClosetItem | null {
  if (!result) return null;
  if ("item" in result) return result.item;
  return result;
}

function getCollectionMetaText(collection: CollectionCard) {
  const itemLabel = collection.count === 1 ? "item" : "items";

  return collection.count > 0
    ? `Your board · ${collection.count} ${itemLabel}`
    : "Your board";
}

interface CollectionAccentPalette {
  edge: string;
  dot: string;
  dotGlow: string;
  cornerGlow: string;
  panelTint: string;
  line: string;
  lineGlow: string;
}

function getCollectionAccentPalette(
  color: ClosetFolderColor | string | null | undefined,
): CollectionAccentPalette {
  switch (color) {
    case "amber":
      return {
        edge: "rgba(205, 150, 82, 0.18)",
        dot: "rgba(220, 172, 103, 0.96)",
        dotGlow: "rgba(220, 172, 103, 0.30)",
        cornerGlow: "rgba(205, 150, 82, 0.16)",
        panelTint: "rgba(138, 96, 52, 0.045)",
        line: "rgba(210, 160, 92, 0.62)",
        lineGlow: "rgba(210, 160, 92, 0.18)",
      };
    case "emerald":
      return {
        edge: "rgba(118, 170, 136, 0.16)",
        dot: "rgba(113, 186, 142, 0.95)",
        dotGlow: "rgba(113, 186, 142, 0.28)",
        cornerGlow: "rgba(72, 150, 106, 0.14)",
        panelTint: "rgba(70, 126, 98, 0.04)",
        line: "rgba(118, 170, 136, 0.56)",
        lineGlow: "rgba(118, 170, 136, 0.18)",
      };
    case "sky":
      return {
        edge: "rgba(104, 156, 208, 0.18)",
        dot: "rgba(108, 183, 234, 0.96)",
        dotGlow: "rgba(108, 183, 234, 0.30)",
        cornerGlow: "rgba(78, 142, 192, 0.14)",
        panelTint: "rgba(66, 98, 146, 0.04)",
        line: "rgba(108, 183, 234, 0.62)",
        lineGlow: "rgba(108, 183, 234, 0.18)",
      };
    case "violet":
      return {
        edge: "rgba(170, 132, 220, 0.18)",
        dot: "rgba(176, 138, 232, 0.96)",
        dotGlow: "rgba(176, 138, 232, 0.30)",
        cornerGlow: "rgba(126, 88, 180, 0.16)",
        panelTint: "rgba(86, 58, 128, 0.045)",
        line: "rgba(176, 138, 232, 0.62)",
        lineGlow: "rgba(176, 138, 232, 0.18)",
      };
    case "rose":
      return {
        edge: "rgba(212, 132, 166, 0.18)",
        dot: "rgba(220, 138, 174, 0.96)",
        dotGlow: "rgba(220, 138, 174, 0.30)",
        cornerGlow: "rgba(172, 82, 122, 0.14)",
        panelTint: "rgba(122, 60, 90, 0.04)",
        line: "rgba(220, 138, 174, 0.60)",
        lineGlow: "rgba(220, 138, 174, 0.18)",
      };
    case "stone":
    default:
      return {
        edge: "rgba(152, 164, 124, 0.14)",
        dot: "rgba(160, 174, 130, 0.92)",
        dotGlow: "rgba(160, 174, 130, 0.24)",
        cornerGlow: "rgba(118, 132, 94, 0.12)",
        panelTint: "rgba(84, 92, 70, 0.035)",
        line: "rgba(160, 174, 130, 0.50)",
        lineGlow: "rgba(160, 174, 130, 0.16)",
      };
  }
}

const ClosetLibrary = ({
  items,
  onAddToCanvas,
  onDelete,
  onAddPhoto,
  onUpdateName,
  isLoading = false,
  variant = "default",
}: ClosetLibraryProps) => {
  const { resolvedTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // The items panel ref + helper let a collection click smooth-scroll the
  // section into view, so the user immediately sees what's inside the board
  // they tapped instead of having to scroll manually.
  const itemsPanelRef = useRef<HTMLDivElement>(null);
  const focusItemsPanel = (collectionId: ClosetCollectionId) => {
    setActiveCollectionId(collectionId);
    // Defer the scroll so the panel has time to update its content first.
    requestAnimationFrame(() => {
      itemsPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<ClosetCategory>("top");
  const [pendingUpload, setPendingUpload] = useState<{
    imageUrl: string;
    category: ClosetCategory;
  } | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [editingItem, setEditingItem] = useState<ClosetItem | null>(null);
  const [editItemName, setEditItemName] = useState("");
  const [isRenamingItem, setIsRenamingItem] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ClosetFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  // Drives the "+ Add items" picker shown when the user is drilled into a
  // collection. Picker lists every wardrobe item not already in the active
  // collection and lets the user assign them with a single tap.
  const [isAddItemsPickerOpen, setIsAddItemsPickerOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState<ClosetFolderColor>(
    DEFAULT_CLOSET_FOLDER_COLOR,
  );
  const [editingFolder, setEditingFolder] = useState<ClosetFolder | null>(
    null,
  );
  const [editFolderName, setEditFolderName] = useState("");
  const [editFolderColor, setEditFolderColor] = useState<ClosetFolderColor>(
    DEFAULT_CLOSET_FOLDER_COLOR,
  );
  const [activeCollectionId, setActiveCollectionId] =
    useState<ClosetCollectionId>("__all__");
  const [activeCollectionBoardTab, setActiveCollectionBoardTab] =
    useState<CollectionBoardTab>(
      variant === "compact" ? "all" : "collections",
    );
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverCollectionId, setDragOverCollectionId] =
    useState<ClosetCollectionId | null>(null);

  const isCompact = variant === "compact";
  const isDarkTheme = resolvedTheme !== "light";
  const normalizedSearch = searchQuery.trim().toLowerCase();

  const {
    folders,
    assignments,
    folderCounts,
    createFolder,
    updateFolder,
    deleteFolder,
    assignItemToFolder,
    getAssignedFolderId,
    isLoading: isFolderSyncLoading,
    syncError: folderSyncError,
  } = useClosetFolders(items);

  const uncategorizedCount = useMemo(
    () => items.filter((item) => !assignments[item.id]).length,
    [assignments, items],
  );

  const collectionCards = useMemo<CollectionCard[]>(() => {
    return folders.map((folder) => ({
      id: folder.id,
      title: folder.name,
      description: "Curated collection",
      count: folderCounts[folder.id] ?? 0,
      isUserFolder: true,
      folder,
    }));
  }, [folderCounts, folders]);

  const collectionPreviewImages = useMemo<Record<string, string[]>>(() => {
    const previews: Record<string, string[]> = {
      __all__: items
        .map((item) => item.imageUrl)
        .filter(Boolean)
        .slice(0, 3),
      __unsorted__: items
        .filter((item) => !assignments[item.id])
        .map((item) => item.imageUrl)
        .filter(Boolean)
        .slice(0, 3),
    };

    for (const folder of folders) {
      previews[folder.id] = items
        .filter((item) => assignments[item.id] === folder.id)
        .map((item) => item.imageUrl)
        .filter(Boolean)
        .slice(0, 3);
    }

    return previews;
  }, [assignments, folders, items]);

  const visibleCollectionCards = useMemo(() => {
    if (activeCollectionBoardTab === "collections") {
      return collectionCards;
    }

    return collectionCards;
  }, [activeCollectionBoardTab, collectionCards]);

  const compactCollectionCards = useMemo<CollectionCard[]>(() => {
    const baseCards: CollectionCard[] = [
      {
        id: "__all__",
        title: "All pieces",
        description: "Everything in your closet",
        count: items.length,
        isUserFolder: false,
      },
    ];

    if (uncategorizedCount > 0) {
      baseCards.push({
        id: "__unsorted__",
        title: "Unsorted",
        description: "Pieces waiting for a home",
        count: uncategorizedCount,
        isUserFolder: false,
      });
    }

    return [...baseCards, ...collectionCards];
  }, [collectionCards, items.length, uncategorizedCount]);

  useEffect(() => {
    setActiveCollectionId((prev) => {
      const isValidSelection =
        prev === "__all__" ||
        prev === "__unsorted__" ||
        folders.some((folder) => folder.id === prev);

      if (isValidSelection) {
        return prev;
      }

      if (uncategorizedCount > 0) {
        return "__unsorted__";
      }

      if (folders.length > 0) {
        return folders[0].id;
      }

      return "__all__";
    });
  }, [folders, uncategorizedCount]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const normalizedCategory = normalizeClothingCategory(item.category);
      const matchesFilter =
        activeFilter === "all" || normalizedCategory === activeFilter;
      if (!matchesFilter) return false;

      const assignedFolderId = assignments[item.id];
      const matchesCollection =
        activeCollectionId === "__all__"
          ? true
          : activeCollectionId === "__unsorted__"
            ? !assignedFolderId
            : assignedFolderId === activeCollectionId;
      if (!matchesCollection) return false;

      if (!normalizedSearch) return true;

      const assignedFolderName =
        folders.find((folder) => folder.id === assignedFolderId)?.name ?? "";
      const haystack = [
        getClosetItemDisplayName(item),
        getClosetItemSubtitle(item.category),
        getClothingCategoryLabel(item.category),
        assignedFolderName,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [
    activeCollectionId,
    activeFilter,
    assignments,
    folders,
    items,
    normalizedSearch,
  ]);

  const activeFolderName = folders.find(
    (folder) => folder.id === activeCollectionId,
  )?.name;
  const activeCollectionSummary = getClosetCollectionSummary(
    activeCollectionId,
    activeFolderName,
  );
  const canResetFilters = activeFilter !== "all" || normalizedSearch.length > 0;

  const resetFilters = () => {
    setActiveFilter("all");
    setSearchQuery("");
  };

  const openEditFolderDialog = (folder: ClosetFolder) => {
    setEditingFolder(folder);
    setEditFolderName(folder.name);
    setEditFolderColor(folder.color);
  };

  const handleUpload = async (file: File) => {
    const imageUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) ?? "");
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    if (!imageUrl) {
      throw new Error("Could not read selected image");
    }

    const category = activeFilter === "all" ? uploadCategory : activeFilter;
    setPendingUpload({ imageUrl, category });
    setNewItemName("");
  };

  const clearPendingUpload = () => {
    setPendingUpload(null);
    setNewItemName("");
  };

  const handleConfirmAddPhoto = async () => {
    if (!pendingUpload) return;

    setIsUploading(true);
    try {
      const addedItem = getAddedClosetItem(
        await onAddPhoto(pendingUpload.imageUrl, pendingUpload.category, newItemName),
      );

      if (
        addedItem &&
        activeCollectionId !== "__all__" &&
        activeCollectionId !== "__unsorted__"
      ) {
        await assignItemToFolder(addedItem.id, activeCollectionId);
      }

      clearPendingUpload();
    } catch (error) {
      console.error("Closet photo upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsUploading(true);
    try {
      await handleUpload(file);
    } catch (error) {
      console.error("Closet photo upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateFolder = async () => {
    const nextFolder = await createFolder(newFolderName, newFolderColor);
    if (!nextFolder) return;

    setActiveCollectionId(nextFolder.id);
    setActiveCollectionBoardTab("collections");
    setNewFolderName("");
    setNewFolderColor(DEFAULT_CLOSET_FOLDER_COLOR);
    setIsCreateFolderOpen(false);
  };

  const handleUpdateFolder = async () => {
    if (!editingFolder || !editFolderName.trim()) return;

    await updateFolder(editingFolder.id, {
      name: editFolderName.trim(),
      color: editFolderColor,
    });

    setEditingFolder(null);
    setEditFolderName("");
    setEditFolderColor(DEFAULT_CLOSET_FOLDER_COLOR);
  };

  const openEditItemNameDialog = (item: ClosetItem) => {
    setEditingItem(item);
    setEditItemName(item.name ?? "");
  };

  const closeEditItemNameDialog = () => {
    setEditingItem(null);
    setEditItemName("");
  };

  const handleUpdateItemName = async () => {
    if (!editingItem) return;

    setIsRenamingItem(true);
    try {
      await onUpdateName(editingItem.id, editItemName);
      closeEditItemNameDialog();
    } finally {
      setIsRenamingItem(false);
    }
  };

  const handleItemDragStart = (
    event: DragEvent<HTMLElement>,
    item: ClosetItem,
  ) => {
    setDraggedItemId(item.id);
    // "move" drives the collection assignment drag; the canvas accepts a
    // separate "copy" drag — we attach both payloads so a single drag handles
    // either drop target. The browser uses dropEffect (set on the target) to
    // pick which one is active.
    event.dataTransfer.effectAllowed = "copyMove";
    event.dataTransfer.setData("text/plain", item.id);

    const payload: CanvasPiecePayload = {
      source: "wardrobe",
      imageUrl: item.imageUrl,
      category: item.category,
    };
    event.dataTransfer.setData(CANVAS_PIECE_MIME, JSON.stringify(payload));
  };

  const handleCollectionDragOver = (
    event: DragEvent<HTMLElement>,
    collectionId: ClosetCollectionId,
  ) => {
    if (collectionId === "__all__") return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverCollectionId(collectionId);
  };

  const handleCollectionDrop = async (
    event: DragEvent<HTMLElement>,
    collectionId: ClosetCollectionId,
  ) => {
    event.preventDefault();
    const itemId = event.dataTransfer.getData("text/plain") || draggedItemId;
    setDragOverCollectionId(null);
    setDraggedItemId(null);

    if (!itemId || collectionId === "__all__") return;

    await assignItemToFolder(
      itemId,
      collectionId === "__unsorted__" ? null : collectionId,
    );
    setActiveCollectionId(collectionId);
    setActiveCollectionBoardTab("collections");
  };

  const pendingUploadCategory = pendingUpload?.category ?? uploadCategory;
  const pendingUploadLabel = getClothingCategoryLabel(pendingUploadCategory);
  const pendingUploadPlaceholder = getClosetItemNamePlaceholder(pendingUploadCategory);
  const editingItemPlaceholder = editingItem
    ? getClosetItemNamePlaceholder(editingItem.category)
    : "White Marco Polo t-shirt";

  const addItemNameDialog = (
    <Dialog
      open={Boolean(pendingUpload)}
      onOpenChange={(open) => {
        if (!open && !isUploading) {
          clearPendingUpload();
        }
      }}
    >
      <DialogContent className="max-w-md border-border bg-card">
        <DialogHeader>
          <DialogTitle>Name this piece</DialogTitle>
          <DialogDescription>
            Add a searchable name now. You can edit it later from the item actions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {pendingUpload?.imageUrl && (
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-background/44 p-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                <img
                  src={pendingUpload.imageUrl}
                  alt="Selected piece preview"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="min-w-0 text-sm text-muted-foreground">
                <div className="font-medium text-foreground">{pendingUploadLabel}</div>
                <div>Example: White Marco Polo t-shirt</div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="closet-item-name" className="text-sm font-medium text-foreground">
              Piece name
            </label>
            <Input
              id="closet-item-name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder={pendingUploadPlaceholder}
              className="h-11"
              autoFocus
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleConfirmAddPhoto();
                }
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={clearPendingUpload}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleConfirmAddPhoto()} disabled={isUploading}>
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Add item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const editItemNameDialog = (
    <Dialog
      open={Boolean(editingItem)}
      onOpenChange={(open) => {
        if (!open && !isRenamingItem) {
          closeEditItemNameDialog();
        }
      }}
    >
      <DialogContent className="max-w-md border-border bg-card">
        <DialogHeader>
          <DialogTitle>Edit piece name</DialogTitle>
          <DialogDescription>
            Rename this piece. Leave it blank to show the default category name.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {editingItem?.imageUrl && (
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-background/44 p-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                <img
                  src={editingItem.imageUrl}
                  alt={getClosetItemDisplayName(editingItem)}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="min-w-0 text-sm text-muted-foreground">
                <div className="font-medium text-foreground">
                  {getClothingCategoryLabel(editingItem.category)}
                </div>
                <div>{getClosetItemDisplayName(editingItem)}</div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="closet-item-edit-name" className="text-sm font-medium text-foreground">
              Piece name
            </label>
            <Input
              id="closet-item-edit-name"
              value={editItemName}
              onChange={(e) => setEditItemName(e.target.value)}
              placeholder={editingItemPlaceholder}
              className="h-11"
              autoFocus
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleUpdateItemName();
                }
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={closeEditItemNameDialog}
            disabled={isRenamingItem}
          >
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleUpdateItemName()} disabled={isRenamingItem}>
            {isRenamingItem ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save name
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (isLoading || isFolderSyncLoading) {
    return (
      <div className="py-4 text-center text-xs text-muted-foreground">
        Loading closet...
      </div>
    );
  }

  if (!isCompact) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          {folderSyncError && (
            <p className="text-xs text-destructive/90">{folderSyncError}</p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {collectionBoardTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setActiveCollectionBoardTab(tab.value);

                  // Always sync activeCollectionId to the chosen tab so the
                  // items panel doesn't keep filtering by a leftover state
                  // from the previously-active tab. (Switching from Unsorted
                  // → Collections used to leave id="__unsorted__" stuck and
                  // the user kept seeing Unsorted under the Collections tab.)
                  if (tab.value === "all") {
                    setActiveCollectionId("__all__");
                  } else if (tab.value === "unsorted") {
                    setActiveCollectionId("__unsorted__");
                  } else {
                    // tab.value === "collections" — reset to the folder
                    // browser default so the cards strip is shown.
                    setActiveCollectionId("__all__");
                  }
                }}
                className={cn(
                  "h-11 rounded-xl border px-5 text-sm font-medium transition-colors",
                  activeCollectionBoardTab === tab.value
                    ? "border-white/20 bg-white/[0.18] text-foreground shadow-sm"
                    : "border-white/10 bg-background/56 text-foreground hover:border-white/20 hover:bg-background/70",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Button
            type="button"
            className="h-11 gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_hsl(var(--primary)/0.25)] transition-colors hover:bg-primary/90"
            onClick={() => setIsCreateFolderOpen(true)}
          >
            <FolderPlus className="h-4 w-4" />
            Create collection
          </Button>
        </div>

        {/* Helper banner that explains the path for adding items to
            collections. Only shown on the Collections tab top-level (when
            no specific folder is drilled into) — the moment the user is
            most likely to wonder "ok, how do I put things in here?" */}
        {activeCollectionBoardTab === "collections" &&
          (activeCollectionId === "__all__" ||
            activeCollectionId === "__unsorted__") && (
            <div className="rounded-2xl border border-primary/25 bg-primary/8 p-4 text-sm text-foreground">
              <p className="font-medium">How to fill a collection</p>
              <p className="mt-1 text-muted-foreground">
                Open any item from the <span className="font-medium text-foreground">All</span> or
                {" "}<span className="font-medium text-foreground">Unsorted</span> tab,
                tap its <span className="font-medium text-foreground">⋯</span> menu, and pick
                <span className="font-medium text-foreground"> Move to collection</span>.
                You can also drag a piece from those tabs straight onto a collection card here.
              </p>
            </div>
          )}

        {/* Drill-down model: only show the collection cards strip when no
            specific collection is selected. Once the user clicks INTO a
            collection, the strip hides so the items panel below becomes
            the only thing on screen — and the breadcrumb in the panel
            header is the way back out. This kills the "two separated
            surfaces" confusion testers had with the previous flat layout. */}
        {activeCollectionBoardTab === "collections" &&
          (activeCollectionId === "__all__" ||
            activeCollectionId === "__unsorted__") && (
          // Auto-fill keeps cards adjacent: the grid only opens a new column
          // when one will actually fit, so leftover horizontal space stops
          // ballooning into the gutter between cards.
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(100%, 220px), 268px))",
            }}
          >
            {visibleCollectionCards.length === 0 && (
              <div className="rounded-[24px] border border-dashed border-white/15 bg-background/30 p-6 text-sm text-muted-foreground">
                No custom collections yet. Create a board to organize saved
                pieces.
              </div>
            )}
            {visibleCollectionCards.map((collection) => {
              const isActive = activeCollectionId === collection.id;
              const isDropTarget =
                dragOverCollectionId === collection.id &&
                collection.id !== "__all__";
              const accentPalette = getCollectionAccentPalette(
                collection.folder?.color,
              );
              const isUserFolder = collection.isUserFolder && collection.folder;
              const previewImages =
                collectionPreviewImages[collection.id] ?? [];
              const heroImage =
                collection.folder?.coverImageUrl ?? previewImages[0];
              const sideImages = previewImages.slice(heroImage ? 1 : 0, 3);

              return (
                <div key={collection.id} className="w-full space-y-2.5">
                  <div
                    onDragOver={(event) =>
                      handleCollectionDragOver(event, collection.id)
                    }
                    onDragLeave={() =>
                      setDragOverCollectionId((prev) =>
                        prev === collection.id ? null : prev,
                      )
                    }
                    onDrop={(event) =>
                      void handleCollectionDrop(event, collection.id)
                    }
                    className={cn(
                      "group relative overflow-hidden rounded-[22px] border p-2.5 transition-all duration-200",
                      isDarkTheme
                        ? "border-white/10 bg-[linear-gradient(180deg,rgba(12,12,14,0.96),rgba(7,7,9,0.985))]"
                        : "border-border/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.985),rgba(246,241,233,0.98))]",
                      "hover:border-white/16",
                      isActive && "border-white/18",
                      isDropTarget && "scale-[1.01] border-white/22",
                    )}
                    style={{
                      boxShadow: isDarkTheme
                        ? "0 18px 42px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.045)"
                        : "0 14px 28px rgba(89,73,48,0.07), inset 0 1px 0 rgba(255,255,255,0.86)",
                      backgroundColor: isDarkTheme
                        ? "rgba(10,10,12,0.97)"
                        : "rgba(249,245,239,0.98)",
                    }}
                  >
                    {isUserFolder && (
                      <>
                        <div
                          className="pointer-events-none absolute left-0 top-0 h-48 w-48 rounded-tl-[32px]"
                          style={{
                            background: `radial-gradient(circle at 0 0, ${isDarkTheme ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.62)"} 0%, ${accentPalette.cornerGlow} 14%, ${accentPalette.edge} 26%, ${isDarkTheme ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.10)"} 40%, transparent 68%)`,
                            filter: "blur(16px)",
                            opacity: 0.78,
                            mixBlendMode: "screen",
                          }}
                        />
                        <div
                          className="pointer-events-none absolute left-0 top-0 h-16 w-[156px]"
                          style={{
                            background: `linear-gradient(90deg, ${isDarkTheme ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.38)"} 0%, ${accentPalette.edge} 18%, ${accentPalette.cornerGlow} 40%, transparent 100%)`,
                            filter: "blur(14px)",
                            opacity: 0.42,
                            mixBlendMode: "screen",
                          }}
                        />
                        <div
                          className="pointer-events-none absolute left-0 top-0 h-[156px] w-16"
                          style={{
                            background: `linear-gradient(180deg, ${isDarkTheme ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.38)"} 0%, ${accentPalette.edge} 18%, ${accentPalette.cornerGlow} 40%, transparent 100%)`,
                            filter: "blur(14px)",
                            opacity: 0.42,
                            mixBlendMode: "screen",
                          }}
                        />
                        <div
                          className="pointer-events-none absolute left-5 top-[1px] h-px w-[112px] rounded-full"
                          style={{
                            background: `linear-gradient(90deg, rgba(255,255,255,0) 0%, ${isDarkTheme ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.46)"} 12%, ${accentPalette.line} 36%, ${accentPalette.edge} 62%, transparent 100%)`,
                            boxShadow: `0 0 10px ${accentPalette.lineGlow}`,
                            opacity: 0.88,
                          }}
                        />
                        <div
                          className="pointer-events-none absolute left-[1px] top-5 h-[112px] w-px rounded-full"
                          style={{
                            background: `linear-gradient(180deg, rgba(255,255,255,0) 0%, ${isDarkTheme ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.46)"} 12%, ${accentPalette.line} 36%, ${accentPalette.edge} 62%, transparent 100%)`,
                            boxShadow: `0 0 10px ${accentPalette.lineGlow}`,
                            opacity: 0.88,
                          }}
                        />
                        <div
                          className="pointer-events-none absolute inset-2.5 rounded-[19px]"
                          style={{
                            boxShadow: isDarkTheme
                              ? "inset 0 1px 0 rgba(255,255,255,0.025)"
                              : "inset 0 1px 0 rgba(255,255,255,0.72)",
                            border: isDarkTheme
                              ? "1px solid rgba(255,255,255,0.055)"
                              : "1px solid rgba(103, 86, 65, 0.12)",
                          }}
                        />
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => focusItemsPanel(collection.id)}
                      className="relative z-10 block w-full text-left"
                    >
                      <div className="grid aspect-[0.84/1] grid-cols-[minmax(0,1.85fr)_minmax(0,0.88fr)] gap-2.5">
                        <div
                          className={cn(
                            "relative overflow-hidden rounded-[18px] border",
                            isDarkTheme ? "border-white/6" : "border-border/75",
                          )}
                          style={{
                            backgroundColor: isDarkTheme
                              ? "rgba(5,5,7,0.96)"
                              : "rgba(250,247,242,0.98)",
                            backgroundImage: (
                              isDarkTheme
                                ? [
                                    `radial-gradient(circle at 14% 18%, ${accentPalette.panelTint}, transparent 34%)`,
                                    "linear-gradient(180deg, rgba(6,6,8,0.90), rgba(4,4,5,0.96))",
                                  ]
                                : [
                                    "radial-gradient(circle at 14% 18%, rgba(255,255,255,0.68), transparent 42%)",
                                    "linear-gradient(180deg, rgba(250,247,242,0.99), rgba(241,236,228,0.97))",
                                  ]
                            ).join(", "),
                            boxShadow: isDarkTheme
                              ? "inset 0 1px 0 rgba(255,255,255,0.03), inset 0 0 0 1px rgba(255,255,255,0.02)"
                              : "inset 0 1px 0 rgba(255,255,255,0.7), inset 0 0 0 1px rgba(120,103,78,0.06)",
                          }}
                        >
                          {heroImage ? (
                            <img
                              src={heroImage}
                              alt={collection.title}
                              className="h-full w-full object-contain p-3"
                            />
                          ) : (
                            // Empty slot: a soft accent glow using the
                            // collection's own colour so the tile reads as
                            // "intentionally decorative" rather than
                            // "missing image".
                            <div
                              className="h-full w-full"
                              style={{
                                background: `radial-gradient(circle at 50% 55%, ${accentPalette.cornerGlow} 0%, transparent 62%)`,
                              }}
                              aria-hidden="true"
                            />
                          )}
                        </div>

                        <div className="grid grid-rows-2 gap-3">
                          {[0, 1].map((index) => {
                            const imageUrl = sideImages[index];

                            return (
                              <div
                                key={index}
                                className={cn(
                                  "relative overflow-hidden rounded-[15px] border",
                                  isDarkTheme ? "border-white/6" : "border-border/75",
                                )}
                                style={{
                                  backgroundColor: isDarkTheme
                                    ? "rgba(5,5,7,0.96)"
                                    : "rgba(250,247,242,0.98)",
                                  backgroundImage: (
                                    isDarkTheme
                                      ? [
                                          `radial-gradient(circle at 14% 18%, ${accentPalette.panelTint}, transparent 34%)`,
                                          "linear-gradient(180deg, rgba(6,6,8,0.90), rgba(4,4,5,0.96))",
                                        ]
                                      : [
                                          "radial-gradient(circle at 14% 18%, rgba(255,255,255,0.68), transparent 42%)",
                                          "linear-gradient(180deg, rgba(250,247,242,0.99), rgba(241,236,228,0.97))",
                                        ]
                                  ).join(", "),
                                  boxShadow: isDarkTheme
                                    ? "inset 0 1px 0 rgba(255,255,255,0.03), inset 0 0 0 1px rgba(255,255,255,0.02)"
                                    : "inset 0 1px 0 rgba(255,255,255,0.7), inset 0 0 0 1px rgba(120,103,78,0.06)",
                                }}
                              >
                                {imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt=""
                                    className="h-full w-full object-contain p-2.25"
                                  />
                                ) : (
                                  // Same accent-coloured glow as the hero
                                  // tile so all the empty preview tiles in
                                  // a collection feel like one cohesive
                                  // decorative surface.
                                  <div
                                    className="h-full w-full"
                                    style={{
                                      background: `radial-gradient(circle at 50% 55%, ${accentPalette.cornerGlow} 0%, transparent 72%)`,
                                    }}
                                    aria-hidden="true"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </button>

                    {isUserFolder && (
                      <div className="absolute bottom-4 right-4 z-20">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              className={cn(
                                "h-8 w-8 rounded-full border shadow-[0_10px_20px_rgba(0,0,0,0.16)] transition-colors",
                                isDarkTheme
                                  ? "border-white/10 bg-[rgba(10,10,12,0.84)] hover:bg-[rgba(18,18,22,0.92)]"
                                  : "border-border/75 bg-white/88 hover:bg-white",
                              )}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              <span className="sr-only">
                                Open collection actions
                              </span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                              {collection.title}
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => openEditFolderDialog(collection.folder!)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit collection
                            </DropdownMenuItem>
                            {collection.folder.coverImageUrl && (
                              <DropdownMenuItem
                                onClick={() =>
                                  void updateFolder(collection.folder!.id, {
                                    coverImageUrl: null,
                                  })
                                }
                              >
                                <ImageIcon className="mr-2 h-4 w-4" />
                                Remove custom cover
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                if (activeCollectionId === collection.id) {
                                  setActiveCollectionId("__all__");
                                }
                                void deleteFolder(collection.id);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete collection
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => focusItemsPanel(collection.id)}
                    className="block px-1 text-left"
                  >
                      <div className="flex items-center gap-2.5 text-[14px] font-medium text-foreground md:text-[15px]">
                      {isUserFolder && (
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: accentPalette.dot,
                            boxShadow: `0 0 16px ${accentPalette.dotGlow}`,
                          }}
                        />
                      )}
                      <span className="truncate">{collection.title}</span>
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground/90">
                      {getCollectionMetaText(collection)}
                    </p>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* On the Collections tab without a specific collection selected
            we hide the items panel entirely. The view is now a pure
            "pick a collection" surface — no second list of items below.
            Once the user clicks a card, drill-down kicks in: the cards
            hide, the items panel appears with the breadcrumb back-out. */}
        {!(activeCollectionBoardTab === "collections" && activeCollectionId === "__all__") && (
        <div ref={itemsPanelRef} className="glass-panel rounded-[28px] border p-5 scroll-mt-4">
          <div className="flex flex-col gap-5">
            {/* Breadcrumb. Only renders when the user has drilled into a
                specific collection. Clicking it returns to the collections
                grid above. This is the "way out" once we hide the cards
                strip in collection view. */}
            {activeCollectionId !== "__all__" &&
              activeCollectionId !== "__unsorted__" && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveCollectionId("__all__");
                    setActiveCollectionBoardTab("collections");
                  }}
                  className="inline-flex items-center gap-1.5 self-start rounded-full border border-foreground/10 bg-background/56 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:border-foreground/25 hover:bg-background/75 hover:text-foreground"
                >
                  <ArrowLeft className="h-3 w-3" />
                  All collections
                </button>
              )}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-1">
                <h3 className="flex items-center gap-2 text-2xl font-display font-medium text-foreground">
                  {/* Color dot + name when inside a specific collection so the
                      header itself reads "you're inside <Vacation>". */}
                  {activeCollectionId !== "__all__" &&
                    activeCollectionId !== "__unsorted__" &&
                    (() => {
                      const folder = folders.find((f) => f.id === activeCollectionId);
                      if (!folder) return null;
                      const palette = getCollectionAccentPalette(folder.color);
                      return (
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor: palette.dot,
                            boxShadow: `0 0 12px ${palette.dotGlow}`,
                          }}
                          aria-hidden="true"
                        />
                      );
                    })()}
                  {activeCollectionSummary.title}
                </h3>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  {activeCollectionSummary.description}
                </p>
                {activeCollectionId !== "__all__" &&
                  activeCollectionId !== "__unsorted__" && (
                    <p className="text-xs uppercase tracking-[0.16em] text-primary/80">
                      New photos added here will go straight into this
                      collection. Drag pieces onto collection cards to move
                      them.
                    </p>
                  )}
                {/* Always-on hint so the drag affordances are discoverable */}
                {/* even on the "All pieces" / "Unsorted" views, where the */}
                {/* collection-specific message above does not show. */}
                {(activeCollectionId === "__all__" ||
                  activeCollectionId === "__unsorted__") &&
                  folders.length > 0 && (
                    <p className="text-xs uppercase tracking-[0.16em] text-primary/80">
                      You can also drag and drop the item into collection.
                    </p>
                  )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* "+ Add items" — primary action when drilled into a
                    collection. Opens a picker dialog listing every item
                    that isn't already in this collection. The user taps
                    items to add many at once, which is the missing
                    "from-the-collection's-side" flow. */}
                {activeCollectionId !== "__all__" &&
                  activeCollectionId !== "__unsorted__" && (
                    <Button
                      type="button"
                      onClick={() => setIsAddItemsPickerOpen(true)}
                      className="h-11 gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_hsl(var(--primary)/0.25)] transition-colors hover:bg-primary/90"
                    >
                      <Plus className="h-4 w-4" />
                      Add items
                    </Button>
                  )}

                <select
                  value={uploadCategory}
                  onChange={(e) =>
                    setUploadCategory(e.target.value as ClosetCategory)
                  }
                  className="h-11 rounded-xl border border-white/10 bg-background/56 px-3 text-sm text-foreground"
                  disabled={isUploading}
                  aria-label="Closet photo category"
                >
                  <option value="top">Top</option>
                  <option value="trousers">Trousers</option>
                  <option value="shoes">Shoes</option>
                </select>

                <Button
                  variant="secondary"
                  className="h-11 gap-2 rounded-xl border border-white/10 bg-background/56 px-4"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  title="Upload a new photo from your device"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Upload photo
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${activeCollectionSummary.title.toLowerCase()}...`}
                    className="h-11 rounded-xl border-white/10 bg-background/56 pl-10"
                  />
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 gap-2 rounded-xl border border-white/10 bg-background/56 px-4"
                  onClick={resetFilters}
                  disabled={!canResetFilters}
                  title="Clear search and category filters"
                >
                  <RotateCcw className="h-4 w-4" />
                  Clear filters
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {compactTabs.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => {
                      setActiveFilter(tab.value);
                      if (tab.value !== "all") {
                        setUploadCategory(tab.value);
                      }
                    }}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-colors",
                      activeFilter === tab.value
                        ? "border-primary/60 bg-primary/12 text-primary"
                        : "border-transparent bg-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <div className="glass-panel-soft rounded-[22px] border px-4 py-10 text-center">
                <p className="text-sm text-foreground">
                  {items.length === 0
                    ? "No pieces yet"
                    : activeCollectionId === "__all__"
                      ? "No pieces match this filter"
                      : `No pieces in ${activeCollectionSummary.title.toLowerCase()} yet`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {items.length === 0
                    ? "Start by adding a few photos of the pieces you actually own."
                    : "Try another collection, another category, or add a new photo."}
                </p>
              </div>
            ) : (
              <div
                className="grid justify-start gap-3"
                style={{
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(min(100%, 180px), 220px))",
                }}
              >
                {filteredItems.map((item) => {
                  const isSelected = selectedItemId === item.id;
                  const assignedFolderId = getAssignedFolderId(item.id);
                  const assignedFolder =
                    folders.find((folder) => folder.id === assignedFolderId) ??
                    null;
                  const assignedFolderName = assignedFolder?.name ?? null;

                  return (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(event) =>
                        handleItemDragStart(event, item)
                      }
                      onDragEnd={() => {
                        setDraggedItemId(null);
                        setDragOverCollectionId(null);
                      }}
                      className={cn(
                        "group relative overflow-hidden rounded-[18px] border bg-background/52 p-2 transition-all duration-200",
                        isSelected
                          ? "border-primary/70 shadow-[0_0_0_1px_hsl(var(--primary)/0.18)]"
                          : "border-white/8 hover:border-primary/30 hover:bg-background/64",
                        draggedItemId === item.id &&
                          "opacity-60 ring-1 ring-primary/40",
                      )}
                    >
                      {/* Card click no longer adds to the board — the */}
                      {/* dropdown menu's "Add to board" item handles that */}
                      {/* explicitly. Tapping the card just selects it for */}
                      {/* visual feedback so the user knows which piece is */}
                      {/* highlighted; drag-to-board still works. */}
                      <button
                        type="button"
                        onClick={() => setSelectedItemId(item.id)}
                        className="w-full text-left"
                      >
                        <div className="relative aspect-[4/5] overflow-hidden rounded-[16px] border border-white/8 bg-white/[0.03]">
                          <img
                            src={item.imageUrl}
                            alt={getClosetItemDisplayName(item)}
                            className="h-full w-full object-contain"
                          />
                          <ItemCategoryBadge source="wardrobe" />
                        </div>

                        <div className="space-y-2 px-1 pb-1 pt-2.5">
                          <div className="space-y-1">
                            <div className="truncate text-sm font-medium text-foreground">
                              {getClosetItemDisplayName(item)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {getClothingCategoryLabel(item.category)}
                            </div>
                          </div>

                          {/* Collection meta line: drop the "Collection:" prefix */}
                          {/* (the dot palette already signals which board the */}
                          {/* item belongs to) and keep the click hint short so */}
                          {/* the folder name has the room it needs. */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-1.5 truncate text-[11px] uppercase tracking-[0.12em] text-muted-foreground/80">
                              {assignedFolderName ? (
                                <>
                                  <span
                                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                                    style={{
                                      backgroundColor: getCollectionAccentPalette(
                                        assignedFolder?.color,
                                      ).dot,
                                    }}
                                  />
                                  <span className="truncate">{assignedFolderName}</span>
                                </>
                              ) : (
                                <span className="truncate">Unsorted</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* Delete in TOP-RIGHT, ⋯ menu in BOTTOM-RIGHT.
                          Both fade in on hover for a cleaner card while
                          the user is just browsing; on touch screens
                          (which can't hover) they stay visible so they
                          can still be reached. */}
                      <div className="absolute right-3 bottom-3 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              className="h-9 w-9 rounded-full border border-foreground/15 bg-background/95 shadow-md transition-colors hover:bg-background"
                              title="More actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">
                                Open item actions
                              </span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="truncate">
                              {getClosetItemDisplayName(item)}
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedItemId(item.id);
                                onAddToCanvas(item);
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add to board
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditItemNameDialog(item)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit name
                            </DropdownMenuItem>
                            {assignedFolder && (
                              <DropdownMenuItem
                                onClick={() =>
                                  void updateFolder(assignedFolder.id, {
                                    coverImageUrl: item.imageUrl,
                                  })
                                }
                              >
                                <ImageIcon className="mr-2 h-4 w-4" />
                                Use as collection cover
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                Move to collection
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                <DropdownMenuRadioGroup
                                  value={assignedFolderId ?? "__unsorted__"}
                                  onValueChange={(nextValue) =>
                                    void assignItemToFolder(
                                      item.id,
                                      nextValue === "__unsorted__"
                                        ? null
                                        : nextValue,
                                    )
                                  }
                                >
                                  <DropdownMenuRadioItem value="__unsorted__">
                                    Unsorted
                                  </DropdownMenuRadioItem>
                                  {folders.map((folder) => (
                                    <DropdownMenuRadioItem
                                      key={folder.id}
                                      value={folder.id}
                                    >
                                      {folder.name}
                                    </DropdownMenuRadioItem>
                                  ))}
                                </DropdownMenuRadioGroup>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Dedicated Delete button in the TOP-RIGHT corner.
                          Same hover-fade behaviour as the ⋯ menu. */}
                      <div className="absolute right-3 top-3 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="h-9 w-9 rounded-full border border-destructive/65 bg-destructive/45 text-destructive-foreground shadow-md backdrop-blur transition-colors hover:bg-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item.id);
                          }}
                          title="Delete item"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete item</span>
                        </Button>
                      </div>

                      {isSelected && (
                        // Moved to bottom-left so it doesn't collide with
                        // the ⋯ menu now living in the bottom-right.
                        <div className="absolute bottom-3 left-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        )}

        {/* "+ Add items" picker. Surfaced only when drilled into a
            specific collection (the dialog gets opened from the matching
            button in the items panel header). Lists every wardrobe item
            that isn't already in this collection; one tap assigns the
            item, no Save step. The dialog stays open so the user can
            add several pieces in a row before clicking Done. */}
        {activeCollectionId !== "__all__" &&
          activeCollectionId !== "__unsorted__" && (() => {
            const activeFolder = folders.find((f) => f.id === activeCollectionId);
            const activeFolderId = activeFolder?.id;
            // Show items not already filed in this folder. Items from
            // OTHER folders are still candidates — assigning here will
            // move them, matching the per-item "Move to collection" UX.
            const candidates = activeFolderId
              ? items.filter((it) => assignments[it.id] !== activeFolderId)
              : [];
            const folderName = activeFolder?.name ?? "this collection";
            return (
              <Dialog open={isAddItemsPickerOpen} onOpenChange={setIsAddItemsPickerOpen}>
                <DialogContent className="max-w-2xl border-border bg-card">
                  <DialogHeader>
                    <DialogTitle>Add items to “{folderName}”</DialogTitle>
                    <DialogDescription>
                      Tap any item to add it. Items already in another
                      collection will be moved here.
                    </DialogDescription>
                  </DialogHeader>
                  {candidates.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-foreground/15 bg-background/40 p-6 text-center text-sm text-muted-foreground">
                      Every item is already in this collection.
                    </div>
                  ) : (
                    <div
                      className="grid max-h-[60vh] gap-3 overflow-y-auto pr-1"
                      style={{
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(min(100%, 120px), 1fr))",
                      }}
                    >
                      {candidates.map((item) => {
                        const currentFolderId = assignments[item.id];
                        const currentFolder = currentFolderId
                          ? folders.find((f) => f.id === currentFolderId)
                          : null;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={async () => {
                              if (!activeFolderId) return;
                              await assignItemToFolder(item.id, activeFolderId);
                              toast.success(`Added to “${folderName}”`);
                            }}
                            className="group flex flex-col items-stretch gap-1 rounded-xl border border-foreground/10 bg-background/40 p-2 text-left transition-colors hover:border-primary/50 hover:bg-primary/8"
                          >
                            <div className="aspect-square overflow-hidden rounded-lg border border-foreground/10 bg-background/60">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={getClosetItemDisplayName(item)}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground/40">
                                  <ImageIcon className="h-6 w-6" />
                                </div>
                              )}
                            </div>
                            <div className="truncate text-[12px] font-medium text-foreground">
                              {getClosetItemDisplayName(item)}
                            </div>
                            {currentFolder ? (
                              <div className="truncate text-[10px] uppercase tracking-[0.14em] text-muted-foreground/80">
                                In: {currentFolder.name}
                              </div>
                            ) : (
                              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60">
                                Unsorted
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setIsAddItemsPickerOpen(false)}
                      className="rounded-xl"
                    >
                      Done
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            );
          })()}

        <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
          <DialogContent className="max-w-md border-border bg-card">
            <DialogHeader>
              <DialogTitle>Create collection</DialogTitle>
              <DialogDescription>
                Group pieces into saved boards. Pick a color now, then set a
                cover from any item inside the collection.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="closet-folder-name"
                  className="text-sm font-medium text-foreground"
                >
                  Collection name
                </label>
                <Input
                  id="closet-folder-name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Weekend outfits"
                  className="h-11"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleCreateFolder();
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">
                  Collection color
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {CLOSET_FOLDER_COLORS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setNewFolderColor(option.value)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors",
                        newFolderColor === option.value
                          ? "border-primary/55 bg-primary/10 text-foreground"
                          : "border-white/10 bg-background/40 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full",
                          option.chipClassName,
                        )}
                      />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsCreateFolderOpen(false);
                  setNewFolderName("");
                  setNewFolderColor(DEFAULT_CLOSET_FOLDER_COLOR);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void handleCreateFolder()}
                disabled={!newFolderName.trim()}
              >
                Create Collection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={Boolean(editingFolder)}
          onOpenChange={(open) => {
            if (!open) {
              setEditingFolder(null);
              setEditFolderName("");
              setEditFolderColor(DEFAULT_CLOSET_FOLDER_COLOR);
            }
          }}
        >
          <DialogContent className="max-w-md border-border bg-card">
            <DialogHeader>
              <DialogTitle>Edit collection</DialogTitle>
              <DialogDescription>
                Rename your collection or change its accent color.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="closet-folder-edit-name"
                  className="text-sm font-medium text-foreground"
                >
                  Collection name
                </label>
                <Input
                  id="closet-folder-edit-name"
                  value={editFolderName}
                  onChange={(e) => setEditFolderName(e.target.value)}
                  placeholder="Weekend outfits"
                  className="h-11"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleUpdateFolder();
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">
                  Collection color
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {CLOSET_FOLDER_COLORS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setEditFolderColor(option.value)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors",
                        editFolderColor === option.value
                          ? "border-primary/55 bg-primary/10 text-foreground"
                          : "border-white/10 bg-background/40 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full",
                          option.chipClassName,
                        )}
                      />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditingFolder(null);
                  setEditFolderName("");
                  setEditFolderColor(DEFAULT_CLOSET_FOLDER_COLOR);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void handleUpdateFolder()}
                disabled={!editFolderName.trim()}
              >
                Save changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {addItemNameDialog}
        {editItemNameDialog}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void handleFileChange(e)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
            Collections
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {compactCollectionCards.map((collection) => {
            const previewImages = collectionPreviewImages[collection.id] ?? [];
            const accentPalette = getCollectionAccentPalette(
              collection.folder?.color,
            );
            const isActive = activeCollectionId === collection.id;

            return (
              <button
                key={collection.id}
                type="button"
                onClick={() => focusItemsPanel(collection.id)}
                className={cn(
                  "group relative min-w-[132px] overflow-hidden rounded-[18px] border p-2.5 text-left transition-all duration-200",
                  isDarkTheme
                    ? "border-white/10 bg-background/56 hover:border-white/18"
                    : "border-border/80 bg-white/78 hover:border-border",
                  isActive && "border-primary/55 shadow-[0_0_0_1px_hsl(var(--primary)/0.16)]",
                )}
              >
                {collection.isUserFolder && (
                  <div
                    className="pointer-events-none absolute left-0 top-0 h-20 w-20 rounded-tl-[18px]"
                    style={{
                      background: `radial-gradient(circle at 0 0, ${
                        isDarkTheme ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.4)"
                      } 0%, ${accentPalette.cornerGlow} 22%, transparent 70%)`,
                      filter: "blur(8px)",
                      opacity: 0.7,
                    }}
                  />
                )}

                <div
                  className={cn(
                    "relative mb-2 aspect-[1.15/1] overflow-hidden rounded-[14px] border",
                    isDarkTheme ? "border-white/8" : "border-border/70",
                  )}
                  style={{
                    backgroundImage: (
                      isDarkTheme
                        ? [
                            `radial-gradient(circle at 14% 18%, ${accentPalette.panelTint}, transparent 34%)`,
                            "linear-gradient(180deg, rgba(6,6,8,0.9), rgba(4,4,5,0.96))",
                          ]
                        : [
                            "radial-gradient(circle at 14% 18%, rgba(255,255,255,0.44), transparent 38%)",
                            "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(244,239,231,0.96))",
                          ]
                    ).join(", "),
                  }}
                >
                  {previewImages[0] ? (
                    <img
                      src={previewImages[0]}
                      alt={collection.title}
                      className="h-full w-full object-contain p-3"
                    />
                  ) : (
                    <div
                      className="h-full w-full"
                      style={{
                        background: `radial-gradient(circle at 50% 60%, ${accentPalette.cornerGlow} 0%, transparent 70%)`,
                      }}
                      aria-hidden="true"
                    />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {collection.isUserFolder && (
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: accentPalette.dot,
                        boxShadow: `0 0 10px ${accentPalette.dotGlow}`,
                      }}
                    />
                  )}
                  <span className="truncate text-sm font-medium text-foreground">
                    {collection.title}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground/85">
                  {collection.count} {collection.count === 1 ? "piece" : "pieces"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {compactTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setActiveFilter(tab.value);
              if (tab.value !== "all") {
                setUploadCategory(tab.value);
              }
            }}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              activeFilter === tab.value
                ? "border-primary/60 bg-primary/12 text-primary"
                : "border-transparent bg-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search closet..."
            className="h-11 w-full rounded-xl border border-white/8 bg-background/56 pl-10 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/35"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          className="h-11 gap-2 rounded-xl border border-white/8 bg-background/56 px-3.5"
          onClick={resetFilters}
          disabled={!canResetFilters}
          title="Clear search and category filters"
        >
          <RotateCcw className="h-4 w-4" />
          <span className="text-sm">Clear filters</span>
        </Button>
      </div>

      <button
        type="button"
        className="flex h-12 w-full items-center justify-between rounded-xl border border-white/10 bg-background/56 px-4 text-left text-sm text-foreground transition-colors hover:border-primary/30 hover:bg-background/68"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        <span className="flex items-center gap-2">
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Add item
        </span>
        <Upload className="h-4 w-4 text-muted-foreground" />
      </button>

      <div className="max-h-[440px] overflow-y-auto pr-1">
        {filteredItems.length === 0 ? (
          <div className="glass-panel-soft rounded-[22px] border px-4 py-8 text-center">
            <p className="text-sm text-foreground">
              {items.length === 0
                ? "No items yet"
                : "No items match this filter"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {items.length === 0
                ? "Add a few photos to start building your closet."
                : "Try another category or search."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const isSelected = selectedItemId === item.id;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "group relative overflow-hidden rounded-[18px] border bg-background/56 p-3 text-left transition-all duration-200",
                    isSelected
                      ? "border-primary/70 shadow-[0_0_0_1px_hsl(var(--primary)/0.18)]"
                      : "border-white/8 hover:border-primary/30 hover:bg-background/68",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedItemId(item.id);
                      onAddToCanvas(item);
                    }}
                    className="block w-full text-left"
                  >
                    <div className="relative flex items-center gap-3">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[14px] border border-white/8 bg-white/[0.03]">
                        <img
                          src={item.imageUrl}
                          alt={getClosetItemDisplayName(item)}
                          className="h-full w-full object-contain"
                        />
                        <ItemCategoryBadge source="wardrobe" />
                      </div>
                      <div className="min-w-0 flex-1 pr-16">
                        <div className="truncate text-[15px] font-medium text-foreground">
                          {getClosetItemDisplayName(item)}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {getClosetItemSubtitle(item.category)}
                        </div>
                        <div className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground/80">
                          Tap to add to board
                        </div>
                      </div>
                    </div>
                  </button>

                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-6 w-6 rounded-full border border-white/10 bg-background/78"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditItemNameDialog(item);
                      }}
                      title="Edit item name"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-6 w-6 rounded-full border border-white/10 bg-background/78"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                      }}
                      title="Delete item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {isSelected && (
                    <div className="absolute right-3 bottom-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Button
        asChild
        variant="secondary"
        className="h-11 w-full justify-between rounded-xl border border-white/10 bg-background/56 px-4"
      >
        <Link to="/closet">
          Open closet
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>

      {addItemNameDialog}
      {editItemNameDialog}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void handleFileChange(e)}
      />
    </div>
  );
};

export default ClosetLibrary;
