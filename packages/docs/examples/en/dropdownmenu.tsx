import { Button, DropdownMenu } from '@utakata-ui/react';

export default function DropdownMenuExample() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger render={<Button variant="outline" />}>
        Actions
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner sideOffset={4}>
          <DropdownMenu.Popup>
            <DropdownMenu.Group>
              <DropdownMenu.GroupLabel>Document</DropdownMenu.GroupLabel>
              <DropdownMenu.Item>Edit</DropdownMenu.Item>
              <DropdownMenu.Item>Duplicate</DropdownMenu.Item>
            </DropdownMenu.Group>
            <DropdownMenu.Separator />
            <DropdownMenu.Item disabled>
              Delete (no permission)
            </DropdownMenu.Item>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
