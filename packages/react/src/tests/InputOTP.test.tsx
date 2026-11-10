import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { type ComponentProps, createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Field } from '../components/Field.js';
import { InputOTP } from '../components/InputOTP.js';
import {
  inputOTPManifest,
  inputOTPQualityRules,
} from '../metadata/components/InputOTP.js';
import {
  Code,
  getSlotLabel,
  inputOTPChecks,
} from './quality/InputOTP.checks.js';
import { expectAutomatedQuality, settle } from './quality-helpers.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Checked by pnpm typecheck without rendering invalid JSX.
type RootProps = ComponentProps<typeof InputOTP.Root>;
const valid: RootProps = { length: 6, getSlotLabel, validationType: 'numeric' };
// @ts-expect-error getSlotLabel is required so slots are not duplicate names.
const noSlotLabel: RootProps = { length: 6 };
// @ts-expect-error autoSubmit would change context without warning.
const autoSubmit: RootProps = { length: 6, getSlotLabel, autoSubmit: true };
// @ts-expect-error aria-label would leave the first slot unnamed.
const rootLabel: RootProps = { length: 6, getSlotLabel, 'aria-label': 'Code' };
const callbackClass: RootProps = {
  length: 6,
  getSlotLabel,
  // @ts-expect-error className must be a string, not a Base UI state callback.
  className: () => 'x',
};
void [valid, noSlotLabel, autoSubmit, rootLabel, callbackClass];

describe('InputOTP', () => {
  it('uses Base UI defaults and forwards className and refs', () => {
    const rootRef = createRef<HTMLDivElement>();
    const slotRef = createRef<HTMLInputElement>();
    render(
      <Field.Root>
        <Field.Label>Code</Field.Label>
        <InputOTP.Root
          ref={rootRef}
          className="root"
          length={2}
          getSlotLabel={getSlotLabel}
        >
          <InputOTP.Slot ref={slotRef} className="slot" />
          <InputOTP.Separator className="separator" />
          <InputOTP.Slot />
        </InputOTP.Root>
      </Field.Root>,
    );
    const [first] = screen.getAllByRole('textbox');
    expect(slotRef.current).toBe(first);
    expect(rootRef.current).toHaveClass('ui-input-otp', 'root');
    expect(first).toHaveClass('ui-input-otp__slot', 'slot');
    expect(document.querySelector('.separator')).toHaveClass(
      'ui-input-otp__separator',
    );
    expect(first).toHaveAttribute('autocomplete', 'one-time-code');
    expect(first).toHaveAttribute('inputmode', 'numeric');
    expect(inputOTPManifest.defaults.validationType).toBe('numeric');
    expect(inputOTPManifest.defaults.autoComplete).toBe('one-time-code');
  });

  it('follows a controlled value and disabled state', () => {
    const view = render(<Code value="12" disabled onValueChange={() => {}} />);
    expect(
      screen
        .getAllByRole('textbox')
        .map((slot) => (slot as HTMLInputElement).value),
    ).toEqual(['1', '2', '', '']);
    for (const slot of screen.getAllByRole('textbox'))
      expect(slot).toBeDisabled();
    view.rerender(<Code value="123" disabled onValueChange={() => {}} />);
    expect((screen.getAllByRole('textbox')[2] as HTMLInputElement).value).toBe(
      '3',
    );
  });

  it('names slots without diagnostics inside Field.Root', async () => {
    const warn = vi.spyOn(console, 'warn');
    render(<Code />);
    await settle();
    expect(
      warn.mock.calls.filter(([message]) =>
        String(message).startsWith('[Utakata-UI a11y]'),
      ),
    ).toEqual([]);
  });

  it('names slots from aria-labelledby on Root', async () => {
    const warn = vi.spyOn(console, 'warn');
    render(
      <>
        <span id="otp-name">Backup code</span>
        <InputOTP.Root
          length={2}
          aria-labelledby="otp-name"
          getSlotLabel={getSlotLabel}
        >
          <InputOTP.Slot />
          <InputOTP.Slot />
        </InputOTP.Root>
      </>,
    );
    await settle();
    expect(
      screen.getByRole('group', { name: 'Backup code' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('textbox')[0]).toHaveAccessibleName(
      'Backup code',
    );
    expect(screen.getAllByRole('textbox')[1]).toHaveAccessibleName(
      'Digit 2 of 2',
    );
    expect(
      warn.mock.calls.filter(([message]) =>
        String(message).startsWith('[Utakata-UI a11y]'),
      ),
    ).toEqual([]);
  });

  it('warns for an unlabelled code', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <InputOTP.Root length={2} getSlotLabel={getSlotLabel}>
        <InputOTP.Slot />
        <InputOTP.Slot />
      </InputOTP.Root>,
    );
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          '[Utakata-UI a11y] InputOTP.Slot: No accessible name source',
        ),
      ),
    );
  });

  it('passes all automated quality rules without diagnostics', async () => {
    await expectAutomatedQuality(inputOTPQualityRules, inputOTPChecks);
  });
});
