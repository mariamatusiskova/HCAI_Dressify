# src/

Main React application source.

## Entry and global files

- `main.tsx`: browser entrypoint; mounts `<App />` into `#root` and imports `index.css`.
- `App.tsx`: root provider tree and route map.
- `App.css`: legacy Vite starter stylesheet; not part of the current runtime layout.
- `index.css`: Tailwind layers, design tokens, global utility classes, and shared theme styles.
- `vite-env.d.ts`: Vite TypeScript declarations.

## Architecture summary

- The route shell lives in `pages/Index.tsx`.
- Feature pages read shared studio state through `useStudio()`.
- Persistence and cloud sync are isolated in `hooks/` and `services/`.
- UI primitives live in `components/ui/`, while feature-level components live in `components/`.

## Subfolders

- `components/`: feature components such as canvas editor, auth UI, upload, generation, and wardrobe/outfit lists.
- `hooks/`: custom hooks for outfits, wardrobe, system prompts, toasts, and mobile helpers.
- `lib/`: shared helpers such as ID creation, error formatting, Supabase bootstrap, and class merging.
- `pages/`: route-level pages and the shared shell/navigation layer.
- `services/`: external API clients and Supabase data access modules.
- `test/`: Vitest bootstrap and tests.
- `types/`: shared TypeScript types and prompt/style constants.
