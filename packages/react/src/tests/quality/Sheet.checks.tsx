import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { expect } from 'vitest';
import { Button } from '../../components/Button.js';
import { Sheet } from '../../components/Sheet.js';
import {
  type SheetSide,
  sheetManifest,
} from '../../metadata/components/Sheet.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

function FilterSheet({ side }: { side: SheetSide | undefined }) {
  return (
    <>
      <p>Outside content</p>
      <Sheet.Root>
        <Sheet.Trigger render={<Button />}>Open filters</Sheet.Trigger>
        <Sheet.Portal>
          <Sheet.Backdrop />
          <Sheet.Popup {...(side ? { side } : {})}>
            <Sheet.Title>Filters</Sheet.Title>
            <Sheet.Description>Narrow the list of results.</Sheet.Description>
            <Sheet.Close render={<Button variant="outline" />}>
              Close filters
            </Sheet.Close>
          </Sheet.Popup>
        </Sheet.Portal>
      </Sheet.Root>
    </>
  );
}

async function openSheet(side?: SheetSide) {
  render(<FilterSheet side={side} />);
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

export const sheetChecks: Record<string, QualityCheck> = {
  'sheet.semantics': async () => {
    for (const side of [undefined, ...sheetManifest.sides]) {
      const { dialog } = await openSheet(side);
      const expected = side ?? sheetManifest.props.side.default;
      expect(dialog).toHaveAccessibleDescription('Narrow the list of results.');
      expect(dialog).toHaveAttribute('data-side', expected);
      expect(dialog).toHaveClass(
        'ui-sheet__popup',
        `ui-sheet__popup--${expected}`,
      );
      expect((await audit(document.body)).violations).toEqual([]);
      cleanup();
    }
  },
  'sheet.escape-focus-return': async () => {
    for (const side of sheetManifest.sides) {
      const escaped = await openSheet(side);
      fireEvent.keyDown(document.activeElement ?? document.body, {
        key: 'Escape',
      });
      await expectClosedWithFocusOn(escaped.trigger);
      cleanup();
      const closed = await openSheet(side);
      fireEvent.click(screen.getByRole('button', { name: 'Close filters' }));
      await expectClosedWithFocusOn(closed.trigger);
      cleanup();
    }
  },
};
