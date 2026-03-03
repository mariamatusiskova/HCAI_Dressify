# src/hooks/

Custom hooks for app state and UI behavior.

## Files
- `use-mobile.tsx`: `useIsMobile()` viewport helper; currently consumed by `ui/sidebar.tsx`.
- `use-toast.ts`: Toast store/actions hook used by `ui/toaster.tsx`.
- `useOutfits.ts`: Outfit persistence logic (save/load/delete via `localStorage`).
