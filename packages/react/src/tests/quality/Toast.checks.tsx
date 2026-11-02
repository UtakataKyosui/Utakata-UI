import { act, render, screen } from '@testing-library/react';
import { expect, vi } from 'vitest';
import { Button } from '../../components/Button.js';
import { Toast, useToastManager } from '../../components/Toast.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

type Manager = ReturnType<typeof useToastManager>;

function ToastList({ onManager }: { onManager: (manager: Manager) => void }) {
  const manager = useToastManager();
  onManager(manager);
  return manager.toasts.map((toast) => (
    <Toast.Root key={toast.id} toast={toast}>
      <Toast.Content>
        <Toast.Title />
        <Toast.Description />
        <Toast.Action />
        <Toast.Close>Dismiss</Toast.Close>
      </Toast.Content>
    </Toast.Root>
  ));
}

/** Renders a Provider with one Viewport and returns its toast manager. */
export function renderToasts(timeout?: number) {
  let current: Manager | undefined;
  const view = render(
    <Toast.Provider timeout={timeout}>
      <Button>Outside</Button>
      <Toast.Portal>
        <Toast.Viewport>
          <ToastList
            onManager={(manager) => {
              current = manager;
            }}
          />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>,
  );
  const manager = () => {
    if (!current) throw new Error('Toast manager is not ready');
    return current;
  };
  const add = (options: Parameters<Manager['add']>[0]) => {
    let id = '';
    act(() => {
      id = manager().add(options);
    });
    return id;
  };
  return { view, manager, add };
}

const advance = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

async function withFakeTimers(run: () => Promise<void>) {
  vi.useFakeTimers();
  try {
    await run();
  } finally {
    vi.useRealTimers();
  }
}

export const toastChecks: Record<string, QualityCheck> = {
  'toast.live-announcement': async () => {
    const { add } = renderToasts();
    const outside = screen.getByRole('button', { name: 'Outside' });
    outside.focus();
    const region = screen.getByRole('region', { name: 'Notifications' });
    expect(region).toHaveAttribute('aria-live', 'polite');
    add({ title: 'Saved', description: 'Changes applied.' });
    const toast = await screen.findByRole('dialog', { name: 'Saved' });
    expect(toast).toHaveAccessibleDescription('Changes applied.');
    expect(outside).toHaveFocus();
    add({ title: 'Upload failed', priority: 'high' });
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Upload failed');
    expect((await audit(region)).violations).toEqual([]);
  },
  'toast.lifecycle': () =>
    withFakeTimers(async () => {
      const { add, manager } = renderToasts(1000);
      const first = add({ title: 'First' });
      add({ title: 'Second' });
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      act(() => manager().update(first, { title: 'First updated' }));
      expect(screen.getByText('First updated')).toBeInTheDocument();
      act(() => manager().close(first));
      await advance(10);
      expect(screen.queryByText('First updated')).not.toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      await advance(1100);
      expect(screen.queryByText('Second')).not.toBeInTheDocument();
    }),
  'toast.persistent-timeout': () =>
    withFakeTimers(async () => {
      const { add } = renderToasts();
      add({ title: 'Connection lost', timeout: 0 });
      await advance(60_000);
      expect(screen.getByText('Connection lost')).toBeInTheDocument();
    }),
};
