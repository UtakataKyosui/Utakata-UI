import { Stack, Text, ToggleGroup } from '@utakata-ui/react';
import { useState } from 'react';

export default function ToggleGroupExample() {
  const [view, setView] = useState<string[]>(['list']);
  return (
    <Stack style={{ gap: '1rem' }}>
      <ToggleGroup.Root
        multiple
        aria-label="書式"
        defaultValue={['bold']}
        orientation="horizontal"
      >
        <ToggleGroup.Item value="bold" variant="outline">
          太字
        </ToggleGroup.Item>
        <ToggleGroup.Item value="italic" variant="outline">
          斜体
        </ToggleGroup.Item>
        <ToggleGroup.Item value="underline" variant="outline" disabled>
          下線（無効）
        </ToggleGroup.Item>
      </ToggleGroup.Root>
      <ToggleGroup.Root
        aria-label="表示形式"
        value={view}
        onValueChange={setView}
        orientation="vertical"
      >
        <ToggleGroup.Item value="list">リスト</ToggleGroup.Item>
        <ToggleGroup.Item value="grid">グリッド</ToggleGroup.Item>
      </ToggleGroup.Root>
      <Text>
        表示形式：
        {view[0] === 'grid' ? 'グリッド' : view[0] ? 'リスト' : '未選択'}
      </Text>
    </Stack>
  );
}
