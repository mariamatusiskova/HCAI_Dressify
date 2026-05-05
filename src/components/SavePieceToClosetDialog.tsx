import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FolderPlus, Bookmark, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useStudio } from "@/pages/Index";
import { useWardrobeFolders } from "@/hooks/useWardrobeFolders";
import { useSavedItemFolders } from "@/hooks/useSavedItemFolders";
import {
  DEFAULT_WARDROBE_FOLDER_COLOR,
  WARDROBE_FOLDER_COLORS,
  type WardrobeFolderColor,
} from "@/lib/wardrobeFolders";
import { getCollectionAccentPalette } from "@/lib/collectionAccents";
import type { CanvasItem } from "@/hooks/useOutfits";
import type { GeneratedItem } from "@/hooks/useOutfits";

// Dialog opened from the canvas item toolbar that lets a user:
//   1. Save an AI piece into the closet (saved AI items list).
//   2. Add the piece to an existing collection.
//   3. Create a brand-new collection on the fly and assign the piece.
//
// The dialog adapts to the piece's source:
//   - "ai" pieces flow through saved AI item folders.
//   - "wardrobe" pieces flow through wardrobe folders. (They're already
//     in the closet, so step 1 is implicit.)
//
// Because the folder hooks own their own state, after the dialog closes
// the relevant Library page (/closet) will pick up the new state on its
// next mount via Supabase / localStorage. That's acceptable for v1.

interface SavePieceToClosetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  piece: CanvasItem | null;
}

