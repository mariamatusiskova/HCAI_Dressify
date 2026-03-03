# src/

Main React app source.

## Entry + global files
- `main.tsx`: App entrypoint; mounts `<App />` and imports global `index.css`.
- `App.tsx`: Root app shell with providers and routes.
- `App.css`: Legacy Vite starter styles (currently not imported by runtime).
- `index.css`: Tailwind layers + global theme variables + utility classes.
- `vite-env.d.ts`: Vite TypeScript type declarations.

## Subfolders
- `components/`: Feature components and reusable UI primitives.
- `hooks/`: Custom React hooks and state helpers.
- `lib/`: Shared utility functions.
- `pages/`: Route-level page components.
- `services/`: API/service integrations.
- `test/`: Vitest setup and tests.
- `types/`: Shared TypeScript types and prompt/style template constants.
