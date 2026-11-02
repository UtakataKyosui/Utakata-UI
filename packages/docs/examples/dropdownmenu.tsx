import { Button, DropdownMenu } from '@utakata-ui/react';

export default function DropdownMenuExample() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger render={<Button variant="outline" />}>
        操作
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner sideOffset={4}>
          <DropdownMenu.Popup>
            <DropdownMenu.Group>
              <DropdownMenu.GroupLabel>文書</DropdownMenu.GroupLabel>
              <DropdownMenu.Item>編集</DropdownMenu.Item>
              <DropdownMenu.Item>複製</DropdownMenu.Item>
            </DropdownMenu.Group>
            <DropdownMenu.Separator />
            <DropdownMenu.Item disabled>
              削除（権限がありません）
            </DropdownMenu.Item>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
