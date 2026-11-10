'use client';

import {
  type ComponentPropsWithoutRef,
  forwardRef,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAccessibilityRef } from './accessibility.js';
import { withClassName } from './classNames.js';

/** A calendar day as an ISO 8601 date string, for example "2026-11-10". */
export type CalendarDate = `${number}-${number}-${number}`;

/** A calendar month as "YYYY-MM", for example "2026-11". */
export type CalendarMonth = `${number}-${number}`;

/** A selected range. `to` is absent while only the start has been chosen. */
export type CalendarRange = { from: CalendarDate; to?: CalendarDate };

export type CalendarLabels = {
  /** Name of the previous-month button. Defaults to "前の月". */
  previousMonth?: string;
  /** Name of the next-month button. Defaults to "次の月". */
  nextMonth?: string;
  /** Prefix of the status message that announces a selection. Defaults to "選択中". */
  selected?: string;
};

type CalendarBaseProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  | 'className'
  | 'children'
  | 'role'
  | 'defaultValue'
  | 'onChange'
  | 'aria-label'
  | 'aria-labelledby'
> & {
  className?: string;
  /** BCP 47 tag used for month, weekday and date names. Defaults to "ja-JP". */
  locale?: string;
  /** First column: 0 = Sunday … 6 = Saturday. Defaults to 0. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Visible month (controlled). */
  month?: CalendarMonth;
  defaultMonth?: CalendarMonth;
  onMonthChange?: (month: CalendarMonth) => void;
  /** Earliest selectable and navigable day. */
  minDate?: CalendarDate;
  /** Latest selectable and navigable day. */
  maxDate?: CalendarDate;
  /** Marks days that cannot be selected. They stay focusable. */
  isDateDisabled?: (date: CalendarDate) => boolean;
  /** Overrides the current day (local time by default), e.g. for SSR. */
  today?: CalendarDate;
  labels?: CalendarLabels;
} & (
    | { 'aria-label': string; 'aria-labelledby'?: never }
    | { 'aria-label'?: never; 'aria-labelledby': string }
  );

type SingleProps = {
  mode?: 'single';
  value?: CalendarDate | null;
  defaultValue?: CalendarDate | null;
  onValueChange?: (value: CalendarDate) => void;
};

type RangeProps = {
  mode: 'range';
  value?: CalendarRange | null;
  defaultValue?: CalendarRange | null;
  onValueChange?: (value: CalendarRange) => void;
};

/**
 * A named single-day or range calendar. The group must be named by aria-label
 * or aria-labelledby. Values are plain ISO date strings (no time zones).
 */
export type CalendarProps = CalendarBaseProps & (SingleProps | RangeProps);

const DAY = 86_400_000;
const pad = (value: number, length = 2) => String(value).padStart(length, '0');

type Selection = { from: number; to: number | null } | null;
type Mode = 'single' | 'range';
type AnyValue = CalendarDate | CalendarRange | null | undefined;

