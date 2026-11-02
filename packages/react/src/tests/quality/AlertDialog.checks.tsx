import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { expect } from 'vitest';
import { AlertDialog } from '../../components/AlertDialog.js';
import { Button } from '../../components/Button.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

function DeleteConfirmation({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <p>Outside content</p>
      <AlertDialog.Root open={open} onOpenChange={setOpen}>
        <AlertDialog.Trigger render={<Button />}>Delete</AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop />
          <AlertDialog.Popup>
            <AlertDialog.Title>Delete file?</AlertDialog.Title>
            <AlertDialog.Description>
              This cannot be undone.
            </AlertDialog.Description>
            <AlertDialog.Close render={<Button variant="outline" />}>
              Cancel
            </AlertDialog.Close>
            <Button
              onClick={() => {
                onDelete();
                setOpen(false);
              }}
            >
              Delete permanently
            </Button>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}

async function openConfirmation(onDelete = () => {}) {
  render(<DeleteConfirmation onDelete={onDelete} />);
  const trigger = screen.getByRole('button', { name: 'Delete' });
  trigger.focus();
  fireEvent.click(trigger);
  const dialog = await screen.findByRole('alertdialog', {
    name: 'Delete file?',
  });
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus(),
  );
  return { trigger, dialog };
}

async function expectClosedWithFocusOn(trigger: HTMLElement) {
  await waitFor(() =>
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
  );
  await waitFor(() => expect(trigger).toHaveFocus());
}

export const alertDialogChecks: Record<string, QualityCheck> = {
  'alert-dialog.semantics': async () => {
    const { dialog } = await openConfirmation();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(dialog).toHaveAccessibleDescription('This cannot be undone.');
    expect((await audit(document.body)).violations).toEqual([]);
  },
  'alert-dialog.confirm-controlled': async () => {
    let deletions = 0;
    const { trigger } = await openConfirmation(() => deletions++);
    fireEvent.click(screen.getByRole('button', { name: 'Delete permanently' }));
    expect(deletions).toBe(1);
    await expectClosedWithFocusOn(trigger);
  },
};
