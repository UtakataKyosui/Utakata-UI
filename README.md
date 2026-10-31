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

`@utakata-ui/react` は Base UI のアクセシブルな振る舞いと、Lism CSS の Foundation プリミティブを組み合わせます。初期コンポーネントとして Button、Field、Dialog を提供し、公開仕様は `componentManifest` と `packages/react/src/manifest.ts` にまとめています。`skills/utakata-ui/SKILL.md` は AI エージェント向けの実装ガイド、`packages/mcp` は manifest の検索・参照用 MCP サーバーです。

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

Node.js 22.22.2 以降の 22.x、24.15.0 以降の 24.x、または 26.0.0 以降と、pnpm 10.18.3 を使用します。テスト依存関係の要件に合わせ、対応バージョンをルートの `package.json` の `engines.node` に定義しています。

```sh
pnpm install
pnpm test
pnpm build
pnpm typecheck
pnpm lint
```

### アクセシビリティの品質チェック

`packages/react/src/quality.ts` に、ルール ID・要件・検証方法（`automated` / `manual`）・重大度（`error` / `warning`）・修正方法を定義しています。コンポーネント固有のルールは manifest の各コンポーネントの `qualityRules`、共通ルールは `sharedQualityRules` から参照できます。MCP のコンポーネント取得・検索結果には、共通ルールも含めて返します。

`pnpm test:a11y` は登録された自動ルールを検証します。Button の名前と無効化、Field のラベル・説明の関連付け、Dialog の名前・説明と Escape による閉鎖・フォーカス復帰を対象とします。必須の自動ルールが失敗、または検証処理が未登録なら CI が失敗します。ルール ID の重複や、存在しないルールに対する検証処理もエラーです。失敗時のレポートにはルール ID・要件・修正方法を含めます。コンポーネント追加・変更時は、ルールと `accessibility.test.tsx` の検証処理を一緒に更新してください。

公開 API の `evaluateQuality(rules, checks)` は各ルールを `passed` / `failed` / `unverified` で返します。`automatedPassed` は必須の自動検証がすべて成功したこと、`complete` は手動項目を含めて全ルールが成功したことを表します。警告の失敗は自動検証の合格を妨げません。手動項目は常に `unverified` として残し、CI の成功をアクセシビリティ全体の合格とは扱いません。現段階では手動確認結果の記録・承認機能はなく、リリース時に実行環境と確認結果を別途記録してください。

`pnpm test:a11y` で Button の各 variant、Field のラベル・説明、開いた Dialog の portal を axe-core で検査します。違反があればテストが失敗し、違反ルールと対象要素が表示されます。検査自体が動作していることも、名前のないボタンを検出するテストで確認します。

GitHub Actions の `Quality / accessibility` は push・PR 時に lint、型検査、a11y テスト、全テスト、ビルドを実行します。マージを必ずブロックするには、リポジトリの branch protection でこのチェックを必須に設定してください。

コンポーネント追加・変更時は `packages/react/src/accessibility.test.tsx` に代表的な状態を追加してください。jsdom ではレイアウトを評価できないため、色コントラスト検査のみ無効化しています。リリース前には実ブラウザーでコントラスト、Tab / Shift+Tab の順序、フォーカス表示、Dialog のフォーカス移動・閉じ込め・Escape・復帰、スクリーンリーダーでの読み上げを手動確認してください。自動検査の成功は WCAG 適合全体を保証しません。

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

Action の依存は `.github/workflows/actions.lock` に記録します。workflow の `uses:` を変更したら `gh actions-lock` で更新し、workflow とロックファイルを一緒にコミットしてください。`gh actions-lock --verify` でオンライン検証、`--verify-local` で参照の網羅性をオフライン検証できます。CI では PR・main への push・週次にオンライン検証します。
