import { AlertDialog, Button } from '@utakata-ui/react';
import { useState } from 'react';

export default function AlertDialogExample() {
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  return (
    <>
      <AlertDialog.Root open={open} onOpenChange={setOpen}>
        <AlertDialog.Trigger render={<Button variant="outline" />}>
          Delete file
        </AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop />
          <AlertDialog.Popup>
            <AlertDialog.Title>Delete this file?</AlertDialog.Title>
            <AlertDialog.Description>
              Deleted files cannot be restored.
            </AlertDialog.Description>
            <AlertDialog.Close render={<Button variant="outline" />}>
              Cancel
            </AlertDialog.Close>
            <Button
              onClick={() => {
                setDeleted(true);
                setOpen(false);
              }}
            >
              Delete
            </Button>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
      <p role="status">{deleted ? 'File deleted.' : ''}</p>
    </>
  );
}
