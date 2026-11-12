import { Button, Drawer } from '@utakata-ui/react';

const sides = ['bottom', 'top', 'right', 'left'] as const;

export default function DrawerExample() {
  return (
    <>
      {sides.map((side) => (
        <Drawer.Root key={side} side={side}>
          <Drawer.Trigger render={<Button variant="outline" />}>
            Open from the {side}
          </Drawer.Trigger>
          <Drawer.Portal>
            <Drawer.Backdrop />
            <Drawer.Popup>
              <Drawer.Title>Filters</Drawer.Title>
              <Drawer.Description>
                Choose the conditions shown in the list. Swipe toward the edge,
                or use the close button or Escape, to dismiss.
              </Drawer.Description>
              <Drawer.Close render={<Button variant="outline" />}>
                Close
              </Drawer.Close>
            </Drawer.Popup>
          </Drawer.Portal>
        </Drawer.Root>
      ))}
    </>
  );
}
