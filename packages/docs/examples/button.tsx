import { Button, componentManifest, Flex, Stack } from '@utakata-ui/react';
import { useState } from 'react';

export default function ButtonExample() {
  const [count, setCount] = useState(0);
  return (
    <Stack g="1.5rem">
      <Flex g="0.75rem" fxw="wrap" ai="center">
        {componentManifest.components.Button.variants.map((variant) => (
          <Button
            key={variant}
            variant={variant}
            onClick={() => setCount((value) => value + 1)}
          >
            {variant}
          </Button>
        ))}
      </Flex>
      <p role="status">クリック回数: {count}</p>
      <Flex g="0.75rem" fxw="wrap" ai="center">
        {componentManifest.components.Button.sizes.map((size) => (
          <Button key={size} size={size} variant="outline">
            サイズ {size}
          </Button>
        ))}
        <Button disabled>無効なボタン</Button>
      </Flex>
      <Flex g="0.75rem" fxw="wrap" ai="center">
        <Button variant="secondary" px="1.5rem">
          補助操作
        </Button>
        <Button variant="destructive">アカウントを削除</Button>
        <Button variant="link">詳細を表示</Button>
        <a href="https://utakata-ui.dev/">ドキュメントへ移動（リンク）</a>
        <Button iconOnly square aria-label="追加">
          +
        </Button>
        <Button iconOnly square size="lg" variant="outline" aria-label="設定">
          *
        </Button>
      </Flex>
    </Stack>
  );
}
