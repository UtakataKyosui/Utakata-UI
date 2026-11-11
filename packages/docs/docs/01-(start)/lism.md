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

`LismProps`（上流の型）、`LismStyleProps`（部品用）、`WithLismProps<Props>` を `@utakata-ui/react` から型として import できます。レイアウトには再公開している `Box`・`Stack`・`Flex`・`Frame`・`Grid`・`Container`、文字には `Text`・`Heading` を使えます。

レスポンシブ値はビューポート幅ではなく、祖先の CSS コンテナー幅に反応します。上の例のように `Box isContainer` で囲みます。標準 CSS の `sm`・`md`・`lg` は 480・800・1120px です。`xl` は標準では無効で、Lism の CSS 設定を変更する場合に利用します。

独自の色・配置・大きさを指定した画面では、コントラスト、ターゲットサイズ、フォーカス、読み順、拡大時の折り返し、強制配色、動きを利用側でも検証してください。スタイル Props はアクセシビリティの要件を免除しません。

## 縦横比 [#aspect-ratio]

Utakata-UI に `AspectRatio` 部品はありません。`Frame`（`layout="frame"`）に Lism の `ar` Props（CSS の `aspect-ratio`）を指定すれば shadcn/ui と同じ用途を満たせるため、ラッパーを足すと DOM と API が重複します。再公開した `Frame`（`Box` と同じ Lism の薄いプリミティブ）を合成してください。公開 API の変更は `Frame` の再 export だけで、新しい依存や manifest の項目は追加しません。

```tsx
import { Box, Frame } from '@utakata-ui/react';

export function Cover() {
  return (
    <Box isContainer>
      <Frame ar="16/9" w="100%">
        <img src="/cover.jpg" alt="四半期売上のグラフ" />
      </Box>
    </Box>
  );
}
```

- 最終的な API: `Frame` と `ar`（`"16/9"`、`"4/3"`、`"1/1"`、`{ base: '1/1', md: '16/9' }` など）。既定の比率はなく、`ar` を省略すると内容に合わせた大きさになります。レスポンシブ値は前述のとおり祖先コンテナーに反応します。
- 動作（Chromium で検証）: メディアの読み込み前から比率分の領域を確保し、幅の変更（320px のコンテナーを含む）や画像の元の比率が異なる場合も比率を保ち、あふれた内容は伸ばさず切り取ります。直下の `img`・`video`・`iframe` は `object-fit: cover` で枠を埋めます。
- 対象外: 静的なレイアウトです。読み込み、遅延読み込み、焦点位置での切り抜き、失敗時の代替表示、操作部品は提供しません。枠にはメディアだけを入れてください。文字は切り取られるため、文字には `Card` や通常のフローを使います。
- 利用側の責任: 代替テキスト（装飾のときだけ `alt=""`）、`iframe` の `title`、動画の字幕・書き起こし・見える操作部品、重要な情報を切り取らないこと（`object-fit: cover` は切り取ります）。ほかの比率、`aspect-ratio` や `overflow` を上書きする独自 CSS、拡大表示はアプリ側で確認してください。型は比率の文字列を検証しません。Lism の `ar` は任意の値を受け取り、不正な値は CSS が無視します。動的な文字列や独自 CSS は型検査の対象外です。

## ソースを取り込む場合 [#cli]

`@utakata-ui/cli init` は Base UI と Lism CSS を自動インストールします。`packageManager` フィールド、lockfile の順に package manager を判定し、判定できなければ npm を使います。`--package-manager pnpm` で指定できます。`--no-install` ではコマンドを表示するだけ、`--dry-run` ではファイルも依存も変更しません。コピーした CSS の import は利用側で追加します。[CLI の手順](/registry)を参照してください。
