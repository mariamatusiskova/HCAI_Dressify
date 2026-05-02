import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ItemCategoryBadge from "@/components/ItemCategoryBadge";
import {
  RotateCw,
  ImageMinus,
  Loader2,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Eraser,
  Trash2,
  Upload,
  Wand2,
  X,
  Shirt,
  ShoppingBag,
  Glasses,
  Footprints,
} from "lucide-react";
import { toast } from "sonner";
import type { CanvasItem, GeneratedItem } from "@/hooks/useOutfits";
import { createId } from "@/lib/id";
import { normalizeClothingCategory } from "@/lib/clothingCategory";
import { removeBackgroundAdvanced } from "@/services/backgroundRemoval";
import ImageEditorDialog from "@/components/ImageEditorDialog";

// Custom MIME used by the wardrobe / saved-AI lists to advertise that the
// drag carries a styleable piece (not a file or plain text). Listening for
// this lets the canvas accept drops from anywhere in the app without
// confusing wardrobe collection-card drops with file uploads.
export const CANVAS_PIECE_MIME = "application/x-dressify-piece";

export interface CanvasPiecePayload {
  source: "wardrobe" | "ai";
  imageUrl: string;
  category: string;
  prompt?: string;
}

interface CanvasEditorProps {
  userPhoto: string | null;
  onPhotoChange?: (photo: string | null) => void;
  items: CanvasItem[];
  onItemsChange: (items: CanvasItem[]) => void;
  onDeleteItem: (id: string) => void;
  hideTitle?: boolean;
  className?: string;
  viewportClassName?: string;
  emptyStateMessage?: string;
  exampleCards?: ExampleCanvasCard[];
}

interface ExampleCanvasCard {
  id: string;
  imageUrl: string;
  alt?: string;
}

const avatarPlaceholderUrl = `${import.meta.env.BASE_URL}examples/avatar_body.png`;
const emptyBoardOutfitIcons = [
  { Icon: Shirt, className: "left-[38%] top-[20%] -rotate-6" },
  { Icon: ShoppingBag, className: "right-[38%] top-[20%] rotate-6" },
  { Icon: Glasses, className: "left-[35%] bottom-[35%] rotate-12" },
  { Icon: Footprints, className: "right-[35%] bottom-[35%] -rotate-12" },
];

type InteractionMode = "none" | "drag" | "resize" | "rotate";
type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

const itemButtonClassName =
  "h-8 w-8 rounded-full border border-white/10 bg-background/90 shadow-sm backdrop-blur hover:bg-primary hover:text-primary-foreground";

