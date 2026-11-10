---

title: MCP
description: Let AI agents look up the UI specification
---

Utakata UI is designed for Agent Coding. MCP is the entry point agents use to look up the specification so they can choose components and build interfaces that follow the public API and accessibility requirements. It serves the component specification and quality requirements from the same manifest as the UI package.

## Use it from another project [#setup]

MCP is set up to be distributed as the npm package `@utakata-ui/mcp`. **The npx configuration below works once the package is published to npm.** Publishing the docs does not publish the npm package. Before publication, see "Local development" below.

You need Node.js 22 or later and an MCP client that can start a local stdio server. You do not need to install Utakata UI or the MCP server in your app, or clone this repository.

In your client's MCP configuration, set the command to `npx` and the arguments to `-y` and `@utakata-ui/mcp@0.1.0`. In clients that support the `mcpServers` format, you can add the following to your existing configuration.

```json
{
  "mcpServers": {
    "utakata-ui": {
      "command": "npx",
      "args": ["-y", "@utakata-ui/mcp@0.1.0"]
    }
  }
}
```

Where the configuration is saved and how it is reloaded depends on the client. Add one server without overwriting your existing MCP configuration. The [official MCP guide to connecting local servers](https://modelcontextprotocol.io/docs/develop/connect-local-servers) is also useful.

With pnpm, you can set `command` to `pnpm` and `args` to `["dlx", "@utakata-ui/mcp@0.1.0"]`. If starting `npx` fails with `ENOENT` on Windows, set `command` to `cmd` and `args` to `["/c", "npx", "-y", "@utakata-ui/mcp@0.1.0"]`.

If a GUI app cannot find Node.js, configure a PATH the client can see or specify the absolute path to the executable. The first package download needs network access to the npm registry. No API key or Utakata UI account is required.

Pinning the version prevents the specification from changing unexpectedly when the client restarts. To update, check the published versions, change the number in the configuration and reconnect the MCP client.

## Check the connection [#verify]

After connecting, check that `list_components`, `get_component` and `search_components` are listed. For example, if you ask the agent "Look up the specification and accessibility requirements of the Utakata UI Button", it can pass `{"name":"Button"}` to `get_component`.

| Tool                | Arguments                        | Returns                                                                |
| ------------------- | -------------------------------- | ---------------------------------------------------------------------- |
| `list_components`   | None                             | Specification and quality requirements of every component              |
| `get_component`     | `name`: component name           | The specified component. Case-insensitive                              |
| `search_components` | `query`: a non-blank search term | Search across names, Props, composition and accessibility requirements |

MCP reads the same manifest as the UI package version it depends on. It does not read copied and edited component implementations or verification results for custom themes. Keep the UI version you use and the MCP dependency version aligned.

See [Installation](/en/getting-started) to add the package and [Theme colors](/en/theming) to change colors. MCP tools only look up the specification; they do not rewrite files or install packages.

## stdio versus URL connections [#stdio]

This MCP server is a stdio server that runs in each user's environment. The client starts the process and communicates over standard input and output. If you run it directly in a terminal, it waits without output, which is normal.

No HTTP server or connection URL is provided, so clients that only support URL connections cannot use it. Specifying the docs URL or the `/registry/v1/` registry URL as an MCP endpoint does not work.

## Local development and use before publication [#local]

Run the following at the repository root. Use the Node.js and pnpm versions specified in the root `package.json`.

```sh
pnpm --filter @utakata-ui/mcp... build
pnpm --filter @utakata-ui/mcp start
```

After building, set the client's `command` to `node` and `args` to `["/absolute/path/Utakata-UI/packages/mcp/dist/server.js"]`. This lets you use it locally before npm publication.

## Publishing (maintainers) [#publishing]

1. Confirm publish rights for the `@utakata-ui` npm scope and publish the `@utakata-ui/react` version it depends on first. The MCP tgz does not include the React package itself and declares a concrete version as a dependency.
2. Update the version, then verify quality checks, packing and an MCP connection from an external project.

```sh
pnpm check
pnpm --filter @utakata-ui/react pack --pack-destination /tmp
pnpm --filter @utakata-ui/mcp pack --pack-destination /tmp
node scripts/verify-mcp-package.mjs /tmp/utakata-ui-mcp-0.1.0.tgz /tmp/utakata-ui-react-0.1.0.tgz
```

`pnpm pack` also builds MCP and replaces the `workspace:*` dependency with the published version. Do not use `npm pack` for MCP; publish the generated tgz. Verification installs the tgz into a temporary project and checks the executable, the stdio connection, the three tools, input errors and that the manifest matches.

The first release can also be published with the GitHub Actions `Release MCP` workflow. Set a Granular Access Token for publishing as the `NPM_TOKEN` secret in the `npm` environment, select main, check with `release_mode: verify`, then run with `release_mode: token` and approve. The token needs publish rights for the scope and Bypass 2FA. After that, register a Trusted Publisher and publish with `release_mode: oidc` or by pushing an `mcp-vX.Y.Z` tag. The tag must match the stable MCP version and the commit must be on main. Do not publish the same version both manually and with a tag. See the [repository publishing guide](https://github.com/UtakataKyosui/Utakata-UI/blob/main/.github/NPM-PUBLISHING.md) for details.

Set the required publishing restrictions on the GitHub `npm` environment, and register an npm Trusted Publisher for `@utakata-ui/mcp` with owner `UtakataKyosui`, repository `Utakata-UI`, workflow `release-mcp.yml` and environment `npm`. If you use tag restrictions on the environment, also allow `mcp-v*`. This is configured separately from the React Trusted Publisher. CI checks before publishing that the React dependency version exists on npm.

Changes to GitHub or npm settings, tag pushes and actual publication are never run automatically by this repository's implementation or by docs deployment.
