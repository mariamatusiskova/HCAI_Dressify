import { useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Upload, X } from "lucide-react";

interface UploadSectionProps {
  // string | null → the current photo (stored as a string URL, usually a Base64 data: URL) or null if none
  photo: string | null;
  // a callback to update the photo in the parent component
  onPhotoChange: (photo: string | null) => void;
  hideTitle?: boolean;
  className?: string;
  boxClassName?: string;
}

const UploadSection = ({ photo, onPhotoChange, hideTitle = false, className, boxClassName }: UploadSectionProps) => {
  // Keeps a hidden file input
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      // Converts an uploaded image into a usable string
      const reader = new FileReader();
      reader.onload = (e) => onPhotoChange(e.target?.result as string);
      reader.readAsDataURL(file);
    },
    [onPhotoChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file?.type.startsWith("image/")) handleFile(file);
    },
    [handleFile]
  );

  // Supports drag-and-drop upload onDrop or onDragOver
  return (
    <div className={cn("space-y-3", className)}>
      {!hideTitle && (
        <h3 className="text-sm font-display font-medium text-muted-foreground uppercase tracking-wider">
          Your Photo
        </h3>
      )}
      {photo ? (
        <div
          className={cn(
            "glass-panel-soft relative aspect-[3/4] max-h-48 overflow-hidden rounded-[22px] border",
            boxClassName,
          )}
        >
          <img src={photo} alt="User" className="w-full h-full object-cover" />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 bg-background/80 hover:bg-background"
            onClick={() => onPhotoChange(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "glass-panel-soft flex aspect-[3/4] max-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-[22px] border border-dashed p-6 transition-colors hover:border-primary/40",
            boxClassName,
          )}
        >
          <Upload className="h-7 w-7 text-muted-foreground" />
          <span className="text-center text-sm text-muted-foreground">Drop or click to upload</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
};

export default UploadSection;
