---

name: utakata-component
description: Implement or change Utakata-UI React components, their public API, manifest and accessibility behavior in this repository.
---

# Component development

Read the component, `packages/react/src/index.ts`, `metadata/manifest.ts`, `metadata/quality.ts`
and existing tests before editing. Read `skills/utakata-ui/SKILL.md` for usage.

Preserve Base UI interactions and Lism layout primitives. Match existing ref,
className and CSS conventions. Keep exports, manifest defaults, variants and
composition requirements aligned. Update MCP tests when tool output changes.

Add behavior-focused tests for affected accessible names, disabled behavior,
label relationships, focus or dismissal. Follow the existing axe test pattern.
Manual quality rules remain unverified until checked in a real browser.

Update handwritten docs for changed usage in both `packages/docs/docs/` (ja)
and `packages/docs/docs/en/`, and keep each example in `packages/docs/examples/`
matched by its English version in `packages/docs/examples/en/`. Generate reference content with
`pnpm --filter @utakata-ui/docs generate:reference`; generated component pages
are ignored and should not be committed. When manifest text changes, update the
reported keys in `packages/docs/i18n/ja/` until the translation audit passes.

Run relevant tests first, then the checks required by `AGENTS.md`. Report public
API changes and outstanding manual verification.
