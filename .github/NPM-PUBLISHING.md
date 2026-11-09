# npm 公開の初期設定と運用

初回も以後も **GitHub Actions** から公開できます。各 Release の手動実行で
`release_mode` を選択します。既定は `verify`（検証のみ）です。

| release_mode | 動作                                   | 必要な設定                         |
| ------------ | -------------------------------------- | ---------------------------------- |
| `verify`     | 検証・pack・配布テストのみ             | npm の公開認証は不要               |
| `token`      | 検証後に npm へ公開。初回にも使用可能  | `npm` Environment の `NPM_TOKEN`   |
| `oidc`       | 検証後に npm Trusted Publishing で公開 | 対象パッケージの Trusted Publisher |

タグ push での公開は引き続き OIDC を使用します。Token への自動切り替えは行いません。
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

各 Release ジョブは、公開する実行（`token` / `oidc` の選択、またはタグ push）だけ
`environment: npm` を使用し、承認を待ちます。手動実行では `main` を選択し、
`release_mode: verify` が公開しない検証モードです。`verify` は `npm` Environment を
使わないため、承認待ちにならず、Environment の `NPM_TOKEN` も渡されません。

## 3. 初回を GitHub Actions で公開する

1. 次の「Token の設定」に従い、公開権限を持つ Granular Access Token を発行し、
   `npm` Environment の Secret `NPM_TOKEN` に保存します。
2. 公開するバージョンを package.json で確認し、変更とこのワークフローを main にマージします。
   Quality と必要な手動確認が完了していることも確認します。
3. GitHub の **Actions → Release React → Run workflow** を開きます。
   **Use workflow from: main**、**release_mode: verify** を選んで検証します。
4. 検証成功後、同じ main のバージョンを確認し、**release_mode: token** で実行します。
   同じコミット、または検証に影響しない変更だけなら、main の Quality や前回の
   Release で成功した検証を再利用し、配布物の build・pack・配布テストだけを行います。
   すべて再実行するには **full_verification** を選びます。
5. `npm` Environment の承認要求でコミットと公開対象を確認し、承認します。
   全検証と配布テストの成功後、テストしたものと同じ tgz を公開します。
6. 実行ログと npm のパッケージページで、バージョンと provenance を確認します。
   公開済みのバージョンは再利用できません。成功した同一バージョンの公開ジョブを再実行しないでください。

MCP は **Release MCP**、CLI は **Release CLI** で同じ操作を行います。
MCP の公開前には依存する React のバージョンを先に公開してください。
MCP は pnpm pack による workspace 依存の変換と外部利用テストを行い、
公開時には React の依存バージョンが npm に存在することも確認します。
CLI は React の npm 公開を必要としません。

ローカルで `npm login` や `npm publish` を実行する必要はありません。
公開権限の実確認は公開時に行われます。検証モードの成功だけでは認証・公開権限を確認済みにしません。

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

次のバージョンに更新した変更を main にマージし、対応する Release を main で
`release_mode: verify` により検証します。続いて `release_mode: oidc` で実行し、承認して公開します。
タグで公開する場合は、確認した main のコミットにパッケージ固有のタグを付けて push します。
たとえば React の次版が `0.1.1` なら `react-v0.1.1` です。
手動で公開した同じバージョンのタグを push すると再公開になるため、いずれか一方の方法を使用します。
タグと package.json のバージョンが違う場合や、コミットが main に含まれない場合は失敗します。

OIDC 公開の成功後、npm の Publishing access で Token による公開を禁止する設定を検討し、
不要な公開 Token を失効させます。パッケージページのバージョン・provenance と CI の結果を確認します。

## 5. 初回公開用の Token の設定

初回を Actions から公開するため、npm のプロフィールメニューから
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

保存先は **GitHub Settings → Environments → npm → Environment secrets → Add secret**、
名前は `NPM_TOKEN`、値は発行した Token です。Actions の入力欄には Token を貼り付けません。
`release_mode: token` の公開ステップだけがこの Secret を読み取ります。
依存インストール・テスト・ビルドには渡しません。
一時 userconfig には環境変数の参照だけを書き、終了時に削除します。
公開時の lifecycle scripts は無効化し、検証済み tgz を npm registry へ公開します。
Secret 未設定・認証失敗時は失敗し、OIDC への自動切り替えはしません。

OIDC への移行が完了するまでは、Token を更新して `release_mode: token` で公開を継続できます。
移行後は Secret と npm 側の不要な Token を削除・失効させます。

## 6. 未設定・認証失敗の切り分け

- `pnpm verify:release-readiness` は読み取り専用です。ローカル認証、main の必須チェック、
  npm Environment と承認者を確認し、不明な項目は unverified として非ゼロ終了します。
  ローカル認証は任意の補助確認です。Actions の Token/OIDC 公開にはローカルログインは不要で、
  ローカル未認証でも手動リリースできます。この preflight は公開ジョブの必須ゲートではありません。
- スコープ権限・Publisher の確認証拠を渡す方法は [CI ガイド](CI.md) を参照してください。
  現在の preflight の対象は React です。MCP・CLI はそれぞれ別に設定を確認します。
- ENEEDAUTH/E404 は、スコープ権限、Publisher の owner/repository/workflow/environment、
  `npm publish` 許可、有効期限、npm バージョン、`id-token: write` を確認します。
  E404 だけでパッケージが存在しないと断定しません。
- Environment 待ちやスキップでは、承認者と branch/tag の許可パターンを確認します。
- バージョン重複は再試行で解決しません。公開済み内容を確認してから次のバージョンを準備します。

設定・公開の証拠には日時、対象バージョン、確認者、CI run、公開ページを記録し、認証情報は含めません。
