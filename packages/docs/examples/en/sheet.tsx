import { Button, Sheet } from '@utakata-ui/react';

const sides = ['top', 'right', 'bottom', 'left'] as const;

export default function SheetExample() {
  return (
    <>
      {sides.map((side) => (
        <Sheet.Root key={side}>
          <Sheet.Trigger render={<Button variant="outline" />}>
            Open from the {side}
          </Sheet.Trigger>
          <Sheet.Portal>
            <Sheet.Backdrop />
            <Sheet.Popup side={side}>
              <Sheet.Title>Filters</Sheet.Title>
              <Sheet.Description>
                Choose the conditions shown in the list. Long content scrolls
                inside the panel.
              </Sheet.Description>
              <Sheet.Close render={<Button variant="outline" />}>
                Close
              </Sheet.Close>
            </Sheet.Popup>
          </Sheet.Portal>
        </Sheet.Root>
      ))}
    </>
  );
}
