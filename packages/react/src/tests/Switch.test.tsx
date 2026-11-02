import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Field } from '../components/Field.js';
import { Switch, type SwitchRootProps } from '../components/Switch.js';
import {
  switchManifest,
  switchQualityRules,
} from '../metadata/components/Switch.js';
import { switchChecks } from './quality/Switch.checks.js';
import { expectAutomatedQuality, settle } from './quality-helpers.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Type fixtures checked by pnpm typecheck.
const validRoot: SwitchRootProps = { readOnly: true, name: 'n', value: 'on' };
// @ts-expect-error Switch has no mixed state.
const indeterminate: SwitchRootProps = { indeterminate: true };
// @ts-expect-error className must be a string.
const functionClass: SwitchRootProps = { className: () => 'x' };
void [validRoot, indeterminate, functionClass];

describe('Switch', () => {
  it('forwards className and refs to Root and Thumb', () => {
    const rootRef = createRef<HTMLElement>();
    const thumbRef = createRef<HTMLSpanElement>();
    render(
      <Switch.Root ref={rootRef} className="custom" aria-label="Sound">
        <Switch.Thumb ref={thumbRef} className="knob" />
      </Switch.Root>,
    );
    const control = screen.getByRole('switch', { name: 'Sound' });
    expect(control).toHaveClass('ui-switch', 'custom');
    expect(rootRef.current).toBe(control);
    expect(thumbRef.current).toHaveClass('ui-switch__thumb', 'knob');
    expect(switchManifest.parts).toEqual(['Root', 'Thumb']);
  });

  it('marks disabled and required states', () => {
    render(
      <>
        <Switch.Root aria-label="Disabled" disabled />
        <Switch.Root aria-label="Required" required />
      </>,
    );
    expect(screen.getByRole('switch', { name: 'Disabled' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('switch', { name: 'Required' })).toHaveAttribute(
      'aria-required',
      'true',
    );
  });

  it('satisfies automated quality rules', async () => {
    await expectAutomatedQuality(switchQualityRules, switchChecks);
  });

  it('warns without a name source and stays quiet with labels', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const view = render(
      <>
        <Field.Root>
          <Switch.Root />
          <Field.Label>Notifications</Field.Label>
        </Field.Root>
        <label>
          <Switch.Root />
          Wrapped
        </label>
      </>,
    );
    await settle();
    expect(warn).not.toHaveBeenCalled();
    view.unmount();
    render(<Switch.Root />);
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          '[Utakata-UI a11y] Switch.Root: No accessible name source',
        ),
      ),
    );
  });
});
