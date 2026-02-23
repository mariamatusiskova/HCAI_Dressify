import { useState, useCallback } from "react";

export interface GeneratedItem {
  id: string;
  category: "top" | "trousers" | "shoes";
  imageUrl: string;
  prompt: string;
  createdAt: string;
}

export interface CanvasItem {
  id: string;
  imageUrl: string;
  category: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface Outfit {
  id: string;
  name: string;
  timestamp: string;
  userPhoto: string | null;
  canvasItems: CanvasItem[];
}

const STORAGE_KEY = "dressify-outfits";

export function useOutfits() {
  const [outfits, setOutfits] = useState<Outfit[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveOutfit = useCallback(
    (name: string, userPhoto: string | null, canvasItems: CanvasItem[]) => {
      const outfit: Outfit = {
        id: crypto.randomUUID(),
        name,
        timestamp: new Date().toISOString(),
        userPhoto,
        canvasItems,
      };
      const updated = [outfit, ...outfits];
      setOutfits(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return outfit;
    },
    [outfits]
  );

  const deleteOutfit = useCallback(
    (id: string) => {
      const updated = outfits.filter((o) => o.id !== id);
      setOutfits(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    },
    [outfits]
  );

  const loadOutfit = useCallback(
    (id: string) => outfits.find((o) => o.id === id) || null,
    [outfits]
  );

  return { outfits, saveOutfit, deleteOutfit, loadOutfit };
}
