# src/services/

Service/API integration layer.

## Files
- `backgroundRemoval.ts`: Client-side background removal (edge detection + flood fill) used by `CanvasEditor.tsx`.
- `outfitsSupabase.ts`: Supabase data layer for list/save/delete outfits using `outfits`, `outfit_items`, `wardrobe`, `wardrobe_items`.
- `sanaSprintApi.ts`: Sana Sprint image generation client logic used by `GeneratePanel.tsx`.
