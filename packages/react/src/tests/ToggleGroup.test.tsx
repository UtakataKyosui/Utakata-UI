import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ToggleGroup,
  type ToggleGroupItemProps,
  type ToggleGroupRootProps,
} from '../components/ToggleGroup.js';
import {
  toggleGroupManifest,
  toggleGroupQualityRules,
} from '../metadata/components/ToggleGroup.js';
import { toggleGroupChecks } from './quality/ToggleGroup.checks.js';
import { expectAutomatedQuality, settle } from './quality-helpers.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Type fixtures checked by pnpm typecheck without rendering invalid JSX.
const named: ToggleGroupRootProps = { 'aria-label': 'Format', multiple: true };
const referenced: ToggleGroupRootProps = { 'aria-labelledby': 'format' };
// @ts-expect-error The group requires aria-label or aria-labelledby.
const unnamed: ToggleGroupRootProps = { multiple: true };
// @ts-expect-error Only one group name source may be passed.
const bothNames: ToggleGroupRootProps = {
  'aria-label': 'Format',
  'aria-labelledby': 'format',
};
// @ts-expect-error Values are arrays in both single and multiple mode.
const scalarValue: ToggleGroupRootProps = { 'aria-label': 'x', value: 'a' };
// @ts-expect-error Orientations are limited to the manifest.
const diagonal: ToggleGroupRootProps = { 'aria-label': 'x', orientation: 'd' };
const item: ToggleGroupItemProps = { value: 'bold', variant: 'outline' };
// @ts-expect-error Every item needs a value.
const noValue: ToggleGroupItemProps = { children: 'Bold' };
// @ts-expect-error Icon-only items keep the Toggle name requirement.
const unnamedIcon: ToggleGroupItemProps = { value: 'b', iconOnly: true };
// @ts-expect-error Pressed state belongs to ToggleGroup.Root.
const pressedItem: ToggleGroupItemProps = { value: 'b', pressed: true };
void [
  named,
  referenced,
  unnamed,
  bothNames,
  scalarValue,
  diagonal,
  item,
  noValue,
  unnamedIcon,
  pressedItem,
];

describe('ToggleGroup', () => {
  it('applies defaults, className and refs', () => {
    const rootRef = createRef<HTMLDivElement>();
    const itemRef = createRef<HTMLButtonElement>();
    render(
      <ToggleGroup.Root ref={rootRef} aria-label="Format" className="custom">
        <ToggleGroup.Item ref={itemRef} value="bold" size="sm" className="c">
          Bold
        </ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    const group = screen.getByRole('group', { name: 'Format' });
    expect(rootRef.current).toBe(group);
    expect(group).toHaveClass(
      'ui-toggle-group',
      'ui-toggle-group--horizontal',
      'custom',
    );
    expect(group).toHaveAttribute('data-orientation', 'horizontal');
    const bold = screen.getByRole('button', { name: 'Bold' });
    expect(itemRef.current).toBe(bold);
    expect(bold).toHaveClass(
      'ui-toggle',
      'ui-toggle--ghost',
      'ui-toggle--sm',
      'ui-toggle-group__item',
      'c',
    );
    expect(toggleGroupManifest.props.multiple.default).toBe(false);
    expect(toggleGroupManifest.props.orientation.default).toBe('horizontal');
  });

  it('passes the automated quality rules', async () => {
    const report = await expectAutomatedQuality(
      toggleGroupQualityRules,
      toggleGroupChecks,
    );
    expect(report.complete).toBe(false);
  });

  it('warns in development for unnamed groups and items only', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const view = render(
      <ToggleGroup.Root aria-label="Format">
        <ToggleGroup.Item value="bold">Bold</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    await settle();
    expect(warn).not.toHaveBeenCalled();
    view.rerender(
      <ToggleGroup.Root aria-labelledby="missing">
        <ToggleGroup.Item value="bold">
          <span aria-hidden="true">B</span>
        </ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    await waitFor(() => {
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          '[Utakata-UI a11y] ToggleGroup.Root: aria-labelledby must reference existing elements',
        ),
      );
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          '[Utakata-UI a11y] Toggle: No accessible name source',
        ),
      );
    });
  });
});
