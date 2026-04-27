export type WardrobeFolderColor =
  | "rose"
  | "amber"
  | "emerald"
  | "sky"
  | "violet"
  | "stone";

export interface WardrobeFolderColorOption {
  value: WardrobeFolderColor;
  label: string;
  toneClassName: string;
  chipClassName: string;
}

export const DEFAULT_WARDROBE_FOLDER_COLOR: WardrobeFolderColor = "rose";

export const WARDROBE_FOLDER_COLORS: WardrobeFolderColorOption[] = [
  {
    value: "rose",
    label: "Rose",
    toneClassName:
      "border-primary/28 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.18),transparent_42%),linear-gradient(145deg,rgba(44,14,18,0.92),rgba(12,10,12,0.92))]",
    chipClassName: "bg-rose-400/90",
  },
  {
    value: "amber",
    label: "Amber",
    toneClassName:
      "border-amber-400/22 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.16),transparent_42%),linear-gradient(145deg,rgba(42,28,10,0.92),rgba(12,10,12,0.92))]",
    chipClassName: "bg-amber-400/90",
  },
  {
    value: "emerald",
    label: "Emerald",
    toneClassName:
      "border-emerald-400/22 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_42%),linear-gradient(145deg,rgba(12,36,26,0.92),rgba(12,10,12,0.92))]",
    chipClassName: "bg-emerald-400/90",
  },
  {
    value: "sky",
    label: "Sky",
    toneClassName:
      "border-sky-400/22 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_42%),linear-gradient(145deg,rgba(13,27,38,0.92),rgba(12,10,12,0.92))]",
    chipClassName: "bg-sky-400/90",
  },
  {
    value: "violet",
    label: "Violet",
    toneClassName:
      "border-violet-400/22 bg-[radial-gradient(circle_at_top_right,rgba(167,139,250,0.16),transparent_42%),linear-gradient(145deg,rgba(28,18,42,0.92),rgba(12,10,12,0.92))]",
    chipClassName: "bg-violet-400/90",
  },
  {
    value: "stone",
    label: "Stone",
    toneClassName:
      "border-white/12 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_42%),linear-gradient(145deg,rgba(30,30,33,0.92),rgba(12,10,12,0.92))]",
    chipClassName: "bg-stone-300/90",
  },
];

export function getWardrobeFolderColorOption(
  color: string | null | undefined,
): WardrobeFolderColorOption {
  return (
    WARDROBE_FOLDER_COLORS.find((option) => option.value === color) ??
    WARDROBE_FOLDER_COLORS.find(
      (option) => option.value === DEFAULT_WARDROBE_FOLDER_COLOR,
    ) ??
    WARDROBE_FOLDER_COLORS[0]
  );
}