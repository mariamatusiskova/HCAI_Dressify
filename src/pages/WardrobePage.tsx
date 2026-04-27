import { Link } from "react-router-dom";
import WardrobeLibrary from "@/components/WardrobeLibrary";
import { Button } from "@/components/ui/button";
import { useStudio } from "./Index";

const WardrobePage = () => {
  const studio = useStudio();
  const savedAiItemsCount = studio.savedGeneratedItems.length;

  return (
    <div className="min-h-full p-4 space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-sm font-display font-medium text-muted-foreground uppercase tracking-wider">
            Wardrobe
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Organize your real wardrobe pieces into synced folder boards, drag
            items between collections, and keep your favorite covers/colors
            across devices.
          </p>
        </div>

        <Button
          asChild
          variant="secondary"
          className="h-10 w-fit rounded-xl border border-white/10 bg-background/56 px-4"
        >
          <Link to="/saved/items">Open AI items</Link>
        </Button>
      </div>

      <div className="glass-panel-soft flex flex-col gap-2 rounded-[22px] border px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Keep the wardrobe focused on real saved pieces.
          </p>
          <p className="text-sm text-muted-foreground">
            Generated items stay in Saved &gt; AI Items until you choose what
            belongs in your permanent wardrobe.
          </p>
        </div>

        <Button
          asChild
          variant="secondary"
          className="h-10 w-fit rounded-xl border border-white/10 bg-background/56 px-4"
        >
          <Link to="/saved/items">
            {savedAiItemsCount} AI item{savedAiItemsCount === 1 ? "" : "s"} in
            staging
          </Link>
        </Button>
      </div>

      <WardrobeLibrary
        items={studio.wardrobeItems}
        onAddToCanvas={studio.handleAddWardrobeToCanvas}
        onDelete={(id) => void studio.handleDeleteWardrobeItem(id)}
        onAddPhoto={studio.handleAddPhotoToWardrobe}
        isLoading={studio.wardrobeLoading}
      />
    </div>
  );
};

export default WardrobePage;