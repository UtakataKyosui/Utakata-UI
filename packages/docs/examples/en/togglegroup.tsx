import { Stack, Text, ToggleGroup } from '@utakata-ui/react';
import { useState } from 'react';

export default function ToggleGroupExample() {
  const [view, setView] = useState<string[]>(['list']);
  return (
    <Stack style={{ gap: '1rem' }}>
      <ToggleGroup.Root
        multiple
        aria-label="Formatting"
        defaultValue={['bold']}
        orientation="horizontal"
      >
        <ToggleGroup.Item value="bold" variant="outline">
          Bold
        </ToggleGroup.Item>
        <ToggleGroup.Item value="italic" variant="outline">
          Italic
        </ToggleGroup.Item>
        <ToggleGroup.Item value="underline" variant="outline" disabled>
          Underline (disabled)
        </ToggleGroup.Item>
      </ToggleGroup.Root>
      <ToggleGroup.Root
        aria-label="View"
        value={view}
        onValueChange={setView}
        orientation="vertical"
      >
        <ToggleGroup.Item value="list">List</ToggleGroup.Item>
        <ToggleGroup.Item value="grid">Grid</ToggleGroup.Item>
      </ToggleGroup.Root>
      <Text>
        View: {view[0] === 'grid' ? 'Grid' : view[0] ? 'List' : 'None'}
      </Text>
    </Stack>
  );
}
