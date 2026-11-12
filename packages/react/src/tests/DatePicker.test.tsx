import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { type CalendarDate, DatePicker } from '../index.js';

function ControlledExample() {
  const [date, setDate] = useState<CalendarDate | null>(null);
  return (
    <DatePicker
      label="Date"
      value={date}
      onValueChange={setDate}
      locale="en-US"
      labels={{
        openCalendar: 'Open calendar',
        calendarTitle: 'Choose date',
      }}
    />
  );
}

describe('DatePicker', () => {
  it('uses native form validation without losing malformed or unavailable text', () => {
    const change = vi.fn();
    render(
      <form aria-label="Booking">
        <DatePicker
          label="Date"
          name="date"
          minDate="2024-02-01"
          maxDate="2024-03-01"
          isDateDisabled={(date) => date === '2024-02-28'}
          onValueChange={change}
        />
      </form>,
    );
    const input = screen.getByRole<HTMLInputElement>('textbox', {
      name: 'Date',
    });
    const form = screen.getByRole<HTMLFormElement>('form', { name: 'Booking' });
    expect(form.checkValidity()).toBe(true);

    for (const date of [
      '2024-02-30',
      '2024-02-28',
      '2024-03-02',
      '2024-01-31',
    ]) {
      fireEvent.change(input, { target: { value: date } });
      fireEvent.blur(input);
      expect(input).toHaveValue(date);
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).not.toBeValid();
    }
    expect(change).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: '2024-02-29' } });
    expect(input).toBeValid();
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(new FormData(form).get('date')).toBe('2024-02-29');
    expect(change).toHaveBeenLastCalledWith('2024-02-29');

    fireEvent.change(input, { target: { value: '' } });
    expect(input).toBeValid();
    expect(change).toHaveBeenLastCalledWith(null);
  });

  it('resets an associated external form and preserves text when reset is canceled', async () => {
    const change = vi.fn();
    const prevent = vi.fn((event) => event.preventDefault());
    render(
      <>
        <form id="booking" aria-label="Booking" />
        <DatePicker
          label="Date"
          name="date"
          form="booking"
          defaultValue="2026-11-10"
          onValueChange={change}
        />
      </>,
    );
    const form = screen.getByRole<HTMLFormElement>('form');
    const input = screen.getByRole('textbox', { name: 'Date' });
    fireEvent.change(input, { target: { value: '2026-11-20' } });
    form.addEventListener('reset', prevent, { once: true });
    await act(async () => form.reset());
    expect(prevent).toHaveBeenCalledOnce();
    expect(input).toHaveValue('2026-11-20');

    fireEvent.change(input, { target: { value: 'invalid' } });
    fireEvent.blur(input);
    await act(async () => form.reset());
    expect(input).toHaveValue('2026-11-10');
    expect(input).toBeValid();
    expect(change).toHaveBeenLastCalledWith('2026-11-10');
  });

  it('syncs controlled changes, opens on the typed month and selects a day', async () => {
    render(<ControlledExample />);
    const input = screen.getByRole('textbox', { name: 'Date' });
    fireEvent.change(input, { target: { value: '2026-11-10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    expect(
      await screen.findByRole('dialog', { name: 'Choose date' }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /November 11, 2026/ }));
    expect(input).toHaveValue('2026-11-11');
  });

  it('keeps disabled fields out of form data and validates required empty fields', () => {
    render(
      <form aria-label="Booking">
        <DatePicker label="Required date" name="requiredDate" required />
        <DatePicker
          label="Disabled date"
          name="disabledDate"
          disabled
          defaultValue="2026-11-10"
        />
      </form>,
    );
    const form = screen.getByRole<HTMLFormElement>('form');
    expect(
      screen.getByRole('textbox', { name: 'Required date' }),
    ).not.toBeValid();
    expect(
      screen.getByRole('textbox', { name: 'Disabled date' }),
    ).toBeDisabled();
    expect(new FormData(form).has('disabledDate')).toBe(false);
  });
});
