import { Select, Stack } from '@utakata-ui/react';

const themes = [
  { value: 'system', label: 'Match system setting' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'contrast', label: 'High contrast (coming soon)', disabled: true },
];

export default function SelectExample() {
  return (
    <Stack style={{ gap: '0.5rem', maxWidth: '20rem' }}>
      <Select.Root name="theme" defaultValue="system" items={themes}>
        <Select.Label>Theme</Select.Label>
        <Select.Trigger>
          <Select.Value placeholder="Choose a theme" />
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
