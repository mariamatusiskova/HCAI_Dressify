import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStudio } from "./Index";

const ItemPage = () => {
  const studio = useStudio();
  const savedGeneratedItems = [...studio.savedGeneratedItems].sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
  );

  if (savedGeneratedItems.length === 0) {
    return <div className="text-xs text-muted-foreground text-center py-4">No saved items yet</div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {savedGeneratedItems.map((item) => (
        <div key={item.savedId} className="rounded-lg border border-border bg-muted/20 p-2 space-y-2">
            <div className="relative aspect-square rounded-md overflow-hidden border border-border bg-muted/50">
              <img src={item.imageUrl} alt={item.category} className="w-full h-full object-cover" />
              <Badge className="absolute top-1 left-1 text-[9px] px-1 py-0 border-0 bg-background/80 text-foreground">
                AI
              </Badge>
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6"
                onClick={() => studio.handleDeleteSavedGeneratedItem(item.savedId)}
                title="Remove saved item"
                aria-label="Remove saved item"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            <div className="text-[11px] text-muted-foreground truncate">{item.category}</div>

            {item.prompt ? (
              <div className="text-[10px] text-muted-foreground line-clamp-2">{item.prompt}</div>
            ) : null}

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => studio.handleAddToCanvas(item)}
              >
                + Board
              </Button>
            </div>
          </div>
      ))}
    </div>
  );
};

export default ItemPage;