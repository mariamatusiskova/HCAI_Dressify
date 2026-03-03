import { Button } from "@/components/ui/button";
import { Trash2, FolderOpen } from "lucide-react";
import type { Outfit } from "@/hooks/useOutfits";

// outfits: Outfit[] → the saved outfits to display
// onLoad(id) → callback when the user clicks “open/load”
// onDelete(id) → callback when the user clicks “delete”
interface OutfitLibraryProps {
  outfits: Outfit[];
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}

const OutfitLibrary = ({ outfits, onLoad, onDelete }: OutfitLibraryProps) => {
  if (outfits.length === 0) {
    return (
      <div className="text-xs text-muted-foreground text-center py-4">
        No saved outfits yet
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {outfits.map((outfit) => (
        <div
          key={outfit.id}
          className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 card-hover"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{outfit.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {new Date(outfit.timestamp).toLocaleDateString()} · {outfit.canvasItems.length} items
            </p>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onLoad(outfit.id)}>
              <FolderOpen className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(outfit.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OutfitLibrary;
