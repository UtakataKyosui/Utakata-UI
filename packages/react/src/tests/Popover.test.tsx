import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { type ComponentProps, createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Popover } from '../components/Popover.js';
import {
  popoverManifest,
  popoverQualityRules,
} from '../metadata/components/Popover.js';
import {
  openPopover,
  popoverChecks,
  renderPopover,
} from './quality/Popover.checks.js';
import { expectAutomatedQuality } from './quality-helpers.js';

// Type contract fixtures, checked by pnpm typecheck without rendering.
const positioned: ComponentProps<typeof Popover.Positioner> = {
  side: 'top',
  sideOffset: 8,
};
// @ts-expect-error side is limited to Base UI placements.
const badSide: ComponentProps<typeof Popover.Positioner> = { side: 'middle' };
const stateClass: ComponentProps<typeof Popover.Popup> = {
  // @ts-expect-error className is a string, not a Base UI state function.
  className: () => 'x',
};
void [positioned, badSide, stateClass];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Popover', () => {
  it('forwards refs and merges classNames on every DOM part', () => {
    const refs = {
      trigger: createRef<HTMLElement>(),
      popup: createRef<HTMLElement>(),
      title: createRef<HTMLElement>(),
      close: createRef<HTMLElement>(),
    };
    render(
      <Popover.Root defaultOpen>
        <Popover.Trigger ref={refs.trigger} className="t">
          Open
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner className="p">
            <Popover.Popup ref={refs.popup} className="c">
              <Popover.Arrow className="a" />
              <Popover.Title ref={refs.title} className="h">
                Filters
              </Popover.Title>
              <Popover.Description className="d">
                Narrow results.
              </Popover.Description>
              <Popover.Close ref={refs.close} className="x">
                Close
              </Popover.Close>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Filters' });
    expect(dialog).toHaveClass('ui-popover__popup', 'c');
    expect(refs.popup.current).toBe(dialog);
    expect(refs.trigger.current).toHaveClass('ui-popover__trigger', 't');
    expect(refs.title.current).toHaveClass('ui-popover__title', 'h');
    expect(refs.close.current).toHaveClass('ui-popover__close', 'x');
    expect(dialog.parentElement).toHaveClass('ui-popover__positioner', 'p');
    expect(screen.getByText('Narrow results.')).toHaveClass(
      'ui-popover__description',
      'd',
    );
    expect(dialog.querySelector('.ui-popover__arrow.a')).not.toBeNull();
    expect(popoverManifest.defaults.modal).toBe(false);
  });

  it('opens from the trigger and moves focus inside', async () => {
    const trigger = renderPopover();
    const dialog = await openPopover(trigger);
    expect(dialog).toBeVisible();
  });

  it('warns when the popup has no name source', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Popover.Root defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup>
              <Popover.Close>Close</Popover.Close>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>,
    );
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          '[Utakata-UI a11y] Popover.Popup: No accessible name',
        ),
      ),
    );
    expect(
      warn.mock.calls.filter(([m]) => String(m).includes('Popover.Trigger')),
    ).toEqual([]);
  });

  it('passes its automated quality rules without diagnostics', async () => {
    await expectAutomatedQuality(popoverQualityRules, popoverChecks);
  });

  it('keeps the popover open on an Enter key press inside', async () => {
    const trigger = renderPopover();
    await openPopover(trigger);
    fireEvent.keyDown(screen.getByRole('spinbutton'), { key: 'Enter' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
