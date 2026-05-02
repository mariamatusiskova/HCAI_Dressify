import { useNavigate } from "react-router-dom";
import WardrobeLibrary from "@/components/WardrobeLibrary";
import { useStudio } from "./Index";
import type { WardrobeItem } from "@/hooks/useWardrobe";

const WardrobePage = () => {
  const studio = useStudio();
  const navigate = useNavigate();

  const handleAddWardrobeAndOpenBoard = (item: WardrobeItem) => {
    studio.handleAddWardrobeToCanvas(item);
    // The board lives on the home page, so jump there so the user sees
    // the piece they just added rather than staying on /wardrobe with no
    // visible feedback.
    navigate("/");
  };

  return (
    <div className="min-h-full px-4 pb-24 pt-2 md:px-6 lg:px-10 lg:pb-6">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <WardrobeLibrary
          items={studio.wardrobeItems}
          onAddToCanvas={handleAddWardrobeAndOpenBoard}
          onDelete={(id) => void studio.handleDeleteWardrobeItem(id)}
          onAddPhoto={studio.handleAddPhotoToWardrobe}
          onUpdateName={studio.handleUpdateWardrobeItemName}
          isLoading={studio.wardrobeLoading}
        />
      </div>
    </div>
  );
};

export default WardrobePage;
