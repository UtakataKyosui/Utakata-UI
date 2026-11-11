import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { type ComponentProps, createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContextMenu } from '../components/ContextMenu.js';
import { DropdownMenu } from '../components/DropdownMenu.js';
import {
  contextMenuManifest,
  contextMenuQualityRules,
} from '../metadata/components/ContextMenu.js';
import {
  contextMenuChecks,
  openContextMenu,
  renderContextMenu,
} from './quality/ContextMenu.checks.js';
import { expectAutomatedQuality } from './quality-helpers.js';

// Type contract fixtures, checked by pnpm typecheck without rendering.
const named: ComponentProps<typeof ContextMenu.Popup> = {
  'aria-label': 'Actions',
};
const labelled: ComponentProps<typeof ContextMenu.Popup> = {
  'aria-labelledby': 'heading',
};
// @ts-expect-error The menu needs aria-label or aria-labelledby.
const unnamed: ComponentProps<typeof ContextMenu.Popup> = {};
const stateClass: ComponentProps<typeof ContextMenu.Trigger> = {
  // @ts-expect-error className is a string, not a Base UI state function.
  className: () => 'x',
};
// @ts-expect-error disabled is a boolean.
const badItem: ComponentProps<typeof ContextMenu.Item> = { disabled: 'yes' };
void [named, labelled, unnamed, stateClass, badItem];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ContextMenu', () => {
  it('forwards refs, merges classNames and reuses DropdownMenu item parts', async () => {
    const popupRef = createRef<HTMLElement>();
    const triggerRef = createRef<HTMLElement>();
    render(
      <ContextMenu.Root>
        <ContextMenu.Trigger ref={triggerRef} className="t">
          Area
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner className="p">
            <ContextMenu.Popup ref={popupRef} aria-label="Area" className="c">
              <ContextMenu.Item className="i">Open</ContextMenu.Item>
            </ContextMenu.Popup>
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>,
    );
    const area = screen.getByText('Area');
    expect(area).toHaveClass('ui-context-menu__trigger', 't');
    expect(triggerRef.current).toBe(area);
    fireEvent.contextMenu(area, { clientX: 10, clientY: 10 });
    const menu = await screen.findByRole('menu', { name: 'Area' });
    expect(menu).toHaveClass(
      'ui-dropdown-menu__popup',
      'ui-context-menu__popup',
      'c',
    );
    expect(popupRef.current).toBe(menu);
    expect(menu.parentElement).toHaveClass(
      'ui-dropdown-menu__positioner',
      'ui-context-menu__positioner',
      'p',
    );
    expect(screen.getByRole('menuitem', { name: 'Open' })).toHaveClass(
      'ui-dropdown-menu__item',
      'i',
    );
    expect(ContextMenu.Item).toBe(DropdownMenu.Item);
    expect(ContextMenu.Group).toBe(DropdownMenu.Group);
    expect(ContextMenu.GroupLabel).toBe(DropdownMenu.GroupLabel);
    expect(ContextMenu.Separator).toBe(DropdownMenu.Separator);
    expect(contextMenuManifest.defaults.open).toBe(false);
  });

  it('opens on contextmenu and not on a primary click', async () => {
    const target = renderContextMenu();
    target.click();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(await openContextMenu(target)).toBeInTheDocument();
  });

  it('warns when the popup has no name source', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner>
            {/* @ts-expect-error Deliberately unnamed to exercise the diagnostic. */}
            <ContextMenu.Popup>
              <ContextMenu.Item>Open</ContextMenu.Item>
            </ContextMenu.Popup>
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>,
    );
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          '[Utakata-UI a11y] ContextMenu.Popup: No accessible name',
        ),
      ),
    );
  });

  it('passes its automated quality rules without diagnostics', async () => {
    await expectAutomatedQuality(contextMenuQualityRules, contextMenuChecks);
  });
});
