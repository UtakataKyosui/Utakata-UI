import { Combobox, Field, Stack } from '@utakata-ui/react';

const fruits = [
  { value: 'apple', label: 'りんご' },
  { value: 'banana', label: 'バナナ' },
  { value: 'cherry', label: 'さくらんぼ' },
  { value: 'grape', label: 'ぶどう（入荷待ち）', disabled: true },
];

export default function ComboboxExample() {
  return (
    <Stack style={{ gap: '0.5rem', maxWidth: '20rem' }}>
      <Field.Root>
        <Field.Label>果物</Field.Label>
        <Combobox.Root name="fruit" items={fruits}>
          <Combobox.InputGroup>
            <Combobox.Input placeholder="果物を検索" />
            <Combobox.Clear aria-label="選択を解除" />
            <Combobox.Trigger aria-label="候補を表示" />
          </Combobox.InputGroup>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.Empty>該当する果物がありません</Combobox.Empty>
                <Combobox.List>
                  {(fruit: (typeof fruits)[number]) => (
                    <Combobox.Item
                      key={fruit.value}
                      value={fruit}
                      disabled={fruit.disabled}
                    >
                      {fruit.label}
                      <Combobox.ItemIndicator />
                    </Combobox.Item>
                  )}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
        <Field.Description>
          入力して絞り込み、矢印キーとEnterで選びます。
        </Field.Description>
      </Field.Root>
    </Stack>
  );
}
