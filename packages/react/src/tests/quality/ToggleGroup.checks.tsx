import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { expect } from 'vitest';
import { ToggleGroup } from '../../components/ToggleGroup.js';
import { toggleGroupManifest } from '../../metadata/components/ToggleGroup.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

const pressed = (group: HTMLElement) =>
  within(group)
    .getAllByRole('button')
    .filter((item) => item.getAttribute('aria-pressed') === 'true')
    .map((item) => item.textContent);

function ControlledAlign() {
  const [value, setValue] = useState<string[]>(['left']);
  return (
    <>
      <ToggleGroup.Root
        aria-label="Align"
        value={value}
        onValueChange={setValue}
      >
        <ToggleGroup.Item value="left">Left</ToggleGroup.Item>
        <ToggleGroup.Item value="right">Right</ToggleGroup.Item>
      </ToggleGroup.Root>
      <output>{value.join(',') || 'none'}</output>
    </>
  );
}

export const toggleGroupChecks: Record<string, QualityCheck> = {
  'toggle-group.selection': () => {
    const changes: string[][] = [];
    render(
      <>
        <ToggleGroup.Root
          aria-label="View"
          onValueChange={(value) => changes.push(value)}
        >
          <ToggleGroup.Item value="list">List</ToggleGroup.Item>
          <ToggleGroup.Item value="grid">Grid</ToggleGroup.Item>
        </ToggleGroup.Root>
        <ToggleGroup.Root aria-label="Format" multiple defaultValue={['bold']}>
          <ToggleGroup.Item value="bold">Bold</ToggleGroup.Item>
          <ToggleGroup.Item value="italic">Italic</ToggleGroup.Item>
        </ToggleGroup.Root>
        <ControlledAlign />
      </>,
    );
    const view = screen.getByRole('group', { name: 'View' });
    fireEvent.click(within(view).getByRole('button', { name: 'List' }));
    fireEvent.click(within(view).getByRole('button', { name: 'Grid' }));
    expect(pressed(view)).toEqual(['Grid']);
    fireEvent.click(within(view).getByRole('button', { name: 'Grid' }));
    expect(pressed(view)).toEqual([]);
    expect(changes).toEqual([['list'], ['grid'], []]);

    const format = screen.getByRole('group', { name: 'Format' });
    expect(pressed(format)).toEqual(['Bold']);
    fireEvent.click(within(format).getByRole('button', { name: 'Italic' }));
    expect(pressed(format)).toEqual(['Bold', 'Italic']);
    fireEvent.click(within(format).getByRole('button', { name: 'Bold' }));
    expect(pressed(format)).toEqual(['Italic']);

    const align = screen.getByRole('group', { name: 'Align' });
    fireEvent.click(within(align).getByRole('button', { name: 'Right' }));
    expect(pressed(align)).toEqual(['Right']);
    expect(screen.getByText('right')).toBeInTheDocument();
  },
  'toggle-group.names': async () => {
    for (const orientation of toggleGroupManifest.orientations) {
      const { container, unmount } = render(
        <>
          <span id="tools-label">Tools</span>
          <ToggleGroup.Root
            aria-labelledby="tools-label"
            orientation={orientation}
            defaultValue={['pen']}
          >
            <ToggleGroup.Item value="pen" variant="outline">
              Pen
            </ToggleGroup.Item>
            <ToggleGroup.Item
              value="eraser"
              variant="outline"
              iconOnly
              aria-label="Eraser"
            >
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 16 16"
              >
                <rect x="3" y="3" width="10" height="10" />
              </svg>
            </ToggleGroup.Item>
          </ToggleGroup.Root>
        </>,
      );
      const group = screen.getByRole('group', { name: 'Tools' });
      expect(group).toHaveAttribute('data-orientation', orientation);
      expect(group).not.toHaveAttribute('aria-orientation');
      expect(
        within(group).getByRole('button', { name: 'Pen', pressed: true }),
      ).toBeInTheDocument();
      expect(
        within(group).getByRole('button', { name: 'Eraser', pressed: false }),
      ).toBeInTheDocument();
      expect((await audit(container)).violations).toEqual([]);
      unmount();
    }
  },
  'toggle-group.roving-focus': () => {
    render(
      <ToggleGroup.Root aria-label="Size" orientation="vertical">
        <ToggleGroup.Item value="s" disabled>
          Small
        </ToggleGroup.Item>
        <ToggleGroup.Item value="m">Medium</ToggleGroup.Item>
        <ToggleGroup.Item value="l">Large</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    const [small, ...enabled] = ['Small', 'Medium', 'Large'].map((name) =>
      screen.getByRole('button', { name }),
    ) as [HTMLElement, ...HTMLElement[]];
    expect(enabled.map((item) => item.getAttribute('tabindex')).sort()).toEqual(
      ['-1', '0'],
    );
    expect(small).toBeDisabled();
    small.focus();
    expect(small).not.toHaveFocus();
  },
  'toggle-group.disabled-no-submit': () => {
    let submits = 0;
    const changes: string[][] = [];
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submits++;
        }}
      >
        <ToggleGroup.Root
          aria-label="Style"
          onValueChange={(value) => changes.push(value)}
        >
          <ToggleGroup.Item value="a">Enabled</ToggleGroup.Item>
          <ToggleGroup.Item value="b" disabled>
            Disabled item
          </ToggleGroup.Item>
        </ToggleGroup.Root>
        <ToggleGroup.Root
          aria-label="Locked"
          disabled
          onValueChange={(value) => changes.push(value)}
        >
          <ToggleGroup.Item value="c">In disabled group</ToggleGroup.Item>
        </ToggleGroup.Root>
      </form>,
    );
    const enabled = screen.getByRole('button', { name: 'Enabled' });
    expect(enabled).toHaveAttribute('type', 'button');
    fireEvent.click(enabled);
    for (const name of ['Disabled item', 'In disabled group']) {
      const item = screen.getByRole('button', { name });
      expect(item).toBeDisabled();
      fireEvent.click(item);
      expect(item).toHaveAttribute('aria-pressed', 'false');
    }
    expect(changes).toEqual([['a']]);
    expect(submits).toBe(0);
  },
};
