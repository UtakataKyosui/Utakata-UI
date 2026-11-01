import { Button, componentManifest, Flex, Stack } from '@utakata-ui/react';
import { useState } from 'react';

export default function ButtonExample() {
  const [count, setCount] = useState(0);
  return (
    <Stack style={{ gap: '1.5rem' }}>
      <Flex style={{ gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
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
      <Flex style={{ gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {componentManifest.components.Button.sizes.map((size) => (
          <Button key={size} size={size} variant="outline">
            サイズ {size}
          </Button>
        ))}
        <Button disabled>無効なボタン</Button>
      </Flex>
    </Stack>
  );
}
