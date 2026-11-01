# @utakata-ui/react

Base UI と Lism CSS を基盤にした React コンポーネントライブラリです。
React / React DOM 18.3.1 以降を必要とします。

```sh
pnpm add @utakata-ui/react
```

```tsx
import { Button } from '@utakata-ui/react';
import '@utakata-ui/react/styles.css';

export function Example() {
  return <Button variant="solid">保存</Button>;
}
```

CSS の `@import` を解決できる Vite 等のバンドラーを使用してください。
TypeScript は `moduleResolution: "Bundler"` を使用してください。
依存する Lism CSS の型定義は NodeNext の拡張子要件に対応していません。
公開仕様は `@utakata-ui/react/manifest` から参照できます。
詳細は [リポジトリ](https://github.com/UtakataKyosui/Utakata-UI) を参照してください。

## License

MIT — 同梱の LICENSE を参照してください。
