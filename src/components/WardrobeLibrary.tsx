import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronRight,
  Loader2,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
} from "lucide-react";
import type { WardrobeItem } from "@/hooks/useWardrobe";
import ItemCategoryBadge from "@/components/ItemCategoryBadge";
import { getClothingCategoryLabel, normalizeClothingCategory } from "@/lib/clothingCategory";

type WardrobeCategory = "top" | "trousers" | "shoes";
type WardrobeFilter = "all" | WardrobeCategory;

interface WardrobeLibraryProps {
  items: WardrobeItem[];
  onAddToCanvas: (item: WardrobeItem) => void;
  onDelete: (id: string) => void;
  onAddPhoto: (imageUrl: string, category: string) => void | Promise<void>;
  isLoading?: boolean;
  variant?: "default" | "compact";
}

const compactTabs: Array<{ value: WardrobeFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "top", label: "Tops" },
  { value: "trousers", label: "Bottoms" },
  { value: "shoes", label: "Shoes" },
];

function getCompactItemTitle(category: string) {
  const normalized = normalizeClothingCategory(category);
  if (normalized === "trousers") return "Bottom piece";
  if (normalized === "shoes") return "Shoe pair";
  return "Top piece";
}

function getCompactItemSubtitle(category: string) {
  const normalized = normalizeClothingCategory(category);
  if (normalized === "trousers") return "Bottoms";
  if (normalized === "shoes") return "Shoes";
  return "Tops";
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

  const isCompact = variant === "compact";
  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const normalizedCategory = normalizeClothingCategory(item.category);
      const matchesFilter = activeFilter === "all" || normalizedCategory === activeFilter;
      if (!matchesFilter) return false;

      if (!normalizedSearch) return true;

      const haystack = [
        getCompactItemTitle(item.category),
        getCompactItemSubtitle(item.category),
        getClothingCategoryLabel(item.category),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [activeFilter, items, normalizedSearch]);

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
    await onAddPhoto(imageUrl, category);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  if (isLoading) {
    return <div className="py-4 text-center text-xs text-muted-foreground">Loading wardrobe...</div>;
  }

  if (!isCompact) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <select
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value as WardrobeCategory)}
            className="h-7 rounded-md border border-border bg-background px-2 text-xs text-foreground"
            disabled={isUploading}
            aria-label="Wardrobe photo category"
          >
            <option value="top">Top</option>
            <option value="trousers">Trousers</option>
            <option value="shoes">Shoes</option>
          </select>
          <Button
            variant="secondary"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            Add Photo
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleFileChange(e)}
          />
        </div>

        {items.length === 0 ? (
          <div className="py-4 text-center text-xs text-muted-foreground">No wardrobe items yet</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {items.map((item) => (
              <div key={item.id} className="group relative">
                <button
                  onClick={() => onAddToCanvas(item)}
                  className="card-hover relative w-full overflow-hidden rounded-2xl border border-border bg-background/70 p-3 text-left"
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted/20">
                    <img src={item.imageUrl} alt={item.category} className="h-full w-full object-contain" />
                    <ItemCategoryBadge source="wardrobe" />
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="text-xs font-medium text-primary">+ Board</span>
                    </div>
                  </div>
                  <div className="px-1 pb-1 pt-3">
                    <div className="text-sm font-medium text-foreground">{getClothingCategoryLabel(item.category)}</div>
                  </div>
                </button>
                <div className="absolute bottom-1 left-1 right-1 z-10 flex justify-between opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onAddToCanvas(item)}
                    title="Add to board"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={() => onDelete(item.id)}
                    title="Delete wardrobe item"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

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
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add item
        </span>
        <Upload className="h-4 w-4 text-muted-foreground" />
      </button>

      <div className="max-h-[440px] overflow-y-auto pr-1">
        {filteredItems.length === 0 ? (
          <div className="glass-panel-soft rounded-[22px] border px-4 py-8 text-center">
            <p className="text-sm text-foreground">
              {items.length === 0 ? "No wardrobe items yet" : "No items match this filter"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {items.length === 0 ? "Add a few photos to start building your wardrobe." : "Try another category or search."}
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
                      <img src={item.imageUrl} alt={item.category} className="h-full w-full object-contain" />
                      <ItemCategoryBadge source="wardrobe" />
                    </div>
                    <div className="min-w-0 flex-1 pr-8">
                      <div className="truncate text-[15px] font-medium text-foreground">
                        {getCompactItemTitle(item.category)}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {getCompactItemSubtitle(item.category)}
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

      <Button asChild variant="secondary" className="h-11 w-full justify-between rounded-xl border border-white/10 bg-background/56 px-4">
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
