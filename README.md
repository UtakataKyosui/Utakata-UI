# Utakata-UI

Lism CSS と Base UI を基盤にした、React・TypeScript 向けの AI-Native UI フレームワークです。人間が使いやすく、AI が仕様を参照して正確に実装できる API を目指します。

## パッケージ

`@utakata-ui/react` は Base UI のアクセシブルな振る舞いと、Lism CSS の Foundation プリミティブを組み合わせます。初期コンポーネントとして Button、Field、Dialog を提供し、公開仕様は `componentManifest` と `packages/react/src/manifest.ts` にまとめています。

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

Node.js 20 以降と pnpm を使用します。

```sh
pnpm install
pnpm test
pnpm build
pnpm typecheck
pnpm lint
```

## 設計方針

- **Foundation:** Lism CSS の Box、Stack、Flex、Grid、Container、Text、Heading と CSS カスタムプロパティを利用します。
- **Behavior:** Button、Field、Dialog のフォーカス・キーボード・ARIA 挙動は Base UI に委ねます。
- **Composition:** Field と Dialog は Base UI の compound parts を公開し、意味のある HTML と柔軟な合成を優先します。
- **AI Interface:** manifest は Props、既定値、制約、構成方法、アクセシビリティ契約を記述する機械可読な公開仕様です。
- **Quality:** Vitest、Testing Library、axe-core で代表コンポーネントを検証します。自動検査は手動のアクセシビリティ確認に代わるものではありません。

## 初期スコープとトレードオフ

最初のリリースでは Button、Field、Dialog と Lism CSS の基礎プリミティブに集中します。色・サイズは CSS カスタムプロパティで上書きでき、実行時 CSS-in-JS は使いません。Manifest は公開 API の初期契約であり、Props や構成を追加するときは実装・テストと同時に更新します。残るコンポーネント群、Storybook、Playwright、ビジュアル回帰、SSR の専用検証は、基礎 API の利用結果を踏まえて段階的に追加します。
