// save icon
import { Save } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// generate outfit/item ideas
import GeneratePanel from "@/components/GeneratePanel";
// show generated items
import GeneratedItemsList from "@/components/GeneratedItemsList";
// place items on the canvas
import CanvasEditor from "@/components/CanvasEditor";
import WardrobeLibrary from "@/components/WardrobeLibrary";
import { cn } from "@/lib/utils";
import { useStudio } from "./Index";

const HomePage = () => {
  const studio = useStudio();
  const panelShell = "glass-panel rounded-[28px] border p-4";
  const sectionEyebrow = "text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground";
  const hasPhoto = Boolean(studio.userPhoto);
  const hasCanvasContent = studio.canvasItems.length > 0;
  const canSaveOutfit = hasCanvasContent && !studio.isLoading;
  const generateIsPrimary = hasPhoto && !hasCanvasContent;
  const exampleCanvasCards = [
    {
      id: "example-flat-lay-1",
      imageUrl: `${import.meta.env.BASE_URL}examples/spring-wardrobe-switch-flat-lay-1.jpg`,
      alt: "Spring wardrobe flat lay with green trousers and hat",
    },
    {
      id: "example-flat-lay-2",
      imageUrl: `${import.meta.env.BASE_URL}examples/spring-wardrobe-switch-flat-lay.jpg`,
      alt: "Spring wardrobe flat lay with cream cardigan and boots",
    },
    {
      id: "example-view",
      imageUrl: `${import.meta.env.BASE_URL}examples/spring-wardrobe-switch-view.jpg`,
      alt: "Spring wardrobe view with jeans and grey t-shirt",
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <section className="shrink-0 px-4 pb-3 pt-1 md:px-6 md:pb-4 md:pt-2 lg:px-10">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-1.5 text-center">
          <h1 className="text-2xl font-display tracking-tight text-foreground md:text-3xl xl:text-4xl">
            Create an outfit
          </h1>
        </div>
      </section>

      <div className="flex-1 min-h-0 overflow-hidden px-4 pb-24 pt-2 md:px-6 lg:px-10 lg:pb-6">
        <div className="mx-auto grid h-full max-w-[1440px] min-h-0 gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="min-h-0">
            <section className={cn(panelShell, "space-y-4 transition-all duration-300")}>
              <div className="space-y-4">
                <div className="space-y-3">
                  <p className={sectionEyebrow}>Save outfit</p>
                  <div
                    className={cn(
                      "glass-panel-soft space-y-3 rounded-[24px] border p-3.5 transition-all duration-300",
                      !canSaveOutfit && "opacity-70",
                    )}
                  >
                    <Input
                      placeholder="Outfit name..."
                      value={studio.outfitName}
                      onChange={(e) => studio.setOutfitName(e.target.value)}
                      className="h-10 rounded-xl bg-background/48 px-4 dark:border-white/[0.08] dark:bg-black/16"
                      onKeyDown={(e) => canSaveOutfit && e.key === "Enter" && void studio.handleSave()}
                    />
                    <Button
                      onClick={() => void studio.handleSave()}
                      className="h-10 w-full gap-2 rounded-xl"
                      disabled={!canSaveOutfit}
                    >
                      <Save className="h-4 w-4" />
                      Save outfit
                    </Button>
                    <Button asChild variant="secondary" className="h-10 w-full rounded-xl">
                      <Link to="/saved/outfits">View saved outfits</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            <section className={cn(panelShell, "space-y-4 transition-all duration-300")}>
              <div className="space-y-4">
                <div className="space-y-3">
                  <p className={sectionEyebrow}>Wardrobe</p>
                  <div className="glass-panel-soft rounded-[24px] border p-3.5">
                    <WardrobeLibrary
                      items={studio.wardrobeItems}
                      onAddToCanvas={studio.handleAddWardrobeToCanvas}
                      onDelete={studio.deleteWardrobeItem}
                      onAddPhoto={studio.addWardrobeItem}
                      isLoading={studio.wardrobeLoading}
                    />
                  </div>
                </div>
              </div>
            </section>
          </aside>

          <main className="min-h-0 space-y-4 overflow-y-auto pr-1">
            <section
              className={cn(
                panelShell,
                "transition-all duration-300",
                !hasPhoto && !hasCanvasContent && "border-white/6 bg-background/46",
              )}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className={sectionEyebrow}>Board</p>
                {hasPhoto && (
                  <p className="hidden text-xs text-muted-foreground md:block">
                    {hasCanvasContent ? "Drag pieces to refine the look." : "Generated pieces land here first."}
                  </p>
                )}
              </div>

              <CanvasEditor
                userPhoto={studio.userPhoto}
                onPhotoChange={studio.setUserPhoto}
                items={studio.canvasItems}
                onItemsChange={studio.setCanvasItems}
                onDeleteItem={studio.handleDeleteItem}
                exampleCards={exampleCanvasCards}
                emptyStateMessage={
                  hasPhoto
                    ? "Generate pieces to start arranging the outfit on your board."
                    : "Start with a photo. Then build your look on the board"
                }
                hideTitle
                className="space-y-0"
              />
            </section>

            <section
              className={cn(
                "space-y-3 rounded-[24px] transition-all duration-300",
                generateIsPrimary && "border border-primary/18 bg-background/32 p-3 shadow-[0_0_0_1px_hsl(var(--primary)/0.06),0_18px_44px_hsl(var(--primary)/0.07)]",
                !hasPhoto && "opacity-80",
              )}
            >
              <div className="flex items-center justify-between">
                <p className={cn(sectionEyebrow, generateIsPrimary && "text-foreground/88")}>Create look</p>
              </div>

              <GeneratePanel
                onItemGenerated={studio.handleItemGenerated}
                hideTitle
                className="space-y-0"
                buttonLabel="Generate outfit"
              />
            </section>

            {studio.generatedItems.length > 0 && (
              <section className={panelShell}>
                <div className="mb-4 flex items-center justify-between">
                  <p className={sectionEyebrow}>AI items</p>
                  <p className="hidden text-xs text-muted-foreground md:block">
                    Click any item to place it on the board.
                  </p>
                </div>

                <GeneratedItemsList
                  items={studio.generatedItems}
                  onAddToCanvas={studio.handleAddToCanvas}
                  onItemUpdate={studio.handleItemUpdate}
                  onItemDelete={studio.handleDeleteGeneratedItem}
                  onItemAdd={studio.handleItemGenerated}
                  onSaveItem={studio.handleSaveGeneratedItem}
                  isSaved={(item) =>
                    studio.savedGeneratedItems.some(
                      (savedItem) =>
                        savedItem.category === item.category &&
                        savedItem.imageUrl === item.imageUrl &&
                        savedItem.prompt === item.prompt,
                    )
                  }
                  hideTitle
                  gridClassName="grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
                />
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
