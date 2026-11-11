import { Combobox, Field, Stack } from '@utakata-ui/react';

const fruits = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'grape', label: 'Grape (out of stock)', disabled: true },
];

export default function ComboboxExample() {
  return (
    <Stack style={{ gap: '0.5rem', maxWidth: '20rem' }}>
      <Field.Root>
        <Field.Label>Fruit</Field.Label>
        <Combobox.Root name="fruit" items={fruits}>
          <Combobox.InputGroup>
            <Combobox.Input placeholder="Search fruit" />
            <Combobox.Clear aria-label="Clear selection" />
            <Combobox.Trigger aria-label="Show options" />
          </Combobox.InputGroup>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.Empty>No fruit found</Combobox.Empty>
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
          Type to filter, then choose with the arrow keys and Enter.
        </Field.Description>
      </Field.Root>
    </Stack>
  );
}
