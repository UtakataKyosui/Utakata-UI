---

title: ソースを取り込んで改変する
description: 専用のregistryとCLIでコンポーネントのソースを取得する
---

Utakata UI の標準の導入方法は npm パッケージ `@utakata-ui/react` です（[導入方法](/getting-started)）。このページの CLI は、コンポーネントの実装自体を書き換える必要がある場合の補助手段です。

CLI は **Base UI + Lism CSS** の構成に合わせた専用 registry から、コンポーネントのソース・型・アクセシビリティ診断・共通 CSS を自分のプロジェクトへコピーします。Tailwind CSS、shadcn CLI、`components.json` のセットアップは不要です。

## npm パッケージとの違い [#comparison]

| 項目                                                | npm パッケージ               | CLI で取り込んだソース                                       |
| --------------------------------------------------- | ---------------------------- | ------------------------------------------------------------ |
| 更新・修正の反映                                    | パッケージの更新で反映される | 反映されない。利用側で差分を管理する                         |
| 型制約・開発時の診断                                | 配布物で CI 検証済み         | 取り込んだ時点の内容。編集後は利用側で検証する               |
| import パス                                         | `@utakata-ui/react`          | 配置先のパス（例: `@/components/utakata/components/Button`） |
| コンポーネント仕様・MCP・エージェント向けガイドの例 | そのまま使える               | import パスを配置先に読み替える                              |

1つのアプリでは、どちらか一方の方式に揃えてください。

## 前提 [#requirements]

CLI には Node.js 22 以降が必要です。利用先は React 18.3.1 以降・React DOM・TypeScript と、CSS import を解決するバンドラーを使用します。

コンポーネントの取得先は、docs サイトが配信する registry です。docs の公開と CLI の npm 公開は別の作業です。リポジトリ内での試し方は後述します。

## 初期化・一覧・追加コマンド [#commands]

`REGISTRY_URL` を、この docs を公開した URL の `/registry/v1` に置き換えて実行します。example.com は例示用です。サブパスで公開する場合は、そのパスも含めてください。

```sh
REGISTRY_URL="https://example.com/registry/v1"

npx -y @utakata-ui/cli@0.1.0 init --registry "$REGISTRY_URL" --dry-run
npx -y @utakata-ui/cli@0.1.0 init --registry "$REGISTRY_URL"
npx -y @utakata-ui/cli@0.1.0 list
npx -y @utakata-ui/cli@0.1.0 add button dialog field --dry-run
npx -y @utakata-ui/cli@0.1.0 add button dialog field
```

pnpm なら `npx -y @utakata-ui/cli@0.1.0` を `pnpm dlx @utakata-ui/cli@0.1.0` に置き換えられます。CLI のバージョンは公開済みの番号を指定してください。

`init` はプロジェクトルートの `utakata.json` に `schemaVersion: 1`・`registry`・`directory` を保存し、配置先に共有 CSS と LICENSE を用意します。コンポーネントはまだ追加しません。表示された依存インストール用コマンドと CSS の読み込み手順は、後述のとおり利用先で実行してください。既存のエントリーファイルは自動編集しません。

`init` の `--dir` / `--cwd` は `add` と共通です。以後の `list` / `add` は `--cwd` のルート（省略時は実行ディレクトリ）の設定を参照し、親ディレクトリは探索しません。`--registry` / `--dir` を明示すると保存値より優先し、設定自体は変更しません。ローカル registry はプロジェクトルートからの相対パスで保存します。`init` を使わず、従来どおり毎回 `--registry` を指定する方法も利用できます。

`init` は再実行でき、同じ内容は変更しません。競合があれば書き込み前に停止し、設定や CSS の変更は `--overwrite` で明示的に許可します。`--dry-run` では設定ファイルも作成しません。

`init --palette '<JSON>'` で任意の配色も保存できます。[テーマ画面](/theming)で配色を選び、Registry URLを確認すると初期化コマンドをコピーできます。パレット指定時は配置先の `theme.css` が標準スタイルのimportと配色の上書きをまとめるため、グローバルエントリーでは `styles/styles.css` の代わりに `theme.css` を1度だけ読み込みます。保存した色は以後の `add` でも維持します。

コンポーネント名は[コンポーネント一覧](/components)の小文字です（例: `alertdialog`、`dropdownmenu`、`nativeselect`）。[専用カタログ](/registry/v1/registry.json)でも確認できます。取得先は `--registry` または保存済み設定に限定し、別の registry への暗黙のフォールバックはありません。

## 依存関係を追加する [#dependencies]

CLI はソースを配置し、必要な依存パッケージのインストール用コマンドを表示します。package manager の実行や `package.json` の変更は行いません。表示されたコマンドを利用先で実行してください。現在の標準構成は次のとおりです。

```sh
pnpm add @base-ui/react@^1.9.0 lism-css@^1.1.0
```

React・React DOM とその型定義はアプリ側で用意します。ソースを取り込む場合、`@utakata-ui/react` はインストールしません。

## 配置先と読み込み [#location]

既定の配置先は `src/components/utakata/` です。`--dir` で変更でき、`--cwd` で利用先のプロジェクトルートを指定できます。配置先はプロジェクトルートの下に限定しています。

```sh
npx -y @utakata-ui/cli@0.1.0 add button --registry "$REGISTRY_URL" --cwd ./my-app --dir src/components/utakata
```

