---

name: utakata-ui
description: Build accessible React interfaces using the verified Utakata-UI components, manifest, and composition rules.
---

# Utakata-UI implementation guide

Before writing UI, inspect `packages/react/src/metadata/manifest.ts` or query the `get_component` MCP tool. Treat the manifest as the authority for supported component names, variants, defaults, composition, and accessibility requirements. Do not invent props or substitute components that are not exported by `packages/react/src/index.ts`.

## Component usage

- Import styles from `@utakata-ui/react/styles.css`.
- Use `Button` for actions and provide a visible text label. For icon-only content set `iconOnly` and provide `aria-label` or `aria-labelledby`; this is enforced by TypeScript. Resolve development name/reference warnings and validate computed names with axe. A warning-free render is not proof of accessibility.
- Compose `Field.Root` with a visible `Field.Label` and `Field.Control`. Add `Field.Description` or `Field.Error` when useful.
- Compose `Dialog.Root` with `Dialog.Trigger` and a portalled `Dialog.Popup` containing a `Dialog.Title`. Use Base UI's `Dialog.Close` and do not implement a second open-state or focus-management system.
- Use `Kbd` for each displayed key and `KbdGroup` for combinations. Key labels are supplied by you; when symbols such as `⌘` read poorly, set `aria-label` on `KbdGroup` and wrap the visual keys in `aria-hidden="true"`. Kbd does not register shortcuts.
- `Separator` is decorative (hidden from assistive technology) by default. Set `decorative={false}` only for meaningful separation; vertical separators stretch inside `Flex`.
- Use `Input` for single-line text inside `Field.Root` in place of `Field.Control` (never both); one input receives `Field.Label`, `Field.Description` and `Field.Error`. `size` is visual (`sm | md | lg`); set width with CSS. Provide `autoComplete` and visible error text; do not coerce values in the component.
- Use `Textarea` for multi-line text in place of `Field.Control`. Default `rows` is 3 and resizing is vertical; state `maxLength` limits in visible text such as `Field.Description`.
- Use `NativeSelect` for short single-value lists that should use the platform picker; pass `option`/`optgroup` children. `multiple` and the native listbox `size` are not supported; className/ref target the select.
- Compose `Checkbox.Root` with `Checkbox.Indicator` and name it with `Field.Label` in `Field.Root` or a wrapping `<label>`. An empty Indicator draws a check or a dash (indeterminate); do not pass a single ✓ glyph when using indeterminate. Base UI submits `name`/`value`; do not add hidden inputs.
- Compose `Switch.Root` with `Switch.Thumb` for settings that apply immediately; keep the label text unchanged across states. Use Checkbox for choices confirmed by a submit button.
- Use `RadioGroup.Root` with `RadioGroup.Item` (each containing `RadioGroup.Indicator` and its visible text) for a single choice. Name the group with `aria-labelledby` pointing at visible text, or `aria-label`; do not put it inside `Field.Root` with `Field.Label`, which would rename every item. `orientation` only changes layout. Keep the value on Root; `form.reset()` restores an uncontrolled `defaultValue`, and a controlled value must be reset in `onReset`.
- Use `Select` for a styled single-value listbox: `Root` (pass `items` so the trigger shows labels) > `Label`, `Trigger` (`Value placeholder`, `Icon`) and `Portal > Positioner > Popup > List > Item > ItemText` (+ optional `ItemIndicator`). The selected value is not a name; use `Select.Label`, `Field.Label` or `aria-label`. Use `NativeSelect` for native pickers. No multiple selection or search.
- Use `Slider` with one `Thumb`: `Root` (number `value`/`defaultValue`, `min`/`max`/`step`, `onValueCommitted` for final values) > `Label`, `Value`, `Control > Track > Indicator + Thumb`. Use `format` or `getAriaValueText` when the bare number is not understandable.
- Use the exported Lism CSS layout and typography primitives before creating custom layout wrappers.
- Customize appearance with CSS custom properties and classes; avoid runtime CSS generation.

## Verification

Prefer native HTML semantics. Check keyboard operation, visible focus, labels, descriptions, reduced-motion behavior, and dark theme contrast. Run `pnpm test`, `pnpm typecheck`, and `pnpm lint`; automated axe checks supplement rather than replace manual accessibility review.
