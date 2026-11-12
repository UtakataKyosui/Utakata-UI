import { fireEvent, render, screen } from '@testing-library/react';
import { expect } from 'vitest';
import { Button } from '../../components/Button.js';
import { DropdownMenu } from '../../components/DropdownMenu.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';
import { expectDocumentMenu } from '../quality-helpers.js';

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

export const dropdownMenuChecks: Record<string, QualityCheck> = {
  'dropdown-menu.semantics': async () => {
    const trigger = renderMenu();
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    const menu = await openMenu(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expectDocumentMenu(4);
    expect((await audit(menu)).violations).toEqual([]);
  },
};
