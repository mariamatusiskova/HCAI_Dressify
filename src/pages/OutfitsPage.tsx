import SavedOutfitsLibrary from "@/components/SavedOutfitsLibrary";
import { useStudio } from "./Index";

// Saved outfits page. Same collections + edit-name + drag-and-drop UX as
// the wardrobe page, but operating on saved outfits.
const OutfitsPage = () => {
  const studio = useStudio();

  return (
    <div className="px-1 pb-6 md:px-2">
      <SavedOutfitsLibrary
        outfits={studio.outfits}
        onLoad={studio.handleLoad}
        onDelete={(id) => void studio.handleDeleteOutfit(id)}
        onUpdateName={studio.handleUpdateOutfitName}
        isLoading={studio.isLoading}
      />
    </div>
  );
};

export default OutfitsPage;
