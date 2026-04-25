export type ClothingCategory = "top" | "trousers" | "shoes";
export type ItemSource = "ai" | "wardrobe";

const CATEGORY_LABELS: Record<ClothingCategory, string> = {
  top: "Top",
  trousers: "Trousers",
  shoes: "Shoes",
};

const CATEGORY_KEYWORDS: Record<ClothingCategory, string[]> = {
  top: [
    "top",
    "shirt",
    "t-shirt",
    "tee",
    "blouse",
    "hoodie",
    "sweater",
    "jumper",
    "cardigan",
    "jacket",
    "coat",
    "blazer",
    "tank",
    "vest",
    "polo",
    "long sleeve",
    "crop top",
  ],
  trousers: [
    "trouser",
    "trousers",
    "pants",
    "jeans",
    "denim",
    "cargo",
    "jogger",
    "joggers",
    "slacks",
    "leggings",
    "shorts",
    "skirt",
    "miniskirt",
    "maxiskirt",
  ],
  shoes: [
    "shoe",
    "shoes",
    "sneaker",
    "sneakers",
    "boot",
    "boots",
    "heel",
    "heels",
    "loafer",
    "loafers",
    "sandals",
    "sandal",
    "trainer",
    "trainers",
    "mules",
    "flats",
    "oxford",
  ],
};

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function includesAnyKeyword(value: string, keywords: string[]): boolean {
  return keywords.some((keyword) => value.includes(keyword));
}

export function detectClothingCategory(
  value: string | null | undefined,
  fallback: ClothingCategory = "top",
): ClothingCategory {
  const normalized = normalizeText(value ?? "");
  if (!normalized) return fallback;

  if (includesAnyKeyword(normalized, CATEGORY_KEYWORDS.shoes)) return "shoes";
  if (includesAnyKeyword(normalized, CATEGORY_KEYWORDS.trousers)) return "trousers";
  if (includesAnyKeyword(normalized, CATEGORY_KEYWORDS.top)) return "top";

  return fallback;
}

export function normalizeClothingCategory(
  category: string | null | undefined,
  prompt?: string | null,
): ClothingCategory {
  const normalizedCategory = normalizeText(category ?? "");
  if (normalizedCategory === "top" || normalizedCategory === "trousers" || normalizedCategory === "shoes") {
    if (normalizedCategory === "top" && prompt) {
      return detectClothingCategory(prompt, "top");
    }
    return normalizedCategory;
  }

  if (prompt) {
    return detectClothingCategory(prompt, "top");
  }

  return "top";
}

export function getClothingCategoryLabel(
  category: string | null | undefined,
  prompt?: string | null,
): string {
  return CATEGORY_LABELS[normalizeClothingCategory(category, prompt)];
}

export function formatClothingLabel(
  category: string | null | undefined,
  options?: {
    prompt?: string | null;
    source?: ItemSource;
  },
): string {
  const normalizedCategory = normalizeClothingCategory(category, options?.prompt);
  const prefix = options?.source === "wardrobe" ? "Wardrobe - " : options?.source === "ai" ? "AI - " : "";
  return `${prefix}${CATEGORY_LABELS[normalizedCategory]}`;
}
