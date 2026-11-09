# npm 公開の初期設定と運用

現在の Release ワークフローは **npm Trusted Publishing（OIDC）** を使用します。
通常の CI 公開では `NPM_TOKEN` Secret は不要です。初回は管理者がローカルで公開し、
その後に npm 側で各パッケージの Trusted Publisher を登録します。
この手順書の追加は、Token の発行・設定変更・公開を実行したことを意味しません。

## 1. アカウントとスコープを準備する

- npm アカウントのメール認証と 2FA を設定します。
- npm の `utakata-ui` ユーザーまたは Organization を所有し、対象パッケージを
  作成・公開できることを確認します。GitHub の所有者名とは別の権限です。
- Organization の場合は、メンバー・チームのパッケージ書き込み権限も確認します。
  `npm view` の E404 は、名前の利用可否やスコープの所有権の証明にはなりません。
- Node はルート `package.json` の engines、pnpm は packageManager の指定に合わせます。
  CI と同じく npm 11.5.1 以降を使用します。

## 2. GitHub の公開承認を設定する

リポジトリの **Settings → Environments → New environment** から `npm` を作成します。

1. Required reviewers に公開を承認する管理者を設定します。利用可能なら自己承認も禁止します。
   プランによって必要な保護機能が使えない場合は、承認保護を確認済みにせず記録します。
2. Deployment branches and tags を Selected branches and tags にします。
   検証用の branch `main` と、公開するパッケージに対応した tag パターン
   `react-v*`、`mcp-v*`、`cli-v*` をそれぞれ追加します。
3. 通常の OIDC 運用では、Environment secrets に npm の公開 Token を登録する必要はありません。

各 Release ジョブは `environment: npm` を使用します。手動実行は `main` での検証のみで、
公開しません。タグ push は実際の公開を開始するため、公開準備が整ってから行います。

## 3. 初回をローカルで公開する

公開対象の変更が main に含まれ、CI と必要な手動確認が完了してから行います。
React の例です。コマンドはリポジトリルートで実行します。

```sh
npm login --registry=https://registry.npmjs.org/
npm whoami --registry=https://registry.npmjs.org/
pnpm install --frozen-lockfile
pnpm check
pnpm test:a11y:browser
```

新しい空の作業ディレクトリを `mktemp -d` で作成し、次の `<pack-dir>` にそのパスを指定します。
バージョンとファイル名は package.json に合わせます。

```sh
npm pack ./packages/react --pack-destination <pack-dir>
tar -tzf <pack-dir>/utakata-ui-react-0.1.0.tgz
node scripts/verify-react-package.mjs <pack-dir>/utakata-ui-react-0.1.0.tgz
npm publish <pack-dir>/utakata-ui-react-0.1.0.tgz --dry-run --access public
```

dry-run は収録内容の確認であり、公開権限の成功証明ではありません。
管理者が内容・バージョン・公開先を確認した後、同じ tgz を公開します。

```sh
npm publish <pack-dir>/utakata-ui-react-0.1.0.tgz --access public --registry=https://registry.npmjs.org/
npm view @utakata-ui/react@0.1.0 version dist.integrity --registry=https://registry.npmjs.org/
```

認証・2FA は npm の対話フローで完了します。初回のローカル公開に CI の provenance が
付くとは扱いません。公開済みのバージョンは再利用できません。

MCP は React の依存バージョンを先に公開します。MCP の `workspace:*` を配布用の依存に
変換するため、必ず `pnpm --filter @utakata-ui/mcp pack --pack-destination <pack-dir>` を使い、
`scripts/verify-mcp-package.mjs` で React と MCP の tgz を検証します。
CLI は `pnpm --filter @utakata-ui/cli pack --pack-destination <pack-dir>` と
`scripts/verify-cli-package.mjs` を使用します。正確な引数は各 Release ワークフローを参照してください。
各パッケージの初回公開と npm 側設定は個別に必要です。

## 4. Trusted Publisher を登録する

npm の対象パッケージの **Settings → Trusted publishing → GitHub Actions** で登録します。
このリポジトリで入力する値は次のとおりです。

