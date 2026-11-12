import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { type ComponentProps, createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button } from '../components/Button.js';
import { Drawer } from '../components/Drawer.js';
import {
  drawerManifest,
  drawerQualityRules,
} from '../metadata/components/Drawer.js';
import { drawerChecks } from './quality/Drawer.checks.js';
import { expectAutomatedQuality, settle } from './quality-helpers.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Checked by pnpm typecheck: only the four edges are accepted, the drawer is
// always modal, the swipe direction follows side and className stays a string.
type RootProps = ComponentProps<typeof Drawer.Root>;
const validRoot: RootProps = { side: 'left', defaultOpen: true };
// @ts-expect-error Sides are limited to top, right, bottom and left.
const centered: RootProps = { side: 'center' };
// @ts-expect-error Logical sides are not provided; use the physical edge.
const logical: RootProps = { side: 'inline-end' };
const unsafeProps = { side: 'center' };
// @ts-expect-error Spreads cannot pass an unsupported side.
const spreadSide = <Drawer.Root {...unsafeProps} />;
// @ts-expect-error A Drawer is always modal; modal={false} is not available.
const nonModal: RootProps = { modal: false };
// @ts-expect-error The trap-focus variant is not available either.
const trapFocus: RootProps = { modal: 'trap-focus' };
// @ts-expect-error JSX usage must also keep the drawer modal.
const nonModalJsx = <Drawer.Root modal={false} />;
const unsafeRoot = { modal: false };
// @ts-expect-error Spreads cannot make the drawer non-modal.
const spreadNonModal = <Drawer.Root {...unsafeRoot} />;
// @ts-expect-error The swipe direction follows side.
const swipe: RootProps = { swipeDirection: 'left' };
// @ts-expect-error Snap points are not provided.
const snap: RootProps = { snapPoints: [0.5, 1] };
type PopupProps = ComponentProps<typeof Drawer.Popup>;
const validPopup: PopupProps = { className: 'panel' };
const popupClass: PopupProps = {
  // @ts-expect-error className must be a string, not a state function.
  className: () => 'x',
};
void [
  validRoot,
  centered,
  logical,
  spreadSide,
  nonModal,
  trapFocus,
  nonModalJsx,
  spreadNonModal,
  swipe,
  snap,
  validPopup,
  popupClass,
];

describe('Drawer', () => {
  it('forwards refs and merges classes with the shared dialog styles', async () => {
    const popup = createRef<HTMLDivElement>();
    const title = createRef<HTMLHeadingElement>();
    render(
      <Drawer.Root defaultOpen side="top">
        <Drawer.Portal>
          <Drawer.Backdrop className="shade" />
          <Drawer.Popup ref={popup} className="custom">
            <Drawer.Title ref={title} className="heading">
              Cart
            </Drawer.Title>
            <Drawer.Close>Close</Drawer.Close>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>,
    );
    const dialog = await screen.findByRole('dialog', { name: 'Cart' });
    expect(popup.current).toBe(dialog);
    expect(dialog).toHaveClass(
      'ui-dialog__popup',
      'ui-drawer__popup',
      'ui-drawer__popup--top',
      'custom',
    );
    expect(dialog).toHaveAttribute('data-side', 'top');
    expect(dialog.querySelector('.ui-drawer__content')).not.toBeNull();
    expect(dialog.closest('.ui-drawer__viewport')).not.toBeNull();
    expect(title.current).toHaveClass('ui-dialog__title', 'heading');
    expect(document.querySelector('.ui-drawer__backdrop')).toHaveClass(
      'ui-dialog__backdrop',
      'shade',
    );
  });

  it('defaults to the bottom edge and lists four sides', async () => {
    expect(drawerManifest.props.side.default).toBe('bottom');
    expect(drawerManifest.sides).toEqual(['top', 'right', 'bottom', 'left']);
    render(
      <Drawer.Root defaultOpen>
        <Drawer.Portal>
          <Drawer.Popup>
            <Drawer.Title>Menu</Drawer.Title>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>,
    );
    const dialog = await screen.findByRole('dialog', { name: 'Menu' });
    expect(dialog).toHaveAttribute('data-side', 'bottom');
    // Base UI reports the swipe direction that dismisses a bottom drawer.
    expect(dialog).toHaveAttribute('data-swipe-direction', 'down');
  });

  it('maps each side to the swipe direction that returns it to its edge', async () => {
    const expected = {
      top: 'up',
      right: 'right',
      bottom: 'down',
      left: 'left',
    } as const;
    for (const side of drawerManifest.sides) {
      render(
        <Drawer.Root defaultOpen side={side}>
          <Drawer.Portal>
            <Drawer.Popup>
              <Drawer.Title>Menu</Drawer.Title>
            </Drawer.Popup>
          </Drawer.Portal>
        </Drawer.Root>,
      );
      const dialog = await screen.findByRole('dialog', { name: 'Menu' });
      expect(dialog).toHaveAttribute('data-swipe-direction', expected[side]);
      cleanup();
    }
  });

  it('stays open until a controlled open state changes', async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Drawer.Root open onOpenChange={onOpenChange}>
        <Drawer.Portal>
          <Drawer.Popup>
            <Drawer.Title>Menu</Drawer.Title>
            <Drawer.Close>Close</Drawer.Close>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>,
    );
    const close = await screen.findByRole('button', { name: 'Close' });
    close.click();
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledTimes(1));
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(false);
    // Controlled: still open until the consumer changes the prop.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    rerender(
      <Drawer.Root open={false}>
        <Drawer.Portal>
          <Drawer.Popup>
            <Drawer.Title>Menu</Drawer.Title>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>,
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });

  it('honours initialFocus', async () => {
    render(
      <Drawer.Root defaultOpen>
        <Drawer.Portal>
          <Drawer.Popup initialFocus={() => document.getElementById('second')}>
            <Drawer.Title>Menu</Drawer.Title>
            <Button>First</Button>
            <Button id="second">Second</Button>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>,
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Second' })).toHaveFocus(),
    );
  });

  it('runs an action on click, not on pointer press', async () => {
    const onClick = vi.fn();
    render(
      <Drawer.Root defaultOpen>
        <Drawer.Portal>
          <Drawer.Popup>
            <Drawer.Title>Delete</Drawer.Title>
            <Drawer.Close>Cancel</Drawer.Close>
            <Button onClick={onClick}>Delete item</Button>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>,
    );
    const action = await screen.findByRole('button', { name: 'Delete item' });
    fireEvent.pointerDown(action);
    fireEvent.mouseDown(action);
    expect(onClick).not.toHaveBeenCalled();
    fireEvent.click(action);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('passes every automated quality rule', async () => {
    await expectAutomatedQuality(drawerQualityRules, drawerChecks);
  });

  it('warns in development when the popup has no name source', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Drawer.Root defaultOpen>
        <Drawer.Portal>
          <Drawer.Popup>
            <Drawer.Close>Close</Drawer.Close>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>,
    );
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          '[Utakata-UI a11y] Drawer.Popup: No accessible name source',
        ),
      ),
    );
  });

  it('does not warn for a titled popup', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Drawer.Root defaultOpen>
        <Drawer.Portal>
          <Drawer.Popup>
            <Drawer.Title>Filters</Drawer.Title>
            <Drawer.Close>Close</Drawer.Close>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>,
    );
    await screen.findByRole('dialog', { name: 'Filters' });
    await settle();
    expect(warn).not.toHaveBeenCalled();
  });
});
