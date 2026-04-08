# src/components/

Feature-level UI components used by the pages and shell.

## Auth and navigation

- `AuthPanel.tsx`: full account panel with sign in, sign up, sign out, and current-session display; currently used on `ProfilePage`.
- `AuthTopbar.tsx`: compact auth actions for the shell header on desktop/tablet widths.
- `NavLink.tsx`: small compatibility wrapper around `react-router-dom` `NavLink`, used by `MenuNav.tsx` and `SavedPage.tsx`.

## Main workspace

- `ConsentModal.tsx`: consent dialog shown before entering the workspace.
- `UploadSection.tsx`: user photo upload/preview/remove UI.
- `GeneratePanel.tsx`: prompt entry and generation controls for AI item creation.
- `StyleTemplateSelector.tsx`: style-template picker and system-prompt editor embedded inside `GeneratePanel`.
- `GeneratedItemsList.tsx`: generated-item gallery with actions to send items to canvas or wardrobe.
- `CanvasEditor.tsx`: interactive outfit canvas for placing, transforming, and deleting items over the uploaded photo.

## Saved data views

- `OutfitLibrary.tsx`: saved outfit list with load and delete actions.
- `WardrobeLibrary.tsx`: wardrobe grid with upload, add-to-canvas, and delete actions.

## Subfolder

- `ui/`: shadcn/Radix-based UI primitives and wrappers.
