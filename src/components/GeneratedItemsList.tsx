import { Badge } from "@/components/ui/badge";
import type { GeneratedItem, CanvasItem } from "@/hooks/useOutfits";

interface GeneratedItemsListProps {
  items: GeneratedItem[];
  onAddToCanvas: (item: GeneratedItem) => void;
}

const GeneratedItemsList = ({ items, onAddToCanvas }: GeneratedItemsListProps) => {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-display font-medium text-muted-foreground uppercase tracking-wider">
        Generated Items
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onAddToCanvas(item)}
            className="relative rounded-lg overflow-hidden border border-border bg-muted aspect-square card-hover group"
          >
            <img src={item.imageUrl} alt={item.category} className="w-full h-full object-cover" />
            <Badge className="absolute top-1 left-1 text-[9px] px-1 py-0 bg-ai-badge/90 text-foreground border-0">
              AI
            </Badge>
            <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-xs font-medium text-primary">+ Canvas</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default GeneratedItemsList;
