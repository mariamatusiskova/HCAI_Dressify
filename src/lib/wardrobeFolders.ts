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
    label: "Wine",
    toneClassName:
      "border-white/12 bg-[radial-gradient(circle_at_top_right,rgba(132,42,58,0.13),transparent_46%),linear-gradient(145deg,rgba(28,18,21,0.9),rgba(10,9,10,0.94))]",
    chipClassName: "bg-[#8A2F43]",
  },
  {
    value: "amber",
    label: "Bronze",
    toneClassName:
      "border-white/12 bg-[radial-gradient(circle_at_top_right,rgba(154,103,52,0.12),transparent_46%),linear-gradient(145deg,rgba(28,22,17,0.9),rgba(10,9,10,0.94))]",
    chipClassName: "bg-[#A06A3C]",
  },
  {
    value: "emerald",
    label: "Olive",
    toneClassName:
      "border-white/12 bg-[radial-gradient(circle_at_top_right,rgba(92,108,72,0.12),transparent_46%),linear-gradient(145deg,rgba(20,24,19,0.9),rgba(10,9,10,0.94))]",
    chipClassName: "bg-[#66734D]",
  },
  {
    value: "sky",
    label: "Slate",
    toneClassName:
      "border-white/12 bg-[radial-gradient(circle_at_top_right,rgba(72,91,105,0.12),transparent_46%),linear-gradient(145deg,rgba(18,22,25,0.9),rgba(10,9,10,0.94))]",
    chipClassName: "bg-[#556879]",
  },
  {
    value: "violet",
    label: "Plum",
    toneClassName:
      "border-white/12 bg-[radial-gradient(circle_at_top_right,rgba(105,74,137,0.13),transparent_46%),linear-gradient(145deg,rgba(22,18,28,0.9),rgba(10,9,10,0.94))]",
    chipClassName: "bg-[#7656A0]",
  },
  {
    value: "stone",
    label: "Graphite",
    toneClassName:
      "border-white/12 bg-[radial-gradient(circle_at_top_right,rgba(130,126,120,0.1),transparent_46%),linear-gradient(145deg,rgba(24,24,26,0.9),rgba(10,9,10,0.94))]",
    chipClassName: "bg-[#77736D]",
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
