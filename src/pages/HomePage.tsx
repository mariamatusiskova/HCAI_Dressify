import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark,
  ImagePlus,
  Save,
  Shirt,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import GeneratePanel from "@/components/GeneratePanel";
import CanvasEditor from "@/components/CanvasEditor";
import WardrobeLibrary from "@/components/WardrobeLibrary";
import SavedItemsLibrary from "@/components/SavedItemsLibrary";
import { cn } from "@/lib/utils";
import { useStudio } from "./Index";

// Home page is now a tool-palette workspace:
//   - The canvas (board) takes the main area at the top.
//   - The Generate panel sits inline UNDER the canvas — the most common
//     creative action stays one scroll away, no extra click needed.
//   - "Add from closet" and "Save outfit" are slide-in drawers triggered
//     from a small top toolbar; they only appear on demand.
//   - This replaces the older multi-panel sidebar that testers said was
//     "too much at once" on first visit.
type DrawerKey = "closet" | "save";
type ClosetTab = "clothes" | "ai";

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

const closetTabBase =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium leading-none transition-colors";
const closetTabActive =
  "border-primary bg-primary text-primary-foreground shadow-sm";
const closetTabInactive =
  "border-foreground/15 bg-background/56 text-foreground/75 hover:border-foreground/30 hover:bg-background/75 hover:text-foreground";

