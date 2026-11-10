# Utakata-UI

Lism CSS と Base UI を基盤にした、React・TypeScript 向けの AI-Native UI フレームワークです。人間が使いやすく、AI が仕様を参照して正確に実装できる API を目指します。

## 目指すところ

**人と AI が共通の仕様をもとに UI を育てられ、必要なアクセシビリティが標準で組み込まれるフレームワーク。**

初回の実装だけでなく、生成されたコードを人が読み、修正し、継続して育てられることを重視します。次の原則を、今後の API・仕様・検証を設計する際の判断基準にします。

- **仕様・実装・検証を一緒に育てる:** 用途、API、構成例、必須の部品、アクセシビリティ上の要件を、人にも AI にも参照できる形にします。変更時は実装・公開仕様・関連するテストをセットで更新します。
- **標準的な使い方で必要な配慮が入る:** キーボード操作、フォーカス管理、ラベルと説明の関連付けをコンポーネントに組み込みます。必須の部品や設定の不足は、型・開発時の警告・テストなど、検出に適した方法で気づける設計を目指します。
- **プロダクトの個性を育てられる:** 一貫した余白・文字・色・サイズを土台に、デザイントークンとテーマで見た目を調整できる設計を目指します。調整後も操作性とコンポーネントの意味を保つことを重視します。
- **担保する範囲を明確にする:** フレームワークは部品の意味、操作、状態の関連付けを検証します。利用側が決めるラベルの文言、画面全体の見出し構造、テーマ変更後のコントラストなどは、利用側で確認できるよう要件と確認方法を示します。

まずは Button・Field・Dialog で、仕様と検証の形式を確立します。例えば Dialog では、Props に加えて、アクセシブルな名前を与える条件や、閉じたときに起点へフォーカスを戻す動作も仕様と検証の対象にします。この形式を、以後のコンポーネントに広げます。

現在の検証範囲と制約は「アクセシビリティの品質チェック」に記載します。型や開発時の警告による構成の不足検出などは、今後段階的に追加します。

## パッケージ

`packages` 配下を次のワークスペースに分けています。

| ディレクトリ     | パッケージ                    | 役割                                                   |
| ---------------- | ----------------------------- | ------------------------------------------------------ |
| `packages/docs`  | `@utakata-ui/docs`（private） | 一般公開用のドキュメントサイト                         |
| `packages/react` | `@utakata-ui/react`           | UI ライブラリ本体と公開 manifest（標準の導入方法）     |
| `packages/cli`   | `@utakata-ui/cli`             | ソース取得と配色の利用契約（コントラスト等）の検査 CLI |

docs は UI 本体をワークスペース依存として参照し、Blume の HTTP MCP でドキュメントを提供します。UI 本体は docs に依存しません。

`@utakata-ui/react` は Base UI のアクセシブルな振る舞いと、Lism CSS の Foundation プリミティブを組み合わせます。Button・Field・Dialog を起点に、表示・フォーム・ナビゲーション・開閉・オーバーレイ系のコンポーネント（Kbd・Separator・Badge・Card・Alert・Input・Checkbox・Select・Slider・Tabs・ToggleGroup・ButtonGroup・InputGroup・Tooltip・Popover・DropdownMenu・AlertDialog・Sheet・Toast など）を提供し、公開仕様は `componentManifest` と `packages/react/src/metadata/manifest.ts` にまとめています。`skills/utakata-ui/SKILL.md` は AI エージェント向けの実装ガイド、Blume の MCP は manifest から生成したドキュメントを検索・取得します。

導入は npm パッケージで行います。

```sh
pnpm add @utakata-ui/react
```

```tsx
import { Button, Dialog, Field } from '@utakata-ui/react';
import '@utakata-ui/react/styles.css';

function Example() {
  return (
    <>
      <Button variant="solid">保存</Button>
      <Field.Root>
        <Field.Label>メールアドレス</Field.Label>
        <Field.Control type="email" autoComplete="email" />
        <Field.Description>連絡先として使用します。</Field.Description>
      </Field.Root>
      <Dialog.Root>
        <Dialog.Trigger>詳細を開く</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup>
            <Dialog.Title>詳細</Dialog.Title>
            <Dialog.Description>内容を確認してください。</Dialog.Description>
            <Dialog.Close>閉じる</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
```

## 開発

### docsのUIプレビュー

