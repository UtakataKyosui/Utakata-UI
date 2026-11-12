import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  Calendar,
  type CalendarProps,
  type CalendarRange,
} from '../components/Calendar.js';
import { calendarQualityRules } from '../metadata/components/Calendar.js';
import { calendarChecks } from './quality/Calendar.checks.js';
import { expectAutomatedQuality } from './quality-helpers.js';

// Checked by pnpm typecheck.
const single: CalendarProps = { 'aria-label': 'Date', value: '2026-11-10' };
const range: CalendarProps = {
  'aria-labelledby': 'heading',
  mode: 'range',
  value: { from: '2026-11-10', to: '2026-11-12' },
};
// @ts-expect-error The calendar needs a name.
const unnamed: CalendarProps = { value: '2026-11-10' };
// @ts-expect-error aria-label and aria-labelledby are mutually exclusive.
const bothNames: CalendarProps = { 'aria-label': 'a', 'aria-labelledby': 'b' };
// @ts-expect-error Dates are plain ISO strings, not Date objects.
const dateObject: CalendarProps = { 'aria-label': 'a', value: new Date() };
const rangeString: CalendarProps = {
  'aria-label': 'a',
  mode: 'range',
  // @ts-expect-error A range needs a { from, to } object.
  value: '2026-11-10',
};
const singleRange: CalendarProps = {
  'aria-label': 'a',
  // @ts-expect-error A single value is not a range.
  value: { from: '2026-11-10' },
};
// @ts-expect-error weekStartsOn is 0 to 6.
const badWeek: CalendarProps = { 'aria-label': 'a', weekStartsOn: 7 };
// @ts-expect-error Month values are YYYY-MM strings.
const badMonth: CalendarProps = { 'aria-label': 'a', month: 'November' };
void [single, range, unnamed, bothNames, dateObject, rangeString, singleRange];
void [badWeek, badMonth];
const unnamedProps = { value: '2026-11-10' as const };
// @ts-expect-error Spreads cannot omit the name.
const spreadUnnamed = <Calendar {...unnamedProps} />;
void spreadUnnamed;

afterEach(cleanup);

const day = (name: string | RegExp) => screen.getByRole('button', { name });

