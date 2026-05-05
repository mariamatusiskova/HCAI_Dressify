// Global system prompt that always applies - ensures product-style images for outfit mixing
export const GLOBAL_SYSTEM_PROMPT = "Frontal shot, product photography style, white background, professional lighting, isolated on white, e-commerce product image, high quality, detailed, 1024x1024 resolution, front view, clean background";

export interface StyleTemplate {
  id: string;
  name: string;
  description: string;
  styleDescriptor: string; // Style-specific descriptor (e.g., "oversized", "streetwear style")
  category: "top" | "trousers" | "shoes" | "all";
  // Sentinel ids reserved for the two special options that aren't real
  // styles: "none" (skip the style clause entirely) and "custom" (the
  // user types their own descriptor in a text input). The selector
  // recognises these by id and renders a text field for "custom".
}

// Special sentinel ids — exported so other code can detect them without
// stringly-typing comparisons everywhere.
export const NONE_STYLE_ID = "none";
export const CUSTOM_STYLE_ID = "custom";

export const DEFAULT_STYLE_TEMPLATES: StyleTemplate[] = [
  {
    id: NONE_STYLE_ID,
    name: "None",
    // Kept short so the dropdown trigger doesn't wrap to two lines and
    // make "None" look isolated above a gap.
    description: "No style modifier",
    styleDescriptor: "",
    category: "all",
  },
  {
    id: CUSTOM_STYLE_ID,
    name: "Custom",
    description: "Write your own style words",
    styleDescriptor: "",
    category: "all",
  },
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
    id: "minimalist",
    name: "Minimalist",
    description: "Clean, simple, understated style",
    styleDescriptor: "minimalist, clean, simple, understated, modern, basic",
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
  {
    id: "goth",
    name: "Goth",
    description: "Dark, alternative gothic style",
    styleDescriptor: "goth style, dark, alternative, edgy, black, gothic aesthetic",
    category: "all",
  },
  {
    id: "bohemian",
    name: "Bohemian",
    description: "Free-spirited, eclectic, layered",
    styleDescriptor: "bohemian, boho, free-spirited, layered, eclectic, flowing",
    category: "all",
  },
  {
    id: "preppy",
    name: "Preppy",
    description: "Classic, polished, collegiate",
    styleDescriptor: "preppy, classic, polished, collegiate, traditional, refined",
    category: "all",
  },
  {
    id: "y2k",
    name: "Y2K",
    description: "Early-2000s, glossy, retro-futuristic",
    styleDescriptor: "y2k style, early 2000s, retro futuristic, glossy finish, playful",
    category: "all",
  },
  {
    id: "cottagecore",
    name: "Cottagecore",
    description: "Romantic, rustic, soft pastoral",
    styleDescriptor: "cottagecore, romantic, rustic, soft, floral motifs, pastoral",
    category: "all",
  },
  {
    id: "grunge",
    name: "Grunge",
    description: "Distressed, layered, rock-inspired",
    styleDescriptor: "grunge style, distressed, layered, vintage rock, edgy texture",
    category: "all",
  },
  {
    id: "punk",
    name: "Punk",
    description: "Rebellious, hardware accents, raw",
    styleDescriptor: "punk style, rebellious, hardware accents, raw edges, leather",
    category: "all",
  },
  {
    id: "romantic",
    name: "Romantic",
    description: "Soft, feminine, delicate detailing",
    styleDescriptor: "romantic style, soft, delicate detailing, lace and ruffles, feminine",
    category: "all",
  },
];
