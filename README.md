# Dressify

Dressify is a Vite + React outfit studio for generating clothing items, composing them on a canvas, managing a wardrobe, and saving outfits. The app supports local-only mode by default and can sync wardrobe data, outfits, and system prompts to Supabase when the user signs in.

## Current app flow

- `Home`: upload a user photo, generate clothing items with Sana Sprint, place them on the canvas, and save outfits.
- `Wardrobe`: browse wardrobe items, upload your own clothing photos, add items to the canvas, and delete items.
- `Saved / Items`: merged view of current-session generated items and persisted wardrobe items.
- `Saved / Outfits`: saved outfit library with load/delete actions.
- `Profile`: full auth panel for sign in, sign up, and sign out.
- `Login`, `Register`, `Auth Callback`: dedicated auth routes outside the main shell.

## Route structure

- `/`: app shell + `HomePage`
- `/wardrobe`: wardrobe manager
- `/saved/items`: saved/generated items view
- `/saved/outfits`: saved outfits view
- `/profile`: account/auth management
- `/login`: email/password sign in
- `/register`: email/password registration
- `/auth/callback`: Supabase auth redirect completion

The shell is in `src/pages/Index.tsx`. It owns the consent gate, shared studio state, top header, desktop/mobile navigation, and the `<Outlet />` where the active page renders.

## Tech stack

- Vite
- React 18
- TypeScript
- React Router
- Tailwind CSS
- shadcn/ui + Radix UI
- Supabase
- TanStack Query
- Vitest

## Local development

This project expects Node `20.17.0` via `.nvmrc`.

```sh
nvm use
npm install
npm run dev
```

Useful commands:

```sh
npm run build
npm test
npm run lint
```

## Environment variables

Create a `.env` file in the project root with:

```sh
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
# Optional: FastAPI background-removal API (defaults to http://127.0.0.1:8000)
VITE_API_URL=http://127.0.0.1:8000
```

If these variables are missing, the app still runs, but Supabase-backed auth and cloud sync are disabled.

Background removal in the canvas uses **`POST /remove-bg`** on that API. Run the backend from `backend/` (`uv run python main.py`) so the model loads once in Python instead of downloading weights in the browser.

## Auth and persistence behavior

- Outfits are managed by `src/hooks/useOutfits.ts`.
- Wardrobe items are managed by `src/hooks/useWardrobe.ts`.
- Default system prompt persistence is managed by `src/hooks/useSystemPrompt.ts`.
- When a valid Supabase auth session exists, these features use Supabase tables/RPCs through the service layer.
- When there is no session, outfits and wardrobe fall back to local storage and the UI shows warning toasts about local-only mode.

One important current limitation: generated items are still held in shared React state for the current session. The `Saved / Items` page shows those current-session generated items together with wardrobe items, but generated history is not yet persisted as a separate database-backed history feature.

## Deployment

The app is set up to work with GitHub Pages using a router basename. If you deploy through GitHub Actions, make sure the workflow environment includes:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL` (public URL of your FastAPI `remove-bg` service) if you rely on background removal on the deployed site

For repository-based Pages deployments, the router already uses `import.meta.env.BASE_URL`, so route URLs work under the repository subpath.

## Folder documentation

- `src/README.md`: top-level source folder overview
- `src/pages/README.md`: route and page responsibilities
- `src/components/README.md`: feature component overview
- `src/components/ui/README.md`: shadcn/ui inventory and usage status
- `src/hooks/README.md`: custom hooks and persistence/auth behavior
- `src/services/README.md`: API and Supabase data layer
- `src/lib/README.md`: utility helpers
- `src/test/README.md`: test setup
- `src/types/README.md`: shared type/constants folder
- `public/README.md`: static assets and PWA files
