import WardrobeLibrary from "@/components/WardrobeLibrary";
import { useStudio } from "./Index";

const WardrobePage = () => {
  const studio = useStudio();

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-sm font-display font-medium text-muted-foreground uppercase tracking-wider">Wardrobe</h2>
      <WardrobeLibrary
        items={studio.wardrobeItems}
        onAddToCanvas={studio.handleAddWardrobeToCanvas}
        onDelete={(id) => void studio.handleDeleteWardrobeItem(id)}
        onAddPhoto={(imageUrl, category) => void studio.handleAddPhotoToWardrobe(imageUrl, category)}
        isLoading={studio.wardrobeLoading}
      />
    </div>
  );
};

export default WardrobePage;
