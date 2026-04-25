import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createId } from "@/lib/id";
import type { GeneratedItem } from "@/hooks/useOutfits";
import { editImageWithReplicate } from "@/services/replicateImageEdit";
import { isSupabaseConfigured } from "@/lib/supabase";
import StyleTemplateSelector from "@/components/StyleTemplateSelector";
import type { StyleTemplate } from "@/types/styleTemplates";
import { DEFAULT_STYLE_TEMPLATES } from "@/types/styleTemplates";
import { useSystemPrompt } from "@/hooks/useSystemPrompt";
import { detectClothingCategory } from "@/lib/clothingCategory";

interface ImageEditorDialogProps {
  open: boolean;
  item: GeneratedItem | null;
  onClose: () => void;
  onApply: (newItem: GeneratedItem, mode: "replace" | "copy") => void;
}

const ImageEditorDialog = ({ open, item, onClose, onApply }: ImageEditorDialogProps) => {
  const [isWorking, setIsWorking] = useState(false);
  const [prompt, setPrompt] = useState<string>(item?.prompt ?? "");
  const [selectedTemplate, setSelectedTemplate] = useState<StyleTemplate | null>(DEFAULT_STYLE_TEMPLATES[0]);
  const [previewItem, setPreviewItem] = useState<GeneratedItem | null>(null);

  const {
    prompt: systemPrompt,
    setPrompt: setSystemPrompt,
    savePrompt: saveSystemPrompt,
    isSaving: isSavingSystemPrompt,
    isCloudSyncEnabled: isSystemPromptCloudEnabled,
    syncError: systemPromptSyncError,
  } = useSystemPrompt();

  useEffect(() => {
    if (open) {
      setPrompt(item?.prompt ?? "");
      setPreviewItem(null);
    }
  }, [item, open]);

  const handleRegenerate = async () => {
    if (!item) return;
    const userPrompt = prompt.trim();
    if (!userPrompt) {
      toast.error("Please enter a description for the item");
      return;
    }
    if (!selectedTemplate) {
      toast.error("Please select a style template");
      return;
    }
    setIsWorking(true);
    try {
      const fullPrompt = `${userPrompt}. ${systemPrompt}. ${selectedTemplate.styleDescriptor}`;
      if (!isSupabaseConfigured) {
        throw new Error(
          "Replicate modification is unavailable because Supabase is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
        );
      }

      const imageUrl = await editImageWithReplicate({
        imageUrl: item.imageUrl,
        prompt: fullPrompt,
        aspectRatio: "1:1",
      });
      console.log("[Modify] Provider used: Replicate (p-image-edit)");
      const inferredCategory = detectClothingCategory(userPrompt, item.category);
      const newItem: GeneratedItem = {
        id: createId(),
        category: inferredCategory,
        imageUrl,
        prompt: userPrompt,
        createdAt: new Date().toISOString(),
      };
      setPreviewItem(newItem);
      toast.success("Board ready");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to modify item";
      console.error("[Modify] Replicate modification failed:", error);
      toast.error(msg);
      // keep dialog open for retry
    } finally {
      setIsWorking(false);
    }
  };

  const handleDiscard = () => {
    setPreviewItem(null);
    onClose();
  };

  const handleAccept = () => {
    if (!previewItem) return;
    onApply(previewItem, "replace");
    setPreviewItem(null);
    onClose();
  };

  const handleSaveCopy = () => {
    if (!previewItem) return;
    onApply(previewItem, "copy");
    setPreviewItem(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="max-w-3xl" aria-describedby="image-editor-description">
        <DialogHeader>
          <DialogTitle>Modify Generated Item</DialogTitle>
          <DialogDescription id="image-editor-description">
            Preview edits before applying. You can discard, replace the original, or save a copy.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            {item && (
              <div className="rounded-md border overflow-hidden">
                <img src={item.imageUrl} alt="Original" className="w-full h-auto object-contain" />
              </div>
            )}
            <p className="text-xs text-muted-foreground">Original</p>
            {previewItem && (
              <>
                <div className="rounded-md border overflow-hidden">
                  <img src={previewItem.imageUrl} alt="Modified preview" className="w-full h-auto object-contain" />
                </div>
                <p className="text-xs text-muted-foreground">Modified preview</p>
              </>
            )}
          </div>
          <div className="space-y-3">
            <StyleTemplateSelector
              category={detectClothingCategory(prompt, item?.category ?? "top")}
              selectedTemplate={selectedTemplate}
              onTemplateChange={(template) => setSelectedTemplate(template)}
              systemPrompt={systemPrompt}
              onSystemPromptChange={setSystemPrompt}
              onSaveSystemPrompt={saveSystemPrompt}
              isSavingSystemPrompt={isSavingSystemPrompt}
              isSystemPromptCloudEnabled={isSystemPromptCloudEnabled}
              systemPromptSyncError={systemPromptSyncError}
            />
            <div className="space-y-2">
              <label htmlFor="modify-prompt" className="text-xs font-medium text-muted-foreground">
                Item Description (tweak and regenerate)
              </label>
              <Textarea
                id="modify-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[80px] resize-y"
                placeholder="e.g., make it more oversized, add zipper details..."
                disabled={isWorking}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={previewItem ? handleDiscard : onClose} disabled={isWorking}>
                {previewItem ? "Discard" : "Cancel"}
              </Button>
              <Button onClick={handleRegenerate} disabled={isWorking}>
                {isWorking ? "Generating..." : "Preview Changes"}
              </Button>
              <Button onClick={handleAccept} disabled={!previewItem || isWorking}>
                Accept
              </Button>
              <Button variant="secondary" onClick={handleSaveCopy} disabled={!previewItem || isWorking}>
                Save as Copy
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageEditorDialog;
