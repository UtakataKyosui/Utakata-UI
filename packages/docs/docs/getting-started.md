---

title: 導入方法
description: Utakata-UI を React アプリケーションで使う
---

React 18.3.1 以降を使用します。現在は開発段階のため、このリポジトリのワークスペース内で利用できます。

Utakata UI は、Base UI を基盤とし、内部で Lism CSS を使用するコンポーネントを、Agent Coding で組み合わせて UI を構築することを前提としています。エージェントには[コンポーネント仕様](./components)と [MCP](./mcp)を参照させ、公開 API とアクセシビリティ要件に沿って実装を進めてください。

```tsx
import { Button, Dialog, Field } from '@utakata-ui/react';
import '@utakata-ui/react/styles.css';

export function Example() {
  return <Button variant="solid">保存</Button>;
}
```

Button・Field・Dialog と、Box・Stack・Flex・Grid・Container・Text・Heading を公開しています。

対応する Props・構成例・品質要件は[コンポーネント仕様](./components)を参照してください。

## アクセシビリティを保つ使い方

通常のテキスト付きボタンは追加の ARIA 属性なしで名前を持ちます。アイコン専用の場合は `iconOnly` と `aria-label` または `aria-labelledby` を指定します。名前の指定を省略すると TypeScript エラーになります。

```tsx
<Button>保存</Button>
<Button iconOnly aria-label="閉じる">
  <span aria-hidden="true">×</span>
</Button>
```

Field は `Field.Label`、Dialog は `Dialog.Title` を組み合わせます。説明は必要な場合に追加します。Button・Field.Control・Dialog.Popup は、開発時に名前の取得元の欠落や `aria-labelledby` / `aria-describedby` の参照切れを `[Utakata-UI a11y]` 警告で通知します。動的なラベル変更も再確認し、同じ警告の連発を抑えます。警告は画面を停止しません。

診断は一般的な名前の取得元を確認する補助機能であり、完全な Accessible Name 計算ではありません。複雑な参照関係、CSS 生成コンテンツや支援技術の実際の読み上げは axe と実機で確認してください。文字列型は空白の名前や文言の適切さを保証しません。`iconOnly` を省略したアイコンだけの内容も型では判別できないため、DOM 検査が必要です。

本番ビルドでは `process.env.NODE_ENV` を `production` に置換してください（React と同じビルド前提）。本番では監視・警告を実行しません。SSR では DOM を参照しません。標準テーマを独自 CSS で変更した場合もコントラスト・フォーカス・拡大表示を再検証してください。
