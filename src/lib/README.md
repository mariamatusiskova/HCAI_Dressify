# src/lib/

Shared utility helpers.

## Files
- `error.ts`: normalizes unknown thrown values into readable strings for toasts and UI errors.
- `id.ts`: creates stable client-side IDs with `crypto.randomUUID()` plus browser-safe fallbacks.
- `supabase.ts`: Supabase client initialization plus environment/config checks.
- `utils.ts`: Exports `cn(...)` class merge helper (`clsx` + `tailwind-merge`), used by most UI components.
