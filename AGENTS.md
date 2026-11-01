# Utakata-UI development

## Repository map

- `packages/react/src`: Public exports in `index.ts`; components in `components/`, manifest and quality rules in `metadata/`, CSS in `styles/`, and tests in `tests/`.
- `packages/mcp/src`: tools exposing the same manifest to agents.
- `packages/docs`: Blume documentation; `docs/components.md` is generated.
- `skills/utakata-ui`: consumer-facing UI usage skill; keep it consistent with the public API.

## Implementation

Use pnpm (the version is pinned in `package.json`) and a Node version allowed by `engines`.
Preserve Base UI keyboard, dismissal and focus behavior. Use Lism primitives and
CSS custom properties rather than a second styling or interaction system.
When changing public components, update `index.ts`, `manifest.ts`, relevant
quality rules, tests and documentation together. TypeScript source imports use
`.js` extensions. Do not edit generated `dist`, `.blume` or `docs/components.md`.

## Accessibility requirements

Read [ACCESSIBILITY.md](ACCESSIBILITY.md) for component, theme, example and
quality-rule changes. Target applicable WCAG 2.2 A/AA criteria and document
consumer responsibilities. Preserve semantics, keyboard access, focus behavior
and understandable status/error feedback. Verify supported themes, zoom/reflow,
target sizes, forced colors and reduced motion. Keep API, manifest, quality rules,
tests and usage examples aligned. Automated checks alone do not establish WCAG
conformance; record manual evidence and leave unperformed checks unverified.
Vibration feedback is optional and default-off, with explicit user control and
equivalent visible and assistive-technology-accessible information. Follow the
fallback and verification requirements in `ACCESSIBILITY.md`.
Prevent invalid usage through types, development diagnostics and CI. Require
accessible information rather than redundant ARIA attributes; visible text is
a valid name. Design variants must preserve the same accessibility requirements.

## Verification commands

Start with the relevant test file using `pnpm exec vitest run <path>`.
For runtime changes run `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build`.
UI behavior changes also require `pnpm test:a11y`; real keyboard, screen reader
and theme checks must be reported as unverified unless actually performed.
`pnpm check:fallow` requires an available `origin/main` reference.
Agent infrastructure has a dependency-free check: `pnpm test:agents`.

## Collaboration

Preserve unrelated changes. Ask before adding production dependencies,
destructive operations, production changes or external messages. Commit, push,
PR creation and remote mutations require a user request. Never add credentials,
machine-specific settings or generated caches.

## Skills

Shared skills live in `skills/`; Codex discovers them through `.agents/skills`
and Claude through `.claude/skills` symlinks. Use `utakata-component` for component API
or behavior changes and `utakata-verify` for validation and review requests.
