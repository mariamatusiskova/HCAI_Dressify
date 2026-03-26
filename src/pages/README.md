# src/pages/

Route-level pages plus the shared app shell.

## Main shell

- `Index.tsx`: shared shell and provider for the authenticated workspace area. It owns the consent gate, shared studio state/actions, header, sync status, top-bar auth entry, navigation, and `<Outlet />`.
- `MenuNav.tsx`: responsive app navigation. It renders desktop top navigation and a mobile bottom navigation bar for `Home`, `Wardrobe`, `Saved`, and `Profile`.

## Workspace pages

- `HomePage.tsx`: main creation workspace with upload, generation, generated items, canvas editing, and outfit save/load controls.
- `WardrobePage.tsx`: wardrobe management page built around `WardrobeLibrary`.
- `SavedPage.tsx`: parent route for the saved section; provides the nested tab-like navigation for `items` and `outfits`.
- `ItemPage.tsx`: merged saved-items view that combines current-session generated items with wardrobe items.
- `OutfitsPage.tsx`: saved outfit list and load/delete actions.
- `ProfilePage.tsx`: profile/account page that hosts the full `AuthPanel`.

## Auth and fallback pages

- `LoginPage.tsx`: email/password sign-in route.
- `RegisterPage.tsx`: email/password registration route.
- `AuthCallbackPage.tsx`: completes Supabase auth redirects and returns the user to the app.
- `NotFound.tsx`: catch-all 404 route.

## Route map

- `/` -> `HomePage`
- `/wardrobe` -> `WardrobePage`
- `/saved/items` -> `ItemPage`
- `/saved/outfits` -> `OutfitsPage`
- `/profile` -> `ProfilePage`
- `/login` -> `LoginPage`
- `/register` -> `RegisterPage`
- `/auth/callback` -> `AuthCallbackPage`
