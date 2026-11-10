# @utakata-ui/cli

Utakata UI 専用の **Base UI + Lism CSS** registry からのソース取得と、配色のアクセシビリティ検査を行う CLI です。Node.js 22 以降が必要です。実行時依存はありません。

配色検査は `utakata-ui a11y --config colors.json [--json]` で実行します。旧 `@utakata-ui/a11y-cli` の機能を統合しました。設定形式、判定、終了コードは共通です。詳細とローカル実行手順は [A11Y.md](./A11Y.md) を参照してください。

Utakata UI の標準の導入方法は npm パッケージ `@utakata-ui/react` です。この CLI は、コンポーネントの実装自体を書き換える必要がある場合の補助手段です。取り込んだソースは `@utakata-ui/react` の更新を受け取りません。

`init` で配信済み registry の URL と配置先を保存すると、以後の `list` / `add` で指定を省略できます。

```sh
npx -y @utakata-ui/cli@0.1.0 init --registry https://example.com/registry/v1 --dry-run
npx -y @utakata-ui/cli@0.1.0 init --registry https://example.com/registry/v1
npx -y @utakata-ui/cli@0.1.0 list
npx -y @utakata-ui/cli@0.1.0 add button --dry-run
npx -y @utakata-ui/cli@0.1.0 add button
```

example.com は例示用です。実際の配信 URL に置き換えてください。

`init` はプロジェクトルートに `utakata.json`（`schemaVersion: 1`、`registry`、`directory`）を作り、配置先へ共有 CSS と LICENSE をコピーします。コンポーネントは `add` で追加します。表示された依存インストール用コマンドを実行し、グローバルエントリーから CSS を1度だけ読み込んでください。既存のアプリや `package.json`、エントリーファイルは変更しません。

`init` は再実行できます。同じファイルは変更せず、異なる設定・CSS は `--overwrite` を指定した場合だけ上書きします。`--dry-run` では設定もCSSも書き込みません。ローカル registry のパスはプロジェクトルートからの相対パスで保存します。設定は `--cwd` のルート（省略時は実行ディレクトリ）のみを参照し、親ディレクトリは探索しません。

`init` を使わず、従来どおり `list` / `add` に `--registry` を渡すこともできます。明示した `--registry` / `--dir` は保存済みの設定より優先され、設定ファイル自体は変更しません。

- `--dir`: コピー先。既定は `src/components/utakata`。
- `--cwd`: 利用先プロジェクトのルート。コピー先はその下に限定します。
- `--dry-run`: 書き込みを行わず、予定を表示。
- `--overwrite`: 内容が異なる既存ファイルの上書きを明示的に許可。

CLI は共有 CSS・型・補助コード・LICENSE も配置します。同一ファイルは変更せず、競合や不正な registry は書き込み前に拒否します。依存パッケージのインストール用コマンドを表示するので、利用先で実行してください。CLI 自体は package manager やスクリプトを実行しません。

グローバルエントリーから配置先の `styles/styles.css` を読み込みます。React・React DOM・TypeScript と CSS import を解決するバンドラーは利用先で用意してください。Tailwind CSS や `components.json` は不要です。

独自の `schemaVersion: 1`、`kind: "utakata-ui/catalog" | "utakata-ui/component"` 形式を使用します。registry のディレクトリも `--registry` に渡せるため、npm 公開前はリポジトリの `bin/utakata-ui.mjs` からローカルで試せます。

詳しい導入・更新・配布手順はリポジトリの `packages/docs/docs/04-(advanced)/registry.md` を参照してください。

## License

MIT
