import SavedItemsLibrary from "@/components/SavedItemsLibrary";
import { useStudio } from "./Index";
import type { GeneratedItem } from "@/hooks/useOutfits";
import type { SavedAiItem } from "@/hooks/useSavedItems";

// Saved AI items page. Mirrors the wardrobe page layout (collections,
// search, edit name, drag-and-drop) but for pieces the user generated and
// flagged as saved instead of personal photos.
const ItemPage = () => {
  const studio = useStudio();

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
  };

  return (
    <div className="px-1 pb-6 md:px-2">
      <SavedItemsLibrary
        items={studio.savedGeneratedItems}
        onAddToCanvas={handleAddSavedItemToCanvas}
        onDelete={(id) => void studio.handleDeleteSavedGeneratedItem(id)}
        onUpdateName={studio.handleUpdateSavedItemName}
        isLoading={studio.savedItemsLoading}
      />
    </div>
  );
};

export default ItemPage;
