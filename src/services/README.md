# src/services/

Service/API integration layer.

## Files
- `backgroundRemoval.ts`: Client-side background removal that runs the @imgly/background-removal ONNX model in a Web Worker. No backend required; the model weights (~50 MB) are cached after the first call. Used by `CanvasEditor.tsx` and `GeneratedItemsList.tsx`.
- `outfitsSupabase.ts`: Supabase data layer for outfit CRUD, outfit-item persistence, wardrobe bootstrapping, and resolving the current authenticated user ID.
- `systemPromptsSupabase.ts`: Supabase reads/writes for the per-user default system prompt stored in the `system_prompts` table.
- `wardrobeSupabase.ts`: Supabase data layer for listing, inserting, and deleting `wardrobe_items`, including wardrobe bootstrap logic.
- `sanaSprintApi.ts`: Sana Sprint image generation client logic used by `GeneratePanel.tsx`.
