import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import type { WardrobeItem } from "@/hooks/useWardrobe";

interface WardrobeLibraryProps {
  items: WardrobeItem[];
  onAddToCanvas: (item: WardrobeItem) => void;
  onDelete: (id: string) => void;
  onAddPhoto: (imageUrl: string, category: string) => void | Promise<void>;
  isLoading?: boolean;
}

const WardrobeLibrary = ({ items, onAddToCanvas, onDelete, onAddPhoto, isLoading = false }: WardrobeLibraryProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<"top" | "trousers" | "shoes">("top");

  const handleUpload = async (file: File) => {
    const imageUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) ?? "");
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    if (!imageUrl) {
      throw new Error("Could not read selected image");
    }

    await onAddPhoto(imageUrl, uploadCategory);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsUploading(true);
    try {
      await handleUpload(file);
    } catch (error) {
      console.error("Wardrobe photo upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return <div className="text-xs text-muted-foreground text-center py-4">Loading wardrobe...</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end gap-2">
        <select
          value={uploadCategory}
          onChange={(e) => setUploadCategory(e.target.value as "top" | "trousers" | "shoes")}
          className="h-7 rounded-md border border-border bg-background px-2 text-xs text-foreground"
          disabled={isUploading}
          aria-label="Wardrobe photo category"
        >
          <option value="top">Top</option>
          <option value="trousers">Trousers</option>
          <option value="shoes">Shoes</option>
        </select>
        <Button
          variant="secondary"
          size="sm"
          className="h-7 px-2 text-xs gap-1"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
          Add Photo
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void handleFileChange(e)}
        />
      </div>

      {items.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-4">No wardrobe items yet</div>
      ) : (
        <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
          {items.map((item) => (
            <div key={item.id} className="relative group">
              <button
                onClick={() => onAddToCanvas(item)}
                className="relative w-full rounded-lg overflow-hidden border border-border bg-muted aspect-square card-hover"
              >
                <img src={item.imageUrl} alt={item.category} className="w-full h-full object-cover" />
                <Badge className="absolute top-1 left-1 text-[9px] px-1 py-0 bg-background/80 text-foreground border-0">
                  {item.category}
                </Badge>
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">+ Canvas</span>
                </div>
              </button>
              <div className="absolute bottom-1 left-1 right-1 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onAddToCanvas(item)}
                  title="Add to canvas"
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={() => onDelete(item.id)}
                  title="Delete wardrobe item"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WardrobeLibrary;
