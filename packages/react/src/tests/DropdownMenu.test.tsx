import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { type ComponentProps, createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DropdownMenu } from '../components/DropdownMenu.js';
import {
  dropdownMenuManifest,
  dropdownMenuQualityRules,
} from '../metadata/components/DropdownMenu.js';
import {
  dropdownMenuChecks,
  openMenu,
  renderMenu,
} from './quality/DropdownMenu.checks.js';
import { expectAutomatedQuality } from './quality-helpers.js';

// Type contract fixtures, checked by pnpm typecheck without rendering.
const item: ComponentProps<typeof DropdownMenu.Item> = { disabled: true };
// @ts-expect-error disabled is a boolean.
const badItem: ComponentProps<typeof DropdownMenu.Item> = { disabled: 'yes' };
const stateClass: ComponentProps<typeof DropdownMenu.Item> = {
  // @ts-expect-error className is a string, not a Base UI state function.
  className: () => 'x',
};
void [item, badItem, stateClass];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('DropdownMenu', () => {
  it('forwards refs and merges classNames on every DOM part', () => {
    const itemRef = createRef<HTMLElement>();
    const popupRef = createRef<HTMLElement>();
    render(
      <DropdownMenu.Root defaultOpen>
        <DropdownMenu.Trigger className="t">Actions</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner className="p">
            <DropdownMenu.Popup ref={popupRef} className="c">
              <DropdownMenu.Group className="g">
                <DropdownMenu.GroupLabel className="l">
                  File
                </DropdownMenu.GroupLabel>
                <DropdownMenu.Item ref={itemRef} className="i">
                  Open
                </DropdownMenu.Item>
              </DropdownMenu.Group>
              <DropdownMenu.Separator className="s" />
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>,
    );
    const menu = screen.getByRole('menu');
    expect(menu).toHaveClass('ui-dropdown-menu__popup', 'c');
    expect(popupRef.current).toBe(menu);
    expect(menu.parentElement).toHaveClass('ui-dropdown-menu__positioner', 'p');
    expect(screen.getByRole('button', { name: 'Actions' })).toHaveClass(
      'ui-dropdown-menu__trigger',
      't',
    );
    const openItem = screen.getByRole('menuitem', { name: 'Open' });
    expect(openItem).toHaveClass('ui-dropdown-menu__item', 'i');
    expect(itemRef.current).toBe(openItem);
    expect(screen.getByRole('group', { name: 'File' })).toHaveClass(
      'ui-dropdown-menu__group',
      'g',
    );
    expect(screen.getByText('File')).toHaveClass(
      'ui-dropdown-menu__group-label',
      'l',
    );
    expect(screen.getByRole('separator')).toHaveClass(
      'ui-dropdown-menu__separator',
      's',
    );
    expect(dropdownMenuManifest.defaults.open).toBe(false);
  });

  it('renders onto Button and opens a named menu', async () => {
    const trigger = renderMenu();
    expect(trigger).toHaveClass('ui-button', 'ui-dropdown-menu__trigger');
    expect(await openMenu(trigger)).toBeInTheDocument();
  });

  it('warns when the trigger has no name source', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <DropdownMenu.Root>
        <DropdownMenu.Trigger />
      </DropdownMenu.Root>,
    );
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          '[Utakata-UI a11y] DropdownMenu.Trigger: No accessible name',
        ),
      ),
    );
  });

  it('passes its automated quality rules without diagnostics', async () => {
    await expectAutomatedQuality(dropdownMenuQualityRules, dropdownMenuChecks);
  });
});
