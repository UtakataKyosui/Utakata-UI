# CI execution policy

Quality always starts on PR updates so the `accessibility` aggregate check can
report a result even for documentation-only changes. It does not use workflow
path filters that could leave a required check pending. Superseded runs cancel.
PRs compare the complete merge-base diff, including removed/renamed paths.
Main pushes and manual runs execute all applicable gates.

`scripts/ci-scope.mjs` selects independent checks/build/browser/fallow jobs:

| Change                                                       | Required work                                                                                                |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Root README/accessibility policy                             | Changed-file Biome; agent checks if instructions changed                                                     |
| Docs content/examples                                        | Docs build; types/Markuplint for source examples                                                             |
| React component/API/metadata                                 | Types, related unit tests, React build/packed consumer, Docs, browser, fallow; Markuplint for TSX components |
| React CSS                                                    | React/Docs build, rendered browser checks, fallow                                                            |
| React unit fixture                                           | Types, related unit tests, fallow                                                                            |
| MCP implementation                                           | Types, related unit tests, MCP build, fallow                                                                 |
| Browser fixture/reporter                                     | Types, browser, fallow; Markuplint for markup                                                                |
| Dependency/shared config/scope script/unknown implementation | Full gates                                                                                                   |

Root config/dependency changes clear the diff base: lint and tests run fully.
Other PRs use Biome's changed mode, Vitest's affected import graph (including
the jsdom accessibility tests in the same run), and changed existing JSX/HTML
for Markuplint. Markuplint's detection controls still execute. Typechecking
remains project-wide because file-local checks can miss public API breakage.
Browser checks retain all six light/dark cases when relevant; they are not
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
headless is downloaded. Browser tests have a three-minute global timeout below
the job timeout, so they can write failure evidence. Artifacts are uploaded only
after the test step runs. Release keeps full checks and uses the pnpm cache.

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
