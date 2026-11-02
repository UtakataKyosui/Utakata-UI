import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { ComponentProps } from 'react';
import { expect } from 'vitest';
import { Popover } from '../../components/Popover.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

export function renderPopover(
  rootProps: ComponentProps<typeof Popover.Root> = {},
  triggerDisabled = false,
) {
  render(
    <>
      <button type="button">Outside</button>
      <Popover.Root {...rootProps}>
        <Popover.Trigger disabled={triggerDisabled}>
          Display settings
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={8}>
            <Popover.Popup>
              <Popover.Title>Display</Popover.Title>
              <Popover.Description>Adjust the display.</Popover.Description>
              <label>
                Font size <input type="number" defaultValue={16} />
              </label>
              <Popover.Close>Close</Popover.Close>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </>,
  );
  return screen.getByRole('button', { name: 'Display settings' });
}

export async function openPopover(trigger: HTMLElement) {
  trigger.focus();
  fireEvent.click(trigger);
  const dialog = await screen.findByRole('dialog', { name: 'Display' });
  await waitFor(() =>
    expect(dialog).toContainElement(document.activeElement as HTMLElement),
  );
  return dialog;
}

export const popoverChecks: Record<string, QualityCheck> = {
  'popover.accessible-name': async () => {
    const trigger = renderPopover();
    const dialog = await openPopover(trigger);
    expect(dialog).toHaveAccessibleDescription('Adjust the display.');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect((await audit(dialog)).violations).toEqual([]);
  },
  'popover.disabled-controlled': async () => {
    const disabled = renderPopover({}, true);
    expect(disabled).toBeDisabled();
    fireEvent.click(disabled);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    cleanup();
    const changes: boolean[] = [];
    const trigger = renderPopover({
      open: false,
      onOpenChange: (open) => changes.push(open),
    });
    fireEvent.click(trigger);
    expect(changes).toEqual([true]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  },
};
