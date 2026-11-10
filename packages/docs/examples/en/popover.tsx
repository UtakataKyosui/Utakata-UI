import { Button, Field, Popover, Stack } from '@utakata-ui/react';

export default function PopoverExample() {
  return (
    <Popover.Root>
      <Popover.Trigger render={<Button variant="outline" />}>
        Display settings
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup>
            <Stack style={{ gap: '0.75rem' }}>
              <Popover.Title>Display settings</Popover.Title>
              <Popover.Description>Adjust the text size.</Popover.Description>
              <Field.Root>
                <Field.Label>Text size (px)</Field.Label>
                <Field.Control type="number" defaultValue={16} />
              </Field.Root>
              <Popover.Close render={<Button />}>Close</Popover.Close>
            </Stack>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
