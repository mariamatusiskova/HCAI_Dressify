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

// Two-step audience picker. First row picks Adult vs Kids; the second row
// shows the sub-options for whichever is active. We keep the two
// sub-selections in separate state so flipping back and forth doesn't
// erase the user's previous choice on the other side.
type Audience = "adult" | "kids";
type AdultSubgroup = "any" | "women" | "men";
type KidsSubgroup = "any" | "girl" | "boy" | "baby";

const AUDIENCE_OPTIONS: Array<{ value: Audience; label: string }> = [
  { value: "adult", label: "Adult" },
  { value: "kids", label: "Kids" },
];

const ADULT_SUBGROUP_OPTIONS: Array<{ value: AdultSubgroup; label: string }> = [
  { value: "any", label: "Any" },
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
];

const KIDS_SUBGROUP_OPTIONS: Array<{ value: KidsSubgroup; label: string }> = [
  { value: "any", label: "Any" },
  { value: "girl", label: "Girl" },
  { value: "boy", label: "Boy" },
  { value: "baby", label: "Baby" },
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
  // Two-step audience state: top-level adult/kids + remembered sub-selections.
  const [audience, setAudience] = useState<Audience>("adult");
  const [adultSubgroup, setAdultSubgroup] = useState<AdultSubgroup>("any");
  const [kidsSubgroup, setKidsSubgroup] = useState<KidsSubgroup>("any");
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
      // Combine: user input + audience hint + global system prompt + style descriptor.
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
      //                                     so listing rack made racks.
      //
      // Final strategy: stop naming anything we don't want. Describe the
      // ONLY scene we want as vividly as possible — overhead flat lay
      // photograph on a white surface — and let the model infer the rest.
      // Audience is encoded via terse retail-style "fit" descriptors which
      // adjust garment proportions without pulling in body imagery.
      const fitDescriptor = (() => {
        if (audience === "adult") {
          if (adultSubgroup === "women") return "women's fit";
          if (adultSubgroup === "men") return "men's fit";
          return null;
        }
        // kids
        if (kidsSubgroup === "girl") return "girls' fit, child size";
        if (kidsSubgroup === "boy") return "boys' fit, child size";
        if (kidsSubgroup === "baby") return "infant fit, baby size";
        return "kids' fit, child size";
      })();
      const fitSuffix = fitDescriptor ? `, ${fitDescriptor}` : "";
      const audienceClause = `, overhead flat lay photograph, the garment is laid flat and centered on a clean white background surface, viewed from directly above, only the fabric is in frame, soft even studio lighting${fitSuffix}`;
      // Style descriptor is omitted when blank — happens when the user
      // picks the "None" template or picks "Custom" but leaves the text
      // empty. Stops a trailing ". ." from showing up in the prompt.
      const styleDescriptor = selectedTemplate.styleDescriptor.trim();
      const styleSuffix = styleDescriptor ? `. ${styleDescriptor}` : "";
      const fullPrompt = `${userPrompt}${audienceClause}. ${systemPrompt}${styleSuffix}`;
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

        {/* Audience picker — one connected card.
            Iterations have shown the user that two stacked widgets feel
            "duplicated", and a separate sub-row floating on the left
            looks orphaned when "Kids" is selected. Solution: put the
            Adult/Kids tabs and the sub-options inside ONE container.
            The active tab + its options visually belong to the same
            card, so the connection is obvious regardless of which side
            is selected. */}
        <div className="space-y-2">
          <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            For
          </label>

          <div className="overflow-hidden rounded-xl border border-foreground/10 bg-background/40">
            {/* Top half: Adult / Kids tabs. Equal-width segmented look. */}
            <div className="grid grid-cols-2">
              {AUDIENCE_OPTIONS.map((option) => {
                const isActive = audience === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setAudience(option.value)}
                    disabled={loading}
                    className={cn(
                      "h-11 text-sm font-semibold transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-transparent text-muted-foreground hover:bg-background/60 hover:text-foreground",
                    )}
                    aria-pressed={isActive}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            {/* Bottom half: sub-options for the active tab. Stronger
                inset bg + slightly more padding give the sub-row a
                visibly different "depth" so it reads as a panel nested
                INSIDE the picker (parent tab → its options) rather than
                a peer of the tabs.
                Active state uses a NEUTRAL soft tint (not red) — clearly
                "selected" but visually distinct from both the parent
                tab's solid red fill AND the destructive Delete button's
                red border + dark fill. */}
            <div
              className={cn(
                "grid gap-1.5 border-t border-foreground/10 bg-foreground/[0.04] p-2",
                audience === "adult" ? "grid-cols-3" : "grid-cols-4",
              )}
            >
              {(audience === "adult" ? ADULT_SUBGROUP_OPTIONS : KIDS_SUBGROUP_OPTIONS).map(
                (option) => {
                  const isActive =
                    audience === "adult"
                      ? adultSubgroup === option.value
                      : kidsSubgroup === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        if (audience === "adult") {
                          setAdultSubgroup(option.value as AdultSubgroup);
                        } else {
                          setKidsSubgroup(option.value as KidsSubgroup);
                        }
                      }}
                      disabled={loading}
                      className={cn(
                        "h-9 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-foreground/12 text-foreground shadow-sm ring-1 ring-foreground/15"
                          : "bg-transparent text-foreground/40 hover:bg-foreground/8 hover:text-foreground",
                      )}
                      aria-pressed={isActive}
                    >
                      {option.label}
                    </button>
                  );
                },
              )}
            </div>
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
