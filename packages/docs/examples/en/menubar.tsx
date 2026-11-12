import { Menubar } from '@utakata-ui/react';

export default function MenubarExample() {
  return (
    <Menubar.Root aria-label="Application">
      <Menubar.Menu>
        <Menubar.Trigger>File</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Positioner sideOffset={4}>
            <Menubar.Popup>
              <Menubar.Item>New</Menubar.Item>
              <Menubar.Item disabled>Print (no printer available)</Menubar.Item>
              <Menubar.Separator />
              <Menubar.SubmenuRoot>
                <Menubar.SubmenuTrigger>Share</Menubar.SubmenuTrigger>
                <Menubar.Portal>
                  <Menubar.Positioner>
                    <Menubar.Popup>
                      <Menubar.Item>Email</Menubar.Item>
                      <Menubar.Item>Copy link</Menubar.Item>
                    </Menubar.Popup>
                  </Menubar.Positioner>
                </Menubar.Portal>
              </Menubar.SubmenuRoot>
            </Menubar.Popup>
          </Menubar.Positioner>
        </Menubar.Portal>
      </Menubar.Menu>
      <Menubar.Menu>
        <Menubar.Trigger>Edit</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Positioner sideOffset={4}>
            <Menubar.Popup>
              <Menubar.Group>
                <Menubar.GroupLabel>History</Menubar.GroupLabel>
                <Menubar.Item>Undo</Menubar.Item>
                <Menubar.Item>Redo</Menubar.Item>
              </Menubar.Group>
            </Menubar.Popup>
          </Menubar.Positioner>
        </Menubar.Portal>
      </Menubar.Menu>
    </Menubar.Root>
  );
}