const HomePage = () => {
  const studio = useStudio();
  const [openDrawer, setOpenDrawer] = useState<DrawerKey | null>(null);
  const [closetTab, setClosetTab] = useState<ClosetTab>("clothes");

  const hasPhoto = Boolean(studio.userPhoto);
  const hasCanvasContent = studio.canvasItems.length > 0;
  const canSaveOutfit = hasCanvasContent && !studio.isLoading;

  // Generation auto-adds the new piece to the canvas (existing behaviour).
  // The user can scroll up to see what landed on the board, or keep
  // generating more pieces from the inline panel below.
  const handleGenerateToBoard = (item: Parameters<typeof studio.handleItemGenerated>[0]) => {
    studio.handleItemGenerated(item);
    studio.handleAddToCanvas(item);
  };

  // After a successful save we close the drawer and clear the field. The
  // toast shown by handleSave gives the user feedback even though the
  // drawer is gone.
  const handleSaveAndClose = async () => {
    await studio.handleSave();
    setOpenDrawer(null);
  };

  // Adding from closet keeps the drawer open so the user can drop multiple
  // pieces in a row. We only close it when they're done (X / click-out).
  const wardrobeCount = studio.wardrobeItems.length;
  const aiCount = studio.savedGeneratedItems.length;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Top toolbar — title on the left, three actions on the right.
          On narrow screens the buttons wrap below the title. */}
      <header className="shrink-0 px-4 pt-2 pb-3 md:px-6 lg:px-10">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-display tracking-tight text-foreground md:text-2xl">
              Create an outfit
            </h1>
            <p className="hidden text-xs text-muted-foreground md:block">
              {hasCanvasContent
                ? "Drag pieces to refine the look. Save when you're happy."
                : hasPhoto
                  ? "Generate AI pieces or add some from your closet to get started."
                  : "Add a photo on the board, then start dressing it."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-10 gap-2 rounded-xl border border-foreground/12 bg-background/56 px-4 text-sm font-medium hover:border-foreground/25 hover:bg-background/75"
              onClick={() => setOpenDrawer("closet")}
            >
              <ImagePlus className="h-4 w-4" />
              Add from closet
            </Button>
            <Button
              type="button"
              className={cn(
                "h-10 gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_hsl(var(--primary)/0.25)] transition-colors hover:bg-primary/90",
                !canSaveOutfit && "opacity-60 hover:bg-primary",
              )}
              onClick={() => setOpenDrawer("save")}
              disabled={!canSaveOutfit}
              title={canSaveOutfit ? "Save this outfit" : "Add a piece to the board first"}
            >
              <Save className="h-4 w-4" />
              Save outfit
            </Button>
          </div>
        </div>
      </header>

      {/* Canvas + inline Generate. Both scroll together inside <main> so
          a user with a tall screen sees the canvas first; on a shorter
          screen they scroll down to reach the Generate panel. */}
      <main className="flex-1 min-h-0 overflow-y-auto px-4 pb-24 md:px-6 lg:px-10 lg:pb-6">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-6">
          <CanvasEditor
            userPhoto={studio.userPhoto}
            onPhotoChange={studio.setUserPhoto}
            items={studio.canvasItems}
            onItemsChange={studio.setCanvasItems}
            onDeleteItem={studio.handleDeleteItem}
            exampleCards={exampleCanvasCards}
            emptyStateMessage={
              hasPhoto
                ? "Generate a piece below or use Add from closet to start arranging your outfit."
                : "Drop a photo of yourself, then build your look on the board."
            }
            hideTitle
            className="space-y-0"
          />

          {/* Inline Generate panel — kept always visible below the canvas
              so creating a new AI piece is one scroll away, never a
              drawer/modal click. */}
          <section className="glass-panel rounded-[28px] border p-5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-display font-medium text-foreground">
                Generate AI piece
              </h2>
              <p className="hidden text-xs text-muted-foreground md:block">
                Describe what you want. We'll add it straight to the board.
              </p>
            </div>

            <GeneratePanel
              onItemGenerated={handleGenerateToBoard}
              hideTitle
              buttonLabel="Generate piece"
            />
          </section>
        </div>
      </main>

      {/* Closet drawer — tabs for My clothes / AI pieces. Wider than the
          others because it has to fit a piece grid. */}
      <Sheet
        open={openDrawer === "closet"}
        onOpenChange={(open) => setOpenDrawer(open ? "closet" : null)}
      >
        <SheetContent className="flex w-full flex-col gap-4 overflow-y-auto sm:!max-w-2xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ImagePlus className="h-4 w-4 text-primary" />
              Add from closet
            </SheetTitle>
            <SheetDescription>
              Pick a piece to drop it on the board. The drawer stays open so
              you can add several in a row.
            </SheetDescription>
          </SheetHeader>

          {/* Tab switcher — same labels as the /closet page so users only
              learn the model once. */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={cn(
                closetTabBase,
                closetTab === "clothes" ? closetTabActive : closetTabInactive,
              )}
              onClick={() => setClosetTab("clothes")}
            >
              <Shirt className="h-3.5 w-3.5" />
              My clothes
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none",
                  closetTab === "clothes"
                    ? "bg-primary-foreground/15"
                    : "bg-foreground/8 text-foreground/70",
                )}
              >
                {wardrobeCount}
              </span>
            </button>
            <button
              type="button"
              className={cn(
                closetTabBase,
                closetTab === "ai" ? closetTabActive : closetTabInactive,
              )}
              onClick={() => setClosetTab("ai")}
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI pieces
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none",
                  closetTab === "ai"
                    ? "bg-primary-foreground/15"
                    : "bg-foreground/8 text-foreground/70",
                )}
              >
                {aiCount}
              </span>
            </button>

            <Button
              asChild
              variant="ghost"
              className="ml-auto h-9 gap-1.5 rounded-xl px-3 text-xs text-muted-foreground hover:text-foreground"
            >
              <Link to="/closet">
                Manage closet
              </Link>
            </Button>
          </div>

          {/* Active library. Compact variant of WardrobeLibrary keeps the
              drawer focused on quick add. SavedItemsLibrary uses its
              default render — drilldown collections still work. */}
          {closetTab === "clothes" ? (
            <WardrobeLibrary
              items={studio.wardrobeItems}
              onAddToCanvas={(item) => {
                studio.handleAddWardrobeToCanvas(item);
              }}
              onDelete={(id) => void studio.handleDeleteWardrobeItem(id)}
              onAddPhoto={studio.handleAddPhotoToWardrobe}
              onUpdateName={studio.handleUpdateWardrobeItemName}
              isLoading={studio.wardrobeLoading}
              variant="compact"
            />
          ) : (
            <SavedItemsLibrary
              items={studio.savedGeneratedItems}
              onAddToCanvas={(item) => {
                const asGenerated = {
                  id: item.id,
                  category: item.category,
                  imageUrl: item.imageUrl,
                  prompt: item.prompt,
                  createdAt: item.savedAt,
                };
                studio.handleAddToCanvas(asGenerated);
              }}
              onDelete={(id) => void studio.handleDeleteSavedGeneratedItem(id)}
              onUpdateName={studio.handleUpdateSavedItemName}
              isLoading={studio.savedItemsLoading}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Save outfit drawer — name input + Save. Quick links to Outfits /
          Closet sit underneath as a courtesy. */}
      <Sheet
        open={openDrawer === "save"}
        onOpenChange={(open) => setOpenDrawer(open ? "save" : null)}
      >
        <SheetContent className="flex w-full flex-col gap-4 sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Save className="h-4 w-4 text-primary" />
              Save this outfit
            </SheetTitle>
            <SheetDescription>
              Give it a name so you can find it later.
            </SheetDescription>
          </SheetHeader>

          <Input
            placeholder="Outfit name…"
            value={studio.outfitName}
            onChange={(e) => studio.setOutfitName(e.target.value)}
            className="h-11 rounded-xl bg-background/48 px-4"
            autoFocus
            onKeyDown={(e) => {
              if (canSaveOutfit && e.key === "Enter") void handleSaveAndClose();
            }}
          />

          <Button
            onClick={() => void handleSaveAndClose()}
            className="h-11 w-full gap-2 rounded-xl"
            disabled={!canSaveOutfit}
          >
            <Save className="h-4 w-4" />
            Save outfit
          </Button>

          <div className="border-t border-foreground/10 pt-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Or jump to
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button
                asChild
                variant="secondary"
                className="h-9 gap-1.5 rounded-xl px-2 text-xs"
              >
                <Link to="/outfits">
                  <Bookmark className="h-3.5 w-3.5" />
                  Saved outfits
                </Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                className="h-9 gap-1.5 rounded-xl px-2 text-xs"
              >
                <Link to="/closet">
                  <Shirt className="h-3.5 w-3.5" />
                  Closet
                </Link>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default HomePage;
