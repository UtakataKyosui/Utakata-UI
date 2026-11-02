import { fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import { expect } from 'vitest';
import { Button } from '../../components/Button.js';
import { ButtonGroup } from '../../components/ButtonGroup.js';
import { buttonGroupManifest } from '../../metadata/components/ButtonGroup.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

export const buttonGroupChecks: Record<string, QualityCheck> = {
  'button-group.name': async () => {
    for (const orientation of buttonGroupManifest.orientations) {
      const { container, unmount } = render(
        <>
          <ButtonGroup aria-label="History" orientation={orientation}>
            <Button variant="outline">Undo</Button>
            <Button variant="solid">Redo</Button>
          </ButtonGroup>
          <span id="zoom-label">Zoom</span>
          <ButtonGroup aria-labelledby="zoom-label" orientation={orientation}>
            <Button variant="ghost">Zoom in</Button>
          </ButtonGroup>
        </>,
      );
      expect(screen.getByRole('group', { name: 'History' })).toHaveAttribute(
        'data-orientation',
        orientation,
      );
      expect(screen.getByRole('group', { name: 'Zoom' })).toBeInTheDocument();
      expect((await audit(container)).violations).toEqual([]);
      unmount();
    }
  },
  'button-group.button-behavior': () => {
    let clicks = 0;
    let submits = 0;
    const ref = createRef<HTMLElement>();
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submits++;
        }}
      >
        <ButtonGroup aria-label="Actions">
          <Button
            ref={ref}
            variant="outline"
            size="sm"
            onClick={() => clicks++}
          >
            Copy
          </Button>
          <Button variant="outline" disabled onClick={() => clicks++}>
            Paste
          </Button>
          <Button type="submit">Save</Button>
        </ButtonGroup>
      </form>,
    );
    const group = screen.getByRole('group', { name: 'Actions' });
    const copy = within(group).getByRole('button', { name: 'Copy' });
    const paste = within(group).getByRole('button', { name: 'Paste' });
    const save = within(group).getByRole('button', { name: 'Save' });
    expect(ref.current).toBe(copy);
    expect(copy).toHaveClass('ui-button--outline', 'ui-button--sm');
    expect(copy).toHaveAttribute('type', 'button');
    expect(save).toHaveAttribute('type', 'submit');
    for (const button of [copy, save]) expect(button.tabIndex).toBe(0);
    fireEvent.click(copy);
    fireEvent.click(paste);
    expect(paste).toBeDisabled();
    expect(clicks).toBe(1);
    expect(submits).toBe(0);
    fireEvent.click(save);
    expect(submits).toBe(1);
  },
};
