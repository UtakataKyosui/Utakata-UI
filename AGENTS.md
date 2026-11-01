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

Follow [ACCESSIBILITY-VERIFICATION.md](ACCESSIBILITY-VERIFICATION.md) when
designing or changing validation. Split broad manual checks into independently
testable properties; automate deterministic checks in real browsers and keep
assistive-technology output and user comprehension as separate evidence.
For each rule record applicability, expected behavior, environment/state coverage,
commit and artifacts. Include known-invalid fixtures that prove detection works.
Missing, skipped, timed-out, incomplete or stale checks stay unverified and must
fail required automated gates. Do not equate synthetic DOM events with browser
keyboard behavior, viewport/device scaling with zoom, ARIA snapshots with speech,
or emulation with physical devices. Standard-theme tokens alone do not prove
rendered contrast. Record residual checks and invalidate affected evidence when
implementation or verification conditions change. Planned checks are not passes.

Maintain both layers: library CI verifies component behavior and the distributed
type contract; consumers prevent misuse through public Props and typechecking.
Test valid/invalid consumer fixtures against packed exports and declarations,
not only workspace source aliases. Encode statically expressible requirements
as type errors. TypeScript types cannot emit arbitrary warning-level checks;
use JSDoc for guidance, lint for optional recommendations, and development DOM
diagnostics for runtime relationships. Do not call runtime warnings type warnings.
Document the limits of dynamic strings, JSX composition and custom CSS.

## Verification commands

Start with the relevant test file using `pnpm exec vitest run <path>`.
For runtime changes run `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build`.
UI behavior changes also require `pnpm test:a11y`; real keyboard, screen reader
and theme checks must be reported as unverified unless actually performed.
`pnpm check:fallow` requires an available `origin/main` reference.
Agent infrastructure has a dependency-free check: `pnpm test:agents`.
Run `pnpm lint:markup` for component/example/markup changes and
`pnpm test:a11y:browser` for component, CSS or browser fixture changes.
See [ACCESSIBILITY-TOOLS.md](ACCESSIBILITY-TOOLS.md) for tool selection, exact
coverage and exceptions. Keep negative controls and CI evidence artifacts working;
do not silently suppress new violations or incomplete results.
For CI changes follow [.github/CI.md](.github/CI.md), run `pnpm test:ci` and
`actionlint`, and synchronize/verify the Actions lockfile with `gh actions-lock`.

## Collaboration

Preserve unrelated changes. Ask before adding production dependencies,
destructive operations, production changes or external messages. Commit, push,
PR creation and remote mutations require a user request. Never add credentials,
machine-specific settings or generated caches.

## Skills

Shared skills live in `skills/`; Codex discovers them through `.agents/skills`
and Claude through `.claude/skills` symlinks. Use `utakata-component` for component API
or behavior changes and `utakata-verify` for validation and review requests.
