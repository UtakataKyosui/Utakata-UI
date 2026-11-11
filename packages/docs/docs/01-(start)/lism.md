---

title: Lism CSS を使う
description: Lism のレイアウト、レスポンシブ Props、Utakata-UI のスタイルを組み合わせる
---

## 導入 [#install]

```sh
pnpm add @utakata-ui/react lism-css
```

`lism-css/react` をアプリから直接 import する場合は、Lism CSS もアプリの直接依存に追加します。React と React DOM はアプリ側で用意してください。

```tsx
import '@utakata-ui/react/styles.css';
import { Box, Button, Card, Stack } from '@utakata-ui/react';

export function Actions() {
  return (
    <Box isContainer>
      <Card.Root p={{ base: '1rem', md: '2rem' }}>
        <Stack g="1rem">
          <Card.Title>プロフィール</Card.Title>
          <Button w={{ base: '100%', md: 'auto' }}>保存</Button>
        </Stack>
      </Card.Root>
    </Box>
  );
}
```

`styles.css` は Lism のベース、レイアウト、trait、utility、Props 用 CSS を含みます。`lism-css/main.css` を重複して読み込む必要はありません。アプリのエントリーで 1 度読み込んでください。Lism の reset より部品の既定スタイルを優先し、明示した Lism のレイアウトと utility は部品を調整できるレイヤー順にしています。

## 共通のスタイル Props [#props]

DOM を描画する部品とパーツは `p`、`g`、`w`、`fz`、`bgc`、`layout` などの Lism Props を受け取ります。レスポンシブ値は Lism と同じ `{ base, sm, md, lg, xl }` 形式です。追加の DOM ラッパーは生成せず、既存の要素にクラスと CSS カスタムプロパティを設定します。`ref` とイベントハンドラーは同じ要素を指します。

状態だけを管理する `Dialog.Root`・`Select.Root` など、Provider、Portal、Collection はスタイル対象の DOM を持ちません。`Dialog.Popup`・`Select.Trigger` など描画するパーツに指定してください。`size`、`variant`、ARIA、名前の必須条件など既存の部品 Props が優先します。Lism の `forwardedRef` や内部用 `primitiveClass` は受け取りません。

`LismProps`（上流の型）、`LismStyleProps`（部品用）、`WithLismProps<Props>` を `@utakata-ui/react` から型として import できます。レイアウトには再公開している `Box`・`Stack`・`Flex`・`Grid`・`Container`、文字には `Text`・`Heading` を使えます。

レスポンシブ値はビューポート幅ではなく、祖先の CSS コンテナー幅に反応します。上の例のように `Box isContainer` で囲みます。標準 CSS の `sm`・`md`・`lg` は 480・800・1120px です。`xl` は標準では無効で、Lism の CSS 設定を変更する場合に利用します。

独自の色・配置・大きさを指定した画面では、コントラスト、ターゲットサイズ、フォーカス、読み順、拡大時の折り返し、強制配色、動きを利用側でも検証してください。スタイル Props はアクセシビリティの要件を免除しません。

## ソースを取り込む場合 [#cli]

`@utakata-ui/cli init` は Base UI と Lism CSS を自動インストールします。`packageManager` フィールド、lockfile の順に package manager を判定し、判定できなければ npm を使います。`--package-manager pnpm` で指定できます。`--no-install` ではコマンドを表示するだけ、`--dry-run` ではファイルも依存も変更しません。コピーした CSS の import は利用側で追加します。[CLI の手順](/registry)を参照してください。
