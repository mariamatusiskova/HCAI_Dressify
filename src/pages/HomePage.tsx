import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UploadSection from "@/components/UploadSection";
import GeneratePanel from "@/components/GeneratePanel";
import GeneratedItemsList from "@/components/GeneratedItemsList";
import CanvasEditor from "@/components/CanvasEditor";
import OutfitLibrary from "@/components/OutfitLibrary";
import { useStudio } from "./Index";

const HomePage = () => {
  const studio = useStudio();

  return (
    <div className="h-full flex flex-col lg:flex-row gap-0">
      <aside className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-border p-4 space-y-6 overflow-y-auto">
        <UploadSection photo={studio.userPhoto} onPhotoChange={studio.setUserPhoto} />

        <GeneratePanel onItemGenerated={studio.handleItemGenerated} />

        <GeneratedItemsList
          items={studio.generatedItems}
          onAddToCanvas={studio.handleAddToCanvas}
          onItemUpdate={studio.handleItemUpdate}
          onAddToWardrobe={(item) => void studio.handleAddGeneratedToWardrobe(item)}
        />
      </aside>

      <main className="flex-1 p-4 flex flex-col gap-4 min-h-0">
        <CanvasEditor
          userPhoto={studio.userPhoto}
          items={studio.canvasItems}
          onItemsChange={studio.setCanvasItems}
          onDeleteItem={studio.handleDeleteItem}
        />

        <div className="flex gap-2">
          <Input
            placeholder="Outfit name..."
            value={studio.outfitName}
            onChange={(e) => studio.setOutfitName(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && void studio.handleSave()}
          />
          <Button onClick={() => void studio.handleSave()} className="gap-1.5" disabled={studio.isLoading}>
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-display font-medium text-muted-foreground uppercase tracking-wider">Saved Outfits</h3>
          <OutfitLibrary
            outfits={studio.outfits}
            onLoad={studio.handleLoad}
            onDelete={(id) => void studio.handleDeleteOutfit(id)}
          />
        </div>
      </main>
    </div>
  );
};

export default HomePage;
