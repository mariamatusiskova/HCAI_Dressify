import WardrobeLibrary from "@/components/WardrobeLibrary";
import { Button } from "@/components/ui/button";
import { useStudio } from "./Index";

const WardrobePage = () => {
  const studio = useStudio();

  return (
    <div className="min-h-full p-4 space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">

        <Button
          asChild
          variant="secondary"
          className="h-10 w-fit rounded-xl border border-white/10 bg-background/56 px-4"
        >
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