describe('Calendar', () => {
  it('uses defaults, the ref and className', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Calendar
        ref={ref}
        aria-label="日付"
        className="custom"
        today="2026-11-10"
      />,
    );
    expect(screen.getByRole('group', { name: '日付' })).toBe(ref.current);
    expect(ref.current).toHaveClass('ui-calendar', 'custom');
    expect(screen.getByRole('grid', { name: '2026年11月' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: '日曜日' })).toBeVisible();
    expect(day('2026年11月10日火曜日')).toHaveAttribute('aria-current', 'date');
  });

  it('moves focus with a single Tab stop and arrow keys across months', () => {
    const onMonthChange = vi.fn();
    render(
      <Calendar
        aria-label="Date"
        locale="en-US"
        today="2026-11-10"
        onMonthChange={onMonthChange}
      />,
    );
    const stops = screen
      .getAllByRole('button')
      .filter((button) => button.getAttribute('tabindex') === '0');
    expect(stops.map((button) => button.getAttribute('data-date'))).toEqual([
      '2026-11-10',
    ]);
    const press = (key: string, options = {}) =>
      fireEvent.keyDown(document.activeElement as HTMLElement, {
        key,
        ...options,
      });
    stops[0]?.focus();
    press('ArrowDown');
    expect(document.activeElement).toHaveAttribute('data-date', '2026-11-17');
    press('Home');
    expect(document.activeElement).toHaveAttribute('data-date', '2026-11-15');
    press('End');
    expect(document.activeElement).toHaveAttribute('data-date', '2026-11-21');
    press('PageDown');
    expect(onMonthChange).toHaveBeenLastCalledWith('2026-12');
    expect(document.activeElement).toHaveAttribute('data-date', '2026-12-21');
    press('PageUp', { shiftKey: true });
    expect(document.activeElement).toHaveAttribute('data-date', '2025-12-21');
    press('ArrowLeft', { ctrlKey: true });
    expect(document.activeElement).toHaveAttribute('data-date', '2025-12-21');
  });

  it('keeps focus inside minDate and maxDate', () => {
    render(
      <Calendar
        aria-label="Date"
        today="2026-11-10"
        minDate="2026-11-08"
        maxDate="2026-11-12"
      />,
    );
    const start = day(/11月10日/);
    start.focus();
    for (let i = 0; i < 4; i++)
      fireEvent.keyDown(document.activeElement as HTMLElement, {
        key: 'ArrowLeft',
      });
    expect(document.activeElement).toHaveAttribute('data-date', '2026-11-08');
    fireEvent.keyDown(document.activeElement as HTMLElement, {
      key: 'PageUp',
    });
    expect(document.activeElement).toHaveAttribute('data-date', '2026-11-08');
    expect(day(/11月13日/)).toHaveAttribute('aria-disabled', 'true');
  });

  it('clamps to a single bound when only minDate or maxDate is set', () => {
    const { rerender } = render(
      <Calendar aria-label="Date" today="2026-11-10" minDate="2026-11-05" />,
    );
    day(/11月5日/).focus();
    fireEvent.keyDown(document.activeElement as HTMLElement, {
      key: 'PageUp',
    });
    expect(document.activeElement).toHaveAttribute('data-date', '2026-11-05');
    rerender(
      <Calendar aria-label="Date" today="2026-11-10" maxDate="2026-11-20" />,
    );
    day(/11月20日/).focus();
    fireEvent.keyDown(document.activeElement as HTMLElement, {
      key: 'PageDown',
    });
    expect(document.activeElement).toHaveAttribute('data-date', '2026-11-20');
  });

  it('works controlled for value and month', () => {
    const onValueChange = vi.fn();
    const onMonthChange = vi.fn();
    const { rerender } = render(
      <Calendar
        aria-label="Date"
        today="2026-11-10"
        value="2026-11-10"
        month="2026-11"
        onValueChange={onValueChange}
        onMonthChange={onMonthChange}
      />,
    );
    fireEvent.click(day(/11月12日/));
    expect(onValueChange).toHaveBeenCalledWith('2026-11-12');
    expect(day(/11月10日/).closest('td')).toHaveAttribute(
      'aria-selected',
      'true',
    );
    fireEvent.click(screen.getByRole('button', { name: '次の月' }));
    expect(onMonthChange).toHaveBeenCalledWith('2026-12');
    expect(screen.getByRole('grid', { name: '2026年11月' })).toBeVisible();
    rerender(
      <Calendar
        aria-label="Date"
        today="2026-11-10"
        value="2026-12-24"
        month="2026-12"
      />,
    );
    expect(screen.getByRole('grid', { name: '2026年12月' })).toBeVisible();
    expect(day(/12月24日/).closest('td')).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('selects ranges from the start, swaps ends and restarts', () => {
    const changes: CalendarRange[] = [];
    render(
      <Calendar
        aria-label="Stay"
        mode="range"
        today="2026-11-10"
        onValueChange={(value) => changes.push(value)}
      />,
    );
    fireEvent.click(day(/11月12日/));
    fireEvent.click(day(/11月9日/));
    fireEvent.click(day(/11月20日/));
    expect(changes).toEqual([
      { from: '2026-11-12' },
      { from: '2026-11-09', to: '2026-11-12' },
      { from: '2026-11-20' },
    ]);
  });

  it('ignores invalid date strings instead of guessing', () => {
    render(
      <Calendar
        aria-label="Date"
        today="2026-11-10"
        defaultValue={'2026-02-30' as '2026-02-28'}
        minDate={'tomorrow' as '2026-01-01'}
      />,
    );
    expect(document.querySelectorAll('[aria-selected="true"]')).toHaveLength(0);
    expect(screen.getByRole('grid', { name: '2026年11月' })).toBeVisible();
  });

  it('passes all automated quality rules', async () => {
    const report = await expectAutomatedQuality(
      calendarQualityRules,
      calendarChecks,
    );
    expect(report.complete).toBe(false);
  });
});
