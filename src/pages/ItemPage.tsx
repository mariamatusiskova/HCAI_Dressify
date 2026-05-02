import { useNavigate } from "react-router-dom";
import SavedItemsLibrary from "@/components/SavedItemsLibrary";
import { useStudio } from "./Index";
import type { GeneratedItem } from "@/hooks/useOutfits";
import type { SavedAiItem } from "@/hooks/useSavedItems";

// Saved AI items page. Mirrors the wardrobe page layout (collections,
// search, edit name, drag-and-drop) but for pieces the user generated and
// flagged as saved instead of personal photos.
const ItemPage = () => {
  const studio = useStudio();
  const navigate = useNavigate();

  const handleAddSavedItemToCanvas = (item: SavedAiItem) => {
    // The board's add-to-canvas handler expects the GeneratedItem shape,
    // so synthesize one here. The original generated item may no longer
    // exist, but the canvas only needs the minimal fields below.
    const asGenerated: GeneratedItem = {
      id: item.id,
      category: item.category,
      imageUrl: item.imageUrl,
      prompt: item.prompt,
      createdAt: item.savedAt,
    };
    studio.handleAddToCanvas(asGenerated);
    // Send the user back to the board so they immediately see the piece
    // they just added; otherwise nothing visibly happens on this page.
    navigate("/");
  };

  // SavedPage already supplies horizontal + bottom padding for the whole
  // saved area, so we render the library directly without an extra wrapper —
  // otherwise the duplicated padding leaves a visible strip under the tabs.
  return (
    <SavedItemsLibrary
      items={studio.savedGeneratedItems}
      onAddToCanvas={handleAddSavedItemToCanvas}
      onDelete={(id) => void studio.handleDeleteSavedGeneratedItem(id)}
      onUpdateName={studio.handleUpdateSavedItemName}
      isLoading={studio.savedItemsLoading}
    />
  );
};

export default ItemPage;
