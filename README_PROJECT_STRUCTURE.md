# Project Structure Summary

This file links all folder-specific READMEs and summarizes active usage status.

## Folder READMEs
- `public/README.md`
- `src/README.md`
- `src/components/README.md`
- `src/components/ui/README.md`
- `src/hooks/README.md`
- `src/lib/README.md`
- `src/pages/README.md`
- `src/services/README.md`
- `src/test/README.md`
- `src/types/README.md`

## Runtime Core (actively used)
- `src/main.tsx`
- `src/App.tsx`
- `src/index.css`
- `src/pages/Index.tsx`
- `src/pages/NotFound.tsx`
- `src/components/CanvasEditor.tsx`
- `src/components/ConsentModal.tsx`
- `src/components/GeneratePanel.tsx`
- `src/components/GeneratedItemsList.tsx`
- `src/components/OutfitLibrary.tsx`
- `src/components/StyleTemplateSelector.tsx`
- `src/components/UploadSection.tsx`
- `src/services/backgroundRemoval.ts`
- `src/services/sanaSprintApi.ts`
- `src/hooks/useOutfits.ts`
- `src/hooks/use-toast.ts`
- `src/lib/utils.ts`
- `src/types/styleTemplates.ts`

## UI primitives used by active runtime
- `src/components/ui/badge.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/sonner.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/toast.tsx`
- `src/components/ui/toaster.tsx`
- `src/components/ui/tooltip.tsx`

## Indirectly used (through currently inactive UI subsystems)
- `src/components/ui/sheet.tsx` (via `ui/sidebar.tsx`)
- `src/components/ui/skeleton.tsx` (via `ui/sidebar.tsx`)
- `src/components/ui/toggle.tsx` (via `ui/toggle-group.tsx`)
- `src/hooks/use-mobile.tsx` (via `ui/sidebar.tsx`)

## Currently not wired into active pages (available for future use)
- `src/components/NavLink.tsx`
- Most files under `src/components/ui/` such as:
  `accordion.tsx`, `alert-dialog.tsx`, `alert.tsx`, `aspect-ratio.tsx`, `avatar.tsx`, `breadcrumb.tsx`, `calendar.tsx`, `card.tsx`, `carousel.tsx`, `chart.tsx`, `checkbox.tsx`, `collapsible.tsx`, `command.tsx`, `context-menu.tsx`, `drawer.tsx`, `dropdown-menu.tsx`, `form.tsx`, `hover-card.tsx`, `input-otp.tsx`, `menubar.tsx`, `navigation-menu.tsx`, `pagination.tsx`, `popover.tsx`, `progress.tsx`, `radio-group.tsx`, `resizable.tsx`, `scroll-area.tsx`, `separator.tsx`, `sidebar.tsx`, `slider.tsx`, `switch.tsx`, `table.tsx`, `tabs.tsx`, `toggle-group.tsx`, `use-toast.ts`.

## Test-only files (used in test runs, not runtime UI)
- `src/test/setup.ts`
- `src/test/example.test.ts`

## Tooling/config files (not imported by runtime UI)
- `components.json`
- `vite.config.ts`
- `vitest.config.ts`
- `tailwind.config.ts`
- `postcss.config.js`
- `eslint.config.js`
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`

## Notes
- `src/App.css` currently appears unused by runtime (not imported in `main.tsx`/`App.tsx`).
- `src/components/ui/use-toast.ts` is a re-export helper; active path uses `src/hooks/use-toast.ts`.
- Latest commit updates now reflected:
  layering (`zIndex`) and transform controls in `CanvasEditor.tsx`, style template workflow in `GeneratePanel.tsx` + `StyleTemplateSelector.tsx`, and advanced background removal in `services/backgroundRemoval.ts`.
