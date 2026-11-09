# CI execution policy

Quality always starts on PR updates so the `accessibility` aggregate check can
report a result even for documentation-only changes. It does not use workflow
path filters that could leave a required check pending. Superseded runs cancel.
PRs compare the complete merge-base diff, including removed/renamed paths.
Main pushes compare against the newest main commit whose Quality `push` or
`workflow_dispatch` run succeeded, provided it is an ancestor created within
14 days. Each successful main run therefore extends verification inductively;
an unchanged commit runs no gates. The 14-day bound applies to each link, not
to the original evidence of a skipped gate. A missing, failed, expired or
unreadable prior run gives full gates. Manual runs always execute all gates.

`scripts/ci-scope.mjs` selects independent checks/unit/build/docs/browser/fallow jobs:

| Change                                                       | Required work                                                                                              |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Root README/accessibility policy                             | Changed-file Biome; agent checks if instructions changed                                                   |
| Docs content/examples                                        | Docs build; types/Markuplint for source examples                                                           |
| React component/API/metadata                                 | Types, related unit tests, React and MCP build/packed consumers, Docs, browser, fallow; Markuplint for TSX |
| React CSS                                                    | React/Docs build, rendered browser checks, fallow                                                          |
| React unit fixture                                           | Types, related unit tests, fallow                                                                          |
| MCP implementation                                           | Types, related unit tests, MCP build, fallow                                                               |
| Dedicated registry CLI                                       | Changed-file Biome, CLI tests, packed CLI consumer, fallow                                                 |
| Browser fixture/reporter                                     | Types, browser, fallow; Markuplint for markup                                                              |
| Dependency/shared config/scope script/unknown implementation | Full gates                                                                                                 |

Root config/dependency changes clear the diff base: lint and tests run fully.
Other PRs use Biome's changed mode, Vitest's affected import graph (including
the jsdom accessibility tests in the same run), and changed existing JSX/HTML
for Markuplint. Markuplint's detection controls still execute. Typechecking
remains project-wide because file-local checks can miss public API breakage.
Browser checks retain the complete light/dark suite when relevant; they are not
selected by Vitest's source graph. A deleted markup file is not linted, but its
path still selects affected gates. Scope failure fails the aggregate check.

pnpm stores are cached by setup-node's lockfile key; installs remain frozen.
Build and Release use separate store keys including their workflow policy,
package-manager pin and lockfile. A native compiler smoke check verifies the
actual Docs dependency graph immediately after install. Installation diagnostics
record why pnpm excluded the optional Astro parser or compiler bindings, and are
printed if the smoke check fails. Node must satisfy the entire development
graph, including optional parsers: `astro-eslint-parser@3.2.0` requires
`^22.22.3 || ^24.16.0 || >=26.3.0`. At Node 24.15, pnpm skipped that parser
with `unsupported_engine` and also excluded the shared compiler's optional
native children. A newer pnpm alone and cold caches did not fix this. CI uses
Node 24.16; development engines are `^24.16.0 || >=26.3.0`.
The separate build job caches npm's download cache
for the isolated packed consumer test. No dist, node_modules or test results
are reused as verification evidence. Browser downloads cache the headless shell
by exact Playwright version, OS and architecture. OS libraries are installed
on every browser job; the cache does not establish that they exist. Only Chromium
headless is downloaded. `browser.yml` runs light/dark as two independent matrix
jobs, with `fail-fast: false` to retain both sets of evidence. Each uses two
workers and zero retries. Its five-minute suite timeout leaves time for setup
and evidence upload within the ten-minute job limit. The job records elapsed
wall time (checkout through artifact upload) in the Actions summary and fails
above 420 seconds, 70% of the limit. Six GitHub-hosted browser jobs on PR #85
(runs 42650709777–42660430846, job start to completion) took 119–149 seconds;
these runs were not separated by browser-cache hit or miss, so a cold-cache
budget remains unmeasured.
Artifacts are uploaded only after the test step runs. Release React calls the
same browser workflow and cannot publish if either theme fails. Manual main
release runs default to `release_mode: verify`; explicit `token` or `oidc` modes publish after verification.

Release workflows split into `prior`, `verify` (`pnpm check` and the Docs
compiler), the React browser gate, and `release`. `scripts/prior-verification.mjs`
skips a gate only when a completed main `push`/`workflow_dispatch` run passed it
on an ancestor commit created within 14 days (the browser artifact retention), and
the diff from that commit to HEAD does not select it: any change reruns
`pnpm check`; browser checks rerun when `ci-scope.mjs` selects browser. Accepted
`checks` evidence is a successful main Quality run or a release run's successful
`verify` job. Accepted browser evidence is a run whose two browser jobs both
succeeded in that run, so an incremental main run that skipped them never counts
and the 14-day bound applies to the browser artifacts themselves. Release
evidence counts even when its publication failed. PR runs are scoped and
never count. Lookup errors, missing runs and `full_verification: true` run every
gate. The step summary names the reused run, attempt and commit. `release`
requires each gate to have passed in this run or to be reused, and always
rebuilds, packs and tests the exact archive it publishes.

