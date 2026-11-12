import type { QualityRule } from '../quality.js';

export const calendarQualityRules = [
  {
    id: 'calendar.structure',
    requirement:
      'Root is a named role="group" containing a month heading and a role="grid" labelled by that heading with weekday column headers; every day is a button named by its full date, the selected days expose aria-selected="true" on their gridcell and today exposes aria-current="date".',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Name Calendar with aria-label or aria-labelledby; do not replace the rendered grid, day names or headings.',
  },
  {
    id: 'calendar.selection',
    requirement:
      'Single mode selects one day and range mode selects a start then an end (an earlier second day swaps the ends, a third pick restarts); disabled, minDate and maxDate days never select or notify; value and month work controlled and uncontrolled; a status region announces the selection.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Use value/defaultValue/onValueChange with ISO date strings and express unavailable days with minDate, maxDate or isDateDisabled.',
  },
  {
    id: 'calendar.month-navigation',
    requirement:
      'Previous and next buttons move the month, update the live heading and call onMonthChange; at minDate or maxDate they expose aria-disabled and do nothing while keeping focus.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Keep the month buttons enabled for focus and set the bounds with minDate and maxDate instead of hiding the buttons.',
  },
  {
    id: 'calendar.locale-boundaries',
    requirement:
      'Month, weekday and date names follow locale; weekStartsOn changes the first column; month lengths including leap-year February, year boundaries and a month-end day moved by month are correct and independent of the time zone because dates are plain ISO strings.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Pass plain "YYYY-MM-DD" strings and a BCP 47 locale; convert to and from Date objects in your own code and provide today for server rendering.',
  },
  {
    id: 'calendar.keyboard',
    requirement:
      'In a real browser the grid has one Tab stop; arrow keys move by day and week, Home and End move to the week start and end, PageUp and PageDown move by month (Shift by year) across month boundaries, disabled days stay focusable and are not selected, and Enter or Space selects the focused day.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep the roving tabindex and the grid key handler; do not add per-day tabindex values or swallow arrow keys.',
  },
  {
    id: 'calendar.visual-states',
    requirement:
      'In a real browser days and month buttons are at least 24x24 CSS px, selected days differ from others by a thicker border and heavier weight, today by an underline and disabled days by a line through the number so none relies on color, day text keeps at least 4.5:1 contrast, the grid wraps without clipping or overflow at 320 CSS px and 200% text size, and in forced colors the focused day shows a system-color outline of at least 2px.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep the selected border and weight, the today underline, the disabled line-through, the minimum sizes and the forced-colors outline.',
  },
  {
    id: 'calendar.zoom-theme',
    requirement:
      'At real 200% browser zoom and in real high-contrast modes selected, range, today, disabled days and focus stay distinguishable in both themes.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Check browser zoom, dark theme and high-contrast modes in a real browser; leave unverified until performed.',
  },
  {
    id: 'calendar.screen-reader',
    requirement:
      'Screen readers announce the group name, the month change, each day with its full date, selected and disabled states, and the selection status.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Record NVDA + Firefox and VoiceOver + Safari results; grid navigation announcements differ between screen readers.',
  },
] as const satisfies readonly QualityRule[];

export const calendarManifest = {
  qualityRules: calendarQualityRules,
  description:
    'A named month calendar for choosing one day or a day range, with ISO date string values and Intl locale names; no date library is used.',
  props: {
    mode: { type: 'single | range', default: 'single' },
    value: {
      type: 'single: "YYYY-MM-DD" | null; range: { from, to? } | null; controlled',
      default: undefined,
    },
    defaultValue: {
      type: 'single: "YYYY-MM-DD" | null; range: { from, to? } | null',
      default: undefined,
    },
    onValueChange: {
      type: '(value: "YYYY-MM-DD" | { from; to? }) => void',
      default: undefined,
    },
    month: { type: '"YYYY-MM"; controlled visible month', default: undefined },
    defaultMonth: {
      type: '"YYYY-MM"; falls back to the selection or today',
      default: undefined,
    },
    onMonthChange: { type: '(month: "YYYY-MM") => void', default: undefined },
    minDate: { type: '"YYYY-MM-DD"', default: undefined },
    maxDate: { type: '"YYYY-MM-DD"', default: undefined },
    isDateDisabled: {
      type: '(date: "YYYY-MM-DD") => boolean',
      default: undefined,
    },
    locale: { type: 'BCP 47 language tag', default: 'ja-JP' },
    weekStartsOn: {
      type: '0 | 1 | 2 | 3 | 4 | 5 | 6; 0 is Sunday',
      default: 0,
    },
    today: {
      type: '"YYYY-MM-DD"; overrides the local current day',
      default: undefined,
    },
    labels: {
      type: '{ previousMonth?; nextMonth?; selected? } strings',
      default: undefined,
    },
  },
  defaults: { mode: 'single', locale: 'ja-JP', weekStartsOn: 0 },
  composition:
    'A single Calendar element (aria-label or aria-labelledby required) renders the month header, a day grid and a visually hidden status region. Values are plain ISO date strings so no time zone or Date object is involved; invalid strings are ignored. Disabled days stay focusable but cannot be selected. A range stays incomplete until the second day is picked, and days between the ends are selected even if some are disabled. Right-to-left layout, multiple months, week numbers, month and year dropdowns, outside-month days, form submission and date-time input are not provided.',
  avoid: [
    'Do not pass Date objects or ISO strings with a time; pass "YYYY-MM-DD".',
    'Do not hide the month buttons to limit navigation; use minDate and maxDate.',
    'Do not rely on the calendar alone for typed date entry; pair it with a text input when users need to type or paste dates.',
    'Do not read the default today on the server and client separately; pass today to avoid hydration mismatches.',
  ],
  example:
    '<Calendar aria-label="予約日" defaultMonth="2026-11" minDate="2026-11-03" isDateDisabled={(date) => date.endsWith("-23")} weekStartsOn={1} />',
  accessibility:
    'A named group wraps a role="grid" labelled by the live month heading. Each day is a native button named by its full date inside a gridcell with aria-selected; today uses aria-current="date" and unavailable days use aria-disabled so they remain reachable. Selection and non-color cues (border, weight, underline, line-through) are visible and a status region announces the selection. Consumers provide the group name, translated labels for other languages and availability rules; real-browser keyboard, zoom and screen-reader results are tracked by the quality rules.',
} as const;
