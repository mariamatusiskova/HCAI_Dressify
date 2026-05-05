import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createId } from "@/lib/id";
import type { GeneratedItem } from "@/hooks/useOutfits";
import { generateClothingItem } from "@/services/sanaSprintApi";
import { useSystemPrompt } from "@/hooks/useSystemPrompt";
import StyleTemplateSelector from "@/components/StyleTemplateSelector";
import type { StyleTemplate } from "@/types/styleTemplates";
import { DEFAULT_STYLE_TEMPLATES } from "@/types/styleTemplates";
import { detectClothingCategory } from "@/lib/clothingCategory";

// When a new item is generated, this component calls onItemGenerated(item) so the parent 
// can store it (and later display it / add to board).
interface GeneratePanelProps {
  onItemGenerated: (item: GeneratedItem) => void;
  hideTitle?: boolean;
  className?: string;
  buttonLabel?: string;
}

// Gender hint surfaced to the user as a small Any / Women / Men segmented
// control. When set to "women" or "men" we tack a clause onto the prompt
// the AI sees so the generated piece is sex-appropriate without the user
// having to remember to type "men's…" / "women's…" themselves.
type GenderHint = "any" | "women" | "men";

const GENDER_OPTIONS: Array<{ value: GenderHint; label: string }> = [
  { value: "any", label: "Any" },
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
];

const GeneratePanel = ({
  onItemGenerated,
  hideTitle = false,
  className,
  buttonLabel = "Generate outfit",
}: GeneratePanelProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [prompt, setPrompt] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<StyleTemplate | null>(DEFAULT_STYLE_TEMPLATES[0]);
  const [gender, setGender] = useState<GenderHint>("any");
  const {
    prompt: systemPrompt,
    setPrompt: setSystemPrompt,
    savePrompt: saveSystemPrompt,
    isSaving: isSavingSystemPrompt,
    isCloudSyncEnabled: isSystemPromptCloudEnabled,
    syncError: systemPromptSyncError,
  } = useSystemPrompt();

  const handleGenerate = async () => {
    const userPrompt = prompt.trim();
    if (!userPrompt) {
      toast.error("Please enter a description for the item");
      return;
    }

    if (!selectedTemplate) {
      toast.error("Please select a style template");
      return;
    }

    setLoading(true);
    // Call the generation API
    try {
      // Combine: user input + gender hint + global system prompt + style descriptor.
      //
      // The Sana Sprint endpoint has no "negative prompt" slot, so any
      // fix has to live inside positive text. Trial and error log:
      //   - "for women" / "men's cut"     → model adds a body wearing it.
      //   - "ghost mannequin"             → model adds a literal mannequin.
      //   - "women's fashion design"      → boutique scene, hangers.
      //   - "no hanger, no rack"          → boomeranged: stable-diffusion-
      //                                     style models often promote
      //                                     mentioned nouns into the scene
      //                                     even when prefixed with "no",
      //                                     so explicitly listing rack
      //                                     made the model add racks.
      //
      // Final strategy: stop naming anything we don't want. Describe the
      // ONLY scene we want as vividly as possible — overhead flat lay
      // photograph on a white surface — and let the model infer the rest.
      // Gender is encoded via "women's fit" / "men's fit", which is a
      // very specific garment-cut term that doesn't pull in body imagery.
      const genderClause =
        gender === "women"
          ? ", overhead flat lay photograph, the garment is laid flat and centered on a clean white paper surface, viewed from directly above, only the fabric is in frame, soft even studio lighting, women's fit"
          : gender === "men"
            ? ", overhead flat lay photograph, the garment is laid flat and centered on a clean white paper surface, viewed from directly above, only the fabric is in frame, soft even studio lighting, men's fit"
            : ", overhead flat lay photograph, the garment is laid flat and centered on a clean white paper surface, viewed from directly above, only the fabric is in frame, soft even studio lighting";
      const fullPrompt = `${userPrompt}${genderClause}. ${systemPrompt}. ${selectedTemplate.styleDescriptor}`;
      const inferredCategory = detectClothingCategory(userPrompt, "top");
      const imageUrl = await generateClothingItem(fullPrompt, inferredCategory, selectedTemplate);
      const item: GeneratedItem = {
        id: createId(),
        category: inferredCategory,
        imageUrl,
        prompt: userPrompt, // Store only user input, not full prompt
        createdAt: new Date().toISOString(),
      };
      // Send it to the parent
      onItemGenerated(item);
      // Clear prompt after successful generation
      setPrompt("");
      toast.success("Item generated successfully");
    } catch (error) {
      // Error handling
      const errorMessage = error instanceof Error ? error.message : "Failed to generate item";
      toast.error(errorMessage);
      console.error("Generation error:", error);
    } finally {
      // Finally, stop loading
      setLoading(false);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {!hideTitle && (
        <h3 className="text-sm font-display font-medium text-muted-foreground uppercase tracking-wider">
          Generate Item
        </h3>
      )}

      <div className="glass-panel-soft space-y-3 rounded-[24px] border p-3.5">
        <StyleTemplateSelector
          category={detectClothingCategory(prompt, "top")}
          selectedTemplate={selectedTemplate}
          onTemplateChange={(template) => setSelectedTemplate(template)}
          systemPrompt={systemPrompt}
          onSystemPromptChange={setSystemPrompt}
          onSaveSystemPrompt={saveSystemPrompt}
          isSavingSystemPrompt={isSavingSystemPrompt}
          isSystemPromptCloudEnabled={isSystemPromptCloudEnabled}
          systemPromptSyncError={systemPromptSyncError}
        />

        {/* Gender selector — small segmented control. Default "Any" keeps
            the previous behaviour for users who don't care about gender. */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            For
          </label>
          <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-foreground/10 bg-background/40 p-1">
            {GENDER_OPTIONS.map((option) => {
              const isActive = gender === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setGender(option.value)}
                  disabled={loading}
                  className={cn(
                    "h-9 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-transparent text-muted-foreground hover:bg-background/60 hover:text-foreground",
                  )}
                  aria-pressed={isActive}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="prompt-single" className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Item Description
          </label>
          <Textarea
            id="prompt-single"
            placeholder="e.g., green jacket, blue jeans, white sneakers..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[78px] resize-none"
            disabled={loading || !selectedTemplate}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && prompt.trim()) {
                e.preventDefault();
                handleGenerate();
              }
            }}
          />
        </div>

        <Button
          className="h-10 w-full justify-center gap-2 rounded-xl"
          disabled={loading || !prompt.trim() || !selectedTemplate}
          onClick={() => handleGenerate()}
          title="Generate item"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/70 border-t-transparent" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {loading ? "Generating..." : buttonLabel}
        </Button>
      </div>
    </div>
  );
};

export default GeneratePanel;
