import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { Link } from "react-router-dom";
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
  FolderOpen,
  FolderPlus,
  ImageIcon,
  Loader2,
  MoreHorizontal,
  Palette,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
} from "lucide-react";
import {
  useWardrobeFolders,
  type WardrobeFolder,
} from "@/hooks/useWardrobeFolders";
import type { AddWardrobeResult, WardrobeItem } from "@/hooks/useWardrobe";
import ItemCategoryBadge from "@/components/ItemCategoryBadge";
import {
  getClothingCategoryLabel,
  normalizeClothingCategory,
} from "@/lib/clothingCategory";
import {
  DEFAULT_WARDROBE_FOLDER_COLOR,
  WARDROBE_FOLDER_COLORS,
  getWardrobeFolderColorOption,
  type WardrobeFolderColor,
} from "@/lib/wardrobeFolders";

type WardrobeCategory = "top" | "trousers" | "shoes";
type WardrobeFilter = "all" | WardrobeCategory;
type WardrobeCollectionId = "__all__" | "__unsorted__" | string;
type AddPhotoResult = WardrobeItem | AddWardrobeResult | null | void;

interface WardrobeLibraryProps {
  items: WardrobeItem[];
  onAddToCanvas: (item: WardrobeItem) => void;
  onDelete: (id: string) => void;
  onAddPhoto: (
    imageUrl: string,
    category: string,
  ) => Promise<AddPhotoResult> | AddPhotoResult;
  isLoading?: boolean;
  variant?: "default" | "compact";
}

interface CollectionCard {
  id: WardrobeCollectionId;
  title: string;
  description: string;
  count: number;
  isUserFolder: boolean;
  folder?: WardrobeFolder;
  coverImageUrl?: string | null;
}

const compactTabs: Array<{ value: WardrobeFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "top", label: "Tops" },
  { value: "trousers", label: "Bottoms" },
  { value: "shoes", label: "Shoes" },
];

function getWardrobeItemTitle(category: string) {
  const normalized = normalizeClothingCategory(category);
  if (normalized === "trousers") return "Bottom piece";
  if (normalized === "shoes") return "Shoe pair";
  return "Top piece";
}

function getWardrobeItemSubtitle(category: string) {
  const normalized = normalizeClothingCategory(category);
  if (normalized === "trousers") return "Bottoms";
  if (normalized === "shoes") return "Shoes";
  return "Tops";
}

function getWardrobeCollectionSummary(
  collectionId: WardrobeCollectionId,
  folderName?: string,
) {
  if (collectionId === "__all__") {
    return {
      title: "All pieces",
      description: "Every wardrobe photo you decided to keep for styling.",
    };
  }

  if (collectionId === "__unsorted__") {
    return {
      title: "Unsorted",
      description: "Fresh additions waiting to be filed into a folder.",
    };
  }

  return {
    title: folderName ?? "Folder",
    description: "A focused collection you can build outfits from quickly.",
  };
}

function getAddedWardrobeItem(result: AddPhotoResult): WardrobeItem | null {
  if (!result) return null;
  if ("item" in result) return result.item;
  return result;
}

