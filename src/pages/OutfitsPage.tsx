import OutfitLibrary from "@/components/OutfitLibrary";
import { useStudio } from "./Index";

const OutfitsPage = () => {
  const studio = useStudio();

  return (
    <OutfitLibrary
      outfits={studio.outfits}
      onLoad={studio.handleLoad}
      onDelete={(id) => void studio.handleDeleteOutfit(id)}
    />
  );
};

export default OutfitsPage;
