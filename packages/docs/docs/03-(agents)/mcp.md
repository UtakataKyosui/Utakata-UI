---

title: MCP
description: HTTP MCP でドキュメントとコンポーネント仕様を参照する
---

Utakata UI の MCP は、Blume がドキュメントサイト上で提供する読み取り専用の Streamable HTTP サーバーです。UI 本体の公開 manifest から生成したコンポーネント仕様・Props・構成方法・アクセシビリティ要件を、日本語と英語で検索・取得できます。

## 接続する [#setup]

デプロイ後、各ページの **Connect to MCP** メニューから、クライアント用の設定またはサーバー URL をコピーしてください。接続先は公開サイトのオリジンに `/api/mcp` を付けた URL です。HTTP MCP に対応するクライアントが必要です。

`/mcp` はこの解説ページ、`/api/mcp` が MCP エンドポイントです。サイトのトップページや `/registry/v1/` は接続先ではありません。クライアントの既存の設定を上書きせず、HTTP サーバーを1件追加してください。

MCP 専用の npm パッケージをインストールする必要はありません。以前のローカル stdio 設定を使用している場合は、そのエントリーを HTTP 接続に置き換えて再接続してください。

## ツールを使う [#tools]

| ツール           | 用途                                                                |
| ---------------- | ------------------------------------------------------------------- |
| `search_docs`    | `query` でコンポーネント名・Props・構成・アクセシビリティを検索する |
| `get_page`       | `route` で指定したページを Markdown として取得する                  |
| `list_pages`     | 参照できるページを一覧する                                          |
| `get_navigation` | サイトのナビゲーションを取得する                                    |

ページは MCP リソースとしても参照できます。例えば Button を使う場合は、次の順に取得します。

1. `search_docs` に `{"query":"Button"}` を渡してページを探します。
2. `get_page` に `{"route":"/components/button"}` を渡して Props・構成・アクセシビリティ上の注意点を読みます。

英語ページは `/en/components/button` です。

公開サイトはデプロイされた版の仕様を提供します。別バージョンの UI を使う場合は、インストール済みの `@utakata-ui/react/manifest` と型定義も確認してください。コピーして編集した実装や独自テーマの検証結果は読み取りません。MCP ツールは仕様の参照用で、ファイルの書き換えやインストールは行いません。

## Markdown で読む [#markdown]

各ページの URL に `.md` を付けると、カスタムコンポーネントを変換した Markdown を取得できます。`.mdx` では元のコンポーネント記法を保持します。`Accept: text/markdown` ヘッダーでも Markdown を取得できます。MCP の `get_page` とページリソースも同じ変換を使います。

## ローカル開発 [#local-development]

```sh
pnpm install
pnpm dev
```

起動ログのローカル URL に `/api/mcp` を付けて接続します（既定は `http://localhost:4321/api/mcp`）。本番用には `pnpm build:docs` で Vercel のサーバー出力を生成してデプロイします。静的ホスティングだけでは HTTP MCP を実行できません。

パッケージの導入は[導入方法](/getting-started)、配色の変更は[テーマカラー](/theming)を参照してください。
