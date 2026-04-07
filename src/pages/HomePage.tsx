// save icon
import { Save } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// upload user photo
import UploadSection from "@/components/UploadSection";
// generate outfit/item ideas
import GeneratePanel from "@/components/GeneratePanel";
// show generated items
import GeneratedItemsList from "@/components/GeneratedItemsList";
// place items on the canvas
import CanvasEditor from "@/components/CanvasEditor";
import { useStudio } from "./Index";

const HomePage = () => {
  const studio = useStudio();
  const panelShell =
    "glass-panel rounded-[28px] border p-4";
  const sectionEyebrow = "text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground";

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <section className="shrink-0 px-4 pb-3 pt-1 md:px-6 md:pb-4 md:pt-2 lg:px-10">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-1.5 text-center">
          <h1 className="text-2xl font-display tracking-tight text-foreground md:text-3xl xl:text-4xl">
            Create an outfit
          </h1>
          <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground md:text-sm">
            Upload your photo, choose a style, and generate outfit ideas you can place, edit, and save.
          </p>
        </div>
      </section>

      <div className="flex-1 min-h-0 overflow-hidden px-4 pb-24 pt-2 md:px-6 lg:px-10 lg:pb-6">
        <div className="mx-auto grid h-full max-w-[1440px] min-h-0 gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="min-h-0">
            <section className={`${panelShell} h-full overflow-y-auto`}>
              <div className="space-y-4">
                <div className="space-y-3">
                  <p className={sectionEyebrow}>1. Upload your photo</p>
                  <UploadSection
                    photo={studio.userPhoto}
                    onPhotoChange={studio.setUserPhoto}
                    hideTitle
                    boxClassName="max-h-none min-h-[140px] md:min-h-[180px]"
                  />
                </div>

                <div className="h-px bg-border/70" />

                <div className="space-y-3">
                  <p className={sectionEyebrow}>Save outfit</p>
                  <div className="glass-panel-soft space-y-3 rounded-[24px] border p-3.5">
                    <Input
                      placeholder="Outfit name..."
                      value={studio.outfitName}
                      onChange={(e) => studio.setOutfitName(e.target.value)}
                      className="h-10 rounded-xl bg-background/48 px-4 dark:border-white/[0.08] dark:bg-black/16"
                      onKeyDown={(e) => e.key === "Enter" && void studio.handleSave()}
                    />
                    <Button
                      onClick={() => void studio.handleSave()}
                      className="h-10 w-full gap-2 rounded-xl"
                      disabled={studio.isLoading}
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
          </aside>

          <main className="min-h-0 space-y-4 overflow-y-auto pr-1">
            <section className={panelShell}>
              <div className="mb-3 flex items-center justify-between">
                <p className={sectionEyebrow}>Preview</p>
                <p className="hidden text-xs text-muted-foreground md:block">
                  Build the look by adding pieces to the canvas.
                </p>
              </div>

              <CanvasEditor
                userPhoto={studio.userPhoto}
                items={studio.canvasItems}
                onItemsChange={studio.setCanvasItems}
                onDeleteItem={studio.handleDeleteItem}
                hideTitle
                className="space-y-0"
                viewportClassName="min-h-[220px] md:min-h-[300px] xl:min-h-[340px]"
              />
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <p className={sectionEyebrow}>2. Choose a style and describe the look</p>
                <p className="hidden text-xs text-muted-foreground md:block">
                  This is the main generation composer.
                </p>
              </div>

              <GeneratePanel
                onItemGenerated={studio.handleItemGenerated}
                hideTitle
                buttonLabel="Generate outfit"
              />
            </section>

            {studio.generatedItems.length > 0 && (
              <section className={panelShell}>
                <div className="mb-4 flex items-center justify-between">
                  <p className={sectionEyebrow}>Generated items</p>
                  <p className="hidden text-xs text-muted-foreground md:block">
                    Click any item to place it on the canvas.
                  </p>
                </div>

                <GeneratedItemsList
                  items={studio.generatedItems}
                  onAddToCanvas={studio.handleAddToCanvas}
                  onItemUpdate={studio.handleItemUpdate}
                  onAddToWardrobe={(item) => void studio.handleAddGeneratedToWardrobe(item)}
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