const WardrobeLibrary = ({
  items,
  onAddToCanvas,
  onDelete,
  onAddPhoto,
  isLoading = false,
  variant = "default",
}: WardrobeLibraryProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<WardrobeCategory>("top");
  const [activeFilter, setActiveFilter] = useState<WardrobeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState<WardrobeFolderColor>(
    DEFAULT_WARDROBE_FOLDER_COLOR,
  );
  const [activeCollectionId, setActiveCollectionId] =
    useState<WardrobeCollectionId>("__all__");
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverCollectionId, setDragOverCollectionId] =
    useState<WardrobeCollectionId | null>(null);

  const isCompact = variant === "compact";
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
    isCloudSyncEnabled: isFolderCloudSyncEnabled,
    syncError: folderSyncError,
  } = useWardrobeFolders(items);

  const uncategorizedCount = useMemo(
    () => items.filter((item) => !assignments[item.id]).length,
    [assignments, items],
  );

  const folderCoverImages = useMemo(() => {
    const covers: Record<string, string | null> = {};

    for (const folder of folders) {
      covers[folder.id] = folder.coverImageUrl ?? null;
    }

    for (const item of items) {
      const folderId = assignments[item.id];
      if (!folderId || covers[folderId]) continue;
      covers[folderId] = item.imageUrl;
    }

    return covers;
  }, [assignments, folders, items]);

  const collectionCards = useMemo<CollectionCard[]>(() => {
    const firstUnsortedItem = items.find((item) => !assignments[item.id]);

    return [
      {
        id: "__all__",
        title: "All pieces",
        description: "Everything you saved for styling.",
        count: items.length,
        isUserFolder: false,
        coverImageUrl: items[0]?.imageUrl ?? null,
      },
      {
        id: "__unsorted__",
        title: "Unsorted",
        description: "Fresh pieces waiting for a folder.",
        count: uncategorizedCount,
        isUserFolder: false,
        coverImageUrl: firstUnsortedItem?.imageUrl ?? null,
      },
      ...folders.map((folder) => ({
        id: folder.id,
        title: folder.name,
        description: "Curated collection",
        count: folderCounts[folder.id] ?? 0,
        isUserFolder: true,
        folder,
        coverImageUrl: folderCoverImages[folder.id] ?? null,
      })),
    ];
  }, [
    assignments,
    folderCounts,
    folderCoverImages,
    folders,
    items,
    uncategorizedCount,
  ]);

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
        getWardrobeItemTitle(item.category),
        getWardrobeItemSubtitle(item.category),
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
  const activeCollectionSummary = getWardrobeCollectionSummary(
    activeCollectionId,
    activeFolderName,
  );

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
    const addedItem = getAddedWardrobeItem(
      await onAddPhoto(imageUrl, category),
    );

    if (
      addedItem &&
      activeCollectionId !== "__all__" &&
      activeCollectionId !== "__unsorted__"
    ) {
      await assignItemToFolder(addedItem.id, activeCollectionId);
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
      console.error("Wardrobe photo upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateFolder = async () => {
    const nextFolder = await createFolder(newFolderName, newFolderColor);
    if (!nextFolder) return;

    setActiveCollectionId(nextFolder.id);
    setNewFolderName("");
    setNewFolderColor(DEFAULT_WARDROBE_FOLDER_COLOR);
    setIsCreateFolderOpen(false);
  };

  const handleItemDragStart = (
    event: DragEvent<HTMLElement>,
    itemId: string,
  ) => {
    setDraggedItemId(itemId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", itemId);
  };

  const handleCollectionDragOver = (
    event: DragEvent<HTMLElement>,
    collectionId: WardrobeCollectionId,
  ) => {
    if (collectionId === "__all__") return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverCollectionId(collectionId);
  };

  const handleCollectionDrop = async (
    event: DragEvent<HTMLElement>,
    collectionId: WardrobeCollectionId,
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
  };

  if (isLoading || isFolderSyncLoading) {
    return (
      <div className="py-4 text-center text-xs text-muted-foreground">
        Loading wardrobe...
      </div>
    );
  }

  if (!isCompact) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Keep your personal pieces filed into folders so the wardrobe stays
              clean as it grows.
            </p>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/70">
              {isFolderCloudSyncEnabled
                ? "Folders sync with Supabase, so collections travel across devices."
                : "Folders are saved locally until Supabase sync is available."}
            </p>
            {folderSyncError && (
              <p className="text-xs text-destructive/90">{folderSyncError}</p>
            )}
          </div>

          <Button
            type="button"
            variant="secondary"
            className="h-11 gap-2 rounded-xl border border-white/10 bg-background/56 px-4"
            onClick={() => setIsCreateFolderOpen(true)}
          >
            <FolderPlus className="h-4 w-4" />
            New folder
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {collectionCards.map((collection) => {
            const isActive = activeCollectionId === collection.id;
            const isDropTarget =
              dragOverCollectionId === collection.id &&
              collection.id !== "__all__";
            const colorOption = getWardrobeFolderColorOption(
              collection.folder?.color,
            );
            const isUserFolder = collection.isUserFolder && collection.folder;

            return (
              <div
                key={collection.id}
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
                  "group relative min-h-[168px] overflow-hidden rounded-[22px] border p-4 transition-all duration-200",
                  isUserFolder
                    ? colorOption.toneClassName
                    : isActive
                      ? "border-primary/60 bg-primary/[0.08] shadow-[0_0_0_1px_hsl(var(--primary)/0.16)]"
                      : "border-white/8 bg-background/50 hover:border-primary/24 hover:bg-background/60",
                  isActive && "ring-1 ring-primary/35",
                  isDropTarget &&
                    "scale-[1.01] border-primary/70 ring-2 ring-primary/35",
                )}
              >
                {collection.coverImageUrl && (
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-32 opacity-28 blur-[0.2px]">
                    <img
                      src={collection.coverImageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setActiveCollectionId(collection.id)}
                  className="relative z-10 flex h-full w-full flex-col justify-between text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground/70">
                        {isUserFolder && (
                          <span
                            className={cn(
                              "h-2 w-2 rounded-full",
                              colorOption.chipClassName,
                            )}
                          />
                        )}
                        {isUserFolder ? "Folder" : "Collection"}
                      </div>
                      <div className="mt-2 text-lg font-medium text-foreground">
                        {collection.title}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {collection.description}
                      </p>
                    </div>
                    <div className="rounded-full border border-white/10 bg-background/70 px-3 py-1 text-sm text-foreground">
                      {collection.count}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground/70">
                    <FolderOpen className="h-3.5 w-3.5" />
                    {collection.id === "__all__"
                      ? "Open collection"
                      : "Drop items here"}
                  </div>
                </button>

                {isUserFolder && (
                  <div className="absolute right-3 top-3 z-20">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="h-7 w-7 rounded-full border border-white/10 bg-background/80 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                          <span className="sr-only">Open folder actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>
                          {collection.title}
                        </DropdownMenuLabel>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <Palette className="mr-2 h-4 w-4" />
                            Folder color
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuRadioGroup
                              value={collection.folder.color}
                              onValueChange={(nextValue) =>
                                void updateFolder(collection.folder!.id, {
                                  color: nextValue as WardrobeFolderColor,
                                })
                              }
                            >
                              {WARDROBE_FOLDER_COLORS.map((option) => (
                                <DropdownMenuRadioItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  <span
                                    className={cn(
                                      "mr-2 h-2.5 w-2.5 rounded-full",
                                      option.chipClassName,
                                    )}
                                  />
                                  {option.label}
                                </DropdownMenuRadioItem>
                              ))}
                            </DropdownMenuRadioGroup>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
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
                          Delete folder
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="glass-panel rounded-[28px] border p-5">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground/70">
                  Current collection
                </div>
                <h3 className="text-2xl font-display font-medium text-foreground">
                  {activeCollectionSummary.title}
                </h3>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  {activeCollectionSummary.description}
                </p>
                {activeCollectionId !== "__all__" &&
                  activeCollectionId !== "__unsorted__" && (
                    <p className="text-xs uppercase tracking-[0.16em] text-primary/80">
                      New photos added here will go straight into this folder.
                      Drag pieces onto folder cards to move them.
                    </p>
                  )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={uploadCategory}
                  onChange={(e) =>
                    setUploadCategory(e.target.value as WardrobeCategory)
                  }
                  className="h-11 rounded-xl border border-white/10 bg-background/56 px-3 text-sm text-foreground"
                  disabled={isUploading}
                  aria-label="Wardrobe photo category"
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
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Add wardrobe photo
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
                  size="icon"
                  className="h-11 w-11 rounded-xl border border-white/10 bg-background/56"
                  onClick={() => {
                    setActiveFilter("all");
                    setSearchQuery("");
                  }}
                  title="Reset wardrobe filters"
                >
                  <SlidersHorizontal className="h-4 w-4" />
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
                    ? "No wardrobe pieces yet"
                    : activeCollectionId === "__all__"
                      ? "No pieces match this filter"
                      : `No pieces in ${activeCollectionSummary.title.toLowerCase()} yet`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {items.length === 0
                    ? "Start by adding a few photos of the pieces you actually own."
                    : "Try another folder, another category, or add a new wardrobe photo."}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                        handleItemDragStart(event, item.id)
                      }
                      onDragEnd={() => {
                        setDraggedItemId(null);
                        setDragOverCollectionId(null);
                      }}
                      className={cn(
                        "group relative overflow-hidden rounded-[22px] border bg-background/52 p-3 transition-all duration-200",
                        isSelected
                          ? "border-primary/70 shadow-[0_0_0_1px_hsl(var(--primary)/0.18)]"
                          : "border-white/8 hover:border-primary/30 hover:bg-background/64",
                        draggedItemId === item.id &&
                          "opacity-60 ring-1 ring-primary/40",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedItemId(item.id);
                          onAddToCanvas(item);
                        }}
                        className="w-full text-left"
                      >
                        <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] border border-white/8 bg-white/[0.03]">
                          <img
                            src={item.imageUrl}
                            alt={item.category}
                            className="h-full w-full object-contain"
                          />
                          <ItemCategoryBadge source="wardrobe" />
                        </div>

                        <div className="space-y-3 px-1 pb-1 pt-4">
                          <div className="space-y-1">
                            <div className="text-base font-medium text-foreground">
                              {getWardrobeItemTitle(item.category)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {getClothingCategoryLabel(item.category)}
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 text-xs uppercase tracking-[0.16em] text-muted-foreground/80">
                              {assignedFolderName
                                ? `Folder: ${assignedFolderName}`
                                : "Unsorted"}
                            </div>
                            <div className="text-xs uppercase tracking-[0.16em] text-primary/85">
                              Drag or click
                            </div>
                          </div>
                        </div>
                      </button>

                      <div className="absolute right-4 top-4 flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              className="h-8 w-8 rounded-full border border-white/10 bg-background/82 opacity-0 transition-opacity group-hover:opacity-100"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">
                                Open wardrobe item actions
                              </span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Wardrobe item</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedItemId(item.id);
                                onAddToCanvas(item);
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add to board
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
                                Use as folder cover
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                Move to folder
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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => onDelete(item.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete item
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {isSelected && (
                        <div className="absolute bottom-4 right-4 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
          <DialogContent className="max-w-md border-border bg-card">
            <DialogHeader>
              <DialogTitle>Create wardrobe folder</DialogTitle>
              <DialogDescription>
                Group pieces into saved boards. Pick a color now, then set a
                cover from any item inside the folder.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="wardrobe-folder-name"
                  className="text-sm font-medium text-foreground"
                >
                  Folder name
                </label>
                <Input
                  id="wardrobe-folder-name"
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
                  Folder color
                </div>
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
                Create folder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
            placeholder="Search wardrobe..."
            className="h-11 w-full rounded-xl border border-white/8 bg-background/56 pl-10 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/35"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-11 w-11 rounded-xl border border-white/8 bg-background/56"
          onClick={() => {
            setActiveFilter("all");
            setSearchQuery("");
          }}
          title="Reset wardrobe filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
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
                ? "No wardrobe items yet"
                : "No items match this filter"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {items.length === 0
                ? "Add a few photos to start building your wardrobe."
                : "Try another category or search."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const isSelected = selectedItemId === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedItemId(item.id);
                    onAddToCanvas(item);
                  }}
                  className={cn(
                    "group relative overflow-hidden rounded-[18px] border bg-background/56 p-3 text-left transition-all duration-200",
                    isSelected
                      ? "border-primary/70 shadow-[0_0_0_1px_hsl(var(--primary)/0.18)]"
                      : "border-white/8 hover:border-primary/30 hover:bg-background/68",
                  )}
                >
                  <div className="relative flex items-center gap-3">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[14px] border border-white/8 bg-white/[0.03]">
                      <img
                        src={item.imageUrl}
                        alt={item.category}
                        className="h-full w-full object-contain"
                      />
                      <ItemCategoryBadge source="wardrobe" />
                    </div>
                    <div className="min-w-0 flex-1 pr-8">
                      <div className="truncate text-[15px] font-medium text-foreground">
                        {getWardrobeItemTitle(item.category)}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {getWardrobeItemSubtitle(item.category)}
                      </div>
                      <div className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground/80">
                        Tap to add to board
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-2 h-6 w-6 rounded-full border border-white/10 bg-background/78 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.id);
                    }}
                    title="Delete wardrobe item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>

                  {isSelected && (
                    <div className="absolute right-3 bottom-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </button>
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
        <Link to="/wardrobe">
          View all wardrobe
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>

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

export default WardrobeLibrary;