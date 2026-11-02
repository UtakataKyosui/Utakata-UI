import { Select, Stack } from '@utakata-ui/react';

const themes = [
  { value: 'system', label: 'システム設定に合わせる' },
  { value: 'light', label: 'ライト' },
  { value: 'dark', label: 'ダーク' },
  { value: 'contrast', label: '高コントラスト（準備中）', disabled: true },
];

export default function SelectExample() {
  return (
    <Stack style={{ gap: '0.5rem', maxWidth: '20rem' }}>
      <Select.Root name="theme" defaultValue="system" items={themes}>
        <Select.Label>テーマ</Select.Label>
        <Select.Trigger>
          <Select.Value placeholder="テーマを選択" />
          <Select.Icon />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.List>
                {themes.map((theme) => (
                  <Select.Item
                    key={theme.value}
                    value={theme.value}
                    disabled={theme.disabled}
                  >
                    <Select.ItemText>{theme.label}</Select.ItemText>
                    <Select.ItemIndicator>✓</Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </Stack>
  );
}
