---
name: utakata-verify
description: Verify or review Utakata-UI changes using scoped tests, workspace checks and accessibility evidence before handoff.
---

# Verification and review

Inspect `git status --short` and the relevant diff. Include untracked files
belonging to the request and preserve pre-existing work.

- Components/CSS: relevant Vitest tests, `pnpm test:a11y`, lint, typecheck and build.
- MCP: `packages/mcp/src/tools.test.ts`, typecheck and build; compare manifest output.
- Docs: `pnpm build:docs`; component reference content is generated.
- Agent configuration/hooks: `pnpm test:agents`; inspect discovery links and commands.
- Dependency/configuration changes: full `pnpm check` when dependencies and
  `origin/main` are available. Report missing prerequisites explicitly.

Use existing package scripts. A read-only review does not authorize changing
files, installing dependencies, commits or pushes. For implementation tasks,
fix failures within scope and rerun affected checks.

Distinguish change-related failures from baseline or environment failures.
Report commands and outcomes. Manual screen reader, keyboard and theme checks
remain unverified unless performed. Lead reviews with actionable findings,
file locations and concrete impact.
