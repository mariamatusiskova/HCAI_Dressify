# src/services/

Service/API integration layer.

## Files
- `backgroundRemoval.ts`: Client-side background removal (edge detection + flood fill) used by `CanvasEditor.tsx`.
- `outfitsSupabase.ts`: Supabase data layer for outfit CRUD, outfit-item persistence, wardrobe bootstrapping, and resolving the current authenticated user ID.
- `systemPromptsSupabase.ts`: Supabase reads/writes for the per-user default system prompt stored in the `system_prompts` table.
- `wardrobeSupabase.ts`: Supabase data layer for listing, inserting, and deleting `wardrobe_items`, including wardrobe bootstrap logic.
- `sanaSprintApi.ts`: Sana Sprint image generation client logic used by `GeneratePanel.tsx`.
