import { act, fireEvent, render, screen } from '@testing-library/react';
import { expect } from 'vitest';
import { DatePicker } from '../../index.js';

export const datePickerChecks = {
  'date-picker.form': async () => {
    render(
      <form aria-label="Booking">
        <DatePicker label="Date" name="date" defaultValue="2026-11-10" />
        <DatePicker label="Disabled date" name="disabledDate" disabled />
      </form>,
    );
    const form = screen.getByRole<HTMLFormElement>('form');
    const input = screen.getByRole('textbox', { name: 'Date' });
    expect(input).toHaveAccessibleDescription(/YYYY-MM-DD/);
    expect(new FormData(form).get('date')).toBe('2026-11-10');
    expect(new FormData(form).has('disabledDate')).toBe(false);
    fireEvent.change(input, { target: { value: '2026-02-29' } });
    fireEvent.blur(input);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(/有効な日付/);
    expect(input).not.toBeValid();
    await act(async () => form.reset());
    expect(input).toBeValid();
    expect(input).toHaveValue('2026-11-10');
  },
};