Docs本体の文字組みは `packages/docs/theme.css` で設定します。[ICS MEDIAの解説](https://ics.media/entry/240411/)に沿って、長いURLの折り返しと日本語の厳格な禁則処理を適用します。

既存のBlumeアプリを `pnpm dev` で起動し、「UIプレビュー」ページで開発中のコンポーネントを操作できます。`packages/docs/examples/` の実例をBlumeのPreview / Codeタブで表示しています。英語ページは同じ名前の `packages/docs/examples/en/` の実例を表示するため、実例を追加・変更したときは両方を更新してください。Blumeは実例のiframeを常に `lang="en"` で出力するため、ビルド後に `scripts/set-example-lang.mjs` がパスに応じて `ja` と `en` に書き換えます（`pnpm dev` では書き換えません）。

プレビュー専用のCSSは `packages/docs/examples.css` から読み込み、Blumeの `examples.css` 設定でiframe内に隔離します。サンプルのTSXからグローバルCSSをimportするとドキュメント本体にも混入するため、CSSのimportはこの専用ファイルにまとめてください。利用側のアプリでは通常どおり `@utakata-ui/react/styles.css` を読み込みます。

`pnpm build:docs` でUI本体とdocsをビルドします。VercelのRoot Directoryは `packages/docs` のまま使用し、ビルドコマンドは同ディレクトリの `vercel.json` に定義しています。Blumeの `vercel()` アダプターが `.vercel/output/` にサーバーと静的アセットを生成します。Vercel側でOutput Directoryを上書きしている場合は解除してください。

### npm リリース（React）

`packages/react` を MIT ライセンスで公開します。ルート・docs はこのリリースの対象外です。
GitHub Actions の `Release React`（`.github/workflows/release.yml`）は手動実行の既定 `release_mode: verify` で検証と
パッケージ作成を行い、`token` / `oidc` を選ぶと検証後に公開します。また、`react-vX.Y.Z` タグへの push で同じ検証の後に npm へ公開します。
タグのバージョンは `packages/react/package.json` と一致する安定版に限り、コミットは
`main` に含まれている必要があります。手動実行は main を選択してください（他の ref はスキップします）。
公開するものと同じ tgz を一時的な外部プロジェクトに
インストールし、型・SSR・CSS・manifest を確認し、Vite の production build も実行します。
公開前には Quality と共通のブラウザー検証を light/dark 両テーマで実行します。

初回公開前に、次の設定を行ってください。

画面ごとの設定値、初回公開、Token が必要な場合の権限と GitHub Secrets の扱いは
[npm 公開の設定手順](.github/NPM-PUBLISHING.md) を参照してください。

1. npm で `@utakata-ui` スコープの所有・公開権限と名前の利用可否を確認します。
2. GitHub に `npm` Environment を作成し、承認者と検証用の `main`、公開用の `react-v*` タグの制限を設定します。
3. 初回は Granular Access Token（対象スコープへの公開権限と Bypass 2FA）を発行し、
   `npm` Environment の Secret `NPM_TOKEN` に保存します。
   Actions の `Release React` を main・`release_mode: verify` で確認後、`token` で実行して承認します。
4. npm のパッケージ設定に Trusted Publisher を登録します。
   GitHub owner は `UtakataKyosui`、repository は `Utakata-UI`、workflow filename は
   `release.yml`、environment は `npm` とし、`npm publish` の許可を有効にします。
   新しい設定は有効期限があるため、次の公開の直前に登録してください。

以後はバージョンを更新した変更を main にマージし、`verify` で確認後に `oidc` で公開します。
または、そのコミットに `react-vX.Y.Z` タグを付けて push します。
手動公開と同じバージョンのタグでは再公開しません。公開済みのバージョンは再利用できません。
通常は OIDC を使い、初回用 Token は GitHub Environment Secret で管理します。
認証情報をリポジトリに保存しません。
CI は npm 11.5.1 以降を確認し、公開リポジトリでは provenance も付与します。

公開前には実ブラウザーのキーボード・スクリーンリーダー・テーマ確認を別途記録してください。
詳細は [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/) を参照してください。

### MCP

エージェント向けの入口は、Blume がホストする HTTP MCP `/api/mcp` です。
接続方法は [MCP ガイド](packages/docs/docs/03-(agents)/mcp.md) を参照してください。
`search_docs` で探し、`get_page` でコンポーネントの Props・構成・アクセシビリティ上の注意点を取得します。
MCP 専用の npm パッケージや公開ワークフローは不要です。

### 専用 registry と CLI

標準の導入方法は npm パッケージ `@utakata-ui/react` です。コンポーネントの実装自体を
書き換える必要がある利用者向けに、補助手段として Base UI + Lism CSS のソースを専用 registry から配布します。
取り込んだソースは npm パッケージの更新を受け取りません。
`packages/cli` の `@utakata-ui/cli` は追加の実行時依存を持たず、Tailwind CSS や
shadcn CLI・`components.json` を使用しません。`init` で `utakata.json` と共有 CSS を用意し、
以後は `list`・`add` の registry・配置先指定を省略できます。`--dry-run` を提供し、
既存ファイルとの競合は明示的な `--overwrite` がなければ停止します。
依存パッケージのインストールコマンドは表示のみで、利用側で実行します。

`init --palette '<JSON>'` ではライト・ダークの配色も保存できます。ドキュメントのテーマ画面から配色を含むコマンドをコピーし、生成された `theme.css` をグローバルエントリーで読み込みます。

`pnpm build:docs` は `packages/docs/.vercel/output/static/registry/v1/` にカタログと各コンポーネントの
JSON を生成します。CLI の npm 公開と docs のデプロイの両方が必要です。
導入・ローカル確認・公開手順は [専用 registry ガイド](packages/docs/docs/04-(advanced)/registry.md) を参照してください。
`Release CLI`（`.github/workflows/release-cli.yml`）の手動実行は `verify`（既定）で検証のみ、`token` / `oidc` で公開、
`cli-vX.Y.Z` タグへの push は検証後に公開します。npm Trusted Publisher は
`release-cli.yml` 用に設定し、Environment のタグ制限にも `cli-v*` を含めてください。

### Claude Code / Codex

このリポジトリには共通の開発指針 `AGENTS.md` と、それを読み込む
`CLAUDE.md` を同梱しています。個人のグローバル設定を変更せず利用できます。

Skills の本体は `skills/` に置き、`.agents/skills/`（Codex）と
`.claude/skills/`（Claude Code）から相対シンボリックリンクで共有します。

| Skill             | 用途                                      | Claude Code          | Codex                |
| ----------------- | ----------------------------------------- | -------------------- | -------------------- |
| utakata-ui        | 公開コンポーネントを使った UI 実装        | `/utakata-ui`        | `$utakata-ui`        |
| utakata-component | コンポーネント・公開 API・manifest の開発 | `/utakata-component` | `$utakata-component` |
| utakata-verify    | 変更範囲に応じた検証・レビュー            | `/utakata-verify`    | `$utakata-verify`    |

Node と pnpm は `package.json` の指定バージョンを使用してください。
リポジトリを開き直して Skills を読み込み、Claude Code と Codex の `/hooks`
で設定内容を確認してください。Codex はプロジェクトと Hooks の信頼が必要です。
信頼の承認は利用者が行います。古いクライアントなど Hooks 非対応の環境でも、
共通ガイドと Skills、手動の検証コマンドを利用できます。

Hooks はセッション開始時に開発上の注意を伝え、編集・シェル操作後に
`git diff --check` を実行して追跡済みファイルの空白エラーを通知します。
自動修正・自動インストール・外部通信は行いません。未追跡ファイルやステージ済み
差分、型・テスト・アクセシビリティの検証は含まないため、Skill の手順に従って
別途確認してください。既存の Vite Plus pre-commit hook も継続利用します。

`pnpm test:agents` で共有リンク、両クライアントの Hook コマンド（サブディレクトリ
からの実行を含む）、空白エラー検出と非破壊性を確認できます。CI と `pnpm check`
にも組み込んでいます。個人設定は `.claude/settings.local.json` などの
Git 管理外ファイルに置いてください。

設定形式の参照元: [Claude Skills](https://code.claude.com/docs/en/skills)、
[Claude Hooks](https://code.claude.com/docs/en/hooks)、
[OpenAI Skills](https://learn.chatgpt.com/docs/build-skills)、
[OpenAI Hooks](https://learn.chatgpt.com/docs/hooks)。

開発には Node.js 24.16.0 以降の 24.x、または 26.3.0 以降と、pnpm 10.18.3 を使用します。Markuplint の optional Astro parser を含む開発依存の要件に合わせ、ルートの `package.json` の `engines.node` を定義しています。これはリポジトリ開発ツールの要件です。

```sh
pnpm install
pnpm test
pnpm build
pnpm typecheck
pnpm lint
pnpm check
```

### ドキュメントサイト

ドキュメントサイトには [Blume](https://useblume.dev/docs/quickstart) を使用します。`packages/docs/docs` の Markdown と `blume.config.ts` で内容と設定を管理します。既定の言語は日本語で、英語版は `packages/docs/docs/en/` に同じ構成で置きます。手書きのページを変更したときは、両方の言語を更新してください。

`docs/components/` と `docs/en/components/` のコンポーネントページ（`preview.mdx` を除く）は、`scripts/generate-reference.mjs` が UI 本体の公開 manifest から起動・ビルド時に生成するため、直接編集しません。ページ内の Props の表や品質要件のカードは、`site/` にある Utakata UI のコンポーネントで静的に描画します。

manifest は英語で書かれています（MCP と共有する公開仕様のため）。日本語版の文言は `packages/docs/i18n/ja/` の辞書から取得します。キーは英語の原文の SHA-256 の先頭12文字です。manifest の文言を変更すると、生成スクリプトと `pnpm --filter @utakata-ui/docs test:reference` が未翻訳と古いキーを報告して失敗します。報告されたキーで辞書を更新し、古いキーを削除してください。コード片はバッククォートで囲みます。

`pnpm dev` で開発サーバーを起動します。`pnpm build:docs` は UI 本体を先にビルドし、Vercel向けのサーバー出力を `packages/docs/.vercel/output/` に生成します。実例の言語補正とregistry生成も、その中の `static/` を対象に実行します。Vercelサーバービルドは `blume preview` に対応しないため、ローカル確認には `pnpm dev` を使ってください。

各ページの `.md` / `.mdx` と `llms.txt` を配信し、`Accept: text/markdown` にも応答します。カスタムコンポーネントのMarkdown変換は `site/markdown.ts` に定義しています。ドキュメントを検索・取得するHTTP MCPは `/api/mcp` で公開し、接続方法は解説ページ `/mcp` にまとめています。公開URLはVercelの環境から自動検出され、Connect to MCPメニューに使用されます。

レート制限は `memory({ requests: 30, window: 600 })` を明示しています。対象はBlumeのアシスタント、APIプレイグラウンドのプロキシ、Mixedbread検索で、MCPやMarkdown配信には適用されません。現在これらの有料ルートは使用していません。Vercelではインスタンスごとにカウントされるため、全インスタンスを通じた厳密な制限が必要になった場合は `blume/ratelimit` の `upstash()` などと共有ストアの環境変数を設定してください。

`pnpm build` は各パッケージを依存順にビルドします。UI 本体のみは `pnpm --filter @utakata-ui/react build`、MCP を含む docs は `pnpm build:docs` を使用します。

### コミット前のチェック

Vite+ のコミットフックを使用します。`pnpm install` の `prepare` でフックを設定し、コミット時に `vp staged` から `pnpm check` を一度実行します。ステージした内容に対して lint・型検査・全テスト（a11y を含む）・ビルド・Fallow を実行し、失敗すればコミットを止めます。部分的にステージしたファイルの未ステージ部分は、`vp staged` が一時退避して検証後に戻します。自動修正は行いません。

Fallow は CI と同じ 3.38.1 を使い、`origin/main` との差分を検査します。初回と main 更新後には `git fetch origin main` で比較元を更新してください。手動での確認は `pnpm check`、フックの状態確認は `pnpm exec vp hooks status`、既存 clone への設定は `pnpm run prepare` です。生成される `.vite-hooks/_` と `.fallow` キャッシュはコミットしません。

### アクセシビリティの品質チェック

`packages/react/src/metadata/quality.ts` に、ルール ID・要件・検証方法（`automated` / `manual`）・重大度（`error` / `warning`）・修正方法を定義しています。コンポーネント固有のルールは manifest の各コンポーネントの `qualityRules`、共通ルールは `sharedQualityRules` から参照できます。これらはライブラリの検証用メタデータです。公開ドキュメントでは使い方・Props・アクセシビリティ上の注意点を案内します。

`pnpm test:a11y` は登録された自動ルールを検証します。Button の名前と無効化、Field のラベル・説明の関連付け、Dialog の名前・説明と Escape による閉鎖・フォーカス復帰をはじめ、各コンポーネントの metadata に登録した自動ルールを対象とします。必須の自動ルールが失敗、または検証処理が未登録なら CI が失敗します。ルール ID の重複や、存在しないルールに対する検証処理もエラーです。失敗時のレポートにはルール ID・要件・修正方法を含めます。コンポーネント追加・変更時は、ルールと `accessibility.test.tsx` の検証処理を一緒に更新してください。

公開 API の `evaluateQuality(rules, checks)` は各ルールを `passed` / `failed` / `unverified` で返します。`automatedPassed` は必須の自動検証がすべて成功したこと、`complete` は手動項目を含めて全ルールが成功したことを表します。警告の失敗は自動検証の合格を妨げません。手動項目は常に `unverified` として残し、CI の成功をアクセシビリティ全体の合格とは扱いません。現段階では手動確認結果の記録・承認機能はなく、リリース時に実行環境と確認結果を別途記録してください。

`pnpm test:a11y` で Button の各 variant、Field のラベル・説明、開いた Dialog の portal を axe-core で検査します。違反があればテストが失敗し、違反ルールと対象要素が表示されます。検査自体が動作していることも、名前のないボタンを検出するテストで確認します。

GitHub Actions の `Quality / accessibility` は main 向け PR・main への push・手動実行時に lint、型検査、a11y テスト、全テスト、ビルドを実行します。作業ブランチへの push とタグでは起動しません。マージを必ずブロックするには、リポジトリの branch protection でこのチェックを必須に設定してください。必須チェックを欠落させないため、Quality にはパスフィルターを設定しません。

PR は merge-base からの全差分に必要なゲートを選択し、main・手動実行は全ゲートを実行します。単体テスト、配布検証、Docs、light/dark のブラウザー検証を分割し、依存とブラウザーのダウンロードをキャッシュします。必要なジョブの skip・失敗・キャンセルは集約ゲートを失敗させます。ブラウザーの証拠台帳と手動の未検証一覧も成果物へ保存します。実行方針と保証範囲は [.github/CI.md](.github/CI.md) を参照してください。

コンポーネント追加・変更時は `packages/react/src/tests/accessibility.test.tsx` に代表的な状態を追加してください。jsdom ではレイアウトを評価できないため、色コントラスト検査のみ無効化しています。リリース前には実ブラウザーでコントラスト、Tab / Shift+Tab の順序、フォーカス表示、Dialog のフォーカス移動・閉じ込め・Escape・復帰、スクリーンリーダーでの読み上げを手動確認してください。自動検査の成功は WCAG 適合全体を保証しません。

## 設計方針

- **Foundation:** Lism CSS の Box、Stack、Flex、Grid、Container、Text、Heading と CSS カスタムプロパティを利用します。
- **Behavior:** 操作を伴うコンポーネントのフォーカス・キーボード・ARIA 挙動は Base UI に委ねます。
- **Composition:** Field と Dialog は Base UI の compound parts を公開し、意味のある HTML と柔軟な合成を優先します。
- **AI Interface:** manifest は機械可読な公開仕様で、Agent Skill と、manifest から生成したドキュメントを検索・取得する Blume MCP の `search_docs`、`get_page` ツールから参照できます。`llms.txt` は入口を示します。
- **Quality:** Vitest、Testing Library、axe-core で代表コンポーネントを検証します。自動検査は手動のアクセシビリティ確認に代わるものではありません。

## 初期スコープとトレードオフ

Base UI を包むコンポーネント群と Lism CSS の基礎プリミティブを提供します。色・サイズは CSS カスタムプロパティで上書きでき、実行時 CSS-in-JS は使いません。Manifest は公開 API の初期契約であり、Props や構成を追加するときは実装・テストと同時に更新します。Storybook、Playwright、ビジュアル回帰、SSR の専用検証は、基礎 API の利用結果を踏まえて段階的に追加します。

### CI の静的解析と Action ロック

Biome は CI で `pnpm exec biome ci .` を実行します。fallow は PR で `audit` を実行し、ベースブランチとの比較で新たな問題を検出します。Action と CLI はともに 3.38.1 に固定しています。PR コメントの投稿は行いません。

Action の依存は `.github/workflows/actions.lock` に記録します。workflow の `uses:` を変更したら `gh actions-lock` で更新し、workflow とロックファイルを一緒にコミットしてください。`gh actions-lock --verify` でオンライン検証、`--verify-local` で参照の網羅性をオフライン検証できます。CI では `.github/workflows/**` を変更する main 向け PR・main への push と、週次・手動実行時にオンライン検証します。同じ ref の古い実行はキャンセルします。

`verify-lockfile` は変更パスによって起動しないため、必須チェックには設定しないでください。
パスフィルターで起動しなかった必須チェックは Pending に残ります（[GitHub の説明](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks)）。
