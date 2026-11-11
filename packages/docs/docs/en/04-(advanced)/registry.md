---

title: Copying and modifying source
description: Fetch component source with the dedicated registry and CLI
---

The standard way to install Utakata UI is the npm package `@utakata-ui/react` ([Installation](/en/getting-started)). The CLI on this page is a fallback for when you need to rewrite a component's implementation.

The CLI copies component source, types, accessibility diagnostics and shared CSS into your project from a dedicated registry built for the **Base UI + Lism CSS** stack. Tailwind CSS, the shadcn CLI and `components.json` are not required.

## Differences from the npm package [#comparison]

| Item                                                      | npm package                     | Source copied with the CLI                                              |
| --------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------- |
| Updates and fixes                                         | Applied by updating the package | Not applied. You manage the differences                                 |
| Type constraints and development diagnostics              | Verified in CI on the package   | As of the time you copied them. Verify yourself after editing           |
| Import path                                               | `@utakata-ui/react`             | Your target path (for example `@/components/utakata/components/Button`) |
| Examples in the component reference, MCP and agent guides | Usable as is                    | Replace import paths with your target path                              |

Use only one of the two approaches within a single app.

## Requirements [#requirements]

The CLI needs Node.js 22 or later. The target project uses React 18.3.1 or later, React DOM, TypeScript and a bundler that resolves CSS imports.

Components are fetched from the registry served by the docs site. Publishing the docs and publishing the CLI to npm are separate tasks. How to try it inside the repository is described below.

## Initialize, list and add commands [#commands]

Replace `REGISTRY_URL` with `/registry/v1` under the URL where these docs are published. example.com is only an example. If you publish under a subpath, include that path.

```sh
REGISTRY_URL="https://example.com/registry/v1"

npx -y @utakata-ui/cli@0.1.0 init --registry "$REGISTRY_URL" --dry-run
npx -y @utakata-ui/cli@0.1.0 init --registry "$REGISTRY_URL"
npx -y @utakata-ui/cli@0.1.0 list
npx -y @utakata-ui/cli@0.1.0 add button dialog field --dry-run
npx -y @utakata-ui/cli@0.1.0 add button dialog field
```

With pnpm, you can replace `npx -y @utakata-ui/cli@0.1.0` with `pnpm dlx @utakata-ui/cli@0.1.0`. Specify a published CLI version.

`init` saves `schemaVersion: 1`, `registry` and `directory` in `utakata.json`, copies shared CSS and LICENSE, and automatically installs Base UI and Lism CSS. It does not add components yet. Add the CSS import as described below. Existing application entry files are not edited automatically.

`init` supports the same `--dir` / `--cwd` flags as `add`. Subsequent `list` / `add` commands read settings only from the `--cwd` root (the current directory by default); they do not search parent directories. Explicit `--registry` / `--dir` flags override saved values without updating the configuration. Local registry paths are saved relative to the project root. You can also skip `init` and continue passing `--registry` on each command.

You can rerun `init`: identical files remain unchanged, and conflicts stop the operation before writing. Use `--overwrite` to allow replacing configuration or CSS. `--dry-run` does not create the configuration file either.

Use `init --palette '<JSON>'` to save custom colors too. Choose colors on the [theme page](/en/theming), check the Registry URL, and copy the initialization command. With a palette, `theme.css` imports the standard stylesheet and applies the overrides: import it once from your global entry instead of `styles/styles.css`. Subsequent `add` commands preserve the saved colors.

Component names are the lowercase names from the [component list](/en/components) (for example `alertdialog`, `dropdownmenu`, `nativeselect`). You can also check the [dedicated catalog](/registry/v1/registry.json). The source must come from `--registry` or saved settings; there is no implicit fallback to another registry.

## Add dependencies [#dependencies]

`init` selects npm, pnpm, yarn or bun from the `packageManager` field, then the lockfile, falling back to npm. Select one with `--package-manager pnpm`. It automatically adds the dependencies below without running dependency lifecycle scripts. Use `--no-install` to print the command without running it; `--dry-run` leaves files and dependencies unchanged. `add` does not install additional dependencies.

```sh
pnpm add @base-ui/react@^1.9.0 lism-css@^1.1.0
```

Your app provides React, React DOM and their type definitions. When you copy source, do not install `@utakata-ui/react`.

## Location and imports [#location]

The default location is `src/components/utakata/`. You can change it with `--dir` and set the project root with `--cwd`. The location is restricted to paths under the project root.