const CanvasEditor = ({
  userPhoto,
  onPhotoChange,
  items,
  onItemsChange,
  onDeleteItem,
  hideTitle = false,
  className,
  viewportClassName,
  emptyStateMessage,
  exampleCards = [],
}: CanvasEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [photoAspectRatio, setPhotoAspectRatio] = useState<number>(16 / 9);
  const [interactionMode, setInteractionMode] =
    useState<InteractionMode>("none");
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [hoveredToolbarId, setHoveredToolbarId] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  // The canvas item the user is currently editing with the AI prompt dialog.
  // null = dialog closed. We keep the original CanvasItem (rather than just
  // its ID) because we need its size/position when applying changes.
  const [editingCanvasItem, setEditingCanvasItem] = useState<CanvasItem | null>(null);
  const interactionStart = useRef({
    x: 0,
    y: 0,
    item: null as CanvasItem | null,
    resizeHandle: null as ResizeHandle | null,
  });

  const stageAspectRatio = userPhoto ? photoAspectRatio : 16 / 9;
  const stageMode =
    stageAspectRatio > 1.08
      ? "landscape"
      : stageAspectRatio < 0.92
      ? "portrait"
      : "square";

  const stageSizeStyle = userPhoto
    ? {
        aspectRatio: stageAspectRatio,
        width: "100%",
        height: "auto",
        maxWidth:
          stageMode === "portrait"
            ? "min(48vw, 380px)"
            : stageMode === "square"
            ? "min(70vw, 520px)"
            : "min(85vw, 680px)",
        maxHeight: "min(70vh, 540px)",
        minHeight: "240px",
      }
    : { width: "100%", height: "50vh", maxHeight: "50vh" };

  useEffect(() => {
    if (!userPhoto) {
      setPhotoAspectRatio(16 / 9);
    }
  }, [userPhoto]);

  const handleMouseDown = useCallback(
    (
      e: React.MouseEvent,
      id: string,
      mode: InteractionMode = "drag",
      resizeHandle?: ResizeHandle,
    ) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = stageRef.current?.getBoundingClientRect();
      const item = items.find((i) => i.id === id);
      if (!rect || !item) return;

      if (mode === "drag") {
        const maxZIndex =
          items.length > 0 ? Math.max(...items.map((i) => i.zIndex ?? 0)) : 0;
        if ((item.zIndex ?? 0) < maxZIndex) {
          const updatedItems = items.map((i) =>
            i.id === id ? { ...i, zIndex: maxZIndex + 1 } : i,
          );
          onItemsChange(updatedItems);
        }
      }

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const currentItem = items.find((i) => i.id === id) || item;

      interactionStart.current = {
        x: mouseX,
        y: mouseY,
        item: { ...currentItem },
        resizeHandle: resizeHandle || null,
      };

      setInteractionMode(mode);
      setActiveItemId(id);
    },
    [items, onItemsChange],
  );

  const handleFile = useCallback(
    (file: File) => {
      if (!onPhotoChange || !file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = (event) => onPhotoChange(event.target?.result as string);
      reader.readAsDataURL(file);
    },
    [onPhotoChange],
  );

  const handleUploadDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  // Accept piece drops anywhere on the stage. We pre-parse on dragOver so we
  // can decide whether to call preventDefault — without that the browser
  // refuses to fire onDrop on a non-form-element div.
  const stageHasPieceDrag = useCallback((e: React.DragEvent) => {
    return e.dataTransfer.types.includes(CANVAS_PIECE_MIME);
  }, []);

  const handleStageDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!stageHasPieceDrag(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    },
    [stageHasPieceDrag],
  );

  const handleStageDrop = useCallback(
    (e: React.DragEvent) => {
      const raw = e.dataTransfer.getData(CANVAS_PIECE_MIME);
      if (!raw) return;
      e.preventDefault();
      e.stopPropagation();

      let payload: CanvasPiecePayload | null = null;
      try {
        payload = JSON.parse(raw) as CanvasPiecePayload;
      } catch {
        return;
      }
      if (!payload?.imageUrl) return;

      const stageRect = stageRef.current?.getBoundingClientRect();
      if (!stageRect) return;

      // Default piece size matches what handleAddToCanvas uses (80x80) so the
      // dropped piece visually matches a clicked-add piece. Center the piece
      // under the cursor instead of using its top-left corner.
      const width = 80;
      const height = 80;
      const x = e.clientX - stageRect.left - width / 2;
      const y = e.clientY - stageRect.top - height / 2;

      const maxZIndex =
        items.length > 0 ? Math.max(...items.map((i) => i.zIndex ?? 0)) : -1;

      const newItem: CanvasItem = {
        id: createId(),
        imageUrl: payload.imageUrl,
        category:
          payload.source === "ai"
            ? normalizeClothingCategory(payload.category, payload.prompt)
            : payload.category,
        prompt: payload.prompt,
        source: payload.source,
        x,
        y,
        width,
        height,
        rotation: 0,
        zIndex: maxZIndex + 1,
      };

      onItemsChange([...items, newItem]);
    },
    [items, onItemsChange],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (interactionMode === "none" || !activeItemId || !stageRef.current)
        return;

      const rect = stageRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const deltaX = mouseX - interactionStart.current.x;
      const deltaY = mouseY - interactionStart.current.y;

      const item = items.find((i) => i.id === activeItemId);
      if (!item || !interactionStart.current.item) return;

      const startItem = interactionStart.current.item;
      const containerWidth = rect.width;
      const containerHeight = rect.height;

      // Items used to be clamped strictly inside the stage, but the user wants
      // to be able to place pieces anywhere on the canvas (including the dark
      // area around the photo). We allow items to bleed up to ~70% of their
      // own size past each edge so the user can still grab them back; the
      // outer glass-viewport's overflow-hidden takes care of clipping
      // anything that strays too far.
      const overscanX = item.width * 0.7;
      const overscanY = item.height * 0.7;

      let updatedItem: CanvasItem = { ...item };

      if (interactionMode === "drag") {
        const newX = Math.max(
          -overscanX,
          Math.min(containerWidth - item.width + overscanX, startItem.x + deltaX),
        );
        const newY = Math.max(
          -overscanY,
          Math.min(containerHeight - item.height + overscanY, startItem.y + deltaY),
        );
        updatedItem = { ...item, x: newX, y: newY };
      } else if (interactionMode === "resize") {
        const handle = interactionStart.current.resizeHandle || "se";
        const minSize = 40;

        let newX = startItem.x;
        let newY = startItem.y;
        let newWidth = startItem.width;
        let newHeight = startItem.height;

        if (handle.includes("e")) {
          newWidth = Math.max(minSize, startItem.width + deltaX);
        }
        if (handle.includes("w")) {
          const newWidthValue = Math.max(minSize, startItem.width - deltaX);
          newX = startItem.x + (startItem.width - newWidthValue);
          newWidth = newWidthValue;
        }
        if (handle.includes("s")) {
          newHeight = Math.max(minSize, startItem.height + deltaY);
        }
        if (handle.includes("n")) {
          const newHeightValue = Math.max(minSize, startItem.height - deltaY);
          newY = startItem.y + (startItem.height - newHeightValue);
          newHeight = newHeightValue;
        }

        // Same overscan idea on resize: keep at least a sliver of the item
        // visible relative to the stage rather than clamping to its edges.
        newX = Math.max(-overscanX, Math.min(newX, containerWidth - minSize + overscanX));
        newY = Math.max(-overscanY, Math.min(newY, containerHeight - minSize + overscanY));
        newWidth = Math.max(minSize, newWidth);
        newHeight = Math.max(minSize, newHeight);

        updatedItem = {
          ...item,
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        };
      } else if (interactionMode === "rotate") {
        const centerX = startItem.x + startItem.width / 2;
        const centerY = startItem.y + startItem.height / 2;
        const angle1 = Math.atan2(
          interactionStart.current.y - centerY,
          interactionStart.current.x - centerX,
        );
        const angle2 = Math.atan2(mouseY - centerY, mouseX - centerX);
        const deltaAngle = ((angle2 - angle1) * 180) / Math.PI;
        const newRotation = (startItem.rotation + deltaAngle) % 360;
        updatedItem = { ...item, rotation: newRotation };
      }

      onItemsChange(
        items.map((i) => (i.id === activeItemId ? updatedItem : i)),
      );
    },
    [interactionMode, activeItemId, items, onItemsChange],
  );

  const handleMouseUp = useCallback(() => {
    setInteractionMode("none");
  }, []);

  const handleBoardMouseDown = useCallback(() => {
    setActiveItemId(null);
    setHoveredItemId(null);
    setHoveredToolbarId(null);
  }, []);

  const handleDelete = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      onDeleteItem(id);
      if (activeItemId === id) {
        setActiveItemId(null);
      }
    },
    [activeItemId, onDeleteItem],
  );

  const handleRemoveBackground = useCallback(
    async (e: React.MouseEvent, item: CanvasItem) => {
      e.preventDefault();
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
        const processedImageUrl = await removeBackgroundAdvanced(
          item.imageUrl,
          25,
          true,
        );
        const updatedItems = items.map((i) =>
          i.id === item.id ? { ...i, imageUrl: processedImageUrl } : i,
        );
        onItemsChange(updatedItems);
        toast.success("Background removed", { id: toastId, description: undefined });
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to remove background";
        toast.error(errorMessage, { id: toastId, description: undefined });
        console.error("Background removal error:", error);
      } finally {
        setProcessingIds((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      }
    },
    [items, onItemsChange],
  );

  const handleBringToFront = useCallback(
    (e: React.MouseEvent, itemId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const maxZIndex =
        items.length > 0 ? Math.max(...items.map((i) => i.zIndex ?? 0)) : 0;
      onItemsChange(
        items.map((i) =>
          i.id === itemId ? { ...i, zIndex: maxZIndex + 1 } : i,
        ),
      );
      toast.success("Brought to front");
    },
    [items, onItemsChange],
  );

  const handleSendToBack = useCallback(
    (e: React.MouseEvent, itemId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const minZIndex =
        items.length > 0 ? Math.min(...items.map((i) => i.zIndex ?? 0)) : 0;
      onItemsChange(
        items.map((i) =>
          i.id === itemId ? { ...i, zIndex: minZIndex - 1 } : i,
        ),
      );
      toast.success("Sent to back");
    },
    [items, onItemsChange],
  );

  const handleBringForward = useCallback(
    (e: React.MouseEvent, itemId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      const currentZIndex = item.zIndex ?? 0;
      const higherItems = items
        .filter((i) => (i.zIndex ?? 0) > currentZIndex)
        .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

      if (higherItems.length === 0) {
        handleBringToFront(e, itemId);
        return;
      }

      const swapTarget = higherItems[0];
      onItemsChange(
        items.map((i) => {
          if (i.id === itemId)
            return { ...i, zIndex: swapTarget.zIndex ?? currentZIndex + 1 };
          if (i.id === swapTarget.id) return { ...i, zIndex: currentZIndex };
          return i;
        }),
      );
      toast.success("Brought forward");
    },
    [items, onItemsChange, handleBringToFront],
  );

  const handleSendBackward = useCallback(
    (e: React.MouseEvent, itemId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      const currentZIndex = item.zIndex ?? 0;
      const lowerItems = items
        .filter((i) => (i.zIndex ?? 0) < currentZIndex)
        .sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0));

      if (lowerItems.length === 0) {
        handleSendToBack(e, itemId);
        return;
      }

      const swapTarget = lowerItems[0];
      onItemsChange(
        items.map((i) => {
          if (i.id === itemId)
            return { ...i, zIndex: swapTarget.zIndex ?? currentZIndex - 1 };
          if (i.id === swapTarget.id) return { ...i, zIndex: currentZIndex };
          return i;
        }),
      );
      toast.success("Sent backward");
    },
    [items, onItemsChange, handleSendToBack],
  );

  const sortedItems = [...items].sort(
    (a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0),
  );
  const preUploadState = !userPhoto && items.length === 0;
  const showBoardPhotoControls = Boolean(onPhotoChange) && !preUploadState;
  const helperMessage =
    emptyStateMessage ??
    (preUploadState
      ? "Start with a full-body photo. Then generate pieces or add them from wardrobe."
      : "Add pieces and arrange them on the photo.");

  return (
    <>
    <div className={cn("space-y-3 flex flex-col h-auto", className)}>
      {!hideTitle && (
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-display font-medium text-muted-foreground uppercase tracking-[0.22em]">
            Board
          </h3>
          <p className="hidden text-xs text-muted-foreground/70 md:block">
            Upload a photo, add pieces, then move, resize, rotate, and layer
            them.
          </p>
        </div>
      )}

      <div
        ref={containerRef}
        className={cn(
          "glass-viewport relative h-auto overflow-hidden rounded-[30px] border border-white/8 select-none",
          "bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.10),_transparent_38%),linear-gradient(180deg,hsl(var(--background)/0.75),hsl(var(--background)/0.96))]",
          viewportClassName,
        )}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseDown={handleBoardMouseDown}
      >
        {onPhotoChange && (
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        )}

        <div className="pointer-events-none absolute inset-0 rounded-[30px] border border-white/6" />

        {showBoardPhotoControls && (
          <div className="absolute right-4 top-4 z-30 flex items-center gap-2">
            {/* Clear-board action sits next to the photo controls so the user */}
            {/* can wipe just the styled pieces without losing their photo. */}
            {items.length > 0 && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-9 rounded-full border border-white/10 bg-background/80 px-3 shadow-sm backdrop-blur-md"
                onClick={() => {
                  onItemsChange([]);
                  setActiveItemId(null);
                  toast.success("Board cleared");
                }}
                title="Remove every piece from the board"
                aria-label="Clear board"
              >
                <Eraser className="mr-1 h-3.5 w-3.5" />
                <span>Clear board</span>
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-9 rounded-full border border-white/10 bg-background/80 px-3 shadow-sm backdrop-blur-md"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="mr-1 h-3.5 w-3.5" />
              <span>{userPhoto ? "Change photo" : "Upload photo"}</span>
            </Button>
            {userPhoto && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full border border-white/10 bg-background/70 shadow-sm backdrop-blur-md"
                onClick={() => onPhotoChange?.(null)}
                title="Clear photo"
                aria-label="Clear photo"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        <div className="relative flex items-center justify-center px-4 py-4">
          <div
            ref={stageRef}
            data-stage-mode={stageMode}
            onDragOver={handleStageDragOver}
            onDrop={handleStageDrop}
            // overflow:visible (was overflow-hidden) lets items, the rotation
            // handle, the resize dots, and the floating toolbar bleed outside
            // the photo's bounding box. Anything that drifts too far is still
            // clipped by the outer glass-viewport card so the rounded corners
            // stay clean.
            className="relative overflow-visible"
            style={stageSizeStyle}
          >
            {userPhoto && (
              <>
                <img
                  src={userPhoto}
                  alt="User"
                  onLoad={(event) => {
                    const { naturalWidth, naturalHeight } = event.currentTarget;
                    if (naturalWidth && naturalHeight) {
                      setPhotoAspectRatio(naturalWidth / naturalHeight);
                    }
                  }}
                  className="absolute inset-0 h-full w-full object-contain object-center pointer-events-none brightness-[1.04] contrast-[1.02] drop-shadow-[0_24px_48px_rgba(0,0,0,0.24)]"
                />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-background/10 to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/16 to-transparent" />
              </>
            )}

            {!preUploadState && items.length === 0 && (
              <div className="pointer-events-none absolute inset-x-4 bottom-4 z-20 flex justify-center">
                <div className="rounded-full border border-border/80 bg-background/95 px-5 py-2.5 text-center text-sm font-medium text-foreground shadow-[0_8px_24px_rgba(0,0,0,0.12)] supports-[backdrop-filter]:bg-background/88 supports-[backdrop-filter]:backdrop-blur-md dark:border-white/12 dark:bg-black/78 dark:text-white dark:shadow-[0_14px_34px_rgba(0,0,0,0.34)]">
                  Click a piece to add it, or drag it onto the board.
                </div>
              </div>
            )}

        {preUploadState && (
          <div
            className="absolute inset-0 overflow-hidden"
            onDrop={handleUploadDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="group absolute inset-0 cursor-pointer overflow-hidden text-left transition-colors duration-300 hover:bg-white/[0.012] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Upload a body photo to start styling on the board"
            >
              <div className="pointer-events-none absolute inset-x-[18%] top-[8%] h-12 rounded-full bg-[radial-gradient(circle,_hsl(var(--primary)/0.16)_0%,_transparent_72%)] blur-2xl" />
              <div className="pointer-events-none absolute inset-x-[20%] bottom-[6%] h-16 rounded-full bg-[radial-gradient(circle,_hsl(var(--primary)/0.08)_0%,_transparent_74%)] blur-2xl" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--background)/0.03),transparent_24%,transparent_74%,hsl(var(--background)/0.20))]" />

              <div className="relative z-10 flex h-full items-center justify-center px-2 pb-3 pt-6 md:px-4 md:pb-4 md:pt-8">
                <div className="relative flex h-full w-full items-center justify-center">
                  <div className="pointer-events-none absolute inset-y-[10%] left-1/2 w-[140px] -translate-x-1/2 rounded-[999px] bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.06)_0%,_transparent_70%)] blur-xl md:w-[160px]" />
                  <img
                    src={avatarPlaceholderUrl}
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none relative z-10 h-[70%] min-h-[240px] w-auto max-w-none object-contain opacity-[0.52] saturate-[0.92] drop-shadow-[0_16px_32px_rgba(0,0,0,0.18)] transition-transform duration-300 group-hover:scale-[1.015] md:h-[80%] lg:h-[88%]"
                  />

                  {emptyBoardOutfitIcons.map(({ Icon, className }) => (
                    <div
                      key={className}
                      className={cn(
                        "pointer-events-none absolute z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-background/46 text-muted-foreground/76 shadow-[0_10px_24px_hsl(var(--background)/0.14)] backdrop-blur-md",
                        className,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                  ))}

                  <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 flex w-[min(100%,300px)] -translate-x-1/2 flex-col items-center gap-1 px-2 text-center">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-background/74 px-2.5 py-1.5 shadow-[0_10px_28px_hsl(var(--background)/0.20)] backdrop-blur-md transition-all duration-300 group-hover:border-primary/28 group-hover:bg-background/82">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-primary/12 text-primary shadow-[0_8px_20px_hsl(var(--primary)/0.16)]">
                        <Upload className="h-3.5 w-3.5" />
                      </div>
                      <div className="space-y-0 text-left">
                        <p className="text-xs font-medium text-foreground md:text-sm">
                          Drop or click to upload
                        </p>
                      </div>
                    </div>
                    <p className="max-w-xs text-[10px] leading-relaxed text-muted-foreground/70">
                      {helperMessage}
                    </p>
                  </div>
                </div>
              </div>
            </button>
          </div>
        )}

        {sortedItems.map((item) => {
          const isHovered = hoveredItemId === item.id;
          const isActive = activeItemId === item.id;
          const isToolbarHovered = hoveredToolbarId === item.id;
          const showToolbar = isHovered || isActive || isToolbarHovered;
          const showHandles = isActive;
          const isProcessing = processingIds.has(item.id);

          return (
            <div
              key={item.id}
              className="absolute"
              style={{
                left: item.x,
                top: item.y,
                width: item.width,
                height: item.height,
                transform: `rotate(${item.rotation}deg)`,
                transformOrigin: "center center",
                zIndex: item.zIndex ?? 0,
              }}
              onMouseEnter={() => setHoveredItemId(item.id)}
              onMouseLeave={() => {
                if (!isActive && !isToolbarHovered) setHoveredItemId(null);
              }}
            >
              <div
                onMouseDown={(e) => handleMouseDown(e, item.id, "drag")}
                className={cn(
                  "group/item relative h-full w-full overflow-hidden rounded-[18px] bg-transparent shadow-[0_16px_38px_hsl(var(--background)/0.34)] transition-[border-color,box-shadow,transform] duration-200",
                  "cursor-grab active:cursor-grabbing border-2",
                  isActive
                    ? "border-primary/60 shadow-[0_22px_48px_hsl(var(--primary)/0.18)]"
                    : isHovered
                      ? "border-primary/35"
                      : "border-transparent",
                )}
                style={{ touchAction: "none" }}
              >
                <img
                  src={item.imageUrl}
                  alt={item.category}
                  className="h-full w-full object-fill pointer-events-none"
                />
                {item.source ? (
                  <ItemCategoryBadge
                    source={item.source}
                    className="pointer-events-none z-10"
                  />
                ) : null}
                {/* Big, obvious processing overlay. Uses both a CSS spin
                    on the icon AND a CSS pulse on the backdrop so the user
                    has visual feedback even if one of the animations is
                    briefly throttled by WASM warmup on the main thread. */}
                {isProcessing ? (
                  <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-[16px] bg-background/70 backdrop-blur-sm animate-pulse">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-[11px] font-medium uppercase tracking-wider text-foreground">
                      Removing…
                    </span>
                  </div>
                ) : null}
              </div>

              {showToolbar && (
                <div
                  className="absolute left-1/2 top-0 z-50 flex -translate-x-1/2 -translate-y-[calc(100%+10px)] items-center gap-1 rounded-full border border-white/10 bg-background/92 p-1.5 shadow-lg backdrop-blur-md"
                  onMouseEnter={() => {
                    setHoveredToolbarId(item.id);
                    setHoveredItemId(item.id);
                  }}
                  onMouseLeave={() => {
                    if (!isActive) {
                      setHoveredToolbarId(null);
                      setHoveredItemId(null);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className={itemButtonClassName}
                    onClick={(e) => handleRemoveBackground(e, item)}
                    disabled={isProcessing}
                    title="Cut out background"
                    aria-label="Cut out background"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ImageMinus className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={itemButtonClassName}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEditingCanvasItem(item);
                    }}
                    disabled={isProcessing}
                    title="Edit with AI"
                    aria-label="Edit with AI"
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                  </Button>
                  <div className="mx-0.5 h-6 w-px bg-border/70" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className={itemButtonClassName}
                    onClick={(e) => handleSendToBack(e, item.id)}
                    title="Send to back"
                    aria-label="Send to back"
                  >
                    <ChevronsDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={itemButtonClassName}
                    onClick={(e) => handleSendBackward(e, item.id)}
                    title="Send backward"
                    aria-label="Send backward"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={itemButtonClassName}
                    onClick={(e) => handleBringForward(e, item.id)}
                    title="Bring forward"
                    aria-label="Bring forward"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={itemButtonClassName}
                    onClick={(e) => handleBringToFront(e, item.id)}
                    title="Bring to front"
                    aria-label="Bring to front"
                  >
                    <ChevronsUp className="h-3.5 w-3.5" />
                  </Button>
                  <div className="mx-0.5 h-6 w-px bg-border/70" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      itemButtonClassName,
                      "hover:bg-destructive hover:text-destructive-foreground",
                    )}
                    onClick={(e) => handleDelete(e, item.id)}
                    title="Remove from board"
                    aria-label="Remove from board"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              {showHandles && (
                <>
                  <div
                    onMouseDown={(e) => handleMouseDown(e, item.id, "rotate")}
                    className="absolute -top-8 left-1/2 z-50 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full border border-white/12 bg-primary shadow-lg cursor-grab active:cursor-grabbing"
                    style={{ touchAction: "none" }}
                    title="Rotate"
                  >
                    <RotateCw className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>

                  <div
                    onMouseDown={(e) =>
                      handleMouseDown(e, item.id, "resize", "nw")
                    }
                    className="absolute -left-1.5 -top-1.5 z-50 h-4 w-4 rounded-full border-2 border-background bg-primary shadow-lg cursor-nwse-resize"
                    style={{ touchAction: "none" }}
                    title="Resize"
                  />
                  <div
                    onMouseDown={(e) =>
                      handleMouseDown(e, item.id, "resize", "ne")
                    }
                    className="absolute -right-1.5 -top-1.5 z-50 h-4 w-4 rounded-full border-2 border-background bg-primary shadow-lg cursor-nesw-resize"
                    style={{ touchAction: "none" }}
                    title="Resize"
                  />
                  <div
                    onMouseDown={(e) =>
                      handleMouseDown(e, item.id, "resize", "se")
                    }
                    className="absolute -bottom-1.5 -right-1.5 z-50 h-4 w-4 rounded-full border-2 border-background bg-primary shadow-lg cursor-nwse-resize"
                    style={{ touchAction: "none" }}
                    title="Resize"
                  />
                  <div
                    onMouseDown={(e) =>
                      handleMouseDown(e, item.id, "resize", "sw")
                    }
                    className="absolute -bottom-1.5 -left-1.5 z-50 h-4 w-4 rounded-full border-2 border-background bg-primary shadow-lg cursor-nesw-resize"
                    style={{ touchAction: "none" }}
                    title="Resize"
                  />
                  <div
                    onMouseDown={(e) =>
                      handleMouseDown(e, item.id, "resize", "n")
                    }
                    className="absolute -top-1.5 left-1/2 z-50 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-background bg-primary shadow-lg cursor-ns-resize"
                    style={{ touchAction: "none" }}
                    title="Resize"
                  />
                  <div
                    onMouseDown={(e) =>
                      handleMouseDown(e, item.id, "resize", "s")
                    }
                    className="absolute -bottom-1.5 left-1/2 z-50 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-background bg-primary shadow-lg cursor-ns-resize"
                    style={{ touchAction: "none" }}
                    title="Resize"
                  />
                  <div
                    onMouseDown={(e) =>
                      handleMouseDown(e, item.id, "resize", "e")
                    }
                    className="absolute -right-1.5 top-1/2 z-50 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-background bg-primary shadow-lg cursor-ew-resize"
                    style={{ touchAction: "none" }}
                    title="Resize"
                  />
                  <div
                    onMouseDown={(e) =>
                      handleMouseDown(e, item.id, "resize", "w")
                    }
                    className="absolute -left-1.5 top-1/2 z-50 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-background bg-primary shadow-lg cursor-ew-resize"
                    style={{ touchAction: "none" }}
                    title="Resize"
                  />
                </>
              )}
            </div>
          );
        })}
          </div>
        </div>
      </div>
    </div>
    {/* AI image-edit dialog. Only mounted while a canvas item is being
        edited so the dialog's internal state (prompt, preview) resets
        cleanly between items. The "replace" mode swaps the canvas item's
        imageUrl/category in place (preserving size/position/rotation);
        "copy" adds a new canvas item next to the original. */}
    <ImageEditorDialog
      open={editingCanvasItem !== null}
      item={
        editingCanvasItem
          ? ({
              id: editingCanvasItem.id,
              category: normalizeClothingCategory(editingCanvasItem.category),
              imageUrl: editingCanvasItem.imageUrl,
              prompt: editingCanvasItem.prompt ?? "",
              createdAt: new Date().toISOString(),
            } as GeneratedItem)
          : null
      }
      onClose={() => setEditingCanvasItem(null)}
      onApply={(newItem, mode) => {
        if (!editingCanvasItem) return;
        // Look up the item again in case the user moved or resized it
        // while the dialog was open.
        const currentItem = items.find((i) => i.id === editingCanvasItem.id) ?? editingCanvasItem;
        if (mode === "replace") {
          onItemsChange(
            items.map((i) =>
              i.id === currentItem.id
                ? {
                    ...i,
                    imageUrl: newItem.imageUrl,
                    category: newItem.category,
                    prompt: newItem.prompt,
                  }
                : i,
            ),
          );
          toast.success("Item updated");
        } else {
          // Drop a copy next to the original, same size + rotation, and
          // bring it to front so the user immediately sees the duplicate.
          const offset = 24;
          const maxZ = items.length > 0 ? Math.max(...items.map((i) => i.zIndex ?? 0)) : 0;
          const copy: CanvasItem = {
            id: createId(),
            imageUrl: newItem.imageUrl,
            category: newItem.category,
            prompt: newItem.prompt,
            source: currentItem.source,
            x: currentItem.x + offset,
            y: currentItem.y + offset,
            width: currentItem.width,
            height: currentItem.height,
            rotation: currentItem.rotation,
            zIndex: maxZ + 1,
          };
          onItemsChange([...items, copy]);
          toast.success("Copy added to board");
        }
      }}
    />
    </>
  );
};

export default CanvasEditor;
