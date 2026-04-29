import SavedOutfitsLibrary from "@/components/SavedOutfitsLibrary";
import { useStudio } from "./Index";

// Saved outfits page. Same collections + edit-name + drag-and-drop UX as
// the wardrobe page, but operating on saved outfits.
const OutfitsPage = () => {
  const studio = useStudio();

  // SavedPage already supplies horizontal + bottom padding for the whole
  // saved area, so we render the library directly without an extra wrapper —
  // otherwise the duplicated padding leaves a visible strip under the tabs.
  return (
    <SavedOutfitsLibrary
      outfits={studio.outfits}
      onLoad={studio.handleLoad}
      onDelete={(id) => void studio.handleDeleteOutfit(id)}
      onUpdateName={studio.handleUpdateOutfitName}
      isLoading={studio.isLoading}
    />
  );
};

export default OutfitsPage;
