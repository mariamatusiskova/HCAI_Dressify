// useState stores values
// useEffect runs side effects
// useCallback remembers functions
// createContext and useContext share data across components
import { createContext, useCallback, useContext, useEffect, useState } from "react";
// nested pages get rendered by Outlet
import { Outlet } from "react-router-dom";
// popup messages
import { toast } from "sonner";
// auth section in top bar
import AuthTopbar from "@/components/AuthTopbar";
import ConsentModal from "@/components/ConsentModal";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import SystemWalkthrough from "@/components/SystemWalkthrough";
// to make unique IDs
import { createId } from "@/lib/id";
import { useOutfits, type CanvasItem, type GeneratedItem } from "@/hooks/useOutfits";
import { useWardrobe } from "@/hooks/useWardrobe";
import { useSavedItems, type SavedAiItem } from "@/hooks/useSavedItems";
import { normalizeClothingCategory } from "@/lib/clothingCategory";
import MenuNav from "./MenuNav";

// components logic (saved outfits, wardrobe, etc.)
function useStudioInternal() {
  // if the user agreed or not (data policy)
  const [consented, setConsented] = useState(false);
  // if the modal is visble or not
  const [showConsent, setShowConsent] = useState(true);

  // stores the uploaded photo
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  // AI-generated clothing items
  const [generatedItems, setGeneratedItems] = useState<GeneratedItem[]>([]);
  // items placed on canvas editor
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  // stores the name type for the outfit
  const [outfitName, setOutfitName] = useState("");

  // outfit actions
  const {
    outfits,
    saveOutfit,
    deleteOutfit,
    loadOutfit,
    updateOutfitName,
    isLoading,
    isCloudSyncEnabled,
    syncError,
  } = useOutfits();

  // wardrobe actions
  const {
    items: wardrobeItems,
    addItem: addWardrobeItem,
    deleteItem: deleteWardrobeItem,
    updateItemName: updateWardrobeItemName,
    isLoading: wardrobeLoading,
    isCloudSyncEnabled: isWardrobeCloudSyncEnabled,
    syncError: wardrobeSyncError,
  } = useWardrobe();

  // saved AI items actions
  const {
    items: savedGeneratedItems,
    addItem: addSavedItem,
    deleteItem: deleteSavedItem,
    updateItemName: updateSavedItemName,
    isLoading: savedItemsLoading,
    isCloudSyncEnabled: isSavedItemsCloudSyncEnabled,
    syncError: savedItemsSyncError,
  } = useSavedItems();

  // outfit sync problem popup
  useEffect(() => {
    if (syncError) {
      toast.warning(syncError);
    }
  }, [syncError]);

  // wardrobe sync problem popup
  useEffect(() => {
    if (wardrobeSyncError) {
      toast.warning(wardrobeSyncError);
    }
  }, [wardrobeSyncError]);

  // saved AI item sync problem popup
  useEffect(() => {
    if (savedItemsSyncError) {
      toast.warning(savedItemsSyncError);
    }
  }, [savedItemsSyncError]);

  useEffect(() => {
    setCanvasItems((prev) => {
      let hasChanges = false;

      const next = prev.map((canvasItem) => {
        if (canvasItem.source === "wardrobe") {
          return canvasItem;
        }

        const matchedGeneratedItem =
          generatedItems.find((generatedItem) => generatedItem.imageUrl === canvasItem.imageUrl) ??
          savedGeneratedItems.find((savedItem) => savedItem.imageUrl === canvasItem.imageUrl);

        if (!matchedGeneratedItem) {
          return canvasItem;
        }

        const normalizedCategory = normalizeClothingCategory(
          matchedGeneratedItem.category,
          matchedGeneratedItem.prompt,
        );

        if (
          canvasItem.category === normalizedCategory &&
          canvasItem.prompt === matchedGeneratedItem.prompt &&
          canvasItem.source === "ai"
        ) {
          return canvasItem;
        }

        hasChanges = true;
        return {
          ...canvasItem,
          category: normalizedCategory,
          prompt: matchedGeneratedItem.prompt,
          source: "ai" as const,
        };
      });

      return hasChanges ? next : prev;
    });
  }, [generatedItems, savedGeneratedItems]);

  const handleAgree = useCallback(() => {
    setConsented(true);
    setShowConsent(false);
  }, []);

  // adds the new generated item to the beginning of the list and shows a success message
  const handleItemGenerated = useCallback((item: GeneratedItem) => {
    const normalizedItem: GeneratedItem = {
      ...item,
      category: normalizeClothingCategory(item.category, item.prompt),
    };
    setGeneratedItems((prev) => [normalizedItem, ...prev]);
    toast.success(`${normalizedItem.category} generated`);
  }, []);

  // updates an existing generated item
  const handleItemUpdate = useCallback((itemId: string, updatedItem: GeneratedItem) => {
    const normalizedUpdatedItem: GeneratedItem = {
      ...updatedItem,
      category: normalizeClothingCategory(updatedItem.category, updatedItem.prompt),
    };
    setGeneratedItems((prev) => {
      const updated = prev.map((item) => (item.id === itemId ? normalizedUpdatedItem : item));
      const oldItem = prev.find((item) => item.id === itemId);

      // replace the old item in generatedItems
      // if that old item is already on the canvas, also update the canvas image
      if (oldItem) {
        setCanvasItems((currentCanvasItems) =>
          currentCanvasItems.map((canvasItem) =>
            canvasItem.imageUrl === oldItem.imageUrl
              ? {
                  ...canvasItem,
                  imageUrl: normalizedUpdatedItem.imageUrl,
                  category: normalizeClothingCategory(normalizedUpdatedItem.category, normalizedUpdatedItem.prompt),
                  prompt: normalizedUpdatedItem.prompt,
                }
              : canvasItem,
          ),
        );
      }

      return updated;
    });
  }, []);

  // remove an item from the generated list only
  const handleDeleteGeneratedItem = useCallback((itemId: string) => {
    setGeneratedItems((prev) => prev.filter((item) => item.id !== itemId));
    toast.success("Generated item removed");
  }, []);

  const handleSaveGeneratedItem = useCallback(
    async (item: GeneratedItem) => {
      const normalizedCategory = normalizeClothingCategory(item.category, item.prompt);
      const result = await addSavedItem({
        category: normalizedCategory,
        imageUrl: item.imageUrl,
        prompt: item.prompt,
      });

      if (result.alreadyExists) {
        toast.info("Item already saved");
        return;
      }

      if (result.savedToCloud) {
        toast.success("Item saved");
      } else {
        toast.warning(
          result.cloudError
            ? `Saved locally only: ${result.cloudError}`
            : "Saved locally only (no active Supabase session).",
        );
      }
    },
    [addSavedItem],
  );

  const handleDeleteSavedGeneratedItem = useCallback(
    async (id: string) => {
      try {
        await deleteSavedItem(id);
        toast.success("Saved item removed");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to remove saved item";
        toast.error(message);
      }
    },
    [deleteSavedItem],
  );

  const handleUpdateSavedItemName = useCallback(
    async (id: string, name: string) => {
      try {
        await updateSavedItemName(id, name);
        toast.success(name.trim() ? "Saved item renamed" : "Saved item name cleared");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to rename saved item";
        toast.error(message);
      }
    },
    [updateSavedItemName],
  );

  const handleUpdateOutfitName = useCallback(
    async (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) {
        toast.error("Enter a name for the outfit");
        return;
      }

      try {
        await updateOutfitName(id, trimmed);
        toast.success("Outfit renamed");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to rename outfit";
        toast.error(message);
      }
    },
    [updateOutfitName],
  );

  // add generated items to canvas
  const handleAddToCanvas = useCallback((item: GeneratedItem) => {
    setCanvasItems((prev) => {
      const maxZIndex = prev.length > 0 ? Math.max(...prev.map((i) => i.zIndex ?? 0)) : -1;
      const canvasItem: CanvasItem = {
        id: createId(),
        imageUrl: item.imageUrl,
        category: normalizeClothingCategory(item.category, item.prompt),
        prompt: item.prompt,
        source: "ai",
        x: 40 + Math.random() * 80,
        y: 40 + Math.random() * 80,
        width: 80,
        height: 80,
        rotation: 0,
        zIndex: maxZIndex + 1,
      };
      return [...prev, canvasItem];
    });
  }, []);

  // add wardrobe items to canvas
  const handleAddWardrobeToCanvas = useCallback((item: { imageUrl: string; category: string }) => {
    setCanvasItems((prev) => {
      const maxZIndex = prev.length > 0 ? Math.max(...prev.map((i) => i.zIndex ?? 0)) : -1;
      const canvasItem: CanvasItem = {
        id: createId(),
        imageUrl: item.imageUrl,
        category: item.category,
        source: "wardrobe",
        x: 40 + Math.random() * 80,
        y: 40 + Math.random() * 80,
        width: 80,
        height: 80,
        rotation: 0,
        zIndex: maxZIndex + 1,
      };
      return [...prev, canvasItem];
    });
  }, []);

  // delete items from canvas
  const handleDeleteItem = useCallback((id: string) => {
    setCanvasItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // save outfit
  const handleSave = useCallback(async () => {
    if (!outfitName.trim()) {
      toast.error("Enter an outfit name");
      return;
    }

    await saveOutfit(outfitName.trim(), userPhoto, canvasItems);
    setOutfitName("");
    toast.success("Outfit saved");
  }, [canvasItems, outfitName, saveOutfit, userPhoto]);


  // load outfit
  const handleLoad = useCallback(
    (id: string) => {
      const outfit = loadOutfit(id);
      if (!outfit) return;

      setUserPhoto(outfit.userPhoto);

      const normalizedItems = outfit.canvasItems.map((item, index) => ({
        ...item,
        width: item.width ?? 80,
        height: item.height ?? 80,
        rotation: item.rotation ?? 0,
        zIndex: item.zIndex ?? index,
      }));

      setCanvasItems(normalizedItems);
      toast.info(`Loaded "${outfit.name}"`);
    },
    [loadOutfit],
  );

  // delete outfit
  const handleDeleteOutfit = useCallback(
    async (id: string) => {
      await deleteOutfit(id);
      toast.success("Outfit deleted");
    },
    [deleteOutfit],
  );

  // add generated item to wardrobe
  const handleAddGeneratedToWardrobe = useCallback(
    async (item: GeneratedItem) => {
      const result = await addWardrobeItem(item.category, item.imageUrl);

      if (result.alreadyExists) {
        toast.info("Already in wardrobe");
        return;
      }

      if (result.savedToCloud) {
        toast.success("Added to wardrobe");
      } else {
        toast.warning(
          result.cloudError
            ? `Saved locally only: ${result.cloudError}`
            : "Saved locally only (no active Supabase session).",
        );
      }
    },
    [addWardrobeItem],
  );

  // delete wardrobe item
  const handleDeleteWardrobeItem = useCallback(
    async (id: string) => {
      try {
        await deleteWardrobeItem(id);
        toast.success("Wardrobe item deleted");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to delete wardrobe item";
        toast.error(message);
      }
    },
    [deleteWardrobeItem],
  );

  // add photo directly to wardrobe
  const handleAddPhotoToWardrobe = useCallback(
    async (imageUrl: string, category: string, name?: string | null) => {
      try {
        const result = await addWardrobeItem(category, imageUrl, name);

        if (result.alreadyExists) {
          toast.info("Photo is already in wardrobe");
          return result.item;
        }

        if (result.savedToCloud) {
          toast.success("Photo added to wardrobe");
        } else {
          toast.warning(
            result.cloudError
              ? `Photo saved locally only: ${result.cloudError}`
              : "Photo saved locally only (no active Supabase session).",
          );
        }

        return result.item;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to add photo to wardrobe";
        toast.error(message);
        return null;
      }
    },
    [addWardrobeItem],
  );

  // rename wardrobe item
  const handleUpdateWardrobeItemName = useCallback(
    async (id: string, name: string) => {
      try {
        await updateWardrobeItemName(id, name);
        toast.success(name.trim() ? "Wardrobe item renamed" : "Wardrobe item name cleared");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to rename wardrobe item";
        toast.error(message);
      }
    },
    [updateWardrobeItemName],
  );

  // return the shared studio object
  return {
    consented,
    showConsent,
    handleAgree,
    userPhoto,
    setUserPhoto,
    generatedItems,
    setGeneratedItems,
    savedGeneratedItems,
    savedItemsLoading,
    isSavedItemsCloudSyncEnabled,
    canvasItems,
    setCanvasItems,
    outfitName,
    setOutfitName,
    outfits,
    wardrobeItems,
    isLoading,
    wardrobeLoading,
    isCloudSyncEnabled,
    isWardrobeCloudSyncEnabled,
    handleItemGenerated,
    handleItemUpdate,
    handleDeleteGeneratedItem,
    handleSaveGeneratedItem,
    handleDeleteSavedGeneratedItem,
    handleUpdateSavedItemName,
    handleAddToCanvas,
    handleAddWardrobeToCanvas,
    handleDeleteItem,
    handleSave,
    handleLoad,
    handleDeleteOutfit,
    handleUpdateOutfitName,
    handleAddGeneratedToWardrobe,
    handleDeleteWardrobeItem,
    handleAddPhotoToWardrobe,
    handleUpdateWardrobeItemName,
  };
}

// Re-export so consumer pages can keep using the shared type without
// importing directly from the saved-items hook.
export type { SavedAiItem };

// context -> the context type should match whatever useStudioInternal() return
type StudioContextType = ReturnType<typeof useStudioInternal>;

// shared data container
const StudioContext = createContext<StudioContextType | null>(null);

export const useStudio = () => {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error("useStudio must be used inside Index shell");
  }
  return context;
};

