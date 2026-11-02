import { fireEvent, render, screen } from '@testing-library/react';
import { expect } from 'vitest';
import { Field } from '../../components/Field.js';
import { NativeSelect } from '../../components/NativeSelect.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

function CountryOptions() {
  return (
    <>
      <option value="jp">Japan</option>
      <optgroup label="Americas">
        <option value="us">United States</option>
        <option value="ca" disabled>
          Canada
        </option>
      </optgroup>
    </>
  );
}

export const nativeSelectChecks: Record<string, QualityCheck> = {
  'native-select.field-association': async () => {
    const { container } = render(
      <Field.Root name="country">
        <Field.Label>Country</Field.Label>
        <NativeSelect defaultValue="jp">
          <CountryOptions />
        </NativeSelect>
        <Field.Description>Used for shipping.</Field.Description>
      </Field.Root>,
    );
    expect(container.querySelectorAll('select')).toHaveLength(1);
    const select = screen.getByRole('combobox', { name: 'Country' });
    expect(select).toHaveAccessibleDescription('Used for shipping.');
    expect((screen.getByText('Country') as HTMLLabelElement).control).toBe(
      select,
    );
    const icon = container.querySelector('.ui-native-select__icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect((await audit(container)).violations).toEqual([]);
  },
  'native-select.value-form': () => {
    const values: string[] = [];
    const { container } = render(
      <form>
        <Field.Root name="country">
          <Field.Label>Country</Field.Label>
          <NativeSelect
            defaultValue="jp"
            onChange={(event) => values.push(event.currentTarget.value)}
          >
            <CountryOptions />
          </NativeSelect>
        </Field.Root>
      </form>,
    );
    const select = screen.getByRole('combobox', { name: 'Country' });
    expect(screen.getByRole('group', { name: 'Americas' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Canada' })).toBeDisabled();
    fireEvent.change(select, { target: { value: 'us' } });
    expect(values).toEqual(['us']);
    const form = container.querySelector('form') as HTMLFormElement;
    expect(new FormData(form).get('country')).toBe('us');
    form.reset();
    expect(select).toHaveValue('jp');
  },
  'native-select.disabled': () => {
    const { container } = render(
      <form>
        <NativeSelect aria-label="Country" name="country" disabled>
          <CountryOptions />
        </NativeSelect>
      </form>,
    );
    const select = screen.getByRole('combobox', { name: 'Country' });
    expect(select).toBeDisabled();
    select.focus();
    expect(select).not.toHaveFocus();
    const form = container.querySelector('form') as HTMLFormElement;
    expect(new FormData(form).has('country')).toBe(false);
  },
};
