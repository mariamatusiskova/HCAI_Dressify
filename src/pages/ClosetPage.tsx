import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shirt, Sparkles } from "lucide-react";
import ClosetLibrary from "@/components/ClosetLibrary";
import SavedItemsLibrary from "@/components/SavedItemsLibrary";
import { cn } from "@/lib/utils";
import { useStudio } from "./Index";
import type { GeneratedItem } from "@/hooks/useOutfits";
import type { SavedAiItem } from "@/hooks/useSavedItems";
import type { ClosetItem } from "@/hooks/useCloset";

// /closet — every piece the user can dress with.
//
// Iteration history:
//   v1: stacked the two libraries vertically — testers had to scroll past the
//       full wardrobe to find AI pieces. Bad.
//   v2: small pill tabs side-by-side — fixed the scroll, but testers still
//       didn't notice the second tab existed because the tabs were just two
//       small pills competing with everything else on the page.
//   v3 (this file): the tabs ARE the page header. Two big card-style buttons
//       in a 50/50 grid; each labels itself with what it contains and where
//       the items came from. The active card has a strong primary highlight,
//       the inactive one is muted. A clearly visible underline appears under
//       the active card so users get the "this is the section I'm in" cue
//       even if they ignore the colour change.
type ClosetTab = "clothes" | "ai";

interface TabSpec {
  id: ClosetTab;
  title: string;
  subtitle: string;
  helper: string;
  icon: typeof Shirt;
}

const TABS: TabSpec[] = [
  {
    id: "clothes",
    title: "My clothes",
    subtitle: "Photos you uploaded",
    helper: "Real garments from your wardrobe",
    icon: Shirt,
  },
  {
    id: "ai",
    title: "AI pieces",
    subtitle: "Saved from generations",
    helper: "Items the AI made for you",
    icon: Sparkles,
  },
];

const tabBase =
  "group relative flex w-full flex-col items-start gap-1 rounded-2xl border-2 px-4 py-3 text-left transition-all";
const tabInactive =
  "border-foreground/10 bg-background/56 text-foreground/70 hover:border-foreground/25 hover:bg-background/75 hover:text-foreground";
const tabActive =
  "border-primary bg-primary text-primary-foreground shadow-[0_8px_24px_hsl(var(--primary)/0.25)]";

const ClosetPage = () => {
  const studio = useStudio();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ClosetTab>("clothes");

  // Drag/click → board flows redirect to / so the user immediately sees
  // the piece they just added on the canvas. Same pattern we use on the
  // outfits page.
  const handleAddClosetAndOpenBoard = (item: ClosetItem) => {
    studio.handleAddClosetToCanvas(item);
    navigate("/");
  };

  const handleAddSavedItemAndOpenBoard = (item: SavedAiItem) => {
    const asGenerated: GeneratedItem = {
      id: item.id,
      category: item.category,
      imageUrl: item.imageUrl,
      prompt: item.prompt,
      createdAt: item.savedAt,
    };
    studio.handleAddToCanvas(asGenerated);
    navigate("/");
  };

  const counts: Record<ClosetTab, number> = {
    clothes: studio.closetItems.length,
    ai: studio.savedGeneratedItems.length,
  };

  const activeSpec = TABS.find((t) => t.id === activeTab) ?? TABS[0];

  return (
    <div className="min-h-full px-4 pb-24 pt-2 md:px-6 lg:px-10 lg:pb-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        {/* Compact header — names the destination without dominating the page. */}
        <header className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground/70">
            Your closet
          </p>
          <p className="text-sm text-muted-foreground">
            Two separate sections. Pick one to browse, then drag a piece onto the board.
          </p>
        </header>

        {/* Big segmented switcher: each card is its own labeled section.
            On mobile the cards stay side-by-side (50/50) so neither
            section is hidden below the fold.
            On larger screens they get more breathing room. */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count = counts[tab.id];
            return (
              <button
                key={tab.id}
                type="button"
                className={cn(tabBase, isActive ? tabActive : tabInactive)}
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={isActive}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full border",
                        isActive
                          ? "border-primary-foreground/30 bg-primary-foreground/15"
                          : "border-foreground/15 bg-background/70",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-[15px] font-semibold leading-none">
                      {tab.title}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium leading-none",
                      isActive
                        ? "bg-primary-foreground/15 text-primary-foreground"
                        : "bg-foreground/8 text-foreground/70",
                    )}
                  >
                    {count}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-[12px] leading-tight",
                    isActive ? "text-primary-foreground/85" : "text-muted-foreground",
                  )}
                >
                  {tab.subtitle}
                </span>
                {/* Active-state underline: a thick bottom bar that visually
                    "anchors" the chosen card to the content below it.
                    Inactive cards have no bar, reinforcing which one is in focus. */}
                {isActive ? (
                  <span className="absolute -bottom-[10px] left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-primary" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Section title that re-states the chosen tab below it, so the
            connection between "the card I clicked" and "the items I see"
            is unambiguous. */}
        <div className="flex items-baseline justify-between gap-3 border-b border-foreground/8 pb-2">
          <div className="flex items-baseline gap-2">
            <h3 className="text-base font-display font-medium text-foreground">
              {activeSpec.title}
            </h3>
            <span className="text-[12px] text-muted-foreground">
              {activeSpec.helper}
            </span>
          </div>
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
            {counts[activeTab]}{" "}
            {counts[activeTab] === 1 ? "item" : "items"}
          </span>
        </div>

        {/* Render only the active library so the unused one doesn't quietly
            run filtering / state logic in the background. */}
        {activeTab === "clothes" ? (
          <ClosetLibrary
            items={studio.closetItems}
            onAddToCanvas={handleAddClosetAndOpenBoard}
            onDelete={(id) => void studio.handleDeleteClosetItem(id)}
            onAddPhoto={studio.handleAddPhotoToCloset}
            onUpdateName={studio.handleUpdateClosetItemName}
            isLoading={studio.closetLoading}
          />
        ) : (
          <SavedItemsLibrary
            items={studio.savedGeneratedItems}
            onAddToCanvas={handleAddSavedItemAndOpenBoard}
            onDelete={(id) => void studio.handleDeleteSavedGeneratedItem(id)}
            onUpdateName={studio.handleUpdateSavedItemName}
            isLoading={studio.savedItemsLoading}
          />
        )}
      </div>
    </div>
  );
};

export default ClosetPage;
