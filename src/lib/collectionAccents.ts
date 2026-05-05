// Shared accent palette helpers for collection cards (wardrobe, saved items,
// saved outfits). Extracted from ClosetLibrary so the saved page can render
// matching artwork without duplicating the color definitions.
import type { ClosetFolderColor } from "@/lib/closetFolders";

export interface CollectionAccentPalette {
  edge: string;
  dot: string;
  dotGlow: string;
  cornerGlow: string;
  panelTint: string;
  line: string;
  lineGlow: string;
}

export function getCollectionAccentPalette(
  color: ClosetFolderColor | string | null | undefined,
): CollectionAccentPalette {
  switch (color) {
    case "amber":
      return {
        edge: "rgba(205, 150, 82, 0.18)",
        dot: "rgba(220, 172, 103, 0.96)",
        dotGlow: "rgba(220, 172, 103, 0.30)",
        cornerGlow: "rgba(205, 150, 82, 0.16)",
        panelTint: "rgba(138, 96, 52, 0.045)",
        line: "rgba(210, 160, 92, 0.62)",
        lineGlow: "rgba(210, 160, 92, 0.18)",
      };
    case "emerald":
      return {
        edge: "rgba(118, 170, 136, 0.16)",
        dot: "rgba(113, 186, 142, 0.95)",
        dotGlow: "rgba(113, 186, 142, 0.28)",
        cornerGlow: "rgba(72, 150, 106, 0.14)",
        panelTint: "rgba(70, 126, 98, 0.04)",
        line: "rgba(118, 170, 136, 0.56)",
        lineGlow: "rgba(118, 170, 136, 0.18)",
      };
    case "sky":
      return {
        edge: "rgba(104, 156, 208, 0.18)",
        dot: "rgba(108, 183, 234, 0.96)",
        dotGlow: "rgba(108, 183, 234, 0.30)",
        cornerGlow: "rgba(78, 142, 192, 0.14)",
        panelTint: "rgba(66, 98, 146, 0.04)",
        line: "rgba(108, 183, 234, 0.62)",
        lineGlow: "rgba(108, 183, 234, 0.18)",
      };
    case "violet":
      return {
        edge: "rgba(170, 132, 220, 0.18)",
        dot: "rgba(176, 138, 232, 0.96)",
        dotGlow: "rgba(176, 138, 232, 0.30)",
        cornerGlow: "rgba(126, 88, 180, 0.16)",
        panelTint: "rgba(86, 58, 128, 0.045)",
        line: "rgba(176, 138, 232, 0.62)",
        lineGlow: "rgba(176, 138, 232, 0.18)",
      };
    case "rose":
      return {
        edge: "rgba(212, 132, 166, 0.18)",
        dot: "rgba(220, 138, 174, 0.96)",
        dotGlow: "rgba(220, 138, 174, 0.30)",
        cornerGlow: "rgba(172, 82, 122, 0.14)",
        panelTint: "rgba(122, 60, 90, 0.04)",
        line: "rgba(220, 138, 174, 0.60)",
        lineGlow: "rgba(220, 138, 174, 0.18)",
      };
    case "stone":
    default:
      return {
        edge: "rgba(152, 164, 124, 0.14)",
        dot: "rgba(160, 174, 130, 0.92)",
        dotGlow: "rgba(160, 174, 130, 0.24)",
        cornerGlow: "rgba(118, 132, 94, 0.12)",
        panelTint: "rgba(84, 92, 70, 0.035)",
        line: "rgba(160, 174, 130, 0.50)",
        lineGlow: "rgba(160, 174, 130, 0.16)",
      };
  }
}
