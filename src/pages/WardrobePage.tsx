import WardrobeLibrary from "@/components/WardrobeLibrary";
import { useStudio } from "./Index";

const WardrobePage = () => {
  const studio = useStudio();

  return (
    <div className="min-h-full px-4 pb-24 pt-2 md:px-6 lg:px-10 lg:pb-6">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <WardrobeLibrary
          items={studio.wardrobeItems}
          onAddToCanvas={studio.handleAddWardrobeToCanvas}
          onDelete={(id) => void studio.handleDeleteWardrobeItem(id)}
          onAddPhoto={studio.handleAddPhotoToWardrobe}
          isLoading={studio.wardrobeLoading}
        />
      </div>
    </div>
  );
};

export default WardrobePage;