// app logic
const Index = () => {
  const studio = useStudioInternal();
  const logoSrc = `${import.meta.env.BASE_URL}outfit_white.png`;

  if (!studio.consented) {
    return <ConsentModal open={studio.showConsent} onAgree={studio.handleAgree} onCancel={() => {}} />;
  }

  return (
    <StudioContext.Provider value={studio}>
      <div className="min-h-screen flex flex-col">
        {/* The header is part of the shell, so theme toggle/auth/menu stay visible while routes change in <Outlet /> below. */}
        <header className="sticky top-0 z-30 border-b border-black/[0.05] bg-background/78 backdrop-blur-2xl dark:border-white/[0.06] dark:bg-black/10">
          <div className="relative flex w-full items-center justify-between gap-4 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.38)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] md:px-6 lg:px-10">
            <div className="flex min-w-0 items-center gap-6">
              <div className="flex shrink-0 items-center gap-2">
                <img src={logoSrc} alt="Dressify logo" className="h-8 w-8 object-contain" />
                <h1 className="text-lg font-display font-semibold tracking-tight">Dressify</h1>
              </div>
              <MenuNav />
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {/* Keep sync diagnostics out of smaller headers; they are useful, but not worth crowding the nav. */}
              <div className="hidden 2xl:flex flex-col items-end">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">AI Outfit Generator</span>
                <span className="text-[10px] text-muted-foreground">
                  Outfits: {studio.isCloudSyncEnabled ? "Supabase" : "Local"} | Wardrobe: {" "}
                  {studio.isWardrobeCloudSyncEnabled ? "Supabase" : "Local"}
                </span>
              </div>
              <AuthTopbar className="hidden md:flex" />
              <span
                aria-hidden="true"
                className="hidden md:inline-flex h-6 w-px bg-muted-foreground/30"
              />
              <LanguageToggle className="hidden sm:inline-flex" />
              <ThemeToggle className="hidden sm:inline-flex" />
            </div>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </main>
        <SystemWalkthrough />
      </div>
    </StudioContext.Provider>
  );
};

export default Index;
