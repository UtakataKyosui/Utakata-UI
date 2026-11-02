import { Button, Field, Popover, Stack } from '@utakata-ui/react';

export default function PopoverExample() {
  return (
    <Popover.Root>
      <Popover.Trigger render={<Button variant="outline" />}>
        表示設定
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup>
            <Stack style={{ gap: '0.75rem' }}>
              <Popover.Title>表示設定</Popover.Title>
              <Popover.Description>
                文字の大きさを調整します。
              </Popover.Description>
              <Field.Root>
                <Field.Label>文字サイズ（px）</Field.Label>
                <Field.Control type="number" defaultValue={16} />
              </Field.Root>
              <Popover.Close render={<Button />}>閉じる</Popover.Close>
            </Stack>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
