import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { type ComponentProps, createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button } from '../components/Button.js';
import { Sheet } from '../components/Sheet.js';
import {
  sheetManifest,
  sheetQualityRules,
} from '../metadata/components/Sheet.js';
import { sheetChecks } from './quality/Sheet.checks.js';
import { expectAutomatedQuality, settle } from './quality-helpers.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Checked by pnpm typecheck: only the four edges are accepted and className
// stays a string.
type PopupProps = ComponentProps<typeof Sheet.Popup>;
const validSide: PopupProps = { side: 'left', className: 'panel' };
// @ts-expect-error Sides are limited to top, right, bottom and left.
const centered: PopupProps = { side: 'center' };
// @ts-expect-error Logical sides are not provided; use the physical edge.
const logical: PopupProps = { side: 'inline-end' };
const popupClass: PopupProps = {
  // @ts-expect-error className must be a string, not a state function.
  className: () => 'x',
};
const unsafeProps = { side: 'center' };
// @ts-expect-error Spreads cannot pass an unsupported side.
const spreadSide = <Sheet.Popup {...unsafeProps} />;
void [validSide, centered, logical, popupClass, spreadSide];

describe('Sheet', () => {
  it('forwards refs and merges classes with the shared dialog styles', async () => {
    const popup = createRef<HTMLDivElement>();
    const title = createRef<HTMLHeadingElement>();
    render(
      <Sheet.Root defaultOpen>
        <Sheet.Portal>
          <Sheet.Backdrop className="shade" />
          <Sheet.Popup ref={popup} className="custom" side="bottom">
            <Sheet.Title ref={title} className="heading">
              Cart
            </Sheet.Title>
            <Sheet.Close>Close</Sheet.Close>
          </Sheet.Popup>
        </Sheet.Portal>
      </Sheet.Root>,
    );
    const dialog = await screen.findByRole('dialog', { name: 'Cart' });
    expect(popup.current).toBe(dialog);
    expect(dialog).toHaveClass(
      'ui-dialog__popup',
      'ui-sheet__popup',
      'ui-sheet__popup--bottom',
      'custom',
    );
    expect(dialog).toHaveAttribute('data-side', 'bottom');
    expect(title.current).toHaveClass('ui-dialog__title', 'heading');
    expect(document.querySelector('.ui-dialog__backdrop')).toHaveClass('shade');
  });

  it('defaults to the right edge and lists four sides', () => {
    expect(sheetManifest.props.side.default).toBe('right');
    expect(sheetManifest.sides).toEqual(['top', 'right', 'bottom', 'left']);
  });

  it('stays open until a controlled open state changes', async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Sheet.Root open onOpenChange={onOpenChange}>
        <Sheet.Portal>
          <Sheet.Popup>
            <Sheet.Title>Menu</Sheet.Title>
            <Sheet.Close>Close</Sheet.Close>
          </Sheet.Popup>
        </Sheet.Portal>
      </Sheet.Root>,
    );
    const close = await screen.findByRole('button', { name: 'Close' });
    close.click();
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledTimes(1));
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(false);
    // Controlled: still open until the consumer changes the prop.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    rerender(
      <Sheet.Root open={false}>
        <Sheet.Portal>
          <Sheet.Popup>
            <Sheet.Title>Menu</Sheet.Title>
          </Sheet.Popup>
        </Sheet.Portal>
      </Sheet.Root>,
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });

  it('honours initialFocus', async () => {
    render(
      <Sheet.Root defaultOpen>
        <Sheet.Portal>
          <Sheet.Popup initialFocus={() => document.getElementById('second')}>
            <Sheet.Title>Menu</Sheet.Title>
            <Button>First</Button>
            <Button id="second">Second</Button>
          </Sheet.Popup>
        </Sheet.Portal>
      </Sheet.Root>,
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Second' })).toHaveFocus(),
    );
  });

  it('passes every automated quality rule', async () => {
    await expectAutomatedQuality(sheetQualityRules, sheetChecks);
  });

  it('warns in development when the popup has no name source', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Sheet.Root defaultOpen>
        <Sheet.Portal>
          <Sheet.Popup>
            <Sheet.Close>Close</Sheet.Close>
          </Sheet.Popup>
        </Sheet.Portal>
      </Sheet.Root>,
    );
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          '[Utakata-UI a11y] Sheet.Popup: No accessible name source',
        ),
      ),
    );
  });

  it('does not warn for a titled popup', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Sheet.Root defaultOpen>
        <Sheet.Portal>
          <Sheet.Popup>
            <Sheet.Title>Filters</Sheet.Title>
            <Sheet.Close>Close</Sheet.Close>
          </Sheet.Popup>
        </Sheet.Portal>
      </Sheet.Root>,
    );
    await screen.findByRole('dialog', { name: 'Filters' });
    await settle();
    expect(warn).not.toHaveBeenCalled();
  });
});
