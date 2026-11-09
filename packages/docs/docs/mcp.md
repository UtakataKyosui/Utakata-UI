---

title: MCP
description: AI エージェントから UI の仕様を参照する
---

Utakata UI は Agent Coding を前提としています。MCP は、エージェントがコンポーネントを選び、公開 API とアクセシビリティ要件に沿って UI を構築するための仕様参照の入口です。UI 本体と同じ manifest を使い、コンポーネントの仕様と品質要件を提供します。

## 他のプロジェクトから使う

MCP は npm パッケージ `@utakata-ui/mcp` として配布できる構成です。**以下の npx 設定は npm 公開後に使用できます。** docs の公開だけでは npm パッケージは公開されません。公開前の利用方法は後述の「ローカル開発」を参照してください。

Node.js 22 以降と、ローカルの stdio サーバーを起動できる MCP クライアントが必要です。利用側のアプリに Utakata UI や MCP サーバーをインストールしたり、このリポジトリを clone する必要はありません。

クライアントの MCP 設定で、起動コマンドを `npx`、引数を `-y`、`@utakata-ui/mcp@0.1.0` に設定します。`mcpServers` 形式に対応するクライアントでは、次の設定を既存の設定に追加できます。

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

設定の保存場所と再読み込み方法はクライアントにより異なります。既存の MCP 設定を上書きせず、サーバー1件を追加してください。[MCP 公式のローカルサーバー接続ガイド](https://modelcontextprotocol.io/docs/develop/connect-local-servers)も参考にできます。

pnpm を使う場合は `command` を `pnpm`、`args` を `["dlx", "@utakata-ui/mcp@0.1.0"]` に変更できます。Windows で `npx` の起動が `ENOENT` になる場合は、`command` を `cmd`、`args` を `["/c", "npx", "-y", "@utakata-ui/mcp@0.1.0"]` にしてください。

GUI アプリから Node.js が見つからない場合は、そのクライアントから参照できる PATH を設定するか、実行ファイルの絶対パスを指定します。初回のパッケージ取得には npm registry へのネットワーク接続が必要です。API キーや Utakata UI 用のアカウントは不要です。

バージョンを固定することで、クライアントの再起動時に仕様が意図せず変わることを防げます。更新するときは、公開済みのバージョンを確認して設定の番号を変更し、MCP クライアントを再接続してください。

## 接続を確認する

接続後に `list_components`、`get_component`、`search_components` が表示されることを確認します。例えばエージェントに「Utakata UI の Button の仕様とアクセシビリティ要件を調べて」と依頼すると、`get_component` に `{"name":"Button"}` を渡して参照できます。

| ツール              | 引数                      | 内容                                          |
| ------------------- | ------------------------- | --------------------------------------------- |
| `list_components`   | なし                      | 全コンポーネントの仕様と品質要件              |
| `get_component`     | `name`: コンポーネント名  | 指定した仕様。大文字・小文字は区別しません    |
| `search_components` | `query`: 空白以外の検索語 | 名前・Props・構成・アクセシビリティ要件の検索 |

MCP は依存するバージョンの UI パッケージと同じ manifest を参照します。コピーして編集したコンポーネントの実装や、独自テーマの検証結果を読み取るものではありません。利用中の UI のバージョンと MCP の依存バージョンを合わせてください。

コンポーネントの取得は[コマンドでコンポーネントを追加](./registry)、配色の変更は[テーマカラー](./theming)を参照してください。MCP のツールは仕様を参照するもので、ファイルの書き換えやパッケージのインストールは行いません。

## stdio と URL 接続の違い

この MCP は各ユーザーの環境で動く stdio サーバーです。クライアントがプロセスを起動し、標準入出力で通信します。ターミナルで直接実行して表示が出ずに待機するのは正常です。

HTTP サーバーや接続用 URL は提供しません。URL 接続だけに対応するクライアントでは使用できません。docs の URL や `/registry/v1/` の registry URL を MCP の接続先に指定しても接続できません。

## ローカル開発・公開前の利用

リポジトリのルートで次を実行します。開発用の Node.js・pnpm はルートの `package.json` の指定に従ってください。

```sh
pnpm --filter @utakata-ui/mcp... build
pnpm --filter @utakata-ui/mcp start
```

ビルド後、クライアントの `command` を `node`、`args` を `["/絶対パス/Utakata-UI/packages/mcp/dist/server.js"]` に設定します。これにより npm 公開前でもローカルで使用できます。

## 提供側の公開手順

1. npm の `@utakata-ui` スコープの公開権限を確認し、依存する `@utakata-ui/react` のバージョンを先に公開します。MCP の tgz は React のパッケージ本体を含まず、具体的なバージョンを依存関係として指定します。
2. バージョンを更新し、品質検査・パッケージ作成・外部プロジェクトでの MCP 接続を検証します。

```sh
pnpm check
pnpm --filter @utakata-ui/react pack --pack-destination /tmp
pnpm --filter @utakata-ui/mcp pack --pack-destination /tmp
node scripts/verify-mcp-package.mjs /tmp/utakata-ui-mcp-0.1.0.tgz /tmp/utakata-ui-react-0.1.0.tgz
```

`pnpm pack` は MCP のビルドも実行し、`workspace:*` の依存指定を公開用のバージョンへ置き換えます。MCP には `npm pack` を使わず、生成した tgz を公開してください。検証では tgz を一時プロジェクトへインストールし、実行コマンド・stdio の接続・3ツール・入力エラー・manifest の一致を確認します。

初回も GitHub Actions の `Release MCP` で公開できます。`npm` Environment の Secret
`NPM_TOKEN` に公開用 Granular Access Token を設定し、main を選択して
`release_mode: verify` で確認後、`release_mode: token` で実行して承認します。
Token は対象スコープへの公開権限と Bypass 2FA を必要とします。
以後は Trusted Publisher を登録して `release_mode: oidc`、または `mcp-vX.Y.Z` タグ push で公開します。
タグと MCP の安定版バージョンは一致し、コミットが main に含まれる必要があります。
同じバージョンを手動とタグの両方で公開しないでください。
設定詳細は [リポジトリの公開手順](https://github.com/UtakataKyosui/Utakata-UI/blob/main/.github/NPM-PUBLISHING.md) を参照してください。

GitHub の `npm` Environment で必要な公開制限を設定し、`@utakata-ui/mcp` の npm Trusted Publisher に owner `UtakataKyosui`、repository `Utakata-UI`、workflow `release-mcp.yml`、environment `npm` を登録してください。Environment のタグ制限を使う場合は `mcp-v*` も許可します。React の Trusted Publisher とは別に設定します。CI は公開前に React の依存バージョンが npm に存在することを確認します。

GitHub や npm の設定変更・タグの push・実際の公開は、このリポジトリの実装や docs のデプロイでは自動実行されません。
