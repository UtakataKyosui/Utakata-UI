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
- Use the exported Lism CSS layout and typography primitives before creating custom layout wrappers.
- Customize appearance with CSS custom properties and classes; avoid runtime CSS generation.

## Verification

Prefer native HTML semantics. Check keyboard operation, visible focus, labels, descriptions, reduced-motion behavior, and dark theme contrast. Run `pnpm test`, `pnpm typecheck`, and `pnpm lint`; automated axe checks supplement rather than replace manual accessibility review.
