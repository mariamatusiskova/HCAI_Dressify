import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ImageMinus, Loader2, Wand2, Trash2, BookmarkPlus } from "lucide-react";
import { toast } from "sonner";
import type { GeneratedItem } from "@/hooks/useOutfits";
import { removeBackgroundAdvanced } from "@/services/backgroundRemoval";
import ImageEditorDialog from "@/components/ImageEditorDialog";
import ItemCategoryBadge from "@/components/ItemCategoryBadge";
import { getClothingCategoryLabel } from "@/lib/clothingCategory";
import { CANVAS_PIECE_MIME, type CanvasPiecePayload } from "@/components/CanvasEditor";

interface GeneratedItemsListProps {
  // the generated items to display
  items: GeneratedItem[];
  // function to run when the user clicks an item
  onAddToCanvas: (item: GeneratedItem) => void;
  onItemUpdate?: (itemId: string, updatedItem: GeneratedItem) => void;
  onItemDelete?: (itemId: string) => void;
  onItemAdd?: (item: GeneratedItem) => void;
  onSaveItem?: (item: GeneratedItem) => void;
  isSaved?: (item: GeneratedItem) => boolean;
  hideTitle?: boolean;
  className?: string;
  gridClassName?: string;
}

const GeneratedItemsList = ({
  items,
  onAddToCanvas,
  onItemUpdate,
  onItemDelete,
  onItemAdd,
  onSaveItem,
  isSaved,
  hideTitle = false,
  className,
  gridClassName,
}: GeneratedItemsListProps) => {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<GeneratedItem | null>(null);

  const handleRemoveBackground = async (e: React.MouseEvent, item: GeneratedItem) => {
    e.stopPropagation();
    setProcessingIds((prev) => new Set(prev).add(item.id));

    // Sticky toast so the user has a clear "still working" cue even when
    // the WASM runtime briefly stalls the main thread (which can make the
    // small button spinner appear frozen).
    const toastId = `bg-remove-${item.id}`;
    toast.loading("Removing background…", {
      id: toastId,
      description: "First run downloads ~50 MB; subsequent items are fast.",
    });

    // Yield once before kicking off heavy work so React paints the
    // processing overlay before WASM init seizes the main thread.
    await new Promise((resolve) => setTimeout(resolve, 0));

    try {
      const processedImageUrl = await removeBackgroundAdvanced(item.imageUrl, 25, true);
      const updatedItem: GeneratedItem = {
        ...item,
        imageUrl: processedImageUrl,
      };

      if (onItemUpdate) {
        onItemUpdate(item.id, updatedItem);
      }
      toast.success("Background removed", { id: toastId, description: undefined });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to remove background";
      toast.error(errorMessage, { id: toastId, description: undefined });
      console.error("Background removal error:", error);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  if (items.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {!hideTitle && (
        <h3 className="text-sm font-display font-medium text-muted-foreground uppercase tracking-wider">
          AI Items
        </h3>
      )}
      <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-3", gridClassName)}>
        {items.map((item) => {
          const isProcessing = processingIds.has(item.id);
          const alreadySaved = isSaved?.(item) ?? false;
          return (
            <div
              key={item.id}
              draggable
              // Publish a CanvasPiecePayload so the user can drag a freshly
              // generated piece straight onto the board, just like wardrobe
              // and saved-AI items.
              onDragStart={(event) => {
                const payload: CanvasPiecePayload = {
                  source: "ai",
                  imageUrl: item.imageUrl,
                  category: item.category,
                  prompt: item.prompt,
                };
                event.dataTransfer.effectAllowed = "copy";
                event.dataTransfer.setData(CANVAS_PIECE_MIME, JSON.stringify(payload));
              }}
              className="relative group"
            >
              <button
                onClick={() => onAddToCanvas(item)}
                className="relative w-full overflow-hidden rounded-lg border border-border bg-muted text-left card-hover"
              >
                <div className="relative aspect-square overflow-hidden">
                  <img src={item.imageUrl} alt={item.category} className="w-full h-full object-cover" />
                  <ItemCategoryBadge source="ai" className="transition-opacity group-hover:opacity-0" />
                  <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">+ Board</span>
                  </div>
                  {/* Big, obvious processing overlay. CSS pulse on the
                      backdrop is robust even when WASM warmup briefly
                      throttles the icon's spin animation. */}
                  {isProcessing ? (
                    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-background/75 backdrop-blur-sm animate-pulse">
                      <Loader2 className="h-7 w-7 animate-spin text-primary" />
                      <span className="text-[11px] font-medium uppercase tracking-wider text-foreground">
                        Removing…
                      </span>
                    </div>
                  ) : null}
                </div>
                <div className="space-y-1 px-2 pb-2 pt-2">
                  <div className="text-sm font-medium text-foreground">
                    {getClothingCategoryLabel(item.category, item.prompt)}
                  </div>
                  {item.prompt ? (
                    <div className="text-[11px] leading-4 text-muted-foreground line-clamp-2">{item.prompt}</div>
                  ) : null}
                </div>
              </button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute bottom-1 right-8 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingItem(item);
                }}
                title="Modify"
              >
                <Wand2 className="h-3 w-3" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute bottom-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={(e) => handleRemoveBackground(e, item)}
                disabled={isProcessing}
                title="Cut out background"
                aria-label="Cut out background"
              >
                {isProcessing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <ImageMinus className="h-3 w-3" />
                )}
              </Button>
              {onSaveItem && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute bottom-1 left-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSaveItem(item);
                  }}
                  title={alreadySaved ? "Already saved" : "Save item"}
                  disabled={alreadySaved}
                >
                  <BookmarkPlus className="h-3 w-3" />
                </Button>
              )}
              {onItemDelete && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onItemDelete(item.id);
                  }}
                  title="Remove generated item"
                  aria-label="Remove generated item"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
      <ImageEditorDialog
        open={editingItem !== null}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onApply={(newItem, mode) => {
          if (!editingItem) return;

          if (mode === "replace") {
            if (onItemUpdate) {
              onItemUpdate(editingItem.id, newItem);
              toast.success("Changes accepted");
            } else {
              toast.error("Cannot replace item: update handler is missing");
            }
            return;
          }

          if (onItemAdd) {
            onItemAdd(newItem);
            toast.success("Copy saved");
          } else {
            toast.error("Cannot save copy: add handler is missing");
          }
        }}
      />
    </div>
  );
};

export default GeneratedItemsList;
