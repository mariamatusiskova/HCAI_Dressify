import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Shirt, Footprints, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { GeneratedItem } from "@/hooks/useOutfits";
import { generateClothingItem } from "@/services/sanaSprintApi";
import StyleTemplateSelector from "@/components/StyleTemplateSelector";
import type { StyleTemplate } from "@/types/styleTemplates";
import { DEFAULT_STYLE_TEMPLATES, GLOBAL_SYSTEM_PROMPT } from "@/types/styleTemplates";

// When a new item is generated, this component calls onItemGenerated(item) so the parent 
// can store it (and later display it / add to canvas).
interface GeneratePanelProps {
  onItemGenerated: (item: GeneratedItem) => void;
}

// Categories list (Top / Trousers / Shoes)
// - This array is used to render 3 identical UI blocks (one per category) by mapping over it.
const categories = [
  { key: "top" as const, label: "Top", icon: Shirt },
  { key: "trousers" as const, label: "Trousers", icon: Sparkles },
  { key: "shoes" as const, label: "Shoes", icon: Footprints },
];

// State it manages
// - null means nothing is generating
// - otherwise it stores the category key ("top" | "trousers" | "shoes")
// - This is used to disable inputs/buttons and show a spinner.
// - Stores the textarea content separately for each category. -> the ""
const GeneratePanel = ({ onItemGenerated }: GeneratePanelProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<Record<"top" | "trousers" | "shoes", string>>({
    top: "",
    trousers: "",
    shoes: "",
  });
  const [selectedTemplates, setSelectedTemplates] = useState<Record<"top" | "trousers" | "shoes", StyleTemplate | null>>({
    top: DEFAULT_STYLE_TEMPLATES[0], // Default to first template
    trousers: DEFAULT_STYLE_TEMPLATES[0],
    shoes: DEFAULT_STYLE_TEMPLATES[0],
  });

  // Updating text in a box
  // - So typing in the “Top” textbox only updates prompts.top, etc.
  const handlePromptChange = (category: "top" | "trousers" | "shoes", value: string) => {
    setPrompts((prev) => ({ ...prev, [category]: value }));
  };

  const handleTemplateChange = (category: "top" | "trousers" | "shoes", template: StyleTemplate) => {
    setSelectedTemplates((prev) => ({ ...prev, [category]: template }));
  };

  const handleGenerate = async (category: "top" | "trousers" | "shoes") => {
    const userPrompt = prompts[category].trim();
    if (!userPrompt) {
      toast.error(`Please enter a description for the ${category} item`);
      return;
    }

    const template = selectedTemplates[category];
    if (!template) {
      toast.error("Please select a style template");
      return;
    }

    setLoading(category);
    // Call the generation API
    try {
      // Combine: user input + global system prompt + style descriptor
      const fullPrompt = `${userPrompt}. ${GLOBAL_SYSTEM_PROMPT}. ${template.styleDescriptor}`;
      const imageUrl = await generateClothingItem(fullPrompt, category, template);
      const item: GeneratedItem = {
        id: crypto.randomUUID(),
        category,
        imageUrl,
        prompt: userPrompt, // Store only user input, not full prompt
        createdAt: new Date().toISOString(),
      };
      // Send it to the parent
      onItemGenerated(item);
      // Clear prompt after successful generation
      setPrompts((prev) => ({ ...prev, [category]: "" }));
      toast.success(`${category} generated successfully`);
    } catch (error) {
      // Error handling
      const errorMessage = error instanceof Error ? error.message : "Failed to generate item";
      toast.error(errorMessage);
      console.error("Generation error:", error);
    } finally {
      // Finally, stop loading
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-display font-medium text-muted-foreground uppercase tracking-wider">
        Generate Items
      </h3>

      {/* Category sections with individual textboxes */}
      <div className="space-y-4">
        {categories.map(({ key, label, icon: Icon }) => {
          const prompt = prompts[key];
          const isLoading = loading === key;
          const selectedTemplate = selectedTemplates[key];

          return (
            <div key={key} className="space-y-3 p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <label htmlFor={`prompt-${key}`} className="text-xs font-medium text-muted-foreground">
                  {label}
                </label>
              </div>
              
              {/* Style Template Selector */}
              <StyleTemplateSelector
                category={key}
                selectedTemplate={selectedTemplate}
                onTemplateChange={(template) => handleTemplateChange(key, template)}
              />

              {/* User Input */}
              <div className="space-y-2">
                <label htmlFor={`prompt-${key}`} className="text-xs font-medium text-muted-foreground">
                  Item Description
                </label>
                <div className="flex gap-2">
                  <Textarea
                    id={`prompt-${key}`}
                    placeholder={`e.g., green jacket, blue jeans, white sneakers...`}
                    value={prompt}
                    onChange={(e) => handlePromptChange(key, e.target.value)}
                    className="min-h-[60px] resize-none flex-1"
                    disabled={loading !== null || !selectedTemplate}
                    onKeyDown={(e) => {
                      // Allow Ctrl/Cmd + Enter to generate
                      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && prompt.trim()) {
                        e.preventDefault();
                        handleGenerate(key);
                      }
                    }}
                  />
                  <Button
                    variant="secondary"
                    size="icon"
                    className="shrink-0"
                    disabled={loading !== null || !prompt.trim() || !selectedTemplate}
                    onClick={() => handleGenerate(key)}
                    title={`Generate ${label}`}
                  >
                    {isLoading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {selectedTemplate && (
                  <p className="text-xs text-muted-foreground">
                    Your input + global product prompt + "{selectedTemplate.name}" style
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {loading && (
        <p className="text-xs text-muted-foreground">
          Generating {categories.find((c) => c.key === loading)?.label.toLowerCase()}...
        </p>
      )}
    </div>
  );
};

export default GeneratePanel;
