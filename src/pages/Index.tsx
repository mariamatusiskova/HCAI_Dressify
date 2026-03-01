import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import ConsentModal from "@/components/ConsentModal";
import UploadSection from "@/components/UploadSection";
import GeneratePanel from "@/components/GeneratePanel";
import GeneratedItemsList from "@/components/GeneratedItemsList";
import CanvasEditor from "@/components/CanvasEditor";
import OutfitLibrary from "@/components/OutfitLibrary";
import { useOutfits, type GeneratedItem, type CanvasItem } from "@/hooks/useOutfits";

const Index = () => {
  const [consented, setConsented] = useState(false);
  const [showConsent, setShowConsent] = useState(true);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [generatedItems, setGeneratedItems] = useState<GeneratedItem[]>([]);
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [outfitName, setOutfitName] = useState("");
  const { outfits, saveOutfit, deleteOutfit, loadOutfit } = useOutfits();

  const handleAgree = () => {
    setConsented(true);
    setShowConsent(false);
  };

  const handleItemGenerated = useCallback((item: GeneratedItem) => {
    setGeneratedItems((prev) => [item, ...prev]);
    toast.success(`${item.category} generated`);
  }, []);

  const handleItemUpdate = useCallback((itemId: string, updatedItem: GeneratedItem) => {
    setGeneratedItems((prev) => {
      const updated = prev.map((item) => (item.id === itemId ? updatedItem : item));
      // Also update canvas items if they use this image
      const oldItem = prev.find((gi) => gi.id === itemId);
      if (oldItem) {
        setCanvasItems((currentCanvasItems) =>
          currentCanvasItems.map((canvasItem) => {
            if (canvasItem.imageUrl === oldItem.imageUrl) {
              return { ...canvasItem, imageUrl: updatedItem.imageUrl };
            }
            return canvasItem;
          })
        );
      }
      return updated;
    });
  }, []);

  const handleAddToCanvas = useCallback((item: GeneratedItem) => {
    setCanvasItems((prev) => {
      // Get the highest zIndex and add 1 for new item (brings it to front)
      const maxZIndex = prev.length > 0 ? Math.max(...prev.map((i) => i.zIndex ?? 0)) : -1;
      const ci: CanvasItem = {
        id: crypto.randomUUID(),
        imageUrl: item.imageUrl,
        category: item.category,
        x: 40 + Math.random() * 80,
        y: 40 + Math.random() * 80,
        width: 80,
        height: 80,
        rotation: 0,
        zIndex: maxZIndex + 1,
      };
      return [...prev, ci];
    });
  }, []);

  const handleDeleteItem = useCallback((id: string) => {
    setCanvasItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleSave = () => {
    if (!outfitName.trim()) {
      toast.error("Enter an outfit name");
      return;
    }
    saveOutfit(outfitName.trim(), userPhoto, canvasItems);
    setOutfitName("");
    toast.success("Outfit saved");
  };

  const handleLoad = (id: string) => {
    const outfit = loadOutfit(id);
    if (outfit) {
      setUserPhoto(outfit.userPhoto);
      // Ensure backward compatibility: add default width, height, rotation, zIndex if missing
      const normalizedItems = outfit.canvasItems.map((item, index) => ({
        ...item,
        width: item.width ?? 80,
        height: item.height ?? 80,
        rotation: item.rotation ?? 0,
        zIndex: item.zIndex ?? index, // Assign zIndex based on order if missing
      }));
      setCanvasItems(normalizedItems);
      toast.info(`Loaded "${outfit.name}"`);
    }
  };

  if (!consented) {
    return <ConsentModal open={showConsent} onAgree={handleAgree} onCancel={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-display font-semibold tracking-tight">Dressify</h1>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">AI Outfit Generator</span>
      </header>

      {/* Main */}
      <div className="flex-1 flex flex-col lg:flex-row gap-0">
        {/* Sidebar */}
        <aside className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-border p-4 space-y-6 overflow-y-auto">
          <UploadSection photo={userPhoto} onPhotoChange={setUserPhoto} />
          <GeneratePanel onItemGenerated={handleItemGenerated} />
          <GeneratedItemsList
            items={generatedItems}
            onAddToCanvas={handleAddToCanvas}
            onItemUpdate={handleItemUpdate}
          />
        </aside>

        {/* Canvas */}
        <main className="flex-1 p-4 flex flex-col gap-4 min-h-0">
          <CanvasEditor
            userPhoto={userPhoto}
            items={canvasItems}
            onItemsChange={setCanvasItems}
            onDeleteItem={handleDeleteItem}
          />

          {/* Save bar */}
          <div className="flex gap-2">
            <Input
              placeholder="Outfit name…"
              value={outfitName}
              onChange={(e) => setOutfitName(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
            <Button onClick={handleSave} className="gap-1.5">
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>

          {/* Library */}
          <div className="space-y-2">
            <h3 className="text-sm font-display font-medium text-muted-foreground uppercase tracking-wider">
              Saved Outfits
            </h3>
            <OutfitLibrary outfits={outfits} onLoad={handleLoad} onDelete={deleteOutfit} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
