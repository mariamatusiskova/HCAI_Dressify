import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FolderOpen, ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ItemCategoryBadge from "@/components/ItemCategoryBadge";
import { getClothingCategoryLabel } from "@/lib/clothingCategory";
import { useStudio } from "./Index";

// Detail view for a single saved outfit. Reached from the /outfits list
// when the user taps a card; surfaces every item that was on the board
// when the outfit was saved + a way to load the look back onto the canvas.
const OutfitDetailPage = () => {
  const { outfitId = "" } = useParams<{ outfitId: string }>();
  const studio = useStudio();
  const navigate = useNavigate();

  const outfit = useMemo(
    () => studio.outfits.find((o) => o.id === outfitId) ?? null,
    [outfitId, studio.outfits],
  );

  if (!outfit) {
    return (
      <div className="glass-panel-soft mx-auto max-w-xl rounded-[22px] border px-6 py-10 text-center">
        <p className="text-sm font-medium text-foreground">
          That outfit could not be found.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          It may have been deleted, or your saved outfits are still loading.
        </p>
        <Button asChild variant="secondary" className="mt-4 rounded-xl">
          <Link to="/outfits">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to saved outfits
          </Link>
        </Button>
      </div>
    );
  }

  const sortedItems = [...outfit.canvasItems].sort(
    (a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0),
  );

  const savedDate = new Date(outfit.timestamp).toLocaleDateString();

  const handleOpenOnBoard = () => {
    studio.handleLoad(outfit.id);
    // Loading an outfit replaces the canvas state; the home page is where
    // the user can actually see and edit it.
    navigate("/");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <Link
            to="/outfits"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-muted-foreground/80 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            Saved outfits
          </Link>
          <h2 className="text-2xl font-display font-medium text-foreground">
            {outfit.name}
          </h2>
          <p className="text-xs text-muted-foreground">
            Saved {savedDate} · {outfit.canvasItems.length}{" "}
            {outfit.canvasItems.length === 1 ? "item" : "items"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            className="h-10 gap-2 rounded-xl border border-white/10 bg-background/56 px-4"
            onClick={handleOpenOnBoard}
          >
            <FolderOpen className="h-4 w-4" />
            Open on board
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-10 gap-2 rounded-xl border border-destructive/30 px-4 text-destructive hover:bg-destructive/10"
            onClick={async () => {
              await studio.handleDeleteOutfit(outfit.id);
              navigate("/outfits");
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete outfit
          </Button>
        </div>
      </div>

      <div className="glass-panel rounded-[28px] border p-5">
        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-display font-medium text-foreground">
              Items in this outfit
            </h3>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
              {outfit.canvasItems.length}{" "}
              {outfit.canvasItems.length === 1 ? "piece" : "pieces"}
            </p>
          </div>

          {sortedItems.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-white/12 px-6 py-10 text-center text-sm text-muted-foreground">
              This outfit was saved without any pieces on the board.
            </div>
          ) : (
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(min(100%, 180px), 220px))",
              }}
            >
              {sortedItems.map((item) => (
                <div
                  key={item.id}
                  className="group relative overflow-hidden rounded-[18px] border border-white/8 bg-background/52 p-2"
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[16px] border border-white/8 bg-white/[0.03]">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.category}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground/40">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                    {item.source ? <ItemCategoryBadge source={item.source} /> : null}
                  </div>

                  <div className="space-y-1 px-1 pb-1 pt-2.5">
                    <div className="truncate text-sm font-medium text-foreground">
                      {getClothingCategoryLabel(item.category, item.prompt)}
                    </div>
                    {item.prompt ? (
                      <div className="line-clamp-2 text-[11px] leading-4 text-muted-foreground">
                        {item.prompt}
                      </div>
                    ) : (
                      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">
                        {item.source === "wardrobe" ? "From wardrobe" : "AI piece"}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutfitDetailPage;
