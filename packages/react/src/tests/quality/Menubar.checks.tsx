import { fireEvent, render, screen } from '@testing-library/react';
import { expect } from 'vitest';
import { Menubar } from '../../components/Menubar.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';
import { MenubarMenu } from '../MenubarMenu.js';

export function renderMenubar(onNew: () => void = () => {}) {
  render(
    <>
      <button type="button">Outside</button>
      <Menubar.Root aria-label="Application">
        <Menubar.Menu>
          <Menubar.Trigger>File</Menubar.Trigger>
          <Menubar.Portal>
            <Menubar.Positioner sideOffset={4}>
              <Menubar.Popup>
                <Menubar.Group>
                  <Menubar.GroupLabel>Document</Menubar.GroupLabel>
                  <Menubar.Item onClick={onNew}>New</Menubar.Item>
                </Menubar.Group>
                <Menubar.Separator />
                <Menubar.Item disabled>Print</Menubar.Item>
                <Menubar.SubmenuRoot>
                  <Menubar.SubmenuTrigger>Share</Menubar.SubmenuTrigger>
                  <Menubar.Portal>
                    <Menubar.Positioner>
                      <Menubar.Popup>
                        <Menubar.Item>Email</Menubar.Item>
                      </Menubar.Popup>
                    </Menubar.Positioner>
                  </Menubar.Portal>
                </Menubar.SubmenuRoot>
              </Menubar.Popup>
            </Menubar.Positioner>
          </Menubar.Portal>
        </Menubar.Menu>
        <MenubarMenu label="Edit">
          <Menubar.Item>Undo</Menubar.Item>
        </MenubarMenu>
        <MenubarMenu label="View" disabled>
          <Menubar.Item>Zoom</Menubar.Item>
        </MenubarMenu>
      </Menubar.Root>
    </>,
  );
  return screen.getByRole('menubar', { name: 'Application' });
}

export async function openFile() {
  const trigger = screen.getByRole('menuitem', { name: 'File' });
  trigger.focus();
  fireEvent.click(trigger);
  return screen.findByRole('menu', { name: 'File' });
}

export const menubarChecks: Record<string, QualityCheck> = {
  'menubar.semantics': async () => {
    const bar = renderMenubar();
    expect(bar).toHaveAttribute('aria-orientation', 'horizontal');
    const file = screen.getByRole('menuitem', { name: 'File' });
    expect(file).toHaveAttribute('aria-haspopup', 'menu');
    expect(file).toHaveAttribute('aria-expanded', 'false');
    const menu = await openFile();
    expect(file).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('group', { name: 'Document' })).toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Print' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    const share = screen.getByRole('menuitem', { name: 'Share' });
    expect(share).toHaveAttribute('aria-haspopup', 'menu');
    expect(share).toHaveAttribute('aria-expanded', 'false');
    expect((await audit(menu)).violations).toEqual([]);
  },
};
