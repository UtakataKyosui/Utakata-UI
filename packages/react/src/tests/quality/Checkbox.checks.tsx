import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { expect } from 'vitest';
import { Checkbox } from '../../components/Checkbox.js';
import { Field } from '../../components/Field.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';
import { pressSpace } from '../quality-helpers.js';

function ControlledCheckbox() {
  const [checked, setChecked] = useState(false);
  return (
    <>
      <label>
        <Checkbox.Root checked={checked} onCheckedChange={setChecked}>
          <Checkbox.Indicator />
        </Checkbox.Root>
        Controlled
      </label>
      <button type="button" onClick={() => setChecked(true)}>
        Check from outside
      </button>
    </>
  );
}

export const checkboxChecks: Record<string, QualityCheck> = {
  'checkbox.name-state': async () => {
    const { container } = render(
      <>
        <Field.Root name="terms">
          <Checkbox.Root>
            <Checkbox.Indicator />
          </Checkbox.Root>
          <Field.Label>Accept the terms</Field.Label>
        </Field.Root>
        <label>
          <Checkbox.Root defaultChecked>
            <Checkbox.Indicator />
          </Checkbox.Root>
          Newsletter
        </label>
        <label>
          <Checkbox.Root indeterminate>
            <Checkbox.Indicator />
          </Checkbox.Root>
          All items
        </label>
      </>,
    );
    expect(
      screen.getByRole('checkbox', { name: 'Accept the terms' }),
    ).toHaveAttribute('aria-checked', 'false');
    expect(
      screen.getByRole('checkbox', { name: 'Newsletter' }),
    ).toHaveAttribute('aria-checked', 'true');
    const mixed = screen.getByRole('checkbox', { name: 'All items' });
    expect(mixed).toHaveAttribute('aria-checked', 'mixed');
    expect(mixed.querySelector('.ui-checkbox__indicator')).toHaveAttribute(
      'data-indeterminate',
    );
    expect((await audit(container)).violations).toEqual([]);
  },
  'checkbox.keyboard-pointer': () => {
    const changes: boolean[] = [];
    render(
      <>
        <Field.Root>
          <Checkbox.Root onCheckedChange={(checked) => changes.push(checked)} />
          <Field.Label>Remember me</Field.Label>
        </Field.Root>
        <label>
          <Checkbox.Root disabled onCheckedChange={() => changes.push(false)} />
          Disabled
        </label>
      </>,
    );
    const checkbox = screen.getByRole('checkbox', { name: 'Remember me' });
    pressSpace(checkbox);
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByText('Remember me'));
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
    expect(changes).toEqual([true, false]);
    const disabled = screen.getByRole('checkbox', { name: 'Disabled' });
    pressSpace(disabled);
    fireEvent.click(disabled);
    expect(disabled).toHaveAttribute('aria-checked', 'false');
    expect(changes).toEqual([true, false]);
  },
  'checkbox.form': async () => {
    const { container } = render(
      <form>
        <label>
          <Checkbox.Root name="terms" value="accepted" defaultChecked>
            <Checkbox.Indicator />
          </Checkbox.Root>
          Terms
        </label>
        <ControlledCheckbox />
      </form>,
    );
    const form = container.querySelector('form') as HTMLFormElement;
    expect(new FormData(form).get('terms')).toBe('accepted');
    const terms = screen.getByRole('checkbox', { name: 'Terms' });
    fireEvent.click(terms);
    expect(new FormData(form).has('terms')).toBe(false);
    form.reset();
    expect(new FormData(form).get('terms')).toBe('accepted');
    await waitFor(() =>
      // Reset remounts the control, so query the new element.
      expect(screen.getByRole('checkbox', { name: 'Terms' })).toHaveAttribute(
        'aria-checked',
        'true',
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Check from outside' }));
    expect(
      screen.getByRole('checkbox', { name: 'Controlled' }),
    ).toHaveAttribute('aria-checked', 'true');
    expect(container.querySelectorAll('input[type="checkbox"]')).toHaveLength(
      2,
    );
  },
};
