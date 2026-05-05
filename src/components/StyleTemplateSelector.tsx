import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Settings, Edit2, Save } from "lucide-react";
import { toast } from "sonner";
import type { StyleTemplate } from "@/types/styleTemplates";
import {
  CUSTOM_STYLE_ID,
  DEFAULT_STYLE_TEMPLATES,
  NONE_STYLE_ID,
} from "@/types/styleTemplates";

interface StyleTemplateSelectorProps {
  category: "top" | "trousers" | "shoes";
  selectedTemplate: StyleTemplate | null;
  onTemplateChange: (template: StyleTemplate) => void;
  systemPrompt: string;
  onSystemPromptChange: (value: string) => void;
  onSaveSystemPrompt: (value: string) => Promise<unknown>;
  isSavingSystemPrompt: boolean;
  isSystemPromptCloudEnabled: boolean;
  systemPromptSyncError: string | null;
}

const StyleTemplateSelector = ({
  category,
  selectedTemplate,
  onTemplateChange,
  systemPrompt,
  onSystemPromptChange,
  onSaveSystemPrompt,
  isSavingSystemPrompt,
  isSystemPromptCloudEnabled,
  systemPromptSyncError,
}: StyleTemplateSelectorProps) => {
  const [isEditingGlobal, setIsEditingGlobal] = useState(false);
  const [isEditingStyle, setIsEditingStyle] = useState(false);
  const [editedGlobalPrompt, setEditedGlobalPrompt] = useState(systemPrompt);
  const [editedStyleDescriptor, setEditedStyleDescriptor] = useState(selectedTemplate?.styleDescriptor || "");

  // Update edited style descriptor when selected template changes
  useEffect(() => {
    if (selectedTemplate) {
      setEditedStyleDescriptor(selectedTemplate.styleDescriptor);
    }
  }, [selectedTemplate]);

  useEffect(() => {
    if (!isEditingGlobal) {
      setEditedGlobalPrompt(systemPrompt);
    }
  }, [systemPrompt, isEditingGlobal]);

  // Filter templates that apply to this category or all categories
  const availableTemplates = DEFAULT_STYLE_TEMPLATES.filter(
    (t) => t.category === category || t.category === "all"
  );

  const handleTemplateSelect = (templateId: string) => {
    const template = DEFAULT_STYLE_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      onTemplateChange(template);
      setEditedStyleDescriptor(template.styleDescriptor);
      setIsEditingStyle(false);
      setIsEditingGlobal(false);
      toast.success(`Style "${template.name}" selected`);
    }
  };

  const handleEditGlobalPrompt = () => {
    setIsEditingGlobal(true);
  };

  const handleSaveGlobalPrompt = () => {
    const nextPrompt = editedGlobalPrompt.trim();
    if (!nextPrompt) {
      toast.error("System prompt cannot be empty");
      return;
    }

    onSystemPromptChange(nextPrompt);
    void onSaveSystemPrompt(nextPrompt)
      .then(() => {
    setIsEditingGlobal(false);
        toast.success("System prompt saved");
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Failed to save system prompt");
      });
  };

  const handleEditStyleDescriptor = () => {
    setIsEditingStyle(true);
  };

  const handleSaveStyleDescriptor = () => {
    if (!selectedTemplate) return;

    const updatedTemplate: StyleTemplate = {
      ...selectedTemplate,
      styleDescriptor: editedStyleDescriptor.trim(),
    };
    onTemplateChange(updatedTemplate);
    setIsEditingStyle(false);
    toast.success("Style descriptor updated");
  };

  const handleCancelEdit = () => {
    setEditedGlobalPrompt(systemPrompt);
    setEditedStyleDescriptor(selectedTemplate?.styleDescriptor || "");
    setIsEditingGlobal(false);
    setIsEditingStyle(false);
  };

  // Build full prompt preview
  const fullPromptPreview = selectedTemplate
    ? `${isEditingGlobal ? editedGlobalPrompt : systemPrompt}. ${selectedTemplate.styleDescriptor}`
    : isEditingGlobal
      ? editedGlobalPrompt
      : systemPrompt;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="prompt-single" className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            STYLE
          </label>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 rounded-full p-0 text-muted-foreground hover:bg-primary/16 hover:text-foreground hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_0_0_1px_rgba(239,49,65,0.12),0_10px_24px_rgba(239,49,65,0.08)] dark:hover:bg-primary/20 dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_0_1px_rgba(255,255,255,0.05),0_10px_24px_rgba(239,49,65,0.1)]"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>System Prompt Configuration</DialogTitle>
              <DialogDescription>
                View and edit the prompts that will be combined with your item description
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Global System Prompt */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Global System Prompt (applies to all)</Label>
                  {!isEditingGlobal ? (
                    <Button variant="outline" size="sm" onClick={handleEditGlobalPrompt}>
                      <Edit2 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveGlobalPrompt}>
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                    </div>
                  )}
                </div>
                {isEditingGlobal ? (
                  <Textarea
                    value={editedGlobalPrompt}
                    onChange={(e) => setEditedGlobalPrompt(e.target.value)}
                    className="min-h-[100px] font-mono text-xs"
                    placeholder="Enter global system prompt..."
                    disabled={isSavingSystemPrompt}
                  />
                ) : (
                  <div className="p-3 bg-muted rounded-md font-mono text-xs whitespace-pre-wrap break-words">
                    {systemPrompt}
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Saved to {isSystemPromptCloudEnabled ? "Supabase" : "local storage"}
                </p>
                {systemPromptSyncError && <p className="text-[11px] text-amber-600">{systemPromptSyncError}</p>}
                <p className="text-xs text-muted-foreground">
                  This prompt ensures all generated items are product-style images suitable for outfit mixing (frontal shot, white background, professional lighting).
                </p>
              </div>

              {/* Style Descriptor */}
              {selectedTemplate && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Style Descriptor: {selectedTemplate.name}</Label>
                    {!isEditingStyle ? (
                      <Button variant="outline" size="sm" onClick={handleEditStyleDescriptor}>
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSaveStyleDescriptor}>
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                      </div>
                    )}
                  </div>
                  {isEditingStyle ? (
                    <Textarea
                      value={editedStyleDescriptor}
                      onChange={(e) => setEditedStyleDescriptor(e.target.value)}
                      className="min-h-[80px] font-mono text-xs"
                      placeholder="Enter style descriptor..."
                    />
                  ) : (
                    <div className="p-3 bg-muted rounded-md font-mono text-xs whitespace-pre-wrap break-words">
                      {selectedTemplate.styleDescriptor}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Style-specific descriptors that modify the aesthetic (e.g., "oversized", "streetwear style").
                  </p>
                </div>
              )}

              {/* Full Prompt Preview */}
              <div className="space-y-2 pt-2 border-t">
                <Label>Full Prompt Preview</Label>
                <div className="p-3 bg-primary/5 rounded-md font-mono text-xs whitespace-pre-wrap break-words border border-primary/20">
                  {fullPromptPreview}
                </div>
                <p className="text-xs text-muted-foreground">
                  Your item description will be added to this prompt. Example: "green jacket" + this prompt = full generation prompt.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Select
        value={selectedTemplate?.id || ""}
        onValueChange={handleTemplateSelect}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a style..." />
        </SelectTrigger>
        <SelectContent>
          {/* Two visual groups so the user understands the special
              "None" / "Custom" entries aren't just more presets. The
              labels and the separator are skipped if either group is
              empty (defensive — the templates list should always have
              both sections, but this keeps the dropdown sensible if it
              ever doesn't). */}
          {(() => {
            const specialIds = [NONE_STYLE_ID, CUSTOM_STYLE_ID];
            const specialTemplates = availableTemplates.filter((t) =>
              specialIds.includes(t.id),
            );
            const presetTemplates = availableTemplates.filter(
              (t) => !specialIds.includes(t.id),
            );
            return (
              <>
                {specialTemplates.length > 0 && (
                  <SelectGroup>
                    <SelectLabel className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
                      No preset
                    </SelectLabel>
                    {specialTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{template.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {template.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {specialTemplates.length > 0 && presetTemplates.length > 0 && (
                  <SelectSeparator />
                )}
                {presetTemplates.length > 0 && (
                  <SelectGroup>
                    <SelectLabel className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
                      Style presets
                    </SelectLabel>
                    {presetTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{template.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {template.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </>
            );
          })()}
        </SelectContent>
      </Select>

      {/* Custom-style text input. Visible only when the user picks
          "Custom" from the dropdown above. The typed words become the
          template's styleDescriptor (we mutate the template via
          onTemplateChange so GeneratePanel always reads the latest
          value off selectedTemplate.styleDescriptor). */}
      {selectedTemplate?.id === CUSTOM_STYLE_ID && (
        <div className="space-y-1.5 rounded-lg border border-foreground/10 bg-background/40 p-2">
          <Label className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Your style words
          </Label>
          <Textarea
            value={selectedTemplate.styleDescriptor}
            onChange={(e) =>
              onTemplateChange({
                ...selectedTemplate,
                styleDescriptor: e.target.value,
              })
            }
            placeholder="e.g., dark academia, autumn palette, soft tailoring"
            className="min-h-[60px] resize-none"
          />
          <p className="text-[11px] text-muted-foreground">
            We'll add these words to the AI prompt alongside your description.
          </p>
        </div>
      )}

      {/* "None" gets no extra helper text — the dropdown trigger
          already shows "No style modifier — just my description" so a
          repeat below would just be filler that creates an awkward gap. */}
    </div>
  );
};

export default StyleTemplateSelector;
