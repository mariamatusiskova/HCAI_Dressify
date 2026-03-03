# src/components/

Feature-level components used by pages.

## Files
- `CanvasEditor.tsx`: Interactive outfit canvas (place/move/resize/rotate/layer/delete items over user photo).
- `ConsentModal.tsx`: Consent dialog shown before entering the app.
- `GeneratePanel.tsx`: Prompt + generation UI for clothing categories.
- `GeneratedItemsList.tsx`: Thumbnail gallery of generated items; click adds item to canvas.
- `NavLink.tsx`: Compatibility wrapper around `react-router-dom` NavLink (currently not wired in active pages).
- `OutfitLibrary.tsx`: Saved outfits list with load/delete actions.
- `StyleTemplateSelector.tsx`: Template picker/editor used by `GeneratePanel` to apply global/style prompt descriptors.
- `UploadSection.tsx`: Photo upload via click or drag/drop + preview/remove.

## Subfolder
- `ui/`: shadcn/Radix-based UI primitives.
