import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { GeneratedItem, CanvasItem } from "@/hooks/useOutfits";
import { removeBackgroundAdvanced } from "@/services/backgroundRemoval";

interface GeneratedItemsListProps {
  // the generated items to display
  items: GeneratedItem[];
  // function to run when the user clicks an item
  onAddToCanvas: (item: GeneratedItem) => void;
  onItemUpdate?: (itemId: string, updatedItem: GeneratedItem) => void;
}

const GeneratedItemsList = ({ items, onAddToCanvas, onItemUpdate }: GeneratedItemsListProps) => {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const handleRemoveBackground = async (e: React.MouseEvent, item: GeneratedItem) => {
    e.stopPropagation();
    setProcessingIds((prev) => new Set(prev).add(item.id));

    try {
      const processedImageUrl = await removeBackgroundAdvanced(item.imageUrl, 25, true);
      const updatedItem: GeneratedItem = {
        ...item,
        imageUrl: processedImageUrl,
      };

      if (onItemUpdate) {
        onItemUpdate(item.id, updatedItem);
      }
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
  };

  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-display font-medium text-muted-foreground uppercase tracking-wider">
        Generated Items
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => {
          const isProcessing = processingIds.has(item.id);
          return (
            <div key={item.id} className="relative group">
              <button
                onClick={() => onAddToCanvas(item)}
                className="relative w-full rounded-lg overflow-hidden border border-border bg-muted aspect-square card-hover"
              >
                <img src={item.imageUrl} alt={item.category} className="w-full h-full object-cover" />
                <Badge className="absolute top-1 left-1 text-[9px] px-1 py-0 bg-ai-badge/90 text-foreground border-0">
                  AI
                </Badge>
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">+ Canvas</span>
                </div>
              </button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute bottom-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={(e) => handleRemoveBackground(e, item)}
                disabled={isProcessing}
                title="Remove background"
              >
                {isProcessing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GeneratedItemsList;
