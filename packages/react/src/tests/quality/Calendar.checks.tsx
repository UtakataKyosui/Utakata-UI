import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, vi } from 'vitest';
import { Calendar } from '../../components/Calendar.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

const day = (name: string | RegExp) => screen.getByRole('button', { name });

export const calendarChecks: Record<string, QualityCheck> = {
  'calendar.structure': async () => {
    const { container } = render(
      <Calendar
        aria-label="Booking date"
        locale="en-US"
        today="2026-11-10"
        defaultValue="2026-11-12"
        defaultMonth="2026-11"
        isDateDisabled={(date) => date === '2026-11-13'}
      />,
    );
    const group = screen.getByRole('group', { name: 'Booking date' });
    const grid = within(group).getByRole('grid', { name: 'November 2026' });
    expect(within(grid).getAllByRole('columnheader')).toHaveLength(7);
    expect(day('Tuesday, November 10, 2026')).toHaveAttribute(
      'aria-current',
      'date',
    );
    expect(day('Thursday, November 12, 2026').closest('td')).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(day('Friday, November 13, 2026')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(container.querySelectorAll('[aria-selected="true"]')).toHaveLength(
      1,
    );
    expect((await audit(container)).violations).toEqual([]);
  },
  'calendar.selection': async () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <Calendar
        aria-label="Stay"
        mode="range"
        locale="en-US"
        today="2026-11-10"
        defaultMonth="2026-11"
        minDate="2026-11-03"
        isDateDisabled={(date) => date === '2026-11-20'}
        onValueChange={onValueChange}
      />,
    );
    fireEvent.click(day(/November 2, 2026/));
    fireEvent.click(day(/November 20, 2026/));
    expect(onValueChange).not.toHaveBeenCalled();
    fireEvent.click(day(/November 12, 2026/));
    fireEvent.click(day(/November 5, 2026/));
    expect(onValueChange).toHaveBeenLastCalledWith({
      from: '2026-11-05',
      to: '2026-11-12',
    });
    expect(container.querySelectorAll('[aria-selected="true"]')).toHaveLength(
      8,
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Thursday, November 5 – Thursday, November 12, 2026',
    );
    fireEvent.click(day(/November 15, 2026/));
    expect(onValueChange).toHaveBeenLastCalledWith({ from: '2026-11-15' });
    expect((await audit(container)).violations).toEqual([]);
  },
  'calendar.month-navigation': async () => {
    const onMonthChange = vi.fn();
    const { container } = render(
      <Calendar
        aria-label="Trip"
        locale="en-US"
        today="2026-11-10"
        defaultMonth="2026-11"
        minDate="2026-10-15"
        onMonthChange={onMonthChange}
      />,
    );
    const previous = screen.getByRole('button', { name: '前の月' });
    fireEvent.click(previous);
    expect(onMonthChange).toHaveBeenLastCalledWith('2026-10');
    expect(screen.getByRole('grid', { name: 'October 2026' })).toBeVisible();
    expect(previous).toHaveAttribute('aria-disabled', 'true');
    previous.focus();
    fireEvent.click(previous);
    expect(onMonthChange).toHaveBeenCalledTimes(1);
    expect(previous).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: '次の月' }));
    expect(screen.getByRole('grid', { name: 'November 2026' })).toBeVisible();
    expect((await audit(container)).violations).toEqual([]);
  },
  'calendar.locale-boundaries': async () => {
    const { container, rerender } = render(
      <Calendar
        aria-label="Leap"
        locale="en-US"
        defaultMonth="2024-02"
        today="2024-02-10"
      />,
    );
    expect(container.querySelectorAll('[data-date]')).toHaveLength(29);
    rerender(
      <Calendar
        aria-label="Leap"
        locale="en-US"
        defaultMonth="2024-02"
        today="2024-02-10"
        weekStartsOn={1}
      />,
    );
    const headers = screen.getAllByRole('columnheader');
    expect(headers[0]).toHaveAccessibleName('Monday');
    expect(headers[6]).toHaveAccessibleName('Sunday');
    // Feb 1, 2024 is a Thursday: three empty cells before it when Monday starts.
    expect(
      container.querySelector('tbody tr:first-child td:nth-child(4) button'),
    ).toHaveAttribute('data-date', '2024-02-01');
    // A month-end day moved by month keeps a real date and crosses the year.
    const { container: other } = render(
      <Calendar
        aria-label="Year end"
        defaultMonth="2026-12"
        defaultValue="2026-12-31"
        today="2026-12-31"
      />,
    );
    const target = within(other).getByRole('button', {
      name: /2026年12月31日/,
    });
    target.focus();
    fireEvent.keyDown(target, { key: 'ArrowRight' });
    expect(within(other).getByText('2027年1月')).toBeVisible();
    expect((await audit(container)).violations).toEqual([]);
  },
};
