# @utakata-ui/cli

Utakata UI 専用の **Base UI + Lism CSS** registry から、コンポーネントのソースを取得する CLI です。Node.js 22 以降が必要です。実行時依存はありません。

npm 公開後は、配信済み registry の URL を指定して使用します。

```sh
npx -y @utakata-ui/cli@0.1.0 list --registry https://example.com/registry/v1
npx -y @utakata-ui/cli@0.1.0 add button --registry https://example.com/registry/v1 --dry-run
npx -y @utakata-ui/cli@0.1.0 add button --registry https://example.com/registry/v1
```

example.com は例示用です。実際の配信 URL に置き換えてください。

- `--dir`: コピー先。既定は `src/components/utakata`。
- `--cwd`: 利用先プロジェクトのルート。コピー先はその下に限定します。
- `--dry-run`: 書き込みを行わず、予定を表示。
- `--overwrite`: 内容が異なる既存ファイルの上書きを明示的に許可。

CLI は共有 CSS・型・補助コード・LICENSE も配置します。同一ファイルは変更せず、競合や不正な registry は書き込み前に拒否します。依存パッケージのインストール用コマンドを表示するので、利用先で実行してください。CLI 自体は package manager やスクリプトを実行しません。

グローバルエントリーから配置先の `styles/styles.css` を読み込みます。React・React DOM・TypeScript と CSS import を解決するバンドラーは利用先で用意してください。Tailwind CSS や `components.json` は不要です。

独自の `schemaVersion: 1`、`kind: "utakata-ui/catalog" | "utakata-ui/component"` 形式を使用します。registry のディレクトリも `--registry` に渡せるため、npm 公開前はリポジトリの `bin/utakata-ui.mjs` からローカルで試せます。

詳しい導入・更新・配布手順はリポジトリの `packages/docs/docs/registry.md` を参照してください。

## License

MIT
