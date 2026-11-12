import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { ReactElement } from 'react';
import { expect } from 'vitest';
import type { QualityCheck } from '../metadata/quality.js';
import { audit } from './audit.js';

type SideDialogOptions = {
  /** Rule id prefix, for example `drawer`. */
  prefix: string;
  /** Id suffix of the check that covers Escape, Close and focus return. */
  dismissalId: string;
  popupClass: string;
  sides: readonly string[];
  defaultSide: string;
  /** Renders the "Open filters" dialog on the given side (default when undefined). */
  renderDialog: (side: string | undefined) => ReactElement;
};

async function openDialog(
  renderDialog: SideDialogOptions['renderDialog'],
  side?: string,
) {
  render(renderDialog(side));
  const trigger = screen.getByRole('button', { name: 'Open filters' });
  trigger.focus();
  fireEvent.click(trigger);
  const dialog = await screen.findByRole('dialog', { name: 'Filters' });
  await waitFor(() =>
    expect(dialog).toContainElement(document.activeElement as HTMLElement),
  );
  return { trigger, dialog };
}

async function expectClosedWithFocusOn(trigger: HTMLElement) {
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  await waitFor(() => expect(trigger).toHaveFocus());
}

/** Shared checks for edge-attached modal dialogs such as Sheet and Drawer. */
export function sideDialogChecks(
  options: SideDialogOptions,
): Record<string, QualityCheck> {
  const { prefix, dismissalId, popupClass, sides, defaultSide, renderDialog } =
    options;
  return {
    [`${prefix}.semantics`]: async () => {
      for (const side of [undefined, ...sides]) {
        const { dialog } = await openDialog(renderDialog, side);
        const expected = side ?? defaultSide;
        expect(dialog).toHaveAccessibleDescription(
          'Narrow the list of results.',
        );
        expect(dialog).toHaveAttribute('data-side', expected);
        expect(dialog).toHaveClass(popupClass, `${popupClass}--${expected}`);
        expect((await audit(document.body)).violations).toEqual([]);
        cleanup();
      }
    },
    [`${prefix}.${dismissalId}`]: async () => {
      for (const side of sides) {
        const escaped = await openDialog(renderDialog, side);
        fireEvent.keyDown(document.activeElement ?? document.body, {
          key: 'Escape',
        });
        await expectClosedWithFocusOn(escaped.trigger);
        cleanup();
        const closed = await openDialog(renderDialog, side);
        fireEvent.click(screen.getByRole('button', { name: 'Close filters' }));
        await expectClosedWithFocusOn(closed.trigger);
        cleanup();
      }
    },
  };
}
