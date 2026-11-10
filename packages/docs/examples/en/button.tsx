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
      <p role="status">Clicks: {count}</p>
      <Flex g="0.75rem" fxw="wrap" ai="center">
        {componentManifest.components.Button.sizes.map((size) => (
          <Button key={size} size={size} variant="outline">
            Size {size}
          </Button>
        ))}
        <Button disabled>Disabled button</Button>
      </Flex>
      <Flex g="0.75rem" fxw="wrap" ai="center">
        <Button variant="secondary">Supporting action</Button>
        <Button variant="destructive">Delete account</Button>
        <Button variant="link">Show details</Button>
        <a href="https://utakata-ui.dev/">Go to the docs (link)</a>
        <Button iconOnly square aria-label="Add">
          +
        </Button>
        <Button
          iconOnly
          square
          size="lg"
          variant="outline"
          aria-label="Settings"
        >
          *
        </Button>
      </Flex>
    </Stack>
  );
}
