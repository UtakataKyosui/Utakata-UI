# CI execution policy

Quality always starts on PR updates so the `accessibility` aggregate check can
report a result even for documentation-only changes. It does not use workflow
path filters that could leave a required check pending. Superseded runs cancel.
PRs compare the complete merge-base diff, including removed/renamed paths.
Main pushes and manual runs execute all applicable gates.

`scripts/ci-scope.mjs` selects independent checks/unit/build/docs/browser/fallow jobs:

| Change                                                       | Required work                                                                                                |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Root README/accessibility policy                             | Changed-file Biome; agent checks if instructions changed                                                     |
| Docs content/examples                                        | Docs build; types/Markuplint for source examples                                                             |
| React component/API/metadata                                 | Types, related unit tests, React build/packed consumer, Docs, browser, fallow; Markuplint for TSX components |
| React CSS                                                    | React/Docs build, rendered browser checks, fallow                                                            |
| React unit fixture                                           | Types, related unit tests, fallow                                                                            |
| MCP implementation                                           | Types, related unit tests, MCP build, fallow                                                                 |
| Dedicated registry CLI                                       | Changed-file Biome, CLI tests, packed CLI consumer, fallow                                                   |
| Browser fixture/reporter                                     | Types, browser, fallow; Markuplint for markup                                                                |
| Dependency/shared config/scope script/unknown implementation | Full gates                                                                                                   |

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
above 420 seconds, 70% of the limit. Cold/warm GitHub timings still need to be
measured; local suite duration does not establish this budget on GitHub.
Artifacts are uploaded only after the test step runs. Release React calls the
same browser workflow and cannot publish if either theme fails. Manual main
release runs still verify without publishing. Release keeps full checks and
uses the pnpm cache.

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

This ledger maps existing browser rules to tests; it does not yet enforce a
complete component × variant × size × state registry. Some quality rules still
combine properties. Those parts of #49, actual assistive output, physical OS
modes and browser zoom remain residual work. Repository branch protection and
npm scope/Trusted Publisher configuration require separate verification; this
change does not mutate those services.

MCP builds require the React package first. The build job packs both packages
with pnpm, installs the archives into an isolated consumer, then verifies the
installed MCP executable, stdio initialization, all tools, invalid inputs and
manifest parity. `Release MCP` uses `mcp-vX.Y.Z` tags and a separate npm Trusted
Publisher for `release-mcp.yml`; manual main runs only verify. Tagged releases
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
and runs a production build. This supplements the existing declaration negative
fixtures and SSR test; it exercises the package exports without source aliases.

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
