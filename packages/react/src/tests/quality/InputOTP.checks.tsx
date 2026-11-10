import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { expect } from 'vitest';
import { Field } from '../../components/Field.js';
import { InputOTP } from '../../components/InputOTP.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

export const getSlotLabel = (position: number, length: number) =>
  `Digit ${position} of ${length}`;

export function Code({
  invalid,
  ...props
}: Partial<ComponentProps<typeof InputOTP.Root>> & { invalid?: boolean }) {
  return (
    <main>
      <form>
        <Field.Root invalid={invalid}>
          <Field.Label>Verification code</Field.Label>
          <InputOTP.Root
            name="code"
            length={4}
            getSlotLabel={getSlotLabel}
            {...props}
          >
            <InputOTP.Slot />
            <InputOTP.Slot />
            <InputOTP.Separator />
            <InputOTP.Slot />
            <InputOTP.Slot />
          </InputOTP.Root>
          <Field.Error match>
            The code is not valid. Request a new code.
          </Field.Error>
        </Field.Root>
        <button type="submit">Verify</button>
      </form>
    </main>
  );
}

const slot = (index: number) => slots()[index] as HTMLInputElement;
const slots = () => screen.getAllByRole('textbox') as HTMLInputElement[];
const values = () => slots().map((slot) => slot.value);
const formValue = () =>
  [...new FormData(document.querySelector('form') as HTMLFormElement)].at(0);

export const inputOTPChecks: Record<string, QualityCheck> = {
  'input-otp.name-slots': async () => {
    const { container } = render(<Code />);
    const group = screen.getByRole('group', { name: 'Verification code' });
    const inputs = slots();
    expect(group).toContainElement(inputs[0] as HTMLElement);
    expect(inputs).toHaveLength(4);
    expect(inputs[0] as HTMLElement).toHaveAccessibleName('Verification code');
    expect(
      inputs.slice(1).map((slot) => slot.getAttribute('aria-label')),
    ).toEqual(['Digit 2 of 4', 'Digit 3 of 4', 'Digit 4 of 4']);
    for (const slot of inputs.slice(1))
      expect(slot).not.toHaveAttribute('aria-labelledby');
    // The separator is decorative: it adds no extra announced element.
    expect(screen.queryByRole('separator')).toBeNull();
    expect((await audit(container)).violations).toEqual([]);
  },
  'input-otp.entry-form': async () => {
    const invalid: string[] = [];
    const complete: string[] = [];
    const changes: string[] = [];
    render(
      <Code
        onValueInvalid={(value) => invalid.push(value)}
        onValueComplete={(value) => complete.push(value)}
        onValueChange={(value) => changes.push(value)}
      />,
    );
    const first = slot(0);
    first.focus();
    // Typing fills slots in order and advances focus.
    fireEvent.change(first, { target: { value: '1' } });
    await waitFor(() => expect(slot(1)).toHaveFocus());
    fireEvent.change(slot(1), { target: { value: '2' } });
    await waitFor(() => expect(values()).toEqual(['1', '2', '', '']));
    // Characters rejected by validationType are reported and not entered.
    fireEvent.change(slot(2), { target: { value: 'x' } });
    expect(invalid).toEqual(['x']);
    expect(values()).toEqual(['1', '2', '', '']);
    // Backspace on an empty slot clears the previous character.
    await waitFor(() => expect(slot(2)).toHaveFocus());
    fireEvent.keyDown(slot(2), { key: 'Backspace' });
    await waitFor(() => expect(values()).toEqual(['1', '', '', '']));
    await waitFor(() => expect(slot(1)).toHaveFocus());
    // Arrow keys move between slots.
    fireEvent.keyDown(slot(1), { key: 'ArrowLeft' });
    await waitFor(() => expect(slot(0)).toHaveFocus());
    // Paste distributes characters across slots and completes the code.
    fireEvent.paste(slot(0), {
      clipboardData: { getData: () => '5678' },
    });
    await waitFor(() => expect(values()).toEqual(['5', '6', '7', '8']));
    expect(complete).toEqual(['5678']);
    expect(changes.at(-1)).toBe('5678');
    // The value is submitted with the form; completion does not submit it.
    expect(formValue()).toEqual(['code', '5678']);
    // Pasted text with rejected characters keeps only valid ones.
    fireEvent.paste(slot(0), {
      clipboardData: { getData: () => '12 ab' },
    });
    expect(invalid).toContain('12 ab');
  },
  'input-otp.error': async () => {
    const { container } = render(<Code invalid />);
    for (const slot of slots())
      expect(slot).toHaveAttribute('aria-invalid', 'true');
    const group = screen.getByRole('group', { name: 'Verification code' });
    const message = await screen.findByText(
      'The code is not valid. Request a new code.',
    );
    expect(group.getAttribute('aria-describedby')).toContain(message.id);
    expect((await audit(container)).violations).toEqual([]);
  },
};
