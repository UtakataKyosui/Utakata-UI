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
- `Badge` is a static span for a status or category (`variant`: solid | outline | subtle (default) | destructive). Write the state in text; never rely on color. It has no role, focus or action. Use Button or a link for actions.
- `Skeleton` (`shape`: rect | circle) is always `aria-hidden`. Size it with `style` or `--ui-skeleton-width/height`. Put `aria-busy` on the loading region and one separate `role="status"` text, and set `aria-busy={false}` when content renders.
- `Spinner` renders `role="status"` with a visually hidden `label` (default `読み込み中`). Inside a Button use `decorative` and state the progress in the button text (`<Button disabled><Spinner size="sm" decorative />保存中</Button>`). `label` and `decorative` are mutually exclusive. Don't pass an empty label.
- `Card.Root/Header/Title/Description/Content/Footer` are static parts; all are optional. Set `Card.Title level` ('1'–'6', default '3', like Lism `Heading`) to fit the page outline. Do not make the card clickable; put Button or links inside.
- `Alert.Root/Title/Description` (`variant`: default | destructive) adds no role by default. Set `role="alert"` only for urgent dynamically inserted messages, or `role="status"` for non-urgent ones. State the meaning (e.g. "エラー：…") in Title text; icons get `aria-hidden="true"`.
- `Avatar.Root/Image/Fallback` (`size`: sm | md | lg) wraps Base UI Avatar. `Avatar.Image` requires `alt`: the person's name, or `alt=""` plus `aria-hidden="true"` on `Avatar.Fallback` when the name is visible next to it. Initials are your Fallback children; `delay` postpones the Fallback.
- Compose `Progress.Root` with `Progress.Track` > `Progress.Indicator` and optional `Progress.Value`. A name is required by type: pass `label` (rendered as `Progress.Label`), `aria-label` or `aria-labelledby`. Use `value={null}` for unknown progress (NaN is also indeterminate), never `0`. Do not add live regions for each update; announce completion separately if needed.
- Use `Table.Container` > `Table.Root` with `Table.Caption`, `Table.Head scope="col" | "row"` and `Table.Cell`. `Table.Container` is the only horizontal scroller and is always a named, focusable region: give it `aria-label` or `aria-labelledby` (for example the caption id). Do not hide cells at narrow widths; use `colSpan` for empty-state rows. Sorting and pagination are your responsibility.
- Compose `Breadcrumb.Root` > `Breadcrumb.List` > `Breadcrumb.Item` with `Breadcrumb.Link href` (or `render={<RouterLink />}`) and exactly one `Breadcrumb.Page` for the current location. Put `Breadcrumb.Separator` between items as a sibling; separators and `Breadcrumb.Ellipsis` are hidden from assistive technology. The default landmark name is 「パンくずリスト」.
- Compose `Pagination.Root` (name it with `aria-label`) > `Pagination.List` > `Pagination.Item` with `Pagination.Link href active`, `Pagination.Previous`/`Pagination.Next` and `Pagination.Ellipsis`. You own page state and URLs. Enabled Previous/Next require `href`; on the first/last page use `disabled` (no href, out of Tab order, clicks ignored). Do not put `Button` inside links.
- Use `Input` for single-line text inside `Field.Root` in place of `Field.Control` (never both); one input receives `Field.Label`, `Field.Description` and `Field.Error`. `size` is visual (`sm | md | lg`); set width with CSS. Provide `autoComplete` and visible error text; do not coerce values in the component.
- Use `Textarea` for multi-line text in place of `Field.Control`. Default `rows` is 3 and resizing is vertical; state `maxLength` limits in visible text such as `Field.Description`.
- Use `NativeSelect` for short single-value lists that should use the platform picker; pass `option`/`optgroup` children. `multiple` and the native listbox `size` are not supported; className/ref target the select.
- Compose `Checkbox.Root` with `Checkbox.Indicator` and name it with `Field.Label` in `Field.Root` or a wrapping `<label>`. An empty Indicator draws a check or a dash (indeterminate); do not pass a single ✓ glyph when using indeterminate. Base UI submits `name`/`value`; do not add hidden inputs.
- Compose `Switch.Root` with `Switch.Thumb` for settings that apply immediately; keep the label text unchanged across states. Use Checkbox for choices confirmed by a submit button.
- Use `RadioGroup.Root` with `RadioGroup.Item` (each containing `RadioGroup.Indicator` and its visible text) for a single choice. Name the group with `aria-labelledby` pointing at visible text, or `aria-label`; do not put it inside `Field.Root` with `Field.Label`, which would rename every item. `orientation` only changes layout. Keep the value on Root; `form.reset()` restores an uncontrolled `defaultValue`, and a controlled value must be reset in `onReset`.
- Use `Select` for a styled single-value listbox: `Root` (pass `items` so the trigger shows labels) > `Label`, `Trigger` (`Value placeholder`, `Icon`) and `Portal > Positioner > Popup > List > Item > ItemText` (+ optional `ItemIndicator`). The selected value is not a name; use `Select.Label`, `Field.Label` or `aria-label`. Use `NativeSelect` for native pickers. No multiple selection or search.
- Use `Slider` with one `Thumb`: `Root` (number `value`/`defaultValue`, `min`/`max`/`step`, `onValueCommitted` for final values) > `Label`, `Value`, `Control > Track > Indicator + Thumb`. Use `format` or `getAriaValueText` when the bare number is not understandable.
- Use `Collapsible.Root` > `Collapsible.Trigger` (visible text) + `Collapsible.Panel` for one show/hide region. Control with `open`/`onOpenChange`; do not mirror state in `useState`. Closed content is unmounted (or hidden with `keepMounted`).
- Use the exported Lism CSS layout and typography primitives before creating custom layout wrappers.
- Customize appearance with CSS custom properties and classes; avoid runtime CSS generation.

## Verification

Prefer native HTML semantics. Check keyboard operation, visible focus, labels, descriptions, reduced-motion behavior, and dark theme contrast. Run `pnpm test`, `pnpm typecheck`, and `pnpm lint`; automated axe checks supplement rather than replace manual accessibility review.
