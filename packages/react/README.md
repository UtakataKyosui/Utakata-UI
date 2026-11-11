# @utakata-ui/react

Base UI と Lism CSS を基盤にした React コンポーネントライブラリです。
React / React DOM 18.3.1 以降を必要とします。

```sh
pnpm add @utakata-ui/react lism-css
```

```tsx
import { Button } from '@utakata-ui/react';
import '@utakata-ui/react/styles.css';

export function Example() {
  return (
    <Button variant="solid" w={{ base: '100%', md: 'auto' }}>
      保存
    </Button>
  );
}
```

CSS の `@import` を解決できる Vite 等のバンドラーを使用してください。
`styles.css` は Lism CSS 全体を含みます。アプリのエントリーで 1 度だけ import してください。
DOM を描画する部品・パーツは `p`・`g`・`w`・`fz`・`bgc`・`layout` などの Lism Props とレスポンシブ値を受け取ります。
既存の variant・size・ARIA・必須名の制約を維持します。状態管理だけの Root・Provider・Portal・Collection は対象外です。
`LismProps`・`LismStyleProps`・`WithLismProps` を型として再公開します。独自のスタイルは利用側でもアクセシビリティを再検証してください。
TypeScript は `moduleResolution: "Bundler"` を使用してください。
依存する Lism CSS の型定義は NodeNext の拡張子要件に対応していません。
公開仕様は `@utakata-ui/react/manifest` から参照できます。
詳細は [リポジトリ](https://github.com/UtakataKyosui/Utakata-UI) を参照してください。

## License

MIT — 同梱の LICENSE を参照してください。

## 配布型の検証環境

公開アーカイブの正例・負例（必須情報、禁止組み合わせ、spread、ラッパー）、
SSR、CSS/manifest import、ViteビルドをTypeScript 5.9.3で検証する。
対象はReact/React DOM 18.3.1 + @types/react 18.3.31 / @types/react-dom 18.3.7と、
React/React DOM 19.3.1 + 型定義19.3.0。peer範囲のすべてのバージョンを検証した意味ではない。
利用側でもstrictを有効にして`tsc --noEmit`を実行する。
動的文字列、JSX合成、独自CSS、anyなどによる型検査の迂回は別途検証する。
