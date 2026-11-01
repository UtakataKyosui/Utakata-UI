# Accessibility requirements

Read `ACCESSIBILITY.md` before changing components, styles, metadata, tests or usage examples. It is the shared source of requirements for Codex and Claude.

Read `ACCESSIBILITY-VERIFICATION.md` for the automation plan and evidence contract.
Read `ACCESSIBILITY-TOOLS.md` for implemented static/browser gates and their limits.
Run `pnpm lint:markup` and `pnpm test:a11y:browser` for relevant changes. Keep
known-invalid controls and evidence artifacts; do not suppress new failures.

- Maintain two layers: development-side CI validates behavior, themes and the shipped type contract; consumer-side Props/typechecking prevent invalid usage. Test positive and negative fixtures against packed exports/declarations without source aliases.
- Encode statically expressible mandatory conditions as type errors. TypeScript has no general custom warning severity for types; JSDoc/editor guidance and optional lint rules cover recommendations. Reserve `@deprecated` for genuinely deprecated APIs.
- Runtime DOM warnings supplement types for dynamic names/references and JSX composition. Do not advertise them as type warnings or claim typechecking proves text quality, actual DOM relationships or customized styling. State which planned consumer tools remain unimplemented.

- Decompose broad manual checks into deterministic properties and residual human/assistive-technology checks. Implement browser checks before changing a rule to automated.
- Define applicability, expected results, environments, states and evidence per rule. Use known-invalid fixtures to verify detection. New public variants/sizes need coverage definitions.
- Required automated checks must fail for failed or unverified results. Missing tests, skip, timeout, axe incomplete, or stale evidence never count as passed. Document justified non-applicability separately.
- Record commit, browser/OS/tool versions, theme, content, actual results and artifacts. Invalidate affected evidence when conditions change; preserve unresolved manual checks independently.
- Do not treat DOM key events as browser keyboard tests, viewport/device scaling as zoom, ARIA snapshots as screen-reader output, emulation as physical-device tests, or token contrast as rendered contrast. State the exact scope of every guarantee.

- Target applicable WCAG 2.2 A/AA criteria. Distinguish component guarantees from consumer responsibilities; never claim whole-site conformance from library adoption.
- Preserve native semantics and Base UI interaction. Verify accessible names, descriptions, errors, state announcements, keyboard operation and focus restoration.
- Check every supported theme and relevant state, zoom/reflow, target size, forced colors and reduced motion. Do not communicate essential information by color alone.
- Keep public API, manifest, quality rules, tests and examples consistent. Document required consumer labels and composition constraints.
- Follow `AGENTS.md` verification commands. Automated axe/jsdom checks do not establish contrast, actual keyboard or screen-reader usability.
- Record manual environment, version, commit, procedure and results. Mark checks not performed as `unverified`; never silently waive them or report them as passed.
- Review new component issues against the shared acceptance criteria in `ACCESSIBILITY.md`.
- Require necessary information through types where possible (for example, `Button iconOnly` requires a name source). Use development diagnostics and CI for DOM relationships; visible text is a valid name without extra ARIA. Do not replace actual accessible-name or assistive-technology tests with heuristic diagnostics. Design variants must satisfy the same accessibility requirements.
- Treat vibration as optional, default-off feedback with explicit user control. Always preserve visible and assistive-technology-accessible information; unsupported devices must remain fully usable. API availability or a successful return does not prove delivery. Follow the haptic requirements in `ACCESSIBILITY.md`.