```sh
npx -y @utakata-ui/cli@0.1.0 add button --registry "$REGISTRY_URL" --cwd ./my-app --dir src/components/utakata
```

In apps where `@/` maps to `src/`, import as follows. If you use another alias or relative paths, match your actual location.

```tsx
import { Button } from '@/components/utakata/components/Button';
import '@/components/utakata/styles/styles.css';

export function SaveButton() {
  return <Button>Save</Button>;
}
```

Load the CSS once in your global entry (the root layout in Next.js, for example). You can also change colors with [Theme colors](/en/theming).

Helper code reached through relative imports, type information and quality metadata, shared CSS and the license are placed in the same tree structure. `KbdGroup` is included in `kbd`. Lism layout primitives can be imported directly from `lism-css/react`.

## Updates and existing files [#updates]

Files with identical content are left unchanged, and the add stops if an existing file has different content. Validation and conflict checks run before anything is written. When several components share a helper file, its contents are also checked for a match.

`--dry-run` prints the plan without writing. Specify `--overwrite` only when you have compared your local edits with the source and want to update. You can check what will be overwritten first.

```sh
npx -y @utakata-ui/cli@0.1.0 add button --registry "$REGISTRY_URL" --overwrite --dry-run
```

Copied source is not updated by npm package updates. The registry records the UI version at build time in `packageVersion`. If you need a reproducible source, keep the same build output at a versioned URL.

Keep the label type constraints, development diagnostics and Base UI keyboard and focus handling after editing, and check the accessibility requirements in [Installation](/en/getting-started). Verify the conformance of custom styles and finished screens yourself as well.

## Registry format [#format]

The registry serves `/registry/v1/registry.json`, `/registry/v1/button.json` and so on. The catalog has `kind: "utakata-ui/catalog"`, each component has `kind: "utakata-ui/component"`, and the format version is `schemaVersion: 1`.

A component contains `name`, `title`, `packageVersion`, `dependencies` with dependency names and versions, and `files` with `path`, `content` and `sha256`. Paths are relative to the target location. It does not depend on external registry schemas or placement aliases.

The CLI validates the format, file hashes, paths and dependency specifications. The hash checks content integrity; it is not a signature that authenticates the distributor. Remote registries use HTTPS; local development can use HTTP on localhost or a directory. HTTP redirects are not followed, so specify the final serving URL.

## Build and check before publishing [#build]

```sh
pnpm build:docs
node packages/cli/bin/utakata-ui.mjs list --registry packages/docs/.vercel/output/static/registry/v1
node packages/cli/bin/utakata-ui.mjs add button --registry packages/docs/.vercel/output/static/registry/v1 --cwd /path/to/my-app --dry-run
```

The build generates the dedicated JSON from the React source and places it in `packages/docs/.vercel/output/static/registry/v1/`. Deploying the Vercel server output serves these static files at `/registry/v1/`; no extra API server is needed. Check that JSON URLs are not rewritten to HTML.

`pnpm dev` does not generate the registry. To try it over HTTP, run `pnpm --filter @utakata-ui/docs preview` after building and specify `/registry/v1` under that URL.

## Publish the CLI to npm [#publishing]

The CLI is the `packages/cli` package with no extra runtime dependencies. Components are fetched from the registry, so you do not need to publish the React package to npm before publishing the CLI.

```sh
pnpm check
pnpm --filter @utakata-ui/cli pack --pack-destination /tmp
node scripts/verify-cli-package.mjs /tmp/utakata-ui-cli-0.1.0.tgz
```

The first release can also be published from the GitHub Actions `Release CLI` workflow. Confirm publish rights for the `@utakata-ui` npm scope, and set a Granular Access Token with publish rights for the scope and Bypass 2FA as the `NPM_TOKEN` secret in the GitHub `npm` environment.

Increase the stable `version` in `packages/cli/package.json` and land it on main. `Release CLI` (`.github/workflows/release-cli.yml`) verifies and automatically publishes that version with OIDC. Edits without a version change and tag pushes do not publish. For a manual check, select main and `release_mode: verify` (the default). Manual publication uses `oidc`, or `token` with the Environment token. Do not publish the same version twice. See the [repository publishing guide](https://github.com/UtakataKyosui/Utakata-UI/blob/main/.github/NPM-PUBLISHING.md) for details.

Configure the npm Trusted Publisher with owner `UtakataKyosui`, repository `Utakata-UI`, workflow `release-cli.yml` and environment `npm`. The GitHub `npm` Environment permits only the main branch and requires no manual approval. Creating a PR does not publish; landing a version increase on main triggers automatic publication.
