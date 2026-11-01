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

`packages` 配下を次の3つのワークスペースに分けています。

| ディレクトリ     | パッケージ                    | 役割                             |
| ---------------- | ----------------------------- | -------------------------------- |
| `packages/docs`  | `@utakata-ui/docs`（private） | 一般公開用のドキュメントサイト   |
| `packages/react` | `@utakata-ui/react`           | UI ライブラリ本体と公開 manifest |
| `packages/mcp`   | `@utakata-ui/mcp`             | manifest を参照する MCP サーバー |

docs と MCP は UI 本体をワークスペース依存として参照します。UI 本体は docs・MCP に依存しません。

`@utakata-ui/react` は Base UI のアクセシブルな振る舞いと、Lism CSS の Foundation プリミティブを組み合わせます。初期コンポーネントとして Button、Field、Dialog を提供し、公開仕様は `componentManifest` と `packages/react/src/metadata/manifest.ts` にまとめています。`skills/utakata-ui/SKILL.md` は AI エージェント向けの実装ガイド、`packages/mcp` は manifest の検索・参照用 MCP サーバーです。

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

既存のBlumeアプリを `pnpm dev` で起動し、「UIプレビュー」ページで開発中のButton・Field・Dialogを操作できます。`packages/docs/examples/` の実例をBlumeのPreview / Codeタブで表示しています。

プレビュー専用のCSSは `packages/docs/examples.css` から読み込み、Blumeの `examples.css` 設定でiframe内に隔離します。サンプルのTSXからグローバルCSSをimportするとドキュメント本体にも混入するため、CSSのimportはこの専用ファイルにまとめてください。利用側のアプリでは通常どおり `@utakata-ui/react/styles.css` を読み込みます。

`pnpm build:docs` でUI本体とdocsをビルドします。VercelのRoot Directoryは `packages/docs` のまま使用し、ビルドコマンドと出力先は同ディレクトリの `vercel.json` に定義しています。

### npm リリース（React）

`packages/react` を MIT ライセンスで公開します。ルート・docs・MCP はこのリリースの対象外です。
GitHub Actions の `Release React`（`.github/workflows/release.yml`）は手動実行で検証と
パッケージ作成を行い、`react-vX.Y.Z` タグへの push で同じ検証の後に npm へ公開します。
タグのバージョンは `packages/react/package.json` と一致する安定版に限り、コミットは
`main` に含まれている必要があります。手動実行は main を選択してください（他の ref はスキップします）。
公開するものと同じ tgz を一時的な外部プロジェクトに
インストールし、型・SSR・CSS の解決・manifest を確認します。

初回公開前に、次の設定を行ってください。

1. npm で `@utakata-ui` スコープの所有・公開権限と名前の利用可否を確認します。
2. GitHub に `npm` Environment を作成し、必要に応じて承認者と `react-v*` タグの制限を設定します。
3. 初回はローカルで `pnpm check`、`pnpm --filter @utakata-ui/react build` を実行し、
   `npm pack ./packages/react --pack-destination /tmp` の内容を確認します。
   `node scripts/verify-react-package.mjs /tmp/utakata-ui-react-0.1.0.tgz` で利用側を検証できます。
   `npm login` とアカウントの 2FA を使って、確認した tgz を `npm publish <tgzのパス> --access public` で公開します。
4. npm のパッケージ設定に Trusted Publisher を登録します。
   GitHub owner は `UtakataKyosui`、repository は `Utakata-UI`、workflow filename は
   `release.yml`、environment は `npm` とし、`npm publish` の許可を有効にします。
   新しい設定は有効期限があるため、次の公開の直前に登録してください。

以後はバージョンを更新した変更を main にマージし、手動の `Release React` で検証してから、
そのコミットに `react-vX.Y.Z` タグを付けて push します。公開済みのバージョンは再利用できません。
初回のローカル公開と同じバージョンのタグでは再公開せず、CI の初回公開には次のバージョンを使用します。
認証には OIDC を使い、npm トークンや `.npmrc` の認証情報をリポジトリに保存しません。
CI は npm 11.5.1 以降を確認し、公開リポジトリでは provenance も付与します。

公開前には実ブラウザーのキーボード・スクリーンリーダー・テーマ確認を別途記録してください。
詳細は [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/) を参照してください。

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

開発には Node.js 24.15.0 以降の 24.x、または 26.0.0 以降と、pnpm 10.18.3 を使用します。Markuplint 5 が Node.js 24 以上を必要とするため、ルートの `package.json` の `engines.node` も合わせています。これはリポジトリ開発ツールの要件です。

```sh
pnpm install
pnpm test
pnpm build
pnpm typecheck
pnpm lint
pnpm check
```

### ドキュメントサイト

