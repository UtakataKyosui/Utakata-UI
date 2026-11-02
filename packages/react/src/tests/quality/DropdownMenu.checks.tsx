import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect } from 'vitest';
import { Button } from '../../components/Button.js';
import { DropdownMenu } from '../../components/DropdownMenu.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

export function renderMenu(
  onEdit: () => void = () => {},
  onDelete: () => void = () => {},
) {
  render(
    <>
      <button type="button">Outside</button>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger render={<Button variant="outline" />}>
          Actions
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner sideOffset={4}>
            <DropdownMenu.Popup>
              <DropdownMenu.Group>
                <DropdownMenu.GroupLabel>Document</DropdownMenu.GroupLabel>
                <DropdownMenu.Item onClick={onEdit}>Edit</DropdownMenu.Item>
                <DropdownMenu.Item>Duplicate</DropdownMenu.Item>
              </DropdownMenu.Group>
              <DropdownMenu.Separator />
              <DropdownMenu.Item disabled onClick={onDelete}>
                Delete
              </DropdownMenu.Item>
              <DropdownMenu.Item>Share</DropdownMenu.Item>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </>,
  );
  return screen.getByRole('button', { name: 'Actions' });
}

export async function openMenu(trigger: HTMLElement) {
  trigger.focus();
  fireEvent.click(trigger);
  return screen.findByRole('menu', { name: 'Actions' });
}

const highlighted = () => document.activeElement?.textContent;

export const dropdownMenuChecks: Record<string, QualityCheck> = {
  'dropdown-menu.semantics': async () => {
    const trigger = renderMenu();
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    const menu = await openMenu(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('group', { name: 'Document' })).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(4);
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('separator')).toBeInTheDocument();
    expect((await audit(menu)).violations).toEqual([]);
  },
  'dropdown-menu.keyboard': async () => {
    let deleted = 0;
    const trigger = renderMenu(undefined, () => deleted++);
    const menu = await openMenu(trigger);
    const key = (name: string) => {
      fireEvent.keyDown(document.activeElement ?? menu, { key: name });
    };
    // Whether opening pre-highlights the first item depends on the last input
    // modality, so anchor the highlight with Home before testing arrows.
    key('Home');
    await waitFor(() => expect(highlighted()).toBe('Edit'));
    key('ArrowDown');
    expect(highlighted()).toBe('Duplicate');
    key('ArrowDown');
    // Base UI keeps disabled items discoverable (APG), but they cannot be activated.
    expect(highlighted()).toBe('Delete');
    key('End');
    expect(highlighted()).toBe('Share');
    key('Home');
    expect(highlighted()).toBe('Edit');
    key('s');
    await waitFor(() => expect(highlighted()).toBe('Share'));
    const deleteItem = screen.getByRole('menuitem', { name: 'Delete' });
    fireEvent.click(deleteItem);
    fireEvent.keyDown(deleteItem, { key: 'Enter' });
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(deleted).toBe(0);
  },
  'dropdown-menu.activate-dismiss': async () => {
    let edits = 0;
    const trigger = renderMenu(() => edits++);
    await openMenu(trigger);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));
    await waitFor(() =>
      expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
    );
    expect(edits).toBe(1);
    await waitFor(() => expect(trigger).toHaveFocus());
    const menu = await openMenu(trigger);
    fireEvent.keyDown(document.activeElement ?? menu, { key: 'Escape' });
    await waitFor(() =>
      expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
    await openMenu(trigger);
    const outside = screen.getByRole('button', { name: 'Outside' });
    fireEvent.pointerDown(outside);
    fireEvent.mouseDown(outside);
    fireEvent.click(outside);
    await waitFor(() =>
      expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
    );
  },
};
