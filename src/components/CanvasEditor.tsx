import { useRef, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, RotateCw, Sparkles, Loader2, ArrowUp, ArrowDown, Layers } from "lucide-react";
import { toast } from "sonner";
import type { CanvasItem } from "@/hooks/useOutfits";
import { removeBackgroundAdvanced } from "@/services/backgroundRemoval";

// inputs to the component
interface CanvasEditorProps {
  // URL/base64 string for the user image (background), or null
  userPhoto: string | null;
  // array of CanvasItem objects (each item has id, x, y, width, height, rotation, imageUrl, category)
  items: CanvasItem[];
  // callback whenever the user moves/resizes/rotates something
  onItemsChange: (items: CanvasItem[]) => void;
  // callback when user clicks delete on an item
  onDeleteItem: (id: string) => void;
}

// Key internal state
type InteractionMode = "none" | "drag" | "resize" | "rotate";
type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

// How interactions work
const CanvasEditor = ({ userPhoto, items, onItemsChange, onDeleteItem }: CanvasEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>("none");
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [hoveredLayerControlsId, setHoveredLayerControlsId] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const interactionStart = useRef({ 
    x: 0, 
    y: 0, 
    item: null as CanvasItem | null,
    resizeHandle: null as ResizeHandle | null 
  });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, id: string, mode: InteractionMode = "drag", resizeHandle?: ResizeHandle) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = containerRef.current?.getBoundingClientRect();
      const item = items.find((i) => i.id === id);
      if (!rect || !item) return;

      // Bring item to front when clicked/selected
      if (mode === "drag") {
        const maxZIndex = items.length > 0 ? Math.max(...items.map((i) => i.zIndex ?? 0)) : 0;
        if ((item.zIndex ?? 0) < maxZIndex) {
          const updatedItems = items.map((i) =>
            i.id === id ? { ...i, zIndex: maxZIndex + 1 } : i
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
    [items, onItemsChange]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (interactionMode === "none" || !activeItemId || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const deltaX = mouseX - interactionStart.current.x;
      const deltaY = mouseY - interactionStart.current.y;

      const item = items.find((i) => i.id === activeItemId);
      if (!item || !interactionStart.current.item) return;

      const startItem = interactionStart.current.item;
      const containerWidth = rect.width;
      const containerHeight = rect.height;

      let updatedItem: CanvasItem = { ...item };

      if (interactionMode === "drag") {
        const newX = Math.max(0, Math.min(containerWidth - item.width, startItem.x + deltaX));
        const newY = Math.max(0, Math.min(containerHeight - item.height, startItem.y + deltaY));
        updatedItem = { ...item, x: newX, y: newY };
      } else if (interactionMode === "resize") {
        const handle = interactionStart.current.resizeHandle || "se";
        const minSize = 40;
        
        let newX = startItem.x;
        let newY = startItem.y;
        let newWidth = startItem.width;
        let newHeight = startItem.height;
        
        // Free transform - resize from any corner or edge
        if (handle.includes("e")) {
          // Right edge or corners - adjust width
          newWidth = Math.max(minSize, startItem.width + deltaX);
        }
        if (handle.includes("w")) {
          // Left edge or corners - adjust position and width
          const newWidthValue = Math.max(minSize, startItem.width - deltaX);
          newX = startItem.x + (startItem.width - newWidthValue);
          newWidth = newWidthValue;
        }
        if (handle.includes("s")) {
          // Bottom edge or corners - adjust height
          newHeight = Math.max(minSize, startItem.height + deltaY);
        }
        if (handle.includes("n")) {
          // Top edge or corners - adjust position and height
          const newHeightValue = Math.max(minSize, startItem.height - deltaY);
          newY = startItem.y + (startItem.height - newHeightValue);
          newHeight = newHeightValue;
        }

        updatedItem = { ...item, x: newX, y: newY, width: newWidth, height: newHeight };

      } else if (interactionMode === "rotate") {
        const centerX = startItem.x + startItem.width / 2;
        const centerY = startItem.y + startItem.height / 2;
        const angle1 = Math.atan2(
          interactionStart.current.y - centerY,
          interactionStart.current.x - centerX
        );
        const angle2 = Math.atan2(mouseY - centerY, mouseX - centerX);
        const deltaAngle = ((angle2 - angle1) * 180) / Math.PI;
        const newRotation = (startItem.rotation + deltaAngle) % 360;
        updatedItem = { ...item, rotation: newRotation };
      }

      onItemsChange(items.map((i) => (i.id === activeItemId ? updatedItem : i)));
    },
    [interactionMode, activeItemId, items, onItemsChange]
  );

  const handleMouseUp = useCallback(() => {
    setInteractionMode("none");
    setActiveItemId(null);
  }, []);

  const handleDelete = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      onDeleteItem(id);
    },
    [onDeleteItem]
  );

  const handleRemoveBackground = useCallback(
    async (e: React.MouseEvent, item: CanvasItem) => {
      e.preventDefault();
      e.stopPropagation();
      setProcessingIds((prev) => new Set(prev).add(item.id));

      try {
        const processedImageUrl = await removeBackgroundAdvanced(item.imageUrl, 25, true);
        const updatedItems = items.map((i) =>
          i.id === item.id ? { ...i, imageUrl: processedImageUrl } : i
        );
        onItemsChange(updatedItems);
        toast.success("Background removed");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to remove background";
        toast.error(errorMessage);
        console.error("Background removal error:", error);
      } finally {
        setProcessingIds((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      }
    },
    [items, onItemsChange]
  );

  const handleBringToFront = useCallback(
    (e: React.MouseEvent, itemId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const maxZIndex = items.length > 0 ? Math.max(...items.map((i) => i.zIndex ?? 0)) : 0;
      const updatedItems = items.map((i) =>
        i.id === itemId ? { ...i, zIndex: maxZIndex + 1 } : i
      );
      onItemsChange(updatedItems);
      toast.success("Brought to front");
    },
    [items, onItemsChange]
  );

  const handleSendToBack = useCallback(
    (e: React.MouseEvent, itemId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const minZIndex = items.length > 0 ? Math.min(...items.map((i) => i.zIndex ?? 0)) : 0;
      const updatedItems = items.map((i) =>
        i.id === itemId ? { ...i, zIndex: minZIndex - 1 } : i
      );
      onItemsChange(updatedItems);
      toast.success("Sent to back");
    },
    [items, onItemsChange]
  );

  const handleBringForward = useCallback(
    (e: React.MouseEvent, itemId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      const currentZIndex = item.zIndex ?? 0;
      // Find the next highest zIndex
      const higherItems = items.filter((i) => (i.zIndex ?? 0) > currentZIndex);
      if (higherItems.length === 0) {
        // Already at front
        handleBringToFront(e, itemId);
        return;
      }

      const nextZIndex = Math.min(...higherItems.map((i) => i.zIndex ?? 0));
      const updatedItems = items.map((i) =>
        i.id === itemId ? { ...i, zIndex: nextZIndex } : i
      );
      onItemsChange(updatedItems);
      toast.success("Brought forward");
    },
    [items, onItemsChange, handleBringToFront]
  );

  const handleSendBackward = useCallback(
    (e: React.MouseEvent, itemId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      const currentZIndex = item.zIndex ?? 0;
      // Find the next lowest zIndex
      const lowerItems = items.filter((i) => (i.zIndex ?? 0) < currentZIndex);
      if (lowerItems.length === 0) {
        // Already at back
        handleSendToBack(e, itemId);
        return;
      }

      const nextZIndex = Math.max(...lowerItems.map((i) => i.zIndex ?? 0));
      const updatedItems = items.map((i) =>
        i.id === itemId ? { ...i, zIndex: nextZIndex } : i
      );
      onItemsChange(updatedItems);
      toast.success("Sent backward");
    },
    [items, onItemsChange, handleSendToBack]
  );

  // Sort items by zIndex for rendering (lower zIndex renders first, higher renders on top)
  const sortedItems = [...items].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

  return (
    <div className="space-y-3 flex-1 flex flex-col min-h-0">
      <h3 className="text-sm font-display font-medium text-muted-foreground uppercase tracking-wider">
        Canvas
      </h3>
      <div
        ref={containerRef}
        className="relative flex-1 rounded-lg border border-border bg-muted/20 min-h-[300px] overflow-hidden select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {userPhoto && (
          <img
            src={userPhoto}
            alt="User"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />
        )}
        {!userPhoto && items.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm text-muted-foreground">Upload a photo & generate items</span>
          </div>
        )}
        {sortedItems.map((item) => {
          const isHovered = hoveredItemId === item.id;
          const isActive = activeItemId === item.id;
          const isLayerControlsHovered = hoveredLayerControlsId === item.id;
          const showControls = isHovered || isActive;
          const showLayerControls = showControls || isLayerControlsHovered;
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
                if (!isActive && !isLayerControlsHovered) setHoveredItemId(null);
              }}
            >
              {/* Main item */}
              <div
                onMouseDown={(e) => handleMouseDown(e, item.id, "drag")}
                className="item-content w-full h-full rounded-md overflow-hidden border-2 border-primary/40 cursor-grab active:cursor-grabbing shadow-lg bg-transparent"
                style={{ touchAction: "none" }}
              >
                <img
                  src={item.imageUrl}
                  alt={item.category}
                  className="w-full h-full object-fill pointer-events-none"
                />
                <Badge className="absolute -top-1 -right-1 text-[8px] px-1 py-0 bg-ai-badge/90 text-foreground border-0 pointer-events-none">
                  AI
                </Badge>
              </div>

              {/* Controls overlay - only visible when hovered or active */}
              {showControls && (
                <>
                  {/* Delete button */}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg z-50"
                    onMouseDown={(e) => handleDelete(e, item.id)}
                    title="Delete"
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  {/* Layer controls - vertical slider on right side */}
                  <div
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full ml-1 flex flex-col gap-1 z-50 bg-background/95 backdrop-blur-sm rounded-md p-1 border border-border shadow-lg"
                    onMouseEnter={() => {
                      setHoveredLayerControlsId(item.id);
                      setHoveredItemId(item.id);
                    }}
                    onMouseLeave={() => {
                      if (!isActive) {
                        setHoveredLayerControlsId(null);
                        setHoveredItemId(null);
                      }
                    }}
                  >
                    {/* Background removal button - at top of layer controls */}
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 rounded shadow-sm hover:bg-primary hover:text-primary-foreground"
                      onMouseDown={(e) => handleRemoveBackground(e, item)}
                      disabled={isProcessing}
                      title="Remove background"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <div className="h-px bg-border my-0.5" />
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 rounded shadow-sm hover:bg-primary hover:text-primary-foreground"
                      onMouseDown={(e) => handleBringToFront(e, item.id)}
                      title="Bring to front"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 rounded shadow-sm hover:bg-primary hover:text-primary-foreground"
                      onMouseDown={(e) => handleBringForward(e, item.id)}
                      title="Bring forward"
                    >
                      <ArrowUp className="h-2.5 w-2.5" />
                    </Button>
                    <div className="h-px bg-border my-0.5" />
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 rounded shadow-sm hover:bg-primary hover:text-primary-foreground"
                      onMouseDown={(e) => handleSendBackward(e, item.id)}
                      title="Send backward"
                    >
                      <ArrowDown className="h-2.5 w-2.5" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 rounded shadow-sm hover:bg-primary hover:text-primary-foreground"
                      onMouseDown={(e) => handleSendToBack(e, item.id)}
                      title="Send to back"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Rotation handle - top center */}
                  <div
                    onMouseDown={(e) => handleMouseDown(e, item.id, "rotate")}
                    className="absolute -top-6 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary border-2 border-background cursor-grab active:cursor-grabbing shadow-lg flex items-center justify-center z-50"
                    style={{ touchAction: "none" }}
                    title="Rotate"
                  >
                    <RotateCw className="h-3 w-3 text-primary-foreground" />
                  </div>

                  {/* Free transform resize handles - all corners and edges */}
                  {/* Corner handles */}
                  <div
                    onMouseDown={(e) => handleMouseDown(e, item.id, "resize", "nw")}
                    className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-primary border-2 border-background cursor-nwse-resize shadow-lg z-50"
                    style={{ touchAction: "none" }}
                    title="Resize"
                  />
                  <div
                    onMouseDown={(e) => handleMouseDown(e, item.id, "resize", "ne")}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary border-2 border-background cursor-nesw-resize shadow-lg z-50"
                    style={{ touchAction: "none" }}
                    title="Resize"
                  />
                  <div
                    onMouseDown={(e) => handleMouseDown(e, item.id, "resize", "se")}
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary border-2 border-background cursor-nwse-resize shadow-lg z-50"
                    style={{ touchAction: "none" }}
                    title="Resize"
                  />
                  <div
                    onMouseDown={(e) => handleMouseDown(e, item.id, "resize", "sw")}
                    className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-primary border-2 border-background cursor-nesw-resize shadow-lg z-50"
                    style={{ touchAction: "none" }}
                    title="Resize"
                  />
                  
                  {/* Edge handles */}
                  <div
                    onMouseDown={(e) => handleMouseDown(e, item.id, "resize", "n")}
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary border-2 border-background cursor-ns-resize shadow-lg z-50"
                    style={{ touchAction: "none" }}
                    title="Resize"
                  />
                  <div
                    onMouseDown={(e) => handleMouseDown(e, item.id, "resize", "s")}
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary border-2 border-background cursor-ns-resize shadow-lg z-50"
                    style={{ touchAction: "none" }}
                    title="Resize"
                  />
                  <div
                    onMouseDown={(e) => handleMouseDown(e, item.id, "resize", "e")}
                    className="absolute -right-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary border-2 border-background cursor-ew-resize shadow-lg z-50"
                    style={{ touchAction: "none" }}
                    title="Resize"
                  />
                  <div
                    onMouseDown={(e) => handleMouseDown(e, item.id, "resize", "w")}
                    className="absolute -left-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary border-2 border-background cursor-ew-resize shadow-lg z-50"
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
  );
};

export default CanvasEditor;
