import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { createRef, type RefObject } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  Toast,
  type ToastCloseProps,
  useToastManager,
} from '../components/Toast.js';
import { toastQualityRules } from '../metadata/components/Toast.js';
import { renderToasts, toastChecks } from './quality/Toast.checks.js';
import { expectAutomatedQuality, settle } from './quality-helpers.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Checked by pnpm typecheck: Close must have a name source.
const textClose: ToastCloseProps = { children: '閉じる' };
const labelledClose: ToastCloseProps = { 'aria-label': 'Close' };
// @ts-expect-error An empty Close button has no accessible name.
const emptyClose: ToastCloseProps = {};
// @ts-expect-error className must be a string, not a state function.
const fnClass: ToastCloseProps = { children: 'x', className: () => 'x' };
void [textClose, labelledClose, emptyClose, fnClass];

function RefList({
  root,
  close,
}: {
  root: RefObject<HTMLDivElement | null>;
  close: RefObject<HTMLButtonElement | null>;
}) {
  const { toasts } = useToastManager();
  return toasts.map((toast) => (
    <Toast.Root key={toast.id} toast={toast} ref={root} className="r">
      <Toast.Content className="c">
        <Toast.Title className="t" />
        <Toast.Description className="d" />
        <Toast.Action className="a">Retry</Toast.Action>
        <Toast.Close ref={close} className="x" aria-label="Close">
          <span aria-hidden="true">×</span>
        </Toast.Close>
      </Toast.Content>
    </Toast.Root>
  ));
}
function Add() {
  const manager = useToastManager();
  return (
    <button
      type="button"
      onClick={() => manager.add({ title: 'Saved', description: 'Done.' })}
    >
      Save
    </button>
  );
}
function Unnamed() {
  const manager = useToastManager();
  return (
    <>
      <button
        type="button"
        onClick={() => manager.add({ description: 'x', timeout: 0 })}
      >
        Add
      </button>
      {manager.toasts.map((toast) => (
        <Toast.Root key={toast.id} toast={toast}>
          <Toast.Description />
          <Toast.Action>
            <span aria-hidden="true">↻</span>
          </Toast.Action>
        </Toast.Root>
      ))}
    </>
  );
}

describe('Toast', () => {
  it('forwards refs and merges classes on every DOM part', async () => {
    const viewport = createRef<HTMLDivElement>();
    const root = createRef<HTMLDivElement>();
    const close = createRef<HTMLButtonElement>();
    render(
      <Toast.Provider>
        <Add />
        <Toast.Viewport ref={viewport} className="v">
          <RefList root={root} close={close} />
        </Toast.Viewport>
      </Toast.Provider>,
    );
    expect(viewport.current).toHaveClass('ui-toast__viewport', 'v');
    act(() => screen.getByRole('button', { name: 'Save' }).click());
    const toast = await screen.findByRole('dialog', { name: 'Saved' });
    expect(root.current).toBe(toast);
    expect(toast).toHaveClass('ui-toast', 'r');
    expect(screen.getByText('Saved')).toHaveClass('ui-toast__title', 't');
    expect(screen.getByText('Done.')).toHaveClass('ui-toast__description', 'd');
    expect(screen.getByRole('button', { name: 'Retry' })).toHaveClass(
      'ui-toast__action',
      'a',
    );
    expect(close.current).toHaveClass('ui-toast__close', 'x');
    expect(toast.querySelector('.ui-toast__content')).toHaveClass('c');
  });

  it('defaults to a 5000 ms timeout', async () => {
    vi.useFakeTimers();
    try {
      const { add } = renderToasts();
      add({ title: 'Default timeout' });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(4900);
      });
      expect(screen.getByText('Default timeout')).toBeInTheDocument();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });
      expect(screen.queryByText('Default timeout')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('upserts by ID instead of stacking duplicate notifications', () => {
    const { add, manager } = renderToasts();
    add({ id: 'sync', title: 'Syncing', timeout: 0 });
    add({ id: 'sync', title: 'Synced', timeout: 0 });
    expect(manager().toasts).toHaveLength(1);
    expect(screen.getByText('Synced')).toBeInTheDocument();
  });

  it('cleans up timers when the provider unmounts', async () => {
    vi.useFakeTimers();
    try {
      const { add, view } = renderToasts();
      add({ title: 'Pending' });
      view.unmount();
      await vi.advanceTimersByTimeAsync(6000);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('passes every automated quality rule', async () => {
    await expectAutomatedQuality(toastQualityRules, toastChecks);
  });

  it('warns in development for a toast or action without a name source', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Toast.Provider>
        <Toast.Viewport>
          <Unnamed />
        </Toast.Viewport>
      </Toast.Provider>,
    );
    act(() => screen.getByRole('button', { name: 'Add' }).click());
    await waitFor(() => {
      for (const name of ['Toast.Root', 'Toast.Action'])
        expect(warn).toHaveBeenCalledWith(
          expect.stringContaining(
            `[Utakata-UI a11y] ${name}: No accessible name source`,
          ),
        );
    });
  });

  it('does not warn for titled toasts with labelled actions', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { add } = renderToasts();
    add({ title: 'Saved', actionProps: { children: 'Undo' }, timeout: 0 });
    await screen.findByRole('dialog', { name: 'Saved' });
    await settle();
    expect(warn).not.toHaveBeenCalled();
  });
});
