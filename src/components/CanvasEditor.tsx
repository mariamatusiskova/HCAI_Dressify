import { useRef, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, RotateCw } from "lucide-react";
import type { CanvasItem } from "@/hooks/useOutfits";

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

// How interactions work
const CanvasEditor = ({ userPhoto, items, onItemsChange, onDeleteItem }: CanvasEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>("none");
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const interactionStart = useRef({ x: 0, y: 0, item: null as CanvasItem | null });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, id: string, mode: InteractionMode = "drag") => {
      e.preventDefault();
      e.stopPropagation();
      const rect = containerRef.current?.getBoundingClientRect();
      const item = items.find((i) => i.id === id);
      if (!rect || !item) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      interactionStart.current = {
        x: mouseX,
        y: mouseY,
        item: { ...item },
      };

      setInteractionMode(mode);
      setActiveItemId(id);
    },
    [items]
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
        // Resize from bottom-right corner
        // Calculate the corner position in the original item's coordinate space
        const cornerX = startItem.x + startItem.width;
        const cornerY = startItem.y + startItem.height;
        
        // New corner position
        const newCornerX = Math.max(startItem.x + 40, Math.min(containerWidth, cornerX + deltaX));
        const newCornerY = Math.max(startItem.y + 40, Math.min(containerHeight, cornerY + deltaY));
        
        const minSize = 40;
        const maxSize = 300;
        const newWidth = Math.max(minSize, Math.min(maxSize, newCornerX - startItem.x));
        const newHeight = Math.max(minSize, Math.min(maxSize, newCornerY - startItem.y));

        // Keep top-left corner fixed, adjust size
        const newX = Math.max(0, Math.min(containerWidth - newWidth, startItem.x));
        const newY = Math.max(0, Math.min(containerHeight - newHeight, startItem.y));

        updatedItem = { ...item, width: newWidth, height: newHeight, x: newX, y: newY };
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

  // Rendering: what you see on screen
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
            className="absolute inset-0 w-full h-full object-contain opacity-40 pointer-events-none"
          />
        )}
        {!userPhoto && items.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm text-muted-foreground">Upload a photo & generate items</span>
          </div>
        )}
        {items.map((item) => {
          const isHovered = hoveredItemId === item.id;
          const isActive = activeItemId === item.id;
          const showControls = isHovered || isActive;

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
              }}
              onMouseEnter={() => setHoveredItemId(item.id)}
              onMouseLeave={() => {
                if (!isActive) setHoveredItemId(null);
              }}
            >
              {/* Main item */}
              <div
                onMouseDown={(e) => handleMouseDown(e, item.id, "drag")}
                className="w-full h-full rounded-md overflow-hidden border-2 border-primary/40 cursor-grab active:cursor-grabbing shadow-lg bg-background"
                style={{ touchAction: "none" }}
              >
                <img
                  src={item.imageUrl}
                  alt={item.category}
                  className="w-full h-full object-cover pointer-events-none"
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
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg z-10"
                    onMouseDown={(e) => handleDelete(e, item.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  {/* Rotation handle - top center */}
                  <div
                    onMouseDown={(e) => handleMouseDown(e, item.id, "rotate")}
                    className="absolute -top-6 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary border-2 border-background cursor-grab active:cursor-grabbing shadow-lg flex items-center justify-center z-10"
                    style={{ touchAction: "none" }}
                  >
                    <RotateCw className="h-3 w-3 text-primary-foreground" />
                  </div>

                  {/* Resize handle - bottom right corner */}
                  <div
                    onMouseDown={(e) => handleMouseDown(e, item.id, "resize")}
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary border-2 border-background cursor-nwse-resize shadow-lg z-10"
                    style={{ touchAction: "none" }}
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