ドキュメントサイトには [Blume](https://useblume.dev/docs/quickstart) を使用します。`packages/docs/docs` の Markdown と `blume.config.ts` で内容と設定を管理します。コンポーネント一覧の `components.md` と、実例・仕様を載せた `components/*.mdx` の個別ページは UI 本体の公開 manifest から起動・ビルド時に生成するため、直接編集しません。

`pnpm dev` で開発サーバーを起動します。`pnpm build:docs` は UI 本体を先にビルドし、検索インデックスを含む公開用の静的ファイルを `packages/docs/dist` に生成します。このディレクトリを静的ホスティングに配置できます。ローカルで成果物を確認する場合は `pnpm --filter @utakata-ui/docs preview` を実行します。

`pnpm build` は3パッケージを依存順にビルドします。個別のビルドには `pnpm --filter @utakata-ui/react build`、MCP とその依存には `pnpm --filter @utakata-ui/mcp... build` を使用します。

### コミット前のチェック

Vite+ のコミットフックを使用します。`pnpm install` の `prepare` でフックを設定し、コミット時に `vp staged` から `pnpm check` を一度実行します。ステージした内容に対して lint・型検査・全テスト（a11y を含む）・ビルド・Fallow を実行し、失敗すればコミットを止めます。部分的にステージしたファイルの未ステージ部分は、`vp staged` が一時退避して検証後に戻します。自動修正は行いません。

Fallow は CI と同じ 3.38.1 を使い、`origin/main` との差分を検査します。初回と main 更新後には `git fetch origin main` で比較元を更新してください。手動での確認は `pnpm check`、フックの状態確認は `pnpm exec vp hooks status`、既存 clone への設定は `pnpm run prepare` です。生成される `.vite-hooks/_` と `.fallow` キャッシュはコミットしません。

### アクセシビリティの品質チェック

`packages/react/src/metadata/quality.ts` に、ルール ID・要件・検証方法（`automated` / `manual`）・重大度（`error` / `warning`）・修正方法を定義しています。コンポーネント固有のルールは manifest の各コンポーネントの `qualityRules`、共通ルールは `sharedQualityRules` から参照できます。MCP のコンポーネント取得・検索結果には、共通ルールも含めて返します。

`pnpm test:a11y` は登録された自動ルールを検証します。Button の名前と無効化、Field のラベル・説明の関連付け、Dialog の名前・説明と Escape による閉鎖・フォーカス復帰を対象とします。必須の自動ルールが失敗、または検証処理が未登録なら CI が失敗します。ルール ID の重複や、存在しないルールに対する検証処理もエラーです。失敗時のレポートにはルール ID・要件・修正方法を含めます。コンポーネント追加・変更時は、ルールと `accessibility.test.tsx` の検証処理を一緒に更新してください。

公開 API の `evaluateQuality(rules, checks)` は各ルールを `passed` / `failed` / `unverified` で返します。`automatedPassed` は必須の自動検証がすべて成功したこと、`complete` は手動項目を含めて全ルールが成功したことを表します。警告の失敗は自動検証の合格を妨げません。手動項目は常に `unverified` として残し、CI の成功をアクセシビリティ全体の合格とは扱いません。現段階では手動確認結果の記録・承認機能はなく、リリース時に実行環境と確認結果を別途記録してください。

`pnpm test:a11y` で Button の各 variant、Field のラベル・説明、開いた Dialog の portal を axe-core で検査します。違反があればテストが失敗し、違反ルールと対象要素が表示されます。検査自体が動作していることも、名前のないボタンを検出するテストで確認します。

GitHub Actions の `Quality / accessibility` は main 向け PR・main への push・手動実行時に lint、型検査、a11y テスト、全テスト、ビルドを実行します。作業ブランチへの push とタグでは起動しません。マージを必ずブロックするには、リポジトリの branch protection でこのチェックを必須に設定してください。必須チェックを欠落させないため、Quality にはパスフィルターを設定しません。

コンポーネント追加・変更時は `packages/react/src/tests/accessibility.test.tsx` に代表的な状態を追加してください。jsdom ではレイアウトを評価できないため、色コントラスト検査のみ無効化しています。リリース前には実ブラウザーでコントラスト、Tab / Shift+Tab の順序、フォーカス表示、Dialog のフォーカス移動・閉じ込め・Escape・復帰、スクリーンリーダーでの読み上げを手動確認してください。自動検査の成功は WCAG 適合全体を保証しません。

MCP サーバーはビルド後に stdio transport で起動できます。

```sh
pnpm build
node packages/mcp/dist/server.js
```

## 設計方針

- **Foundation:** Lism CSS の Box、Stack、Flex、Grid、Container、Text、Heading と CSS カスタムプロパティを利用します。
- **Behavior:** Button、Field、Dialog のフォーカス・キーボード・ARIA 挙動は Base UI に委ねます。
- **Composition:** Field と Dialog は Base UI の compound parts を公開し、意味のある HTML と柔軟な合成を優先します。
- **AI Interface:** manifest は機械可読な公開仕様で、Agent Skill と MCP の `list_components`、`get_component`、`search_components` ツールから参照できます。`llms.txt` は入口を示します。
- **Quality:** Vitest、Testing Library、axe-core で代表コンポーネントを検証します。自動検査は手動のアクセシビリティ確認に代わるものではありません。

## 初期スコープとトレードオフ

最初のリリースでは Button、Field、Dialog と Lism CSS の基礎プリミティブに集中します。色・サイズは CSS カスタムプロパティで上書きでき、実行時 CSS-in-JS は使いません。Manifest は公開 API の初期契約であり、Props や構成を追加するときは実装・テストと同時に更新します。残るコンポーネント群、Storybook、Playwright、ビジュアル回帰、SSR の専用検証は、基礎 API の利用結果を踏まえて段階的に追加します。

### CI の静的解析と Action ロック

Biome は CI で `pnpm exec biome ci .` を実行します。fallow は PR で `audit` を実行し、ベースブランチとの比較で新たな問題を検出します。Action と CLI はともに 3.38.1 に固定しています。PR コメントの投稿は行いません。

Action の依存は `.github/workflows/actions.lock` に記録します。workflow の `uses:` を変更したら `gh actions-lock` で更新し、workflow とロックファイルを一緒にコミットしてください。`gh actions-lock --verify` でオンライン検証、`--verify-local` で参照の網羅性をオフライン検証できます。CI では `.github/workflows/**` を変更する main 向け PR・main への push と、週次・手動実行時にオンライン検証します。同じ ref の古い実行はキャンセルします。

`verify-lockfile` は変更パスによって起動しないため、必須チェックには設定しないでください。
パスフィルターで起動しなかった必須チェックは Pending に残ります（[GitHub の説明](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks)）。
