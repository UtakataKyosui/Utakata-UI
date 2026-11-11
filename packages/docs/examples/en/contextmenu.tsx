import { Button, ContextMenu } from '@utakata-ui/react';

/**
 * Opens with right click, long press, or the ContextMenu key / Shift+F10 on a focused element.
 * Always provide a visible alternative such as a DropdownMenu so touch and keyboard users reach the same actions.
 */
export default function ContextMenuExample() {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <Button variant="outline">File (right click for actions)</Button>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner>
          <ContextMenu.Popup aria-label="File actions">
            <ContextMenu.Group>
              <ContextMenu.GroupLabel>Document</ContextMenu.GroupLabel>
              <ContextMenu.Item>Edit</ContextMenu.Item>
              <ContextMenu.Item>Duplicate</ContextMenu.Item>
            </ContextMenu.Group>
            <ContextMenu.Separator />
            <ContextMenu.Item disabled>Delete (no permission)</ContextMenu.Item>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
