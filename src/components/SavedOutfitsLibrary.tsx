import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { useNavigate } from "react-router-dom";
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
  ArrowLeft,
  FolderOpen,
  FolderPlus,
  ImageIcon,
  Loader2,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import {
  DEFAULT_WARDROBE_FOLDER_COLOR,
  WARDROBE_FOLDER_COLORS,
  type WardrobeFolderColor,
} from "@/lib/wardrobeFolders";
import { getCollectionAccentPalette } from "@/lib/collectionAccents";
import { useOutfitFolders, type OutfitFolder } from "@/hooks/useOutfitFolders";
import type { Outfit } from "@/hooks/useOutfits";

type OutfitCollectionId = "__all__" | "__unsorted__" | string;
type CollectionBoardTab = "all" | "collections" | "unsorted";

interface SavedOutfitsLibraryProps {
  outfits: Outfit[];
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateName: (id: string, name: string) => Promise<void> | void;
  isLoading?: boolean;
}

const collectionBoardTabs: Array<{ value: CollectionBoardTab; label: string }> = [
  { value: "all", label: "All" },
  { value: "collections", label: "Collections" },
  { value: "unsorted", label: "Unsorted" },
];

function getCollectionSummary(id: OutfitCollectionId, folderName?: string) {
  if (id === "__all__") {
    return {
      title: "All outfits",
      description: "Browse every outfit you saved.",
    };
  }
  if (id === "__unsorted__") {
    return {
      title: "Unsorted",
      description: "Recently saved outfits waiting to be filed into a collection.",
    };
  }
  return {
    title: folderName ?? "Collection",
    description: "A focused board of outfits you can revisit any time.",
  };
}

function getCollectionMetaText(count: number) {
  const itemLabel = count === 1 ? "outfit" : "outfits";
  return count > 0 ? `Your board · ${count} ${itemLabel}` : "Your board";
}

function getOutfitPreviewImages(outfit: Outfit): string[] {
  return outfit.canvasItems
    .map((item) => item.imageUrl)
    .filter((url): url is string => Boolean(url))
    .slice(0, 4);
}

