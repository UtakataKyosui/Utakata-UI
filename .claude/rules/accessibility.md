# Accessibility requirements

Read `ACCESSIBILITY.md` before changing components, styles, metadata, tests or usage examples. It is the shared source of requirements for Codex and Claude.

- Target applicable WCAG 2.2 A/AA criteria. Distinguish component guarantees from consumer responsibilities; never claim whole-site conformance from library adoption.
- Preserve native semantics and Base UI interaction. Verify accessible names, descriptions, errors, state announcements, keyboard operation and focus restoration.
- Check every supported theme and relevant state, zoom/reflow, target size, forced colors and reduced motion. Do not communicate essential information by color alone.
- Keep public API, manifest, quality rules, tests and examples consistent. Document required consumer labels and composition constraints.
- Follow `AGENTS.md` verification commands. Automated axe/jsdom checks do not establish contrast, actual keyboard or screen-reader usability.
- Record manual environment, version, commit, procedure and results. Mark checks not performed as `unverified`; never silently waive them or report them as passed.
- Review new component issues against the shared acceptance criteria in `ACCESSIBILITY.md`.
- Require necessary information through types where possible (for example, `Button iconOnly` requires a name source). Use development diagnostics and CI for DOM relationships; visible text is a valid name without extra ARIA. Do not replace actual accessible-name or assistive-technology tests with heuristic diagnostics. Design variants must satisfy the same accessibility requirements.
- Treat vibration as optional, default-off feedback with explicit user control. Always preserve visible and assistive-technology-accessible information; unsupported devices must remain fully usable. API availability or a successful return does not prove delivery. Follow the haptic requirements in `ACCESSIBILITY.md`.