function formatDate(ms: number): CalendarDate {
  const date = new Date(ms);
  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}` as CalendarDate;
}

/** Epoch ms at UTC midnight, or null for anything but a real calendar day. */
function parseDate(value: string | null | undefined): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!match) return null;
  const ms = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return formatDate(ms) === value ? ms : null;
}

function parseMonth(value: string | undefined): number | null {
  return /^\d{4}-\d{2}$/.test(value ?? '') ? parseDate(`${value}-01`) : null;
}

function startOfMonth(ms: number) {
  const date = new Date(ms);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
}

function formatMonth(ms: number): CalendarMonth {
  return formatDate(ms).slice(0, 7) as CalendarMonth;
}

function daysInMonth(first: number) {
  const date = new Date(first);
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
}

/** Moves by whole months and clamps the day (Jan 31 + 1 month = Feb 28/29). */
function addMonths(ms: number, months: number) {
  const date = new Date(ms);
  const first = Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1);
  return first + (Math.min(date.getUTCDate(), daysInMonth(first)) - 1) * DAY;
}

function localToday(): number {
  const now = new Date();
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
}

function weekdayIndex(ms: number, weekStartsOn: number) {
  return (new Date(ms).getUTCDay() - weekStartsOn + 7) % 7;
}

function normalizeRange(range: CalendarRange | null | undefined): Selection {
  const from = parseDate(range?.from);
  if (from === null) return null;
  const to = parseDate(range?.to);
  return to !== null && to < from ? { from: to, to: from } : { from, to };
}

function resolveSelection(mode: Mode, value: AnyValue): Selection {
  if (mode === 'range') return normalizeRange(value as CalendarRange | null);
  const from = parseDate(value as string | null | undefined);
  return from === null ? null : { from, to: from };
}

/** A range starts on the first pick, ends on the second and restarts on the third. */
function nextRange(current: Selection, ms: number): CalendarRange {
  const iso = formatDate(ms);
  if (!current || current.to !== null) return { from: iso };
  return current.from <= ms
    ? { from: formatDate(current.from), to: iso }
    : { from: iso, to: formatDate(current.from) };
}

/** Where a navigation key moves the focused day, or undefined for other keys. */
function keyTarget(
  key: string,
  date: number,
  weekStartsOn: number,
  shift: boolean,
): number | undefined {
  const weekday = weekdayIndex(date, weekStartsOn);
  const moves: Record<string, number> = {
    ArrowLeft: date - DAY,
    ArrowRight: date + DAY,
    ArrowUp: date - 7 * DAY,
    ArrowDown: date + 7 * DAY,
    Home: date - weekday * DAY,
    End: date + (6 - weekday) * DAY,
    PageUp: addMonths(date, shift ? -12 : -1),
    PageDown: addMonths(date, shift ? 12 : 1),
  };
  return Object.hasOwn(moves, key) ? moves[key] : undefined;
}

/** Weeks of the month; keys are the day numbers the slots would hold, not indexes. */
function buildRows(month: number, weekStartsOn: number) {
  const length = daysInMonth(month);
  const offset = weekdayIndex(month, weekStartsOn);
  return Array.from(
    { length: Math.ceil((offset + length) / 7) },
    (_, week) => ({
      key: week * 7 - offset + 1,
      cells: Array.from({ length: 7 }, (_, column) => {
        const day = week * 7 + column - offset + 1;
        const inMonth = day >= 1 && day <= length;
        return { key: day, ms: inMonth ? month + (day - 1) * DAY : null };
      }),
    }),
  );
}

function buildWeekdays(weekStartsOn: number) {
  return Array.from({ length: 7 }, (_, column) => {
    const index = (weekStartsOn + column) % 7;
    // 2024-01-07 is a Sunday.
    return { key: index, ms: Date.UTC(2024, 0, 7 + index) };
  });
}

function createBounds(
  minDate: string | undefined,
  maxDate: string | undefined,
  predicate: ((date: CalendarDate) => boolean) | undefined,
) {
  const min = parseDate(minDate);
  const max = parseDate(maxDate);
  return {
    min,
    max,
    clamp: (ms: number) =>
      Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min ?? ms, ms)),
    isDisabled: (ms: number) =>
      (min !== null && ms < min) ||
      (max !== null && ms > max) ||
      Boolean(predicate?.(formatDate(ms))),
  };
}

function dayState(selection: Selection, ms: number, today: number) {
  const last = selection ? (selection.to ?? selection.from) : null;
  const selected =
    selection !== null && ms >= selection.from && ms <= (last ?? 0);
  return {
    selected,
    start: selected && ms === selection?.from,
    end: selected && ms === last,
    today: ms === today,
  };
}

function formatStatus(
  selection: Selection,
  format: Intl.DateTimeFormat,
  prefix: string,
) {
  if (!selection) return '';
  const isRange = selection.to !== null && selection.to !== selection.from;
  const text = isRange
    ? format.formatRange(selection.from, selection.to ?? selection.from)
    : format.format(selection.from);
  return `${prefix}: ${text}`;
}

function firstWithin(
  candidates: (number | null | undefined)[],
  start: number,
  end: number,
  fallback: number,
) {
  const inside = (ms: number | null | undefined): ms is number =>
    typeof ms === 'number' && ms >= start && ms < end;
  return candidates.find(inside) ?? fallback;
}

function useControllable<T>(controlled: T | undefined, initial: T) {
  const [inner, setInner] = useState(initial);
  return [controlled === undefined ? inner : controlled, setInner] as const;
}

function useValue(
  mode: Mode,
  valueProp: AnyValue,
  defaultValue: AnyValue,
  onValueChange: ((value: never) => void) | undefined,
) {
  const [value, setValue] = useControllable<AnyValue>(
    valueProp,
    defaultValue ?? null,
  );
  const selection = resolveSelection(mode, value);
  const pick = (ms: number) => {
    const next = mode === 'range' ? nextRange(selection, ms) : formatDate(ms);
    setValue(next);
    (onValueChange as ((value: typeof next) => void) | undefined)?.(next);
  };
  return { selection, pick };
}

function useMonth(
  monthProp: string | undefined,
  initial: number,
  onMonthChange: ((month: CalendarMonth) => void) | undefined,
) {
  const [inner, setInner] = useState(initial);
  const month = parseMonth(monthProp) ?? inner;
  const showMonth = (ms: number) => {
    const first = startOfMonth(ms);
    if (first === month) return;
    setInner(first);
    onMonthChange?.(formatMonth(first));
  };
  return { month, showMonth };
}

function useFormats(locale: string) {
  return useMemo(() => {
    const make = (options: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' });
    return {
      date: make({ dateStyle: 'full' }),
      title: make({ year: 'numeric', month: 'long' }),
      weekday: make({ weekday: 'narrow' }),
      weekdayLong: make({ weekday: 'long' }),
    };
  }, [locale]);
}

/** Moves DOM focus to a requested day once it is rendered (it may need a new month). */
function useFocusRequest(gridRef: RefObject<HTMLTableElement | null>) {
  const pending = useRef<CalendarDate | null>(null);
  useEffect(() => {
    if (!pending.current) return;
    const target = gridRef.current?.querySelector<HTMLElement>(
      `[data-date="${pending.current}"]`,
    );
    if (!target) return;
    target.focus();
    pending.current = null;
  });
  return pending;
}

const groupTarget = {
  name: 'Calendar',
  fix: 'Provide aria-label or an aria-labelledby that references visible text.',
};

/**
 * A dependency-free month grid for one day or a day range. Dates are ISO
 * strings; names come from Intl in `locale`. Focus uses a single Tab stop
 * with arrow, Home, End, PageUp and PageDown navigation.
 */
export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(
  function Calendar(props, ref) {
    const {
      className,
      locale = 'ja-JP',
      weekStartsOn = 0,
      month: monthProp,
      defaultMonth,
      onMonthChange,
      minDate,
      maxDate,
      isDateDisabled,
      today: todayProp,
      labels,
      mode = 'single',
      value: valueProp,
      defaultValue,
      onValueChange,
      ...rest
    } = props as CalendarBaseProps & {
      mode?: Mode;
      value?: AnyValue;
      defaultValue?: AnyValue;
      onValueChange?: (value: never) => void;
    };
    const accessibilityRef = useAccessibilityRef(groupTarget, ref);
    const titleId = useId();
    const gridRef = useRef<HTMLTableElement>(null);
    const pendingFocus = useFocusRequest(gridRef);
    const formats = useFormats(locale);
    const bounds = createBounds(minDate, maxDate, isDateDisabled);
    const today = parseDate(todayProp) ?? localToday();
    const { selection, pick } = useValue(
      mode,
      valueProp,
      defaultValue,
      onValueChange,
    );
    const { month, showMonth } = useMonth(
      monthProp,
      startOfMonth(parseMonth(defaultMonth) ?? selection?.from ?? today),
      onMonthChange,
    );
    const [focused, setFocused] = useState<number | null>(null);

    // The single Tab stop: the last focused day, else the selection, today or the 1st.
    const monthEnd = month + daysInMonth(month) * DAY;
    const tabDate = firstWithin(
      [focused, selection?.from, today],
      month,
      monthEnd,
      bounds.clamp(month),
    );

    const moveTo = (ms: number) => {
      const target = bounds.clamp(ms);
      setFocused(target);
      showMonth(target);
      pendingFocus.current = formatDate(target);
    };
    const step = (months: number) => {
      setFocused(bounds.clamp(addMonths(tabDate, months)));
      showMonth(addMonths(month, months));
    };
    const press = (ms: number) => {
      setFocused(ms);
      if (!bounds.isDisabled(ms)) pick(ms);
    };
    const onKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
      const date = parseDate(
        (event.target as HTMLElement).getAttribute('data-date'),
      );
      if (date === null || event.ctrlKey || event.altKey || event.metaKey)
        return;
      const target = keyTarget(event.key, date, weekStartsOn, event.shiftKey);
      if (target === undefined) return;
      event.preventDefault();
      moveTo(target);
    };

    const previousBlocked = bounds.min !== null && month <= bounds.min;
    const nextBlocked = bounds.max !== null && monthEnd - DAY >= bounds.max;

    const weekdayHeaders = buildWeekdays(weekStartsOn).map(({ key, ms }) => (
      <th
        key={key}
        scope="col"
        aria-label={formats.weekdayLong.format(ms)}
        className="ui-calendar__weekday"
      >
        {formats.weekday.format(ms)}
      </th>
    ));
    const renderCell = ({ key, ms }: { key: number; ms: number | null }) =>
      ms === null ? (
        <GapCell key={key} />
      ) : (
        <DayCell
          key={key}
          label={formats.date.format(ms)}
          ms={ms}
          disabled={bounds.isDisabled(ms)}
          isTabStop={ms === tabDate}
          state={dayState(selection, ms, today)}
          onFocusDay={setFocused}
          onPress={press}
        />
      );

    return (
      // biome-ignore lint/a11y/useSemanticElements: fieldset is for form controls; this groups a date picker.
      <div
        {...rest}
        ref={accessibilityRef}
        role="group"
        className={withClassName('ui-calendar', className)}
      >
        <div className="ui-calendar__header">
          <NavButton
            direction="previous"
            label={labels?.previousMonth ?? '前の月'}
            blocked={previousBlocked}
            onStep={() => step(-1)}
          />
          <div
            id={titleId}
            className="ui-calendar__title"
            aria-live="polite"
            aria-atomic="true"
          >
            {formats.title.format(month)}
          </div>
          <NavButton
            direction="next"
            label={labels?.nextMonth ?? '次の月'}
            blocked={nextBlocked}
            onStep={() => step(1)}
          />
        </div>
        <table
          ref={gridRef}
          // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: an interactive date grid keeps table row/column semantics.
          role="grid"
          aria-labelledby={titleId}
          className="ui-calendar__grid"
          {...{ onKeyDown }}
        >
          <thead>{renderRow('weekdays', weekdayHeaders)}</thead>
          <tbody>
            {buildRows(month, weekStartsOn).map((row) =>
              renderRow(row.key, row.cells.map(renderCell)),
            )}
          </tbody>
        </table>
        <div role="status" className="ui-calendar__status">
          {formatStatus(selection, formats.date, labels?.selected ?? '選択中')}
        </div>
      </div>
    );
  },
);

/** A plain row builder; the cells are mapped, so the markup linter cannot see them in JSX. */
function renderRow(key: number | string, children: ReactNode) {
  return <tr key={key}>{children}</tr>;
}

/** Empty padding before the 1st and after the last day; hidden from assistive technology. */
function GapCell() {
  return (
    // biome-ignore lint/a11y/useFocusableInteractive: an empty padding cell is hidden from assistive technology and is not interactive.
    <td
      // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: grid rows may only contain gridcells.
      role="gridcell"
      aria-hidden="true"
      className="ui-calendar__outside"
    />
  );
}

type DayCellProps = {
  label: string;
  ms: number;
  disabled: boolean;
  isTabStop: boolean;
  state: ReturnType<typeof dayState>;
  onFocusDay: (ms: number) => void;
  onPress: (ms: number) => void;
};

function DayCell({
  label,
  ms,
  disabled,
  isTabStop,
  state,
  onFocusDay,
  onPress,
}: DayCellProps) {
  return (
    // biome-ignore lint/a11y/useFocusableInteractive: the gridcell holds the focusable day button.
    <td
      // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: grid rows may only contain gridcells.
      role="gridcell"
      aria-selected={state.selected}
      className="ui-calendar__cell"
    >
      <button
        type="button"
        className="ui-calendar__day"
        data-date={formatDate(ms)}
        data-selected={state.selected || undefined}
        data-range-start={state.start || undefined}
        data-range-end={state.end || undefined}
        data-today={state.today || undefined}
        data-disabled={disabled || undefined}
        aria-label={label}
        aria-current={state.today ? 'date' : undefined}
        aria-disabled={disabled || undefined}
        tabIndex={isTabStop ? 0 : -1}
        // Handlers are spread so the markup linter sees a plain element.
        {...{ onClick: () => onPress(ms), onFocus: () => onFocusDay(ms) }}
      >
        {new Date(ms).getUTCDate()}
      </button>
    </td>
  );
}

type NavButtonProps = {
  direction: 'previous' | 'next';
  label: string;
  blocked: boolean;
  onStep: () => void;
};

/** Stays focusable at the bounds (aria-disabled) so focus is never lost. */
function NavButton({ direction, label, blocked, onStep }: NavButtonProps) {
  return (
    <button
      type="button"
      className="ui-calendar__nav"
      aria-label={label}
      aria-disabled={blocked || undefined}
      {...{ onClick: () => (blocked ? undefined : onStep()) }}
    >
      <Chevron direction={direction} />
    </button>
  );
}

/** Decorative arrow; an SVG has no text, so the button name is its aria-label. */
function Chevron({ direction }: { direction: 'previous' | 'next' }) {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={direction === 'previous' ? 'M10 3 5 8l5 5' : 'm6 3 5 5-5 5'} />
    </svg>
  );
}
