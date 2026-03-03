// Global system prompt that always applies - ensures product-style images for outfit mixing
export const GLOBAL_SYSTEM_PROMPT = "Frontal shot, product photography style, white background, professional lighting, isolated on white, e-commerce product image, high quality, detailed, 1024x1024 resolution, front view, clean background";

export interface StyleTemplate {
  id: string;
  name: string;
  description: string;
  styleDescriptor: string; // Style-specific descriptor (e.g., "oversized", "streetwear style")
  category: "top" | "trousers" | "shoes" | "all";
}

export const DEFAULT_STYLE_TEMPLATES: StyleTemplate[] = [
  {
    id: "oversized",
    name: "Oversized",
    description: "Loose, relaxed fit clothing",
    styleDescriptor: "oversized, loose fit, relaxed, comfortable",
    category: "all",
  },
  {
    id: "streetwear",
    name: "Streetwear",
    description: "Urban, casual street style",
    styleDescriptor: "streetwear style, urban, casual, modern, trendy",
    category: "all",
  },
  {
    id: "goth",
    name: "Goth",
    description: "Dark, alternative gothic style",
    styleDescriptor: "goth style, dark, alternative, edgy, black, gothic aesthetic",
    category: "all",
  },
  {
    id: "business-casual",
    name: "Business Casual",
    description: "Professional yet relaxed office wear",
    styleDescriptor: "business casual, professional, smart casual, office appropriate, polished",
    category: "all",
  },
  {
    id: "formal",
    name: "Formal",
    description: "Elegant, sophisticated formal wear",
    styleDescriptor: "formal, elegant, sophisticated, refined, classic, dressy",
    category: "all",
  },
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Clean, simple, understated style",
    styleDescriptor: "minimalist, clean, simple, understated, modern, basic",
    category: "all",
  },
  {
    id: "athletic",
    name: "Athletic",
    description: "Sporty, activewear style",
    styleDescriptor: "athletic, sporty, activewear, performance, functional, athletic style",
    category: "all",
  },
  {
    id: "vintage",
    name: "Vintage",
    description: "Retro, classic vintage style",
    styleDescriptor: "vintage, retro, classic, nostalgic, timeless, retro style",
    category: "all",
  },
];
