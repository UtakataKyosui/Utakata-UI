import type { QualityRule } from '../quality.js';

export const datePickerQualityRules = [
  {
    id: 'date-picker.form',
    requirement:
      'The labelled text input exposes its format and visible error. Valid dates and empty optional values participate in native form submission; unavailable or malformed dates cannot submit, disabled values are omitted, and reset restores the default.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Provide a visible label and name, keep the input associated with its form, and describe the accepted ISO date format and validation errors.',
  },
  {
    id: 'date-picker.keyboard',
    requirement:
      'In Chromium light and dark, the keyboard opens the calendar on the selected day, Escape restores trigger focus, choosing a day updates the text input and closes the popup, and typing, invalid input, disabled controls and form reset behave as documented.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep the Calendar and Popover focus wiring and validate typed dates with the same availability constraints used by the grid.',
  },
  {
    id: 'date-picker.visual-states',
    requirement:
      'At 320 CSS px the input, trigger, popup and errors remain readable. The trigger has a visible focus outline in forced colors and the popup respects reduced motion.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Allow the input and trigger to wrap, keep text error messages and keep the shared focus and motion styles.',
  },
  {
    id: 'date-picker.assistive-output',
    requirement:
      'Real browser zoom, OS high contrast and screen reader operation preserve date entry, error feedback and calendar focus in the integrated form.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Record results with actual browser zoom and OS settings, NVDA with Firefox, and VoiceOver with Safari.',
  },
] as const satisfies readonly QualityRule[];

export const datePickerManifest = {
  qualityRules: datePickerQualityRules,
  description:
    'A labelled ISO date input with a single-day calendar in a popover and native form validation.',
  props: {
    label: { type: 'string', default: undefined },
    name: { type: 'string', default: undefined },
    id: { type: 'string', default: undefined },
    form: { type: 'string', default: undefined },
    value: { type: 'CalendarDate | null', default: undefined },
    defaultValue: { type: 'CalendarDate | null', default: null },
    onValueChange: {
      type: '(value: CalendarDate | null) => void',
      default: undefined,
    },
    disabled: { type: 'boolean', default: false },
    required: { type: 'boolean', default: false },
    minDate: { type: 'CalendarDate', default: undefined },
    maxDate: { type: 'CalendarDate', default: undefined },
    isDateDisabled: {
      type: '(date: CalendarDate) => boolean',
      default: undefined,
    },
    locale: { type: 'BCP 47 language tag', default: 'ja-JP' },
    weekStartsOn: { type: '0 | 1 | 2 | 3 | 4 | 5 | 6', default: 0 },
    today: { type: 'CalendarDate', default: undefined },
    labels: { type: 'DatePickerLabels', default: undefined },
    calendarLabels: { type: 'CalendarLabels', default: undefined },
  },
  defaults: { disabled: false, required: false, defaultValue: null },
  composition:
    'DatePicker renders a labelled text field and a calendar trigger. Enter YYYY-MM-DD or choose one day. A valid change calls onValueChange; clearing calls it with null. Unavailable or malformed edits stay visible for correction without changing the committed date. Reset restores the initial defaultValue and notifies controlled consumers when the date changes. Locale affects the calendar names, while the input format stays ISO. Range and time entry are outside this component.',
  avoid: [
    'Provide a field name for form submission and validate dates on the server.',
    'Provide translated labels and calendarLabels when using the component in another language.',
    'Pass today when server-rendering to keep the initial calendar date deterministic.',
  ],
  example:
    '<DatePicker label="予約日" name="bookingDate" minDate="2026-11-03" weekStartsOn={1} />',
  accessibility:
    'The visible label names the input, and the format hint and error are connected by aria-describedby. The trigger opens a named popup, focuses a day, and receives focus again after Escape or selection. Supply a meaningful field label and make related trigger and dialog labels distinguishable when several date pickers appear together.',
} as const;
