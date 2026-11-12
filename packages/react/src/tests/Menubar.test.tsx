import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { type ComponentProps, createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Menubar } from '../components/Menubar.js';
import {
  menubarManifest,
  menubarQualityRules,
} from '../metadata/components/Menubar.js';
import {
  menubarChecks,
  openFile,
  renderMenubar,
} from './quality/Menubar.checks.js';
import { expectAutomatedQuality } from './quality-helpers.js';

// Type contract fixtures, checked by pnpm typecheck without rendering.
const named: ComponentProps<typeof Menubar.Root> = { 'aria-label': 'App' };
const labelled: ComponentProps<typeof Menubar.Root> = {
  'aria-labelledby': 'app-heading',
};
// @ts-expect-error the menubar must have a name source.
const unnamed: ComponentProps<typeof Menubar.Root> = {};
// @ts-expect-error aria-label and aria-labelledby are mutually exclusive.
const bothNames: ComponentProps<typeof Menubar.Root> = {
  'aria-label': 'App',
  'aria-labelledby': 'app-heading',
};
const stateClass: ComponentProps<typeof Menubar.Root> = {
  'aria-label': 'App',
  // @ts-expect-error className is a string, not a Base UI state function.
  className: () => 'x',
};
const badOrientation: ComponentProps<typeof Menubar.Root> = {
  'aria-label': 'App',
  // @ts-expect-error orientation is limited to horizontal | vertical.
  orientation: 'diagonal',
};
void [named, labelled, unnamed, bothNames, stateClass, badOrientation];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Menubar', () => {
  it('forwards refs and merges classNames on every DOM part', async () => {
    const rootRef = createRef<HTMLDivElement>();
    const triggerRef = createRef<HTMLElement>();
    render(
      <Menubar.Root ref={rootRef} aria-label="App" className="r">
        <Menubar.Menu defaultOpen>
          <Menubar.Trigger ref={triggerRef} className="t">
            File
          </Menubar.Trigger>
          <Menubar.Portal>
            <Menubar.Positioner className="p">
              <Menubar.Popup className="c">
                <Menubar.Item className="i">Open</Menubar.Item>
                <Menubar.SubmenuRoot>
                  <Menubar.SubmenuTrigger className="s">
                    More
                  </Menubar.SubmenuTrigger>
                </Menubar.SubmenuRoot>
              </Menubar.Popup>
            </Menubar.Positioner>
          </Menubar.Portal>
        </Menubar.Menu>
      </Menubar.Root>,
    );
    const bar = screen.getByRole('menubar');
    expect(bar).toHaveClass('ui-menubar', 'r');
    expect(rootRef.current).toBe(bar);
    const trigger = screen.getByRole('menuitem', { name: 'File' });
    expect(trigger).toHaveClass('ui-menubar__trigger', 't');
    expect(triggerRef.current).toBe(trigger);
    const menu = await screen.findByRole('menu');
    expect(menu).toHaveClass('ui-dropdown-menu__popup', 'c');
    expect(menu.parentElement).toHaveClass('ui-dropdown-menu__positioner', 'p');
    expect(screen.getByRole('menuitem', { name: 'Open' })).toHaveClass(
      'ui-dropdown-menu__item',
      'i',
    );
    expect(screen.getByRole('menuitem', { name: 'More' })).toHaveClass(
      'ui-dropdown-menu__item',
      'ui-menubar__submenu-trigger',
      's',
    );
    expect(menubarManifest.defaults.orientation).toBe('horizontal');
  });

  it('runs an item once and closes the menu', async () => {
    const onNew = vi.fn();
    renderMenubar(onNew);
    await openFile();
    fireEvent.click(screen.getByRole('menuitem', { name: 'New' }));
    expect(onNew).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
  });

  it('warns when the root or a trigger has no name source', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      // @ts-expect-error the root name is required by the public type.
      <Menubar.Root>
        <Menubar.Menu>
          <Menubar.Trigger />
        </Menubar.Menu>
      </Menubar.Root>,
    );
    for (const part of ['Menubar.Root', 'Menubar.Trigger'])
      await waitFor(() =>
        expect(warn).toHaveBeenCalledWith(
          expect.stringContaining(
            `[Utakata-UI a11y] ${part}: No accessible name`,
          ),
        ),
      );
  });

  it('passes its automated quality rules without diagnostics', async () => {
    await expectAutomatedQuality(menubarQualityRules, menubarChecks);
  });
});