`@/` が `src/` に対応するアプリでは、次のように読み込みます。別の alias や相対パスを使う場合は、実際の配置先に合わせてください。

```tsx
import { Button } from '@/components/utakata/components/Button';
import '@/components/utakata/styles/styles.css';

export function SaveButton() {
  return <Button>保存</Button>;
}
```

CSS はグローバルエントリー（Next.js ならルート layout 等）で1度だけ読み込みます。[テーマカラー](/theming)から色も変更できます。

相対 import 先の補助コード、型情報・品質メタデータ、共通 CSS、ライセンスも同じツリー構造で配置します。`KbdGroup` は `kbd` に含まれます。Lism のレイアウト部品は `lism-css/react` から直接 import できます。

## 更新と既存ファイル [#updates]

同じ内容のファイルは変更せず、内容が異なる既存ファイルがある場合は追加処理を停止します。検証・競合の確認は書き込み前に行います。複数コンポーネントが同じ補助ファイルを使う場合も、一致を確認します。

`--dry-run` は書き込みを行わず予定を表示します。ローカルの編集と取得元の内容を比較して更新する場合だけ `--overwrite` を指定してください。上書きの対象を先に確認できます。

```sh
npx -y @utakata-ui/cli@0.1.0 add button --registry "$REGISTRY_URL" --overwrite --dry-run
```

コピーしたソースは npm パッケージの更新では更新されません。registry はそのビルド時点の UI バージョンを `packageVersion` に記録しています。再現可能な取得先が必要な場合は、同じビルド成果物をバージョン別の URL で保持してください。

ラベルの型制約、開発時の診断、Base UI のキーボード・フォーカス処理を編集後も維持し、[導入方法](/getting-started)のアクセシビリティ要件を確認します。独自スタイルや完成画面の適合は、利用側でも検証してください。

## 専用 registry の形式 [#format]

配布先は `/registry/v1/registry.json` と `/registry/v1/button.json` 等です。カタログは `kind: "utakata-ui/catalog"`、各コンポーネントは `kind: "utakata-ui/component"`、形式のバージョンは `schemaVersion: 1` です。

コンポーネントには `name`、`title`、`packageVersion`、依存パッケージ名とバージョンの `dependencies`、`path`・`content`・`sha256` を持つ `files` を含めます。パスは配置先からの相対パスです。外部の registry スキーマや配置 alias に依存しません。

CLI は形式・ファイルのハッシュ・パス・依存指定を検査します。ハッシュは内容の整合性を確認するもので、配布者の認証署名ではありません。リモートでは HTTPS、ローカル開発では localhost の HTTP またはディレクトリを利用できます。HTTP リダイレクトには追従しません。取得先には最終的な配信 URL を指定してください。

## ビルドと公開前の確認 [#build]

```sh
pnpm build:docs
node packages/cli/bin/utakata-ui.mjs list --registry packages/docs/.vercel/output/static/registry/v1
node packages/cli/bin/utakata-ui.mjs add button --registry packages/docs/.vercel/output/static/registry/v1 --cwd /path/to/my-app --dry-run
```

ビルドは React のソースから専用 JSON を生成し、`packages/docs/.vercel/output/static/registry/v1/` に配置します。Vercel のサーバー出力と一緒にデプロイすると、`/registry/v1/` から静的ファイルとして配信されます。追加の API サーバーは不要です。JSON の URL が HTML に書き換わらないことを確認してください。

`pnpm dev` は registry を生成しません。HTTP で試す場合はビルド後に `pnpm --filter @utakata-ui/docs preview` を使い、その URL の `/registry/v1` を指定します。

## CLI を npm で公開する [#publishing]

CLI は追加の実行時依存を持たない `packages/cli` パッケージです。コンポーネント本体は registry から取得するため、CLI を公開するために React パッケージを先に npm 公開する必要はありません。

```sh
pnpm check
pnpm --filter @utakata-ui/cli pack --pack-destination /tmp
node scripts/verify-cli-package.mjs /tmp/utakata-ui-cli-0.1.0.tgz
```

初回も GitHub Actions の `Release CLI` から公開できます。npm の `@utakata-ui` スコープの公開権限を確認し、対象スコープへの公開権限と Bypass 2FA を持つ Granular Access Token を GitHub の `npm` Environment の Secret `NPM_TOKEN` に設定します。

`Release CLI`（`.github/workflows/release-cli.yml`）で main を選び、`release_mode: verify`（既定）で検証後、`token` で実行して承認すると公開します。Trusted Publisher 設定後は `oidc`、または main に含まれるコミットへの `cli-vX.Y.Z` タグ push で公開します。タグと CLI の安定版バージョンは一致する必要があり、同じバージョンを手動とタグの両方で公開しないでください。設定詳細は [リポジトリの公開手順](https://github.com/UtakataKyosui/Utakata-UI/blob/main/.github/NPM-PUBLISHING.md) を参照してください。

npm Trusted Publisher は owner `UtakataKyosui`、repository `Utakata-UI`、workflow `release-cli.yml`、environment `npm` として設定します。GitHub の Environment にタグ制限がある場合は `cli-v*` を含めてください。実際の npm 公開・設定変更・docs のデプロイは、コード変更や PR の作成では実行されません。