const SavedOutfitsLibrary = ({
  outfits,
  onLoad,
  onDelete,
  onUpdateName,
  isLoading = false,
}: SavedOutfitsLibraryProps) => {
  const { resolvedTheme } = useTheme();
  const isDarkTheme = resolvedTheme !== "light";
  const navigate = useNavigate();
  // Items panel ref for the smooth scroll on collection-card clicks.
  const itemsPanelRef = useRef<HTMLDivElement>(null);

  // Tapping an outfit card now opens its detail page (the user can review
  // every piece + decide whether to load it onto the canvas). The dropdown
  // still exposes "Open on board" for the previous one-click flow.
  const handleOpenDetail = (outfitId: string) => {
    navigate(`/outfits/${outfitId}`);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [editingOutfit, setEditingOutfit] = useState<Outfit | null>(null);
  const [editOutfitName, setEditOutfitName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  // Drives the "+ Add outfits" picker shown when drilled into a collection.
  // Mirrors WardrobeLibrary / SavedItemsLibrary.
  const [isAddItemsPickerOpen, setIsAddItemsPickerOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState<WardrobeFolderColor>(
    DEFAULT_WARDROBE_FOLDER_COLOR,
  );

  const [editingFolder, setEditingFolder] = useState<OutfitFolder | null>(null);
  const [editFolderName, setEditFolderName] = useState("");
  const [editFolderColor, setEditFolderColor] = useState<WardrobeFolderColor>(
    DEFAULT_WARDROBE_FOLDER_COLOR,
  );

  const [activeCollectionId, setActiveCollectionId] =
    useState<OutfitCollectionId>("__all__");
  const [activeCollectionBoardTab, setActiveCollectionBoardTab] =
    useState<CollectionBoardTab>("collections");

  const [draggedOutfitId, setDraggedOutfitId] = useState<string | null>(null);
  const [dragOverCollectionId, setDragOverCollectionId] =
    useState<OutfitCollectionId | null>(null);

  const focusItemsPanel = (collectionId: OutfitCollectionId) => {
    setActiveCollectionId(collectionId);
    requestAnimationFrame(() => {
      itemsPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

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
  } = useOutfitFolders(outfits);

  const uncategorizedCount = useMemo(
    () => outfits.filter((outfit) => !assignments[outfit.id]).length,
    [assignments, outfits],
  );

  const collectionCards = useMemo(() => {
    return folders.map((folder) => ({
      id: folder.id as OutfitCollectionId,
      title: folder.name,
      count: folderCounts[folder.id] ?? 0,
      isUserFolder: true,
      folder,
    }));
  }, [folderCounts, folders]);

  const collectionPreviewImages = useMemo<Record<string, string[]>>(() => {
    const previews: Record<string, string[]> = {
      __all__: outfits
        .flatMap((outfit) => getOutfitPreviewImages(outfit))
        .slice(0, 3),
      __unsorted__: outfits
        .filter((outfit) => !assignments[outfit.id])
        .flatMap((outfit) => getOutfitPreviewImages(outfit))
        .slice(0, 3),
    };

    for (const folder of folders) {
      previews[folder.id] = outfits
        .filter((outfit) => assignments[outfit.id] === folder.id)
        .flatMap((outfit) => getOutfitPreviewImages(outfit))
        .slice(0, 3);
    }
    return previews;
  }, [assignments, folders, outfits]);

  useEffect(() => {
    setActiveCollectionId((prev) => {
      const isValidSelection =
        prev === "__all__" ||
        prev === "__unsorted__" ||
        folders.some((folder) => folder.id === prev);
      if (isValidSelection) return prev;
      if (uncategorizedCount > 0) return "__unsorted__";
      if (folders.length > 0) return folders[0].id;
      return "__all__";
    });
  }, [folders, uncategorizedCount]);

  const filteredOutfits = useMemo(() => {
    return outfits.filter((outfit) => {
      const assignedFolderId = assignments[outfit.id];
      const matchesCollection =
        activeCollectionId === "__all__"
          ? true
          : activeCollectionId === "__unsorted__"
            ? !assignedFolderId
            : assignedFolderId === activeCollectionId;
      if (!matchesCollection) return false;

      if (!normalizedSearch) return true;

      const folderName =
        folders.find((folder) => folder.id === assignedFolderId)?.name ?? "";
      const haystack = [outfit.name, folderName].join(" ").toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [activeCollectionId, assignments, folders, normalizedSearch, outfits]);

  const activeFolderName = folders.find(
    (folder) => folder.id === activeCollectionId,
  )?.name;
  const activeCollectionSummary = getCollectionSummary(
    activeCollectionId,
    activeFolderName,
  );
  const canResetFilters = normalizedSearch.length > 0;

  const resetFilters = () => setSearchQuery("");

  const openEditFolderDialog = (folder: OutfitFolder) => {
    setEditingFolder(folder);
    setEditFolderName(folder.name);
    setEditFolderColor(folder.color);
  };

  const handleCreateFolder = async () => {
    const folder = await createFolder(newFolderName, newFolderColor);
    if (!folder) return;
    setActiveCollectionId(folder.id);
    setActiveCollectionBoardTab("collections");
    setNewFolderName("");
    setNewFolderColor(DEFAULT_WARDROBE_FOLDER_COLOR);
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
    setEditFolderColor(DEFAULT_WARDROBE_FOLDER_COLOR);
  };

  const openEditOutfitNameDialog = (outfit: Outfit) => {
    setEditingOutfit(outfit);
    setEditOutfitName(outfit.name);
  };

  const closeEditOutfitNameDialog = () => {
    setEditingOutfit(null);
    setEditOutfitName("");
  };

  const handleUpdateOutfitName = async () => {
    if (!editingOutfit) return;
    setIsRenaming(true);
    try {
      await onUpdateName(editingOutfit.id, editOutfitName);
      closeEditOutfitNameDialog();
    } finally {
      setIsRenaming(false);
    }
  };

  const handleOutfitDragStart = (event: DragEvent<HTMLElement>, outfitId: string) => {
    setDraggedOutfitId(outfitId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", outfitId);
  };

  const handleCollectionDragOver = (
    event: DragEvent<HTMLElement>,
    collectionId: OutfitCollectionId,
  ) => {
    if (collectionId === "__all__") return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverCollectionId(collectionId);
  };

  const handleCollectionDrop = async (
    event: DragEvent<HTMLElement>,
    collectionId: OutfitCollectionId,
  ) => {
    event.preventDefault();
    const outfitId = event.dataTransfer.getData("text/plain") || draggedOutfitId;
    setDragOverCollectionId(null);
    setDraggedOutfitId(null);
    if (!outfitId || collectionId === "__all__") return;

    await assignItemToFolder(
      outfitId,
      collectionId === "__unsorted__" ? null : collectionId,
    );
    setActiveCollectionId(collectionId);
    setActiveCollectionBoardTab("collections");
  };

  if (isLoading || isFolderSyncLoading) {
    return (
      <div className="py-4 text-center text-xs text-muted-foreground">
        Loading saved outfits...
      </div>
    );
  }

  const editOutfitNameDialog = (
    <Dialog
      open={Boolean(editingOutfit)}
      onOpenChange={(open) => {
        if (!open && !isRenaming) {
          closeEditOutfitNameDialog();
        }
      }}
    >
      <DialogContent className="max-w-md border-border bg-card">
        <DialogHeader>
          <DialogTitle>Edit outfit name</DialogTitle>
          <DialogDescription>
            Rename this saved outfit so it is easier to find later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {editingOutfit && (
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-background/44 p-3">
              <div className="grid h-20 w-20 shrink-0 grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-1">
                {getOutfitPreviewImages(editingOutfit)
                  .slice(0, 4)
                  .map((url, index) => (
                    <img
                      key={`${editingOutfit.id}-preview-${index}`}
                      src={url}
                      alt=""
                      className="h-full w-full rounded-md object-contain"
                    />
                  ))}
              </div>
              <div className="min-w-0 text-sm text-muted-foreground">
                <div className="font-medium text-foreground">{editingOutfit.name}</div>
                <div>
                  {editingOutfit.canvasItems.length}{" "}
                  {editingOutfit.canvasItems.length === 1 ? "item" : "items"}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="outfit-edit-name" className="text-sm font-medium text-foreground">
              Outfit name
            </label>
            <Input
              id="outfit-edit-name"
              value={editOutfitName}
              onChange={(e) => setEditOutfitName(e.target.value)}
              placeholder="Friday brunch fit"
              className="h-11"
              autoFocus
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleUpdateOutfitName();
                }
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={closeEditOutfitNameDialog}
            disabled={isRenaming}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleUpdateOutfitName()}
            disabled={isRenaming || !editOutfitName.trim()}
          >
            {isRenaming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save name
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground/70">
          Collection
        </div>
        <h2 className="text-2xl font-display font-medium text-foreground">
          Saved outfits
        </h2>
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
                // from the previously-active tab. Mirrors WardrobeLibrary.
                if (tab.value === "all") setActiveCollectionId("__all__");
                else if (tab.value === "unsorted") setActiveCollectionId("__unsorted__");
                else setActiveCollectionId("__all__"); // "collections" → folder browser
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

      {/* Helper banner that explains the path for adding outfits to
          collections. Mirrors WardrobeLibrary / SavedItemsLibrary. */}
      {activeCollectionBoardTab === "collections" &&
        (activeCollectionId === "__all__" ||
          activeCollectionId === "__unsorted__") && (
          <div className="rounded-2xl border border-primary/25 bg-primary/8 p-4 text-sm text-foreground">
            <p className="font-medium">How to fill a collection</p>
            <p className="mt-1 text-muted-foreground">
              Open any outfit from the <span className="font-medium text-foreground">All</span> or
              {" "}<span className="font-medium text-foreground">Unsorted</span> tab,
              tap its <span className="font-medium text-foreground">⋯</span> menu, and pick
              <span className="font-medium text-foreground"> Move to collection</span>.
              You can also drag an outfit from those tabs onto a collection card here.
            </p>
          </div>
        )}

      {/* Drill-down model: only show the collection cards strip when no
          specific collection is selected. Once the user clicks INTO a
          collection, the strip hides so the items panel below becomes the
          only thing on screen — and the breadcrumb in the panel header is
          the way back out. Mirrors WardrobeLibrary / SavedItemsLibrary. */}
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
          {collectionCards.length === 0 && (
            <div className="rounded-[24px] border border-dashed border-white/15 bg-background/30 p-6 text-sm text-muted-foreground">
              No collections yet. Create a board to organize saved outfits.
            </div>
          )}
          {collectionCards.map((collection) => {
            const isActive = activeCollectionId === collection.id;
            const isDropTarget =
              dragOverCollectionId === collection.id && collection.id !== "__all__";
            const accentPalette = getCollectionAccentPalette(collection.folder.color);
            const previewImages = collectionPreviewImages[collection.id] ?? [];
            const heroImage = collection.folder.coverImageUrl ?? previewImages[0];
            const sideImages = previewImages.slice(heroImage ? 1 : 0, 3);

            return (
              <div key={collection.id} className="w-full space-y-2.5">
                <div
                  onDragOver={(event) => handleCollectionDragOver(event, collection.id)}
                  onDragLeave={() =>
                    setDragOverCollectionId((prev) => (prev === collection.id ? null : prev))
                  }
                  onDrop={(event) => void handleCollectionDrop(event, collection.id)}
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
                          // Empty slot uses the collection's accent glow
                          // instead of a broken-image icon. Mirrors
                          // WardrobeLibrary / SavedItemsLibrary.
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
                                  className="h-full w-full object-contain p-2"
                                />
                              ) : (
                                <div
                                  className="h-full w-full"
                                  style={{
                                    background: `radial-gradient(circle at 50% 60%, ${accentPalette.cornerGlow} 0%, transparent 72%)`,
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
                          <span className="sr-only">Open collection actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>{collection.title}</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openEditFolderDialog(collection.folder)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit collection
                        </DropdownMenuItem>
                        {collection.folder.coverImageUrl && (
                          <DropdownMenuItem
                            onClick={() =>
                              void updateFolder(collection.folder.id, { coverImageUrl: null })
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
                </div>

                <button
                  type="button"
                  onClick={() => focusItemsPanel(collection.id)}
                  className="block px-1 text-left"
                >
                  <div className="flex items-center gap-2.5 text-[14px] font-medium text-foreground md:text-[15px]">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor: accentPalette.dot,
                        boxShadow: `0 0 16px ${accentPalette.dotGlow}`,
                      }}
                    />
                    <span className="truncate">{collection.title}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground/90">
                    {getCollectionMetaText(collection.count)}
                  </p>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* On the Collections tab without a specific collection selected we
          hide the items panel entirely. Mirrors WardrobeLibrary /
          SavedItemsLibrary so all three surfaces feel the same. */}
      {!(activeCollectionBoardTab === "collections" && activeCollectionId === "__all__") && (
      <div ref={itemsPanelRef} className="glass-panel rounded-[28px] border p-5 scroll-mt-4">
        <div className="flex flex-col gap-5">
          {/* Breadcrumb back-out when drilled into a specific collection.
              Mirrors WardrobeLibrary / SavedItemsLibrary. */}
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
                    Drag outfits onto collection cards to move them between boards.
                  </p>
                )}
            </div>
          </div>

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
              title="Clear search"
            >
              <RotateCcw className="h-4 w-4" />
              Clear filters
            </Button>
          </div>

          {filteredOutfits.length === 0 ? (
            <div className="glass-panel-soft rounded-[22px] border px-4 py-10 text-center">
              <p className="text-sm text-foreground">
                {outfits.length === 0
                  ? "No saved outfits yet"
                  : activeCollectionId === "__all__"
                    ? "No outfits match this filter"
                    : `No outfits in ${activeCollectionSummary.title.toLowerCase()} yet`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {outfits.length === 0
                  ? "Build a look on the Home page and tap Save outfit."
                  : "Try another collection or clear your search."}
              </p>
            </div>
          ) : (
            <div
              className="grid justify-start gap-3"
              style={{
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(min(100%, 200px), 240px))",
              }}
            >
              {filteredOutfits.map((outfit) => {
                const previewImages = getOutfitPreviewImages(outfit);
                const assignedFolderId = getAssignedFolderId(outfit.id);
                const assignedFolder =
                  folders.find((folder) => folder.id === assignedFolderId) ?? null;
                const assignedFolderName = assignedFolder?.name ?? null;

                return (
                  <div
                    key={outfit.id}
                    draggable
                    onDragStart={(event) => handleOutfitDragStart(event, outfit.id)}
                    onDragEnd={() => {
                      setDraggedOutfitId(null);
                      setDragOverCollectionId(null);
                    }}
                    className={cn(
                      "group relative overflow-hidden rounded-[18px] border bg-background/52 p-2 transition-all duration-200",
                      "border-white/8 hover:border-primary/30 hover:bg-background/64",
                      draggedOutfitId === outfit.id && "opacity-60 ring-1 ring-primary/40",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(outfit.id)}
                      className="w-full text-left"
                    >
                      <div className="relative aspect-[4/5] overflow-hidden rounded-[16px] border border-white/8 bg-white/[0.03] p-2">
                        {previewImages.length === 0 ? (
                          <div className="flex h-full items-center justify-center text-muted-foreground/30">
                            <ImageIcon className="h-8 w-8" />
                          </div>
                        ) : (
                          <div className="grid h-full grid-cols-2 grid-rows-2 gap-1.5">
                            {Array.from({ length: 4 }).map((_, index) => {
                              const url = previewImages[index];
                              return (
                                <div
                                  key={index}
                                  className="overflow-hidden rounded-[12px] border border-white/8 bg-white/[0.03]"
                                >
                                  {url ? (
                                    <img
                                      src={url}
                                      alt=""
                                      className="h-full w-full object-contain p-1"
                                    />
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 px-1 pb-1 pt-2.5">
                        <div className="space-y-1">
                          <div className="truncate text-sm font-medium text-foreground">
                            {outfit.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {outfit.canvasItems.length}{" "}
                            {outfit.canvasItems.length === 1 ? "item" : "items"}
                            {" · "}
                            {new Date(outfit.timestamp).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Collection meta line: drop the "Collection:" prefix */}
                        {/* (the dot palette already signals which board the */}
                        {/* outfit belongs to) and keep the click hint short so */}
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
                          <div className="shrink-0 text-[10px] uppercase tracking-[0.12em] text-primary/80">
                            Tap for details
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Delete in TOP-RIGHT, ⋯ menu in BOTTOM-RIGHT.
                        Hover-fade on desktop, always visible on touch.
                        Mirrors WardrobeLibrary / SavedItemsLibrary. */}
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
                            <span className="sr-only">Open outfit actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel className="truncate">
                            {outfit.name}
                          </DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onLoad(outfit.id)}>
                            <FolderOpen className="mr-2 h-4 w-4" />
                            Open on board
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditOutfitNameDialog(outfit)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit name
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>Move to collection</DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              <DropdownMenuRadioGroup
                                value={assignedFolderId ?? "__unsorted__"}
                                onValueChange={(nextValue) =>
                                  void assignItemToFolder(
                                    outfit.id,
                                    nextValue === "__unsorted__" ? null : nextValue,
                                  )
                                }
                              >
                                <DropdownMenuRadioItem value="__unsorted__">
                                  Unsorted
                                </DropdownMenuRadioItem>
                                {folders.map((folder) => (
                                  <DropdownMenuRadioItem key={folder.id} value={folder.id}>
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
                          onDelete(outfit.id);
                        }}
                        title="Delete outfit"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete outfit</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      )}

      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent className="max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle>Create outfit collection</DialogTitle>
            <DialogDescription>
              Group outfits into saved boards. Pick a color now, then set a
              cover from any outfit inside the collection.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="outfit-folder-name" className="text-sm font-medium text-foreground">
                Collection name
              </label>
              <Input
                id="outfit-folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Weekend looks"
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
              <div className="text-sm font-medium text-foreground">Collection color</div>
              <div className="grid grid-cols-3 gap-2">
                {WARDROBE_FOLDER_COLORS.map((option) => (
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
                    <span className={cn("h-2.5 w-2.5 rounded-full", option.chipClassName)} />
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
                setNewFolderColor(DEFAULT_WARDROBE_FOLDER_COLOR);
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
            setEditFolderColor(DEFAULT_WARDROBE_FOLDER_COLOR);
          }
        }}
      >
        <DialogContent className="max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle>Edit outfit collection</DialogTitle>
            <DialogDescription>
              Rename your collection or change its accent color.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="outfit-folder-edit-name"
                className="text-sm font-medium text-foreground"
              >
                Collection name
              </label>
              <Input
                id="outfit-folder-edit-name"
                value={editFolderName}
                onChange={(e) => setEditFolderName(e.target.value)}
                placeholder="Weekend looks"
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
              <div className="text-sm font-medium text-foreground">Collection color</div>
              <div className="grid grid-cols-3 gap-2">
                {WARDROBE_FOLDER_COLORS.map((option) => (
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
                    <span className={cn("h-2.5 w-2.5 rounded-full", option.chipClassName)} />
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
                setEditFolderColor(DEFAULT_WARDROBE_FOLDER_COLOR);
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

      {editOutfitNameDialog}
    </div>
  );
};

export default SavedOutfitsLibrary;
