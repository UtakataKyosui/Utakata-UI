---
name: utakata-subissue-pr
description: Implement one Epic sub-issue (for example a shadcn/ui gap issue under #98) as a single focused draft PR, skipping issues that already have a PR.
---

# Sub-issue to PR workflow

Handle exactly one sub-issue per run, one branch and one PR.

1. Read the issue body and its acceptance criteria. Check open and merged PRs
   (title, branch, body) for the issue number; if a PR already covers it, stop
   and report that it is skipped.
2. Start from the latest default branch: `git fetch origin main` then
   `git checkout -B <branch> origin/main`. Use `feat/component-<name>` for new
   components and `feat/<topic>` otherwise. Never stack on another feature branch.
3. Follow `skills/utakata-component/SKILL.md` and `AGENTS.md`. Update `index.ts`,
   manifest, quality rules, tests, ja/en docs and examples, and `skills/utakata-ui`
   together. Do not edit generated `dist`, `.blume` or component pages.
4. If the issue asks for an adoption decision (採用判断) rather than a component,
   write the decision and scope in docs instead of adding speculative code.
5. Verify per `skills/utakata-verify/SKILL.md`: scoped `pnpm exec vitest run`,
   then `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and
   `pnpm test:a11y` / `pnpm lint:markup` / `pnpm test:a11y:browser` when relevant.
   Report real-browser, screen reader and theme checks as unverified unless run.
6. Commit with a descriptive message, push with `git push -u origin <branch>`,
   and open a draft PR whose body links the issue (`Refs #<n>`), lists public API
   changes, commands run with outcomes, and unverified checks.
7. Subscribe to PR activity, then report the PR number.
