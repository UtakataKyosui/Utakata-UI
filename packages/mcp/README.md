# @utakata-ui/mcp

Utakata UI のコンポーネント仕様・構成例・アクセシビリティ要件を参照する MCP サーバーです。
Node.js 22 以降と、ローカル stdio サーバーに対応する MCP クライアントが必要です。

## 接続

npm 公開後、クライアントに次の起動設定を登録してください。
リポジトリの clone やグローバルインストールは不要です。

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

`mcpServers` は対応クライアントの設定例です。別の設定形式を使うクライアントでも、
起動コマンド `npx` と同じ引数を指定できます。Windows で npx を直接起動できない場合は、
`command` を `cmd`、`args` を `["/c", "npx", "-y", "@utakata-ui/mcp@0.1.0"]` にします。
更新時はバージョン指定を公開済みの新しい番号に変更してください。

## ツール

- `list_components`: 全コンポーネントの仕様と品質要件
- `get_component`: `name` で指定したコンポーネントの仕様（大文字・小文字を区別しません）
- `search_components`: `query` による仕様の検索

仕様は同梱の依存バージョンの `@utakata-ui/react` の manifest を参照します。
利用側でコピー・編集したソースの状態を検査するものではありません。
コンポーネントのインストールやファイルの書き換えは行いません。

stdio 接続のため、通常起動では入力を待ちます。ターミナルに案内が表示されないのは正常です。
HTTP エンドポイントは提供しません。ログを追加する場合は stdout ではなく stderr を使用してください。

詳細な導入・公開手順はリポジトリの `packages/docs/docs/mcp.md` を参照してください。

## License

MIT
