import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Shirt, Footprints, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { GeneratedItem } from "@/hooks/useOutfits";
import { generateClothingItem } from "@/services/sanaSprintApi";

interface GeneratePanelProps {
  onItemGenerated: (item: GeneratedItem) => void;
}

const categories = [
  { key: "top" as const, label: "Top", icon: Shirt },
  { key: "trousers" as const, label: "Trousers", icon: Sparkles },
  { key: "shoes" as const, label: "Shoes", icon: Footprints },
];

const GeneratePanel = ({ onItemGenerated }: GeneratePanelProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<Record<"top" | "trousers" | "shoes", string>>({
    top: "",
    trousers: "",
    shoes: "",
  });

  const handlePromptChange = (category: "top" | "trousers" | "shoes", value: string) => {
    setPrompts((prev) => ({ ...prev, [category]: value }));
  };

  const handleGenerate = async (category: "top" | "trousers" | "shoes") => {
    const prompt = prompts[category].trim();
    if (!prompt) {
      toast.error(`Please enter a description for the ${category} item`);
      return;
    }

    setLoading(category);
    try {
      const imageUrl = await generateClothingItem(prompt, category);
      const item: GeneratedItem = {
        id: crypto.randomUUID(),
        category,
        imageUrl,
        prompt: prompt,
        createdAt: new Date().toISOString(),
      };
      onItemGenerated(item);
      // Clear prompt after successful generation
      setPrompts((prev) => ({ ...prev, [category]: "" }));
      toast.success(`${category} generated successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate item";
      toast.error(errorMessage);
      console.error("Generation error:", error);
    } finally {
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

          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <label htmlFor={`prompt-${key}`} className="text-xs font-medium text-muted-foreground">
                  {label}
                </label>
              </div>
              <div className="flex gap-2">
                <Textarea
                  id={`prompt-${key}`}
                  placeholder={`e.g., red cotton t-shirt with logo...`}
                  value={prompt}
                  onChange={(e) => handlePromptChange(key, e.target.value)}
                  className="min-h-[60px] resize-none flex-1"
                  disabled={loading !== null}
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
                  disabled={loading !== null || !prompt.trim()}
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
