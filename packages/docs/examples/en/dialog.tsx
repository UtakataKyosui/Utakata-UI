import { Button, Dialog } from '@utakata-ui/react';

export default function DialogExample() {
  return (
    <Dialog.Root>
      <Dialog.Trigger render={<Button />}>Open dialog</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup>
          <Dialog.Title>Welcome to Utakata-UI</Dialog.Title>
          <Dialog.Description>
            This is the Dialog component under development. Close it with the
            Escape key, by clicking the backdrop or with the close button.
          </Dialog.Description>
          <Dialog.Close render={<Button variant="outline" />}>
            Close
          </Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