| パッケージ          | Organization or user | Repository   | Workflow filename | Environment name |
| ------------------- | -------------------- | ------------ | ----------------- | ---------------- |
| `@utakata-ui/react` | `UtakataKyosui`      | `Utakata-UI` | `release.yml`     | `npm`            |
| `@utakata-ui/mcp`   | `UtakataKyosui`      | `Utakata-UI` | `release-mcp.yml` | `npm`            |
| `@utakata-ui/cli`   | `UtakataKyosui`      | `Utakata-UI` | `release-cli.yml` | `npm`            |

Allowed actions では直接公開の `npm publish` を許可します。stage のみでは現在の CI は公開できません。
workflow はパスではなくファイル名を指定し、大文字小文字も一致させます。
CI は GitHub-hosted runner と `id-token: write` を設定済みです。
新規の Publisher 設定は作成後 2 日以内の初回成功が必要なため、次回公開の直前に登録します。
期限切れの場合は npm 側で削除・再作成します。
詳細は [npm Trusted Publishing 公式手順](https://docs.npmjs.com/trusted-publishers/) を参照してください。

次のバージョンに更新した変更を main にマージし、対応する Release を main で手動実行して検証します。
続いて、確認した main のコミットにパッケージ固有のタグを付けて push し、Environment の承認を行います。
たとえば React の次版が `0.1.1` なら `react-v0.1.1` です。
タグと package.json のバージョンが違う場合や、コミットが main に含まれない場合は失敗します。

OIDC 公開の成功後、npm の Publishing access で Token による公開を禁止する設定を検討し、
不要な公開 Token を失効させます。パッケージページのバージョン・provenance と CI の結果を確認します。

## 5. Token が必要な場合の設定

対話的な `npm login` を使えない場合などに限定して、npm のプロフィールメニューから
**Access Tokens → Generate New Token** で Granular Access Token を発行します。

- Packages and scopes は公開対象だけを選び、直接公開には Read and write (publish and stage) を指定します。
  未公開パッケージの場合は所有する `@utakata-ui` スコープを対象にします。
- Organizations の管理権限は公開権限の代わりになりません。管理操作が不要なら No access にします。
- 有効期限は作業に必要な最短期間にします。非対話の Token 公開では Bypass 2FA と
  パッケージ側の Token 許可が必要です。対話公開では 2FA を使用します。
- Token 本文をチャット・Issue・PR・コマンド履歴・ログ・追跡対象の `.npmrc` に保存しません。
  作業後に失効させ、漏えい時は直ちに失効・再発行します。

発行画面の詳細は [npm の Token 作成手順](https://docs.npmjs.com/creating-and-viewing-access-tokens/) を参照してください。
ローカル利用時は、認証情報をユーザー側の保護された設定で管理します。

CI に Token を渡す運用を選ぶ場合の保存先は
**GitHub Settings → Environments → npm → Environment secrets → Add secret**、名前は `NPM_TOKEN` です。
ただし、**現在のワークフローはこの Secret を読みません**。登録だけでは動作せず、
別途レビューしたワークフロー変更で Secret を公開ステップにだけ渡し、npm の認証設定に接続する必要があります。
接続例は `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` と、
`//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}` を記載した一時 userconfig です。
一時ファイルを `NPM_CONFIG_USERCONFIG` で公開ステップだけに指定し、終了時に削除します。
Token の実値を書いた設定をキャッシュ・artifact に含めず、OIDC と Token のどちらで認証するか明示します。
既存 OIDC 構成での公開には、この変更も Secret 登録も不要です。

## 6. 未設定・認証失敗の切り分け

- `pnpm verify:release-readiness` は読み取り専用です。ローカル認証、main の必須チェック、
  npm Environment と承認者を確認し、不明な項目は unverified として非ゼロ終了します。
  ローカルの `npm whoami` 成功は OIDC の成功証明ではありません。
- スコープ権限・Publisher の確認証拠を渡す方法は [CI ガイド](CI.md) を参照してください。
  現在の preflight の対象は React です。MCP・CLI はそれぞれ別に設定を確認します。
- ENEEDAUTH/E404 は、スコープ権限、Publisher の owner/repository/workflow/environment、
  `npm publish` 許可、有効期限、npm バージョン、`id-token: write` を確認します。
  E404 だけでパッケージが存在しないと断定しません。
- Environment 待ちやスキップでは、承認者と branch/tag の許可パターンを確認します。
- バージョン重複は再試行で解決しません。公開済み内容を確認してから次のバージョンを準備します。

設定・公開の証拠には日時、対象バージョン、確認者、CI run、公開ページを記録し、認証情報は含めません。
