import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  Checkbox,
  type CheckboxIndicatorProps,
  type CheckboxRootProps,
} from '../components/Checkbox.js';
import { Field } from '../components/Field.js';
import {
  checkboxManifest,
  checkboxQualityRules,
} from '../metadata/components/Checkbox.js';
import { checkboxChecks } from './quality/Checkbox.checks.js';
import { expectAutomatedQuality, settle } from './quality-helpers.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Type fixtures checked by pnpm typecheck.
const validRoot: CheckboxRootProps = { indeterminate: true, value: 'yes' };
const validIndicator: CheckboxIndicatorProps = { keepMounted: true };
// @ts-expect-error Checkbox values are strings.
const numericValue: CheckboxRootProps = { value: 1 };
// @ts-expect-error className must be a string.
const functionClass: CheckboxRootProps = { className: () => 'x' };
void [validRoot, validIndicator, numericValue, functionClass];

describe('Checkbox', () => {
  it.each([false, true])(
    'preserves changed selection when reset is canceled (default %s)',
    async (defaultChecked) => {
      const formRef = createRef<HTMLFormElement>();
      render(
        <form ref={formRef} onReset={(event) => event.preventDefault()}>
          <Checkbox.Root
            aria-label="Accept"
            name="terms"
            value="yes"
            defaultChecked={defaultChecked}
          />
        </form>,
      );
      const checkbox = screen.getByRole('checkbox', { name: 'Accept' });
      fireEvent.click(checkbox);
      expect(checkbox).toHaveAttribute('aria-checked', String(!defaultChecked));
      act(() => formRef.current?.reset());
      await settle();
      expect(screen.getByRole('checkbox', { name: 'Accept' })).toBe(checkbox);
      expect(checkbox).toHaveAttribute('aria-checked', String(!defaultChecked));
      expect(
        new FormData(formRef.current as HTMLFormElement).get('terms'),
      ).toBe(defaultChecked ? null : 'yes');
    },
  );

  it('forwards className and refs to Root and Indicator', () => {
    const rootRef = createRef<HTMLElement>();
    const indicatorRef = createRef<HTMLSpanElement>();
    render(
      <Checkbox.Root
        ref={rootRef}
        className="custom"
        aria-label="Agree"
        defaultChecked
      >
        <Checkbox.Indicator ref={indicatorRef} className="mark" />
      </Checkbox.Root>,
    );
    const checkbox = screen.getByRole('checkbox', { name: 'Agree' });
    expect(checkbox).toHaveClass('ui-checkbox', 'custom');
    expect(rootRef.current).toBe(checkbox);
    expect(indicatorRef.current).toHaveClass('ui-checkbox__indicator', 'mark');
    expect(checkboxManifest.parts).toEqual(['Root', 'Indicator']);
  });

  it('marks disabled and required states', () => {
    render(
      <>
        <Checkbox.Root aria-label="Disabled" disabled />
        <Checkbox.Root aria-label="Required" required />
      </>,
    );
    expect(screen.getByRole('checkbox', { name: 'Disabled' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('checkbox', { name: 'Required' })).toHaveAttribute(
      'aria-required',
      'true',
    );
  });

  it('satisfies automated quality rules', async () => {
    await expectAutomatedQuality(checkboxQualityRules, checkboxChecks);
  });

  it('warns without a name source and stays quiet with labels', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const view = render(
      <>
        <Field.Root>
          <Checkbox.Root />
          <Field.Label>Accept</Field.Label>
        </Field.Root>
        <label>
          <Checkbox.Root />
          Wrapped
        </label>
      </>,
    );
    await settle();
    expect(warn).not.toHaveBeenCalled();
    view.unmount();
    render(<Checkbox.Root />);
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          '[Utakata-UI a11y] Checkbox.Root: No accessible name source',
        ),
      ),
    );
  });
});
