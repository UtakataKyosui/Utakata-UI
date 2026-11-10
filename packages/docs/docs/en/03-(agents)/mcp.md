---

title: MCP
description: Read documentation and component specifications over HTTP MCP
---

Utakata UI uses Blume's read-only Streamable HTTP MCP server hosted on the documentation site. Search and read Japanese and English component specifications, Props, composition guidance and accessibility requirements generated from the UI package's public manifest.

## Connect [#setup]

After deployment, use the **Connect to MCP** menu on any page to copy your client's configuration or the server URL. The endpoint is the public site's origin followed by `/api/mcp`. Your client must support HTTP MCP.

`/mcp` is the Japanese guide and `/en/mcp` is this guide; `/api/mcp` is the MCP endpoint. The site root and `/registry/v1/` are not MCP endpoints. Add one HTTP server without overwriting your existing client configuration.

No dedicated MCP npm package is needed. If you previously used a local stdio configuration, replace that entry with the HTTP connection and reconnect.

## Use the tools [#tools]

| Tool             | Purpose                                                                         |
| ---------------- | ------------------------------------------------------------------------------- |
| `search_docs`    | Search component names, Props, composition and accessibility notes with `query` |
| `get_page`       | Read the page specified by `route` as Markdown                                  |
| `list_pages`     | List available pages                                                            |
| `get_navigation` | Read the site's navigation                                                      |

Pages are also available as MCP resources. For example, to use Button:

1. Pass `{"query":"Button"}` to `search_docs` to find the page.
2. Pass `{"route":"/en/components/button"}` to `get_page` to read Props, composition and accessibility notes.

The Japanese page is `/components/button`.

The hosted site describes the deployed version. When using another UI version, also inspect the installed `@utakata-ui/react/manifest` and type declarations. MCP does not inspect copied and edited implementations or verification results for custom themes. Its tools only read specifications; they do not rewrite files or install packages.

## Read Markdown [#markdown]

Append `.md` to a page URL to read Markdown with custom components converted to text. The `.mdx` variant preserves the original component markup. Requests with `Accept: text/markdown` also receive Markdown. MCP's `get_page` and page resources use the same conversion.

## Local development [#local-development]

```sh
pnpm install
pnpm dev
```

Append `/api/mcp` to the local URL printed on startup (by default, `http://localhost:4321/api/mcp`). For production, run `pnpm build:docs` and deploy the Vercel server output. Static hosting alone cannot run HTTP MCP.

See [Installation](/en/getting-started) to add the package and [Theme colors](/en/theming) to change colors.