The browser fixture is built once per job and served with Vite preview. It has
no development optimizer that can reload a page during the first test. Unit
tests run independently from lint/types/Markuplint; CI limits Vitest to two
workers to bound contention without extending test timeouts. Docs builds run
independently from packed-package verification. Docs-only PRs do not install
isolated React/MCP/CLI consumers. CLI tests/pack verification run only when the
CLI is relevant (or on full gates).

`scripts/ci-gate.mjs` derives the required jobs from scope outputs: an applicable
job must succeed, including both themes of the reusable browser workflow.
Only irrelevant jobs may be skipped. Dependency-free negative tests cover
missing, failed, skipped and cancelled gates and run before scope selection.

The reporter writes `test-results/browser-evidence.json` and saves inline JSON
attachments under `test-results/evidence/`. The ledger records the commit,
working-tree dirty flag, timestamp, rule-contract hash, project/use settings,
Node/Playwright/platform, test locations, rule IDs, every attempt and its
duration/errors/artifact paths. Browser versions and actual measurements are
in the linked per-test attachments. Manifest manual rules and shared manual
rules remain `unverified` under `residual`. The reporter independently rejects
violations, incomplete or unreadable `*-axe` attachments. Global timeout,
expected failures, missing rules/themes, no results or any unsuccessful attempt
fail the gate. Evidence validation rejects a different commit/contract or
nonpassing records; results are always regenerated, never restored from cache.
The three baseline IDs additionally require rendered Button/Field axe,
Dialog keyboard/focus, and forced-colors tests in every selected theme.

`tests/browser/coverage.ts` explicitly registers every public component, its
public axes and relevant state checks. Manifest axes are compared against fixed
reviewed values: adding a component/value without reviewing fixtures fails.
The configuration test verifies actual rendered axis combinations (including
variant × size), and state entries reference required browser rule IDs. Each
ledger record links those component/state entries to the executed rule test.
This is axis coverage plus registered state transitions, not an assertion that
every axis × state × input × content permutation has run. Some older component
rules still combine properties; their assertions and failure artifacts remain
available. Actual assistive output, physical OS modes and browser zoom are
tracked separately in ACCESSIBILITY-MANUAL.md.

Evidence now hashes the actual nonignored source contents (including unstaged
and new files), environment/configuration and attachments. A changed source,
environment or deleted/replaced attachment invalidates evidence. Source changes
during a run fail it. Do not edit tracked source while gathering final evidence.

Browser workflow dispatch accepts `cache_mode: cold` or `warm`. Cold uses a
temporary empty pnpm store and browser directory and bypasses both cache
restores. Both modes enforce the same 420-second wall budget and retain both
theme artifacts. Quality's manual `browser_cache_mode` input also forwards the
mode to the reusable browser workflow, allowing verification on the PR branch.
Record run URLs and actual job durations before claiming cold/warm performance.

