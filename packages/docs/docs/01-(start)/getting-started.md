---

title: 導入方法
description: Utakata-UI を React アプリケーションに導入し、最初のコンポーネントを表示するまでの手順
---

## 必要な環境 [#requirements]

| 項目             | 要件                                           |
| ---------------- | ---------------------------------------------- |
| React・React DOM | 18.3.1 以降                                    |
| バンドラー       | CSS の `@import` を解決できるもの（Vite など） |
| TypeScript       | `moduleResolution: "Bundler"`                  |

## 1. パッケージを追加する [#install]

```sh
pnpm add @utakata-ui/react
```

npm なら `npm install @utakata-ui/react`、yarn なら `yarn add @utakata-ui/react` です。Base UI と Lism CSS は依存関係として一緒に入ります。

## 2. スタイルを 1 度だけ読み込む [#styles]

アプリのエントリー（Vite なら `src/main.tsx`、Next.js ならルートの `layout.tsx`）で、スタイルを 1 度だけ読み込みます。コンポーネントごとに読み込む必要はありません。

```tsx
import '@utakata-ui/react/styles.css';
```

色を変える場合は、このあとに CSS 変数を上書きします。手順は[テーマカラー](/theming)を参照してください。

## 3. コンポーネントを使う [#use]

コンポーネントは `@utakata-ui/react` から名前付きで読み込みます。

```tsx
import { Button, Field, Input } from '@utakata-ui/react';

export function ProfileForm() {
  return (
    <form>
      <Field.Root>
        <Field.Label>表示名</Field.Label>
        <Input name="displayName" autoComplete="nickname" />
      </Field.Root>
      <Button type="submit">保存</Button>
    </form>
  );
}
```

各コンポーネントが受け取る Props、パーツの組み合わせ方、インポートする名前は[コンポーネント一覧](/components)の各ページに記載しています。

## 4. エージェントに仕様を渡す [#agents]

Utakata UI は、AI エージェントとともに UI を構築する Agent Coding を前提としています。エージェントには [MCP](/mcp) で公開 API とアクセシビリティ要件を参照させ、コンポーネント仕様に沿って実装を進めてください。

## 公開しているコンポーネント [#exports]

UI コンポーネントは用途別に[コンポーネント一覧](/components)にまとめています。レイアウト用に Lism CSS の `Box`・`Stack`・`Flex`・`Grid`・`Container`・`Text`・`Heading` も `@utakata-ui/react` から読み込めます。

## アクセシビリティを保つ使い方 [#accessibility]

通常のテキスト付きボタンは追加の ARIA 属性なしで名前を持ちます。アイコンだけのボタンは `iconOnly` と `aria-label` または `aria-labelledby` を指定します。名前の指定を省略すると TypeScript のエラーになります。

```tsx
<Button>保存</Button>
<Button iconOnly aria-label="閉じる">
  <span aria-hidden="true">×</span>
</Button>
```

Field は `Field.Label`、Dialog は `Dialog.Title` を組み合わせます。説明は必要な場合に追加します。Button・Field.Control・Dialog.Popup をはじめ、名前が必要な操作要素（フォーム部品・トリガー・ポップアップなど）は、開発時に名前の取得元の欠落や `aria-labelledby` / `aria-describedby` の参照切れを `[Utakata-UI a11y]` 警告で通知します。動的なラベル変更も再確認し、同じ警告の連発を抑えます。警告は画面を停止しません。

診断は一般的な名前の取得元を確認する補助機能であり、完全な Accessible Name 計算ではありません。複雑な参照関係、CSS 生成コンテンツや支援技術の実際の読み上げは axe と実機で確認してください。文字列型は空白の名前や文言の適切さを保証しません。`iconOnly` を省略したアイコンだけの内容も型では判別できないため、DOM 検査が必要です。

本番ビルドでは `process.env.NODE_ENV` を `production` に置換してください（React と同じビルド前提）。本番では監視・警告を実行しません。SSR では DOM を参照しません。標準テーマを独自 CSS で変更した場合もコントラスト・フォーカス・拡大表示を再検証してください。

## ソースを取り込んで改変する場合 [#source]

コンポーネントの実装自体を書き換える必要がある場合に限り、[CLI でソースを取り込む](/registry)こともできます。取り込んだソースは npm パッケージの更新を受け取らず、型制約・開発時の診断・アクセシビリティの修正も自動では反映されません。通常は npm パッケージを使用してください。
