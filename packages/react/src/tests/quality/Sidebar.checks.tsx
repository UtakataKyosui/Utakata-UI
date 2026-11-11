import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { expect } from 'vitest';
import {
  Sidebar,
  type SidebarProviderProps,
} from '../../components/Sidebar.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

type Listener = () => void;

/**
 * jsdom has no layout, so the viewport is a controllable matchMedia stub. It
 * stands in for the width query; real resizing is covered in the browser.
 */
export function stubViewport(initialMobile: boolean) {
  let mobile = initialMobile;
  const listeners = new Set<Listener>();
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: () => ({
      get matches() {
        return mobile;
      },
      addEventListener: (_type: string, listener: Listener) =>
        listeners.add(listener),
      removeEventListener: (_type: string, listener: Listener) =>
        listeners.delete(listener),
    }),
  });
  return {
    set(next: boolean) {
      mobile = next;
      act(() => {
        for (const listener of listeners) listener();
      });
    },
    restore() {
      delete (window as { matchMedia?: unknown }).matchMedia;
    },
  };
}

export function SidebarFixture(props: SidebarProviderProps) {
  return (
    <Sidebar.Provider {...props}>
      <header>
        <Sidebar.Trigger iconOnly aria-label="Main menu">
          <svg aria-hidden="true" width="16" height="16">
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" />
          </svg>
        </Sidebar.Trigger>
      </header>
      <Sidebar.Root aria-label="Main" closeLabel="Close menu">
        <Sidebar.Header>Utakata</Sidebar.Header>
        <Sidebar.Content>
          <Sidebar.Group>
            <Sidebar.GroupLabel>Project</Sidebar.GroupLabel>
            <Sidebar.Menu>
              <Sidebar.MenuItem>
                <Sidebar.MenuButton href="/" current>
                  Overview
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
              <Sidebar.MenuItem>
                <Sidebar.MenuButton href="/settings">
                  Settings
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
            </Sidebar.Menu>
          </Sidebar.Group>
        </Sidebar.Content>
        <Sidebar.Footer>v1.0</Sidebar.Footer>
      </Sidebar.Root>
      <main>Page content</main>
    </Sidebar.Provider>
  );
}

export const trigger = () => screen.getByRole('button', { name: 'Main menu' });

export const sidebarChecks: Record<string, QualityCheck> = {
  'sidebar.landmark': async () => {
    const viewport = stubViewport(false);
    try {
      render(<SidebarFixture />);
      const nav = screen.getByRole('navigation', { name: 'Main' });
      expect(nav).toHaveAttribute('data-state', 'open');
      expect(nav.querySelectorAll('ul > li')).toHaveLength(2);
      const current = screen.getByRole('link', { name: 'Overview' });
      expect(current).toHaveAttribute('aria-current', 'page');
      expect(current).toHaveAttribute('href', '/');
      expect(
        screen.getByRole('link', { name: 'Settings' }),
      ).not.toHaveAttribute('aria-current');
      expect(nav.querySelectorAll('[aria-current]')).toHaveLength(1);
      expect(screen.getByRole('group', { name: 'Project' })).toContainElement(
        current,
      );
      expect((await audit(document.body)).violations).toEqual([]);
    } finally {
      viewport.restore();
    }
  },
  'sidebar.trigger-state': async () => {
    const viewport = stubViewport(false);
    try {
      const { rerender } = render(<SidebarFixture />);
      const button = trigger();
      const nav = screen.getByRole('navigation', { name: 'Main' });
      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(button).toHaveAttribute('aria-controls', nav.id);
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(nav).toHaveAttribute('hidden');
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Settings' })).toBeNull();
      // The name is constant; aria-expanded carries the state.
      expect(trigger()).toBe(button);
      fireEvent.click(button);
      expect(screen.getByRole('navigation', { name: 'Main' })).toBe(nav);
      expect((await audit(document.body)).violations).toEqual([]);
      // Controlled: the consumer owns the state.
      const changes: boolean[] = [];
      rerender(
        <SidebarFixture open={false} onOpenChange={(v) => changes.push(v)} />,
      );
      expect(nav).toHaveAttribute('hidden');
      fireEvent.click(trigger());
      expect(changes).toEqual([true]);
      expect(nav).toHaveAttribute('hidden');
      rerender(<SidebarFixture open onOpenChange={() => {}} />);
      expect(nav).not.toHaveAttribute('hidden');
      cleanup();
      render(<SidebarFixture defaultOpen={false} />);
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
      expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    } finally {
      viewport.restore();
    }
  },
  'sidebar.narrow-sheet': async () => {
    const viewport = stubViewport(true);
    try {
      const changes: boolean[] = [];
      render(<SidebarFixture onOpenChange={(v) => changes.push(v)} />);
      const button = trigger();
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).not.toHaveAttribute('aria-controls');
      button.focus();
      fireEvent.click(button);
      const dialog = await screen.findByRole('dialog', { name: 'Main' });
      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(dialog).toHaveAttribute('data-side', 'left');
      expect(dialog).toContainElement(
        screen.getByRole('navigation', { name: 'Main' }),
      );
      expect(
        screen.getByRole('button', { name: 'Close menu' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      await waitFor(() =>
        expect(dialog).toContainElement(document.activeElement as HTMLElement),
      );
      expect((await audit(document.body)).violations).toEqual([]);
      fireEvent.keyDown(document.activeElement ?? document.body, {
        key: 'Escape',
      });
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
      await waitFor(() => expect(button).toHaveFocus());
      fireEvent.click(button);
      await screen.findByRole('dialog', { name: 'Main' });
      fireEvent.click(screen.getByRole('button', { name: 'Close menu' }));
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
      await waitFor(() => expect(button).toHaveFocus());
      // The sheet does not touch the wide-viewport expansion state.
      expect(changes).toEqual([]);
    } finally {
      viewport.restore();
    }
  },
};
