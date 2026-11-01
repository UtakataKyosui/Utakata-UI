# Accessibility requirements

Read `ACCESSIBILITY.md` before changing components, styles, metadata, tests or usage examples. It is the shared source of requirements for Codex and Claude.

- Target applicable WCAG 2.2 A/AA criteria. Distinguish component guarantees from consumer responsibilities; never claim whole-site conformance from library adoption.
- Preserve native semantics and Base UI interaction. Verify accessible names, descriptions, errors, state announcements, keyboard operation and focus restoration.
- Check every supported theme and relevant state, zoom/reflow, target size, forced colors and reduced motion. Do not communicate essential information by color alone.
- Keep public API, manifest, quality rules, tests and examples consistent. Document required consumer labels and composition constraints.
- Follow `AGENTS.md` verification commands. Automated axe/jsdom checks do not establish contrast, actual keyboard or screen-reader usability.
- Record manual environment, version, commit, procedure and results. Mark checks not performed as `unverified`; never silently waive them or report them as passed.
- Review new component issues against the shared acceptance criteria in `ACCESSIBILITY.md`.