`pnpm test:stability` repeats the entire unit suite ten times, retaining every
JSON report and diagnostic log under `unit-stability-results/` (separate from
Playwright's cleaned output directory). Set
`STABILITY_RUNS=2..30` and `STABILITY_WORKERS=2|4|default` to reproduce load
conditions. Any failed/missing/skipped attempt fails the aggregate; later passes
cannot erase it. The manual Unit stability diagnostics workflow runs the same
command on Ubuntu. Repeated passing runs are stability evidence, not proof of
the original Skeleton failure's cause. That failure has no surviving log and
has not been reproduced; #83's cause-identification criterion remains open.

`pnpm verify:release-readiness` performs read-only checks of main's required
quality context, the protected npm environment and optional local npm authentication (the preflight is not a release gate). Unknown
or unauthorized responses are unverified and exit nonzero. npm scope rights
and Trusted Publisher settings need maintainer evidence; optionally provide
its JSON path as an argument. Each entry keyed by `npm.scope-publish-rights` or
`npm.trusted-publisher` must have `package: @utakata-ui/react`, `status: passed`,
`reviewer`, `evidence` reference and `checkedAt` within the last 30 days. Never
put tokens or private screenshots in this file. Trusted Publisher is a later
phase after the separately authorized initial token publication through Actions, not an initial
publication prerequisite. An unconfigured later phase is not overall CI-release
readiness.

For account/scope setup, GitHub Environment protection, initial Actions publication,
per-package Trusted Publisher values, and optional token/Secrets handling, see
[npm publishing setup](NPM-PUBLISHING.md). Release workflows default to verification. Manual `token` mode uses only the npm
Environment secret `NPM_TOKEN` at publication; manual `oidc` mode and tag pushes
use Trusted Publishing. Initial publication needs no local login.

The reviewable `.github/required-checks.ruleset.json` requires the always
reporting `accessibility` aggregate on main, with strict checks and no bypass
actors. Applying it changes remote merge policy and requires confirmation under
AGENTS.md. After explicit user approval on 2026-11-10 JST, ruleset `26865507`
was applied and read back: active on `refs/heads/main`, strict `accessibility`
check from GitHub Actions (integration 15368), no bypass actors. This remote
setting is not applied automatically by a source PR. The `npm` environment should require
the repository owner's review; scope ownership and the npm publisher binding
remain external prerequisites. No npm/environment/publisher settings were changed.

MCP builds require the React package first. The build job packs both packages
with pnpm, installs the archives into an isolated consumer, then verifies the
installed MCP executable, stdio initialization, all tools, invalid inputs and
manifest parity. `Release MCP` uses `mcp-vX.Y.Z` tags and a separate npm Trusted
Publisher for `release-mcp.yml`; manual main runs default to verify and can explicitly publish with token or OIDC. Tagged releases
also require the exact React dependency version to exist on npm before publish.

The dedicated registry CLI has dependency-free Node tests (`pnpm test:cli`) in
the unit job. The build job also packs and installs it into an isolated
consumer, then tests package-name execution, catalog listing, dry-run, source
installation and repeated installs. Docs builds verify the registry's import
graph and typecheck valid/invalid consumer code installed through the CLI.
`Release CLI` uses `cli-vX.Y.Z` tags and its own `release-cli.yml` Trusted
Publisher. It does not require a published React package; sources are fetched
from the separately hosted Utakata UI registry.

Run `pnpm test:ci`, `actionlint`, and `gh actions-lock --verify` after workflow
changes. Run `gh actions-lock` whenever adding/changing an Action reference;
commit `.github/workflows/actions.lock` together with the workflow. The lockfile
verification workflow remains filtered to workflow changes, plus its scheduled
upstream verification. Its job must not be made a required check for every PR
without an always-reporting aggregate.

Skipped _irrelevant jobs_ are allowed by the aggregate. Skipped required browser
test cases, incomplete axe results, failed jobs and cancellations are failures.
Measure cold and warm GitHub runs before claiming a duration improvement;
cache restoration itself has overhead, and parallel jobs trade runner work for
shorter elapsed time.

The React consumer verification also installs Vite 8.3.5 into its temporary
external project, imports the installed CSS and manifest with a rendered Button,
and runs a production build. The same declaration fixtures, SSR and production
build run for React/React DOM 18.3.1 with @types/react 18.3.31 / @types/react-dom
18.3.7 and React/React DOM 19.3.1 with types 19.3.0, using TypeScript 5.9.3.
These are tested versions, not a promise that every peer-range version has run.

## Verification record (2026-11-10 JST)

Local changes based on `2087236bb0305a839cbf5f2c7dd80d788792441f`,
with an uncommitted working tree; macOS arm64, Node 26.13.0, pnpm 10.18.3.
These results describe this working tree, not a GitHub run or released version.

- `pnpm check`: passed, including build/Docs and fallow (one complexity warning).
- `pnpm test:ci`: 12 passed; `actionlint` and `gh actions-lock --verify`: passed.
- `pnpm lint:markup`: 73 files clean plus both detection controls passed.
- `pnpm typecheck`, `pnpm lint`, `pnpm test:a11y`: passed (8 a11y tests).
- Full unit baseline: 194 passed; `CI=true pnpm test`: 194 passed with two
  workers. Five more full-suite runs, concurrent with the browser suite, each
  passed all 194 tests. Skeleton also passed its three focused tests. The
  original Skeleton failure was not reproduced; its root cause remains unknown.
  The worker cap is a contention mitigation, not evidence of a diagnosed fix.
- `CI=true pnpm test:a11y:browser`: 234 passed with two workers, zero retries,
  103.6 seconds including fixture build/startup. The ledger passed with no
  missing rule/theme or axe failure, 214 attachment references and 45 manual
  rules explicitly unverified. This is a local whole-suite run, not a measured
  GitHub matrix-job duration.
- Select's Escape test initially failed during the full browser run: listbox
  visibility preceded initial focus, so subsequent keys raced that effect.
  After asserting System → Dark → Light focus before Escape, all 40 cases in
  `select.spec.ts --repeat-each=10` passed. The narrow run's full-coverage
  reporter correctly failed for omitted unrelated rules; the later complete
  suite passed the reporter. For focused debugging use `--reporter=list`;
  required CI always retains the full coverage reporter.
- Packed `@utakata-ui/react@0.1.0`: isolated declaration positive/negative
  fixtures, SSR, CSS/manifest imports and Vite build passed.
- Read-only GitHub checks: branch protection returned `Branch not protected`
  (404); applicable rules for `main` returned `[]`. Therefore the aggregate is
  implemented but is not currently a repository-enforced merge requirement.
- npm public metadata lookup returned E404 for `@utakata-ui/react`. This does
  not establish scope ownership or publish rights. Initial publication, npm
  ownership/Trusted Publisher configuration, GitHub cold/warm timings, real
  assistive-technology output, OS modes and browser zoom remain unverified.

No repository settings, registry settings, tags or releases were changed.
