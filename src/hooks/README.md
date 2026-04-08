# src/hooks/

Custom hooks for app state and UI behavior.

## Files
- `use-mobile.tsx`: `useIsMobile()` viewport helper; currently only used by the optional `ui/sidebar.tsx` subsystem.
- `use-toast.ts`: toast reducer/store used by `ui/toaster.tsx`.
- `useOutfits.ts`: outfit state and persistence. Loads outfits from Supabase when a user session exists, otherwise falls back to local storage.
- `useWardrobe.ts`: wardrobe state and persistence. Supports Supabase-backed wardrobe CRUD with local fallback when no session is available.
- `useSystemPrompt.ts`: default system-prompt state for generation. Persists to Supabase when authenticated and local storage otherwise.
