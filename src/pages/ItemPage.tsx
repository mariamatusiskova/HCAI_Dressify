import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStudio } from "./Index";

type MergedItem =
  | {
      id: string;
      source: "generated";
      category: string;
      imageUrl: string;
      createdAt: string;
      prompt?: string;
    }
  | {
      id: string;
      source: "wardrobe";
      category: string;
      imageUrl: string;
      createdAt: string;
    };

const ItemPage = () => {
  const studio = useStudio();

  const generatedItems: MergedItem[] = studio.generatedItems.map((item) => ({
    id: `generated-${item.id}`,
    source: "generated",
    category: item.category,
    imageUrl: item.imageUrl,
    createdAt: item.createdAt,
    prompt: item.prompt,
  }));

  const wardrobeItems: MergedItem[] = studio.wardrobeItems.map((item) => ({
    id: `wardrobe-${item.id}`,
    source: "wardrobe",
    category: item.category,
    imageUrl: item.imageUrl,
    createdAt: item.createdAt,
  }));

  const mergedItems = [...generatedItems, ...wardrobeItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (mergedItems.length === 0) {
    return <div className="text-xs text-muted-foreground text-center py-4">No saved items yet</div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {mergedItems.map((item) => (
        <div key={item.id} className="rounded-lg border border-border bg-muted/20 p-2 space-y-2">
          <div className="relative aspect-square rounded-md overflow-hidden border border-border bg-muted/50">
            <img src={item.imageUrl} alt={item.category} className="w-full h-full object-cover" />
            <Badge className="absolute top-1 left-1 text-[9px] px-1 py-0 border-0 bg-background/80 text-foreground">
              {item.source === "generated" ? "Generated" : "Wardrobe"}
            </Badge>
          </div>

          <div className="text-[11px] text-muted-foreground truncate">{item.category}</div>

          {item.source === "generated" && item.prompt ? (
            <div className="text-[10px] text-muted-foreground line-clamp-2">{item.prompt}</div>
          ) : null}

          <div className="flex gap-2">
            {item.source === "generated" ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    const source = studio.generatedItems.find((entry) => `generated-${entry.id}` === item.id);
                    if (source) {
                      studio.handleAddToCanvas(source);
                    }
                  }}
                >
                  + Canvas
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    const source = studio.generatedItems.find((entry) => `generated-${entry.id}` === item.id);
                    if (source) {
                      void studio.handleAddGeneratedToWardrobe(source);
                    }
                  }}
                >
                  + Wardrobe
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  const source = studio.wardrobeItems.find((entry) => `wardrobe-${entry.id}` === item.id);
                  if (source) {
                    studio.handleAddWardrobeToCanvas({ imageUrl: source.imageUrl, category: source.category });
                  }
                }}
              >
                + Canvas
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ItemPage;
