import { fireEvent, render, screen } from '@testing-library/react';
import { expect } from 'vitest';
import { Button } from '../../components/Button.js';
import { ContextMenu } from '../../components/ContextMenu.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';
import { expectDocumentMenu } from '../quality-helpers.js';

function DocumentGroup({ onEdit }: { onEdit: () => void }) {
  return (
    <ContextMenu.Group>
      <ContextMenu.GroupLabel>Document</ContextMenu.GroupLabel>
      <ContextMenu.Item onClick={onEdit}>Edit</ContextMenu.Item>
      <ContextMenu.Item>Duplicate</ContextMenu.Item>
    </ContextMenu.Group>
  );
}

export function renderContextMenu(
  onEdit: () => void = () => {},
  onDelete: () => void = () => {},
) {
  render(
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <Button variant="outline">File</Button>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner>
          <ContextMenu.Popup aria-label="File actions">
            <DocumentGroup onEdit={onEdit} />
            <ContextMenu.Separator />
            <ContextMenu.Item disabled onClick={onDelete}>
              Delete
            </ContextMenu.Item>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>,
  );
  return screen.getByRole('button', { name: 'File' });
}

export async function openContextMenu(target: HTMLElement) {
  fireEvent.contextMenu(target, { clientX: 10, clientY: 10 });
  return screen.findByRole('menu', { name: 'File actions' });
}

export const contextMenuChecks: Record<string, QualityCheck> = {
  'context-menu.semantics': async () => {
    const target = renderContextMenu();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    const menu = await openContextMenu(target);
    expectDocumentMenu(3);
    expect((await audit(menu)).violations).toEqual([]);
  },
};
