# src/components/ui/

shadcn/ui + Radix-based UI primitives with project styling.

Status legend:
- `active`: used by currently mounted app pages (`App.tsx` + `Index.tsx` flow)
- `indirect`: used only through currently inactive UI subsystems
- `inactive`: present, but not imported by active app pages/components

## File-by-file
- `accordion.tsx` (`inactive`): Accordion (expand/collapse sections).
- `alert-dialog.tsx` (`inactive`): Confirm/cancel destructive action modal.
- `alert.tsx` (`inactive`): Inline alert banners (info/warn/error).
- `aspect-ratio.tsx` (`inactive`): Lock content to fixed width/height ratio.
- `avatar.tsx` (`inactive`): User avatar image + fallback.
- `badge.tsx` (`active`): Small labels; used for AI badges on generated/canvas items.
- `breadcrumb.tsx` (`inactive`): Hierarchical path navigation.
- `button.tsx` (`active`): Core button primitive + variants.
- `calendar.tsx` (`inactive`): Date picker UI wrapper.
- `card.tsx` (`inactive`): Card layout primitives.
- `carousel.tsx` (`inactive`): Embla carousel wrapper.
- `chart.tsx` (`inactive`): Recharts helpers + themed chart container.
- `checkbox.tsx` (`inactive`): Checkbox primitive.
- `collapsible.tsx` (`inactive`): Single collapsible section wrapper.
- `command.tsx` (`inactive`): Command palette / quick search dialog.
- `context-menu.tsx` (`inactive`): Right-click context menu.
- `dialog.tsx` (`active`): Modal primitives; used by `ConsentModal`.
- `drawer.tsx` (`inactive`): Bottom/side drawer panel (mobile-friendly).
- `dropdown-menu.tsx` (`inactive`): Menu popover from trigger button.
- `form.tsx` (`inactive`): `react-hook-form` field wrappers.
- `hover-card.tsx` (`inactive`): Hover-triggered info popup.
- `input-otp.tsx` (`inactive`): OTP segmented input.
- `input.tsx` (`active`): Text input; used for outfit name field.
- `label.tsx` (`inactive`): Form label primitive.
- `menubar.tsx` (`inactive`): Desktop menubar primitives.
- `navigation-menu.tsx` (`inactive`): Top navigation with dropdown content.
- `pagination.tsx` (`inactive`): Pagination controls.
- `popover.tsx` (`inactive`): Generic anchored popup panel.
- `progress.tsx` (`inactive`): Progress bar primitive.
- `radio-group.tsx` (`inactive`): Radio option group.
- `resizable.tsx` (`inactive`): Resizable split panels.
- `scroll-area.tsx` (`inactive`): Custom scrollable area + scrollbar.
- `select.tsx` (`inactive`): Dropdown select primitive.
- `separator.tsx` (`inactive`): Horizontal/vertical divider.
- `sheet.tsx` (`indirect`): Side sheet panel; used by `sidebar.tsx`.
- `sidebar.tsx` (`inactive`): Full sidebar system (provider, trigger, content, menu).
- `skeleton.tsx` (`indirect`): Loading placeholder; used by `sidebar.tsx`.
- `slider.tsx` (`inactive`): Range slider.
- `sonner.tsx` (`active`): Sonner toaster wrapper mounted in `App.tsx`.
- `switch.tsx` (`inactive`): On/off toggle switch.
- `table.tsx` (`inactive`): Table primitives.
- `tabs.tsx` (`inactive`): Tabs list/trigger/content primitives.
- `textarea.tsx` (`active`): Multi-line input; used in `GeneratePanel`.
- `toast.tsx` (`active`): Radix toast primitives used by `toaster.tsx` and toast hook types.
- `toaster.tsx` (`active`): Toast renderer mounted in `App.tsx`.
- `toggle-group.tsx` (`inactive`): Grouped toggles.
- `toggle.tsx` (`indirect`): Single toggle primitive; used by `toggle-group.tsx`.
- `tooltip.tsx` (`active`): Tooltip provider mounted in `App.tsx`.
- `use-toast.ts` (`inactive`): Re-export wrapper; active path uses `src/hooks/use-toast.ts` directly.

## Active runtime UI set
`badge.tsx`, `button.tsx`, `dialog.tsx`, `input.tsx`, `sonner.tsx`, `textarea.tsx`, `toast.tsx`, `toaster.tsx`, `tooltip.tsx`.