const SavePieceToClosetDialog = ({
  open,
  onOpenChange,
  piece,
}: SavePieceToClosetDialogProps) => {
  // Keep the Dialog mounted whenever `open` is true so the close animation
  // has time to run before we drop the inner content. The inner content
  // itself is gated on `piece` so the hooks below only spin up when there
  // is actually a piece to act on.
  const isAi = piece?.source !== "wardrobe";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border bg-card">
        {piece ? (
          isAi ? (
            <SaveAiPieceContent piece={piece} onClose={() => onOpenChange(false)} />
          ) : (
            <SaveWardrobePieceContent piece={piece} onClose={() => onOpenChange(false)} />
          )
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

// ----- AI piece flow -------------------------------------------------------
const SaveAiPieceContent = ({
  piece,
  onClose,
}: {
  piece: CanvasItem;
  onClose: () => void;
}) => {
  const studio = useStudio();
  const { folders, createFolder, assignItemToFolder } =
    useSavedItemFolders(studio.savedGeneratedItems);

  const [selectedFolderId, setSelectedFolderId] = useState<string | "__none__">("__none__");
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState<WardrobeFolderColor>(
    DEFAULT_WARDROBE_FOLDER_COLOR,
  );
  const [isWorking, setIsWorking] = useState(false);

  // Has this piece (matched by image+prompt+category) already been saved?
  // If so, we skip the "save to closet" step and just assign.
  const existingSaved = useMemo(
    () =>
      studio.savedGeneratedItems.find(
        (s) =>
          s.imageUrl === piece.imageUrl &&
          s.category === piece.category &&
          s.prompt === (piece.prompt ?? ""),
      ),
    [piece, studio.savedGeneratedItems],
  );

  const handleSubmit = async () => {
    setIsWorking(true);
    try {
      // 1. Make sure the piece is in the closet.
      let savedId = existingSaved?.id ?? null;
      if (!savedId) {
        const generated: GeneratedItem = {
          id: piece.id,
          category: piece.category as GeneratedItem["category"],
          imageUrl: piece.imageUrl,
          prompt: piece.prompt ?? "",
          createdAt: new Date().toISOString(),
        };
        const saved = await studio.handleSaveGeneratedItem(generated);
        savedId = saved?.id ?? null;
      }
      if (!savedId) {
        toast.error("Could not save piece to closet");
        return;
      }

      // 2. Optionally assign to a collection.
      if (isCreating) {
        const trimmed = newFolderName.trim();
        if (!trimmed) {
          toast.error("Give the new collection a name");
          return;
        }
        const folder = await createFolder(trimmed, newFolderColor);
        if (folder?.id) {
          await assignItemToFolder(savedId, folder.id);
          toast.success(`Saved to new collection “${folder.name}”`);
        }
      } else if (selectedFolderId !== "__none__") {
        await assignItemToFolder(savedId, selectedFolderId);
        const folder = folders.find((f) => f.id === selectedFolderId);
        toast.success(`Saved to “${folder?.name ?? "collection"}”`);
      } else if (!existingSaved) {
        // First-time save without folder: handleSaveGeneratedItem already
        // toasted, so no extra toast here.
      } else {
        toast.info("Piece is already in your closet");
      }

      onClose();
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Bookmark className="h-4 w-4 text-primary" />
          Save piece to closet
        </DialogTitle>
        <DialogDescription>
          {existingSaved
            ? "This piece is already in your closet. Pick a collection (optional)."
            : "Adds the piece to your AI items so you can reuse it later."}
        </DialogDescription>
      </DialogHeader>

      <CollectionPicker
        folders={folders}
        selectedFolderId={selectedFolderId}
        onSelectFolder={setSelectedFolderId}
        isCreating={isCreating}
        onToggleCreating={setIsCreating}
        newFolderName={newFolderName}
        onNewFolderNameChange={setNewFolderName}
        newFolderColor={newFolderColor}
        onNewFolderColorChange={setNewFolderColor}
      />

      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={isWorking}>
          Cancel
        </Button>
        <Button onClick={() => void handleSubmit()} disabled={isWorking}>
          {isWorking ? "Saving…" : existingSaved ? "Apply" : "Save"}
        </Button>
      </DialogFooter>
    </>
  );
};

// ----- Wardrobe piece flow -------------------------------------------------
const SaveWardrobePieceContent = ({
  piece,
  onClose,
}: {
  piece: CanvasItem;
  onClose: () => void;
}) => {
  const studio = useStudio();
  const { folders, createFolder, assignItemToFolder } =
    useWardrobeFolders(studio.wardrobeItems);

  const [selectedFolderId, setSelectedFolderId] = useState<string | "__none__">("__none__");
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState<WardrobeFolderColor>(
    DEFAULT_WARDROBE_FOLDER_COLOR,
  );
  const [isWorking, setIsWorking] = useState(false);

  // Look up the original wardrobe item by imageUrl since canvas items use
  // their own ids (not the wardrobe id) once dropped on the board.
  const originalWardrobeItem = useMemo(
    () =>
      studio.wardrobeItems.find(
        (w) =>
          w.imageUrl === piece.imageUrl && w.category === piece.category,
      ),
    [piece, studio.wardrobeItems],
  );

  const handleSubmit = async () => {
    if (!originalWardrobeItem) {
      toast.error("Couldn't find the matching wardrobe item");
      return;
    }
    setIsWorking(true);
    try {
      if (isCreating) {
        const trimmed = newFolderName.trim();
        if (!trimmed) {
          toast.error("Give the new collection a name");
          return;
        }
        const folder = await createFolder(trimmed, newFolderColor);
        if (folder?.id) {
          await assignItemToFolder(originalWardrobeItem.id, folder.id);
          toast.success(`Added to new collection “${folder.name}”`);
        }
      } else if (selectedFolderId !== "__none__") {
        await assignItemToFolder(originalWardrobeItem.id, selectedFolderId);
        const folder = folders.find((f) => f.id === selectedFolderId);
        toast.success(`Added to “${folder?.name ?? "collection"}”`);
      } else {
        toast.info("Pick a collection or create a new one");
        return;
      }
      onClose();
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FolderPlus className="h-4 w-4 text-primary" />
          Add to a collection
        </DialogTitle>
        <DialogDescription>
          This piece is already in your closet. Pick a collection or create a new one.
        </DialogDescription>
      </DialogHeader>

      <CollectionPicker
        folders={folders}
        selectedFolderId={selectedFolderId}
        onSelectFolder={setSelectedFolderId}
        isCreating={isCreating}
        onToggleCreating={setIsCreating}
        newFolderName={newFolderName}
        onNewFolderNameChange={setNewFolderName}
        newFolderColor={newFolderColor}
        onNewFolderColorChange={setNewFolderColor}
        hideNoneOption
      />

      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={isWorking}>
          Cancel
        </Button>
        <Button onClick={() => void handleSubmit()} disabled={isWorking}>
          {isWorking ? "Saving…" : "Add"}
        </Button>
      </DialogFooter>
    </>
  );
};

// ----- Shared collection picker subview ------------------------------------
interface FolderLike {
  id: string;
  name: string;
  color: WardrobeFolderColor;
}

const CollectionPicker = ({
  folders,
  selectedFolderId,
  onSelectFolder,
  isCreating,
  onToggleCreating,
  newFolderName,
  onNewFolderNameChange,
  newFolderColor,
  onNewFolderColorChange,
  hideNoneOption = false,
}: {
  folders: FolderLike[];
  selectedFolderId: string | "__none__";
  onSelectFolder: (id: string | "__none__") => void;
  isCreating: boolean;
  onToggleCreating: (next: boolean) => void;
  newFolderName: string;
  onNewFolderNameChange: (value: string) => void;
  newFolderColor: WardrobeFolderColor;
  onNewFolderColorChange: (color: WardrobeFolderColor) => void;
  hideNoneOption?: boolean;
}) => {
  // Toggle creating mode resets the selection so the two states can't both
  // be active at once (creating a new folder OR picking an existing one).
  useEffect(() => {
    if (isCreating) onSelectFolder("__none__");
  }, [isCreating]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Pick a collection
      </p>

      <div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto pr-1">
        {!hideNoneOption && (
          <button
            type="button"
            onClick={() => {
              onToggleCreating(false);
              onSelectFolder("__none__");
            }}
            className={cn(
              "h-9 rounded-full border px-3 text-xs font-medium transition-colors",
              selectedFolderId === "__none__" && !isCreating
                ? "border-primary bg-primary text-primary-foreground"
                : "border-foreground/15 bg-background/56 text-foreground/80 hover:border-foreground/30",
            )}
          >
            None — closet only
          </button>
        )}
        {folders.map((folder) => {
          const palette = getCollectionAccentPalette(folder.color);
          const isSelected = selectedFolderId === folder.id && !isCreating;
          return (
            <button
              key={folder.id}
              type="button"
              onClick={() => {
                onToggleCreating(false);
                onSelectFolder(folder.id);
              }}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-medium transition-colors",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-foreground/15 bg-background/56 text-foreground/80 hover:border-foreground/30",
              )}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: palette.dot }}
              />
              {folder.name}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onToggleCreating(!isCreating)}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-full border border-dashed px-3 text-xs font-medium transition-colors",
            isCreating
              ? "border-primary bg-primary/15 text-primary"
              : "border-foreground/25 text-foreground/70 hover:border-primary/50 hover:text-foreground",
          )}
        >
          <Plus className="h-3 w-3" />
          New
        </button>
      </div>

      {isCreating && (
        <div className="space-y-2 rounded-xl border border-foreground/10 bg-background/40 p-3">
          <Input
            placeholder="Collection name…"
            value={newFolderName}
            onChange={(e) => onNewFolderNameChange(e.target.value)}
            className="h-10 rounded-lg"
            autoFocus
          />
          <div className="flex flex-wrap gap-1.5">
            {WARDROBE_FOLDER_COLORS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onNewFolderColorChange(option.value)}
                className={cn(
                  "flex h-7 items-center gap-1.5 rounded-full border px-2 text-[11px] transition-colors",
                  newFolderColor === option.value
                    ? "border-primary text-foreground"
                    : "border-foreground/15 text-foreground/70 hover:border-foreground/40",
                )}
                title={option.label}
              >
                <span
                  className={cn("h-2 w-2 rounded-full", option.chipClassName)}
                />
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SavePieceToClosetDialog;
