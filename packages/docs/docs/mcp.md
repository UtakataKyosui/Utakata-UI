---

title: MCP
description: AI エージェントから UI の仕様を参照する
---

リポジトリのルートで次のコマンドを実行すると、stdio transport の MCP サーバーを起動できます。

```sh
pnpm --filter @utakata-ui/mcp... build
pnpm --filter @utakata-ui/mcp start
```

MCP クライアントから起動する場合は、ビルド後に `node` をコマンド、`packages/mcp/dist/server.js` の絶対パスを引数に指定します。

次のツールで UI 本体の公開 manifest を参照できます。

- `list_components`: コンポーネント一覧
- `get_component`: コンポーネントの仕様と品質要件
- `search_components`: コンポーネント検索
