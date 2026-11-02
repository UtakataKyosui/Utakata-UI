import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { type ComponentProps, createRef, useRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AlertDialog } from '../components/AlertDialog.js';
import { Button } from '../components/Button.js';
import { alertDialogQualityRules } from '../metadata/components/AlertDialog.js';
import { alertDialogChecks } from './quality/AlertDialog.checks.js';
import { expectAutomatedQuality, settle } from './quality-helpers.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Checked by pnpm typecheck: alert dialogs cannot opt into outside dismissal
// or non-modal behavior.
type RootProps = ComponentProps<typeof AlertDialog.Root>;
const validRoot: RootProps = { defaultOpen: true };
// @ts-expect-error Outside-press dismissal is not configurable on AlertDialog.
const dismissible: RootProps = { disablePointerDismissal: false };
// @ts-expect-error AlertDialog is always modal.
const nonModal: RootProps = { modal: false };
const popupClass: ComponentProps<typeof AlertDialog.Popup> = {
  // @ts-expect-error className must be a string, not a state function.
  className: () => 'x',
};
void [validRoot, dismissible, nonModal, popupClass];

function AsyncDelete({ work }: { work: Promise<void> }) {
  const [open, setOpen] = useState(true);
  const [pending, setPending] = useState(false);
  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Portal>
        <AlertDialog.Popup>
          <AlertDialog.Title>Delete project?</AlertDialog.Title>
          <AlertDialog.Description>Files are removed.</AlertDialog.Description>
          <AlertDialog.Close render={<Button variant="outline" />}>
            Cancel
          </AlertDialog.Close>
          <Button
            disabled={pending}
            onClick={async () => {
              setPending(true);
              await work;
              setOpen(false);
            }}
          >
            Delete
          </Button>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

function StayFixture() {
  const keep = useRef<HTMLButtonElement>(null);
  return (
    <AlertDialog.Root defaultOpen>
      <AlertDialog.Portal>
        <AlertDialog.Popup initialFocus={keep}>
          <AlertDialog.Title>Leave page?</AlertDialog.Title>
          <Button>Leave</Button>
          <AlertDialog.Close ref={keep}>Stay</AlertDialog.Close>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

describe('AlertDialog', () => {
  it('forwards refs and merges classes with the shared dialog styles', async () => {
    const popup = createRef<HTMLDivElement>();
    const title = createRef<HTMLHeadingElement>();
    render(
      <AlertDialog.Root defaultOpen>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className="shade" />
          <AlertDialog.Popup ref={popup} className="custom">
            <AlertDialog.Title ref={title} className="heading">
              Discard draft?
            </AlertDialog.Title>
            <AlertDialog.Description>Changes are lost.</AlertDialog.Description>
            <AlertDialog.Close>Keep editing</AlertDialog.Close>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>,
    );
    const dialog = await screen.findByRole('alertdialog', {
      name: 'Discard draft?',
    });
    expect(popup.current).toBe(dialog);
    expect(dialog).toHaveClass(
      'ui-dialog__popup',
      'ui-alert-dialog__popup',
      'custom',
    );
    expect(title.current).toHaveClass('ui-dialog__title', 'heading');
    expect(document.querySelector('.ui-dialog__backdrop')).toHaveClass('shade');
  });

  it('honours initialFocus for the least destructive action', async () => {
    render(<StayFixture />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Stay' })).toHaveFocus(),
    );
  });

  it('stays open until controlled asynchronous work finishes', async () => {
    let finish = () => {};
    const work = new Promise<void>((resolve) => {
      finish = resolve;
    });
    render(<AsyncDelete work={work} />);
    const confirm = await screen.findByRole('button', { name: 'Delete' });
    fireEvent.click(confirm);
    await settle();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(confirm).toBeDisabled();
    await act(async () => finish());
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
  });

  it('passes every automated quality rule', async () => {
    await expectAutomatedQuality(alertDialogQualityRules, alertDialogChecks);
  });

  it('warns in development when the popup has no name source', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <AlertDialog.Root defaultOpen>
        <AlertDialog.Portal>
          <AlertDialog.Popup>
            <AlertDialog.Close>Cancel</AlertDialog.Close>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>,
    );
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          '[Utakata-UI a11y] AlertDialog.Popup: No accessible name source',
        ),
      ),
    );
  });

  it('does not warn for a titled popup', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <AlertDialog.Root defaultOpen>
        <AlertDialog.Portal>
          <AlertDialog.Popup>
            <AlertDialog.Title>Delete file?</AlertDialog.Title>
            <AlertDialog.Close>Cancel</AlertDialog.Close>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>,
    );
    await screen.findByRole('alertdialog', { name: 'Delete file?' });
    await settle();
    expect(warn).not.toHaveBeenCalled();
  });
});
