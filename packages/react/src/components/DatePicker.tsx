'use client';

import {
  type ChangeEvent,
  type ForwardedRef,
  forwardRef,
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { Button } from './Button.js';
import { Calendar, type CalendarDate, type CalendarProps } from './Calendar.js';
import { parseDate } from './calendarDate.js';
import { withClassName } from './classNames.js';
import { Input } from './Input.js';
import { type WithLismProps, withLism } from './lism.js';
import { Popover } from './Popover.js';

export type DatePickerLabels = {
  openCalendar?: string;
  calendarTitle?: string;
  formatHint?: string;
  invalidDate?: string;
  unavailableDate?: string;
  requiredDate?: string;
};

const defaultLabels = {
  openCalendar: 'カレンダーを開く',
  calendarTitle: '日付を選択',
  formatHint: 'YYYY-MM-DD 形式で入力してください。',
  invalidDate: 'YYYY-MM-DD 形式の有効な日付を入力してください。',
  unavailableDate: '選択できる日付を入力してください。',
  requiredDate: '日付を入力してください。',
} satisfies Required<DatePickerLabels>;

export type DatePickerProps = WithLismProps<
  Pick<
    CalendarProps,
    | 'locale'
    | 'weekStartsOn'
    | 'today'
    | 'minDate'
    | 'maxDate'
    | 'isDateDisabled'
  > & {
    /** Visible label for the text input. */
    label: string;
    className?: string;
    id?: string;
    name?: string;
    /** ID of an associated form outside the component's ancestors. */
    form?: string;
    disabled?: boolean;
    required?: boolean;
    value?: CalendarDate | null;
    defaultValue?: CalendarDate | null;
    onValueChange?: (value: CalendarDate | null) => void;
    labels?: DatePickerLabels;
    calendarLabels?: CalendarProps['labels'];
  }
>;

type Draft = { text: string; selection: CalendarDate | null };

type DateRules = {
  [K in 'minDate' | 'maxDate' | 'isDateDisabled']:
    | DatePickerProps[K]
    | undefined;
};

const messageOr = (text: string, fallback: string) => text.trim() || fallback;

const isBefore = (timestamp: number, limit: number | null) =>
  limit !== null && timestamp < limit;

function isUnavailable(
  input: string,
  timestamp: number,
  { minDate, maxDate, isDateDisabled }: DateRules,
) {
  return (
    isBefore(timestamp, parseDate(minDate)) ||
    isBefore(parseDate(maxDate) ?? Number.POSITIVE_INFINITY, timestamp) ||
    Boolean(isDateDisabled?.(input as CalendarDate))
  );
}

/** Returns an error message for the typed text, or '' when it is acceptable. */
function validateDate(
  input: string,
  rules: DateRules,
  messages: Required<DatePickerLabels>,
) {
  if (!input) return '';
  const timestamp = parseDate(input);
  if (timestamp === null)
    return messageOr(messages.invalidDate, defaultLabels.invalidDate);
  return isUnavailable(input, timestamp, rules)
    ? messageOr(messages.unavailableDate, defaultLabels.unavailableDate)
    : '';
}

/** Drops undefined entries so optional Calendar props keep their defaults. */
function definedProps<T extends Record<string, unknown>>(props: T) {
  return Object.fromEntries(
    Object.entries(props).filter(([, value]) => value !== undefined),
  ) as { [K in keyof T]?: Exclude<T[K], undefined> };
}

/** Runs `onReset` after the input's form resets, unless a handler cancels it. */
function useFormReset(
  inputRef: React.RefObject<HTMLInputElement | null>,
  onReset: () => void,
) {
  const latest = useRef(onReset);
  latest.current = onReset;
  useEffect(() => {
    // Listen on the document to respect form reassociation through the form ID.
    const input = inputRef.current;
    if (!input) return;
    function reset(event: Event) {
      if (event.target !== input?.form) return;
      // A form handler may cancel reset later in the event propagation.
      queueMicrotask(() => {
        if (event.defaultPrevented || !input?.isConnected) return;
        latest.current();
      });
    }
    input.ownerDocument.addEventListener('reset', reset, true);
    return () => input.ownerDocument.removeEventListener('reset', reset, true);
  }, [inputRef]);
}

type ValueOptions = {
  value: CalendarDate | null | undefined;
  defaultValue: CalendarDate | null;
  onValueChange: ((value: CalendarDate | null) => void) | undefined;
};

/** Controlled or uncontrolled date plus the text the user is still typing. */
function useDateValue({ value, defaultValue, onValueChange }: ValueOptions) {
  const initialValue = useRef(defaultValue);
  const [localValue, setLocalValue] = useState(defaultValue);
  const selected = value === undefined ? localValue : value;
  const [draft, setDraft] = useState<Draft | null>(null);
  const text = draft?.selection === selected ? draft.text : (selected ?? '');

  useEffect(() => {
    setDraft((current) => (current?.selection === selected ? current : null));
  }, [selected]);

  const commit = useCallback(
    (next: CalendarDate | null) => {
      setDraft(null);
      if (value === undefined) setLocalValue(next);
      if (next !== selected) onValueChange?.(next);
    },
    [onValueChange, selected, value],
  );
  const keepDraft = (next: string) =>
    setDraft({ text: next, selection: selected });

  return { selected, text, commit, keepDraft, initialValue };
}

/** Keeps a local ref to the input while forwarding it to the consumer. */
function useForwardedInputRef(ref: ForwardedRef<HTMLInputElement>) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const attachInput = useCallback(
    (input: HTMLInputElement | null) => {
      inputRef.current = input;
      if (typeof ref === 'function') return ref(input);
      if (ref) ref.current = input;
    },
    [ref],
  );
  return { inputRef, attachInput };
}

type CalendarPopoverProps = {
  open: boolean;
  disabled: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  triggerLabel: string;
  titleId: string;
  calendarRef: RefObject<HTMLDivElement | null>;
  selected: CalendarDate | null;
  onSelect: (date: CalendarDate | null) => void;
  calendarProps: Partial<
    Pick<
      CalendarProps,
      | 'locale'
      | 'weekStartsOn'
      | 'today'
      | 'minDate'
      | 'maxDate'
      | 'isDateDisabled'
      | 'labels'
    >
  >;
};

function CalendarPopover({
  open,
  disabled,
  onOpenChange,
  title,
  triggerLabel,
  titleId,
  calendarRef,
  selected,
  onSelect,
  calendarProps,
}: CalendarPopoverProps) {
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger
        render={<Button type="button" variant="outline" />}
        disabled={disabled}
      >
        {triggerLabel}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={4}>
          <Popover.Popup
            className="ui-date-picker__popup"
            initialFocus={() =>
              calendarRef.current?.querySelector<HTMLButtonElement>(
                '[role="grid"] button[tabindex="0"]',
              ) ?? true
            }
          >
            <Popover.Title id={titleId}>{title}</Popover.Title>
            <Calendar
              ref={calendarRef}
              aria-labelledby={titleId}
              value={selected}
              onValueChange={onSelect}
              {...calendarProps}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function Feedback({
  hintId,
  errorId,
  hint,
  error,
}: {
  hintId: string;
  errorId: string;
  hint: string;
  error: string;
}) {
  return (
    <>
      <p id={hintId} className="ui-date-picker__hint">
        {hint}
      </p>
      {error && (
        <p id={errorId} className="ui-date-picker__error">
          {error}
        </p>
      )}
    </>
  );
}

/** Reset and calendar selection both settle the value and hide the error. */
function createActions({
  commit,
  initialValue,
  popover,
  setShowError,
}: {
  commit: (next: CalendarDate | null) => void;
  initialValue: { current: CalendarDate | null };
  popover: { close: () => void };
  setShowError: (show: boolean) => void;
}) {
  return {
    reset: () => {
      commit(initialValue.current);
      popover.close();
      setShowError(false);
    },
    select: (date: CalendarDate | null) => {
      commit(date);
      setShowError(false);
      popover.close();
    },
  };
}

/** Popover open state that always stays closed while the picker is disabled. */
function usePopoverState(disabled: boolean) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);
  return {
    open: open && !disabled,
    onOpenChange: (next: boolean) => setOpen(next && !disabled),
    close: () => setOpen(false),
  };
}

function describeError({
  disabled,
  required,
  text,
  validate,
  requiredMessage,
}: {
  disabled: boolean;
  required: boolean;
  text: string;
  validate: (input: string) => string;
  requiredMessage: string;
}) {
  if (disabled) return { customError: '', error: '' };
  const customError = validate(text);
  const missing = required && !text ? requiredMessage : '';
  return { customError, error: customError || missing };
}

/** Input events: surface errors on blur or invalid, commit only valid text. */
function createInputHandlers({
  text,
  validate,
  commit,
  keepDraft,
  setShowError,
}: {
  text: string;
  validate: (input: string) => string;
  commit: (next: CalendarDate | null) => void;
  keepDraft: (next: string) => void;
  setShowError: (show: boolean) => void;
}) {
  return {
    onBlur: () => {
      if (text) setShowError(true);
    },
    onInvalid: () => setShowError(true),
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      const next = event.currentTarget.value;
      const invalid = validate(next);
      event.currentTarget.setCustomValidity(invalid);
      if (invalid) return keepDraft(next);
      commit(next ? (next as CalendarDate) : null);
      setShowError(false);
    },
  };
}

/** Separates field, value, validation and calendar options from layout props. */
function splitProps({
  label,
  className,
  id,
  name,
  form,
  disabled = false,
  required = false,
  value,
  defaultValue = null,
  onValueChange,
  labels,
  calendarLabels,
  locale,
  weekStartsOn,
  today,
  minDate,
  maxDate,
  isDateDisabled,
  ...layout
}: DatePickerProps) {
  const rules = { minDate, maxDate, isDateDisabled };
  return {
    layout,
    field: { label, className, id, name, form, disabled, required },
    valueOptions: { value, defaultValue, onValueChange },
    messages: { ...defaultLabels, ...labels },
    rules,
    calendarProps: definedProps({
      locale,
      weekStartsOn,
      today,
      ...rules,
      labels: calendarLabels,
    }),
  };
}

export const DatePicker = withLism(
  forwardRef<HTMLInputElement, DatePickerProps>(
    function DatePicker(props, ref) {
      const { layout, field, valueOptions, messages, rules, calendarProps } =
        splitProps(props);
      const { label, className, name, form, disabled, required } = field;
      const generatedId = useId();
      const inputId = field.id ?? generatedId;
      const hintId = `${inputId}-hint`;
      const errorId = `${inputId}-error`;
      const { inputRef, attachInput } = useForwardedInputRef(ref);
      const calendarRef = useRef<HTMLDivElement>(null);
      const { selected, text, commit, keepDraft, initialValue } =
        useDateValue(valueOptions);
      const [showError, setShowError] = useState(false);
      const popover = usePopoverState(disabled);

      const validate = (input: string) => validateDate(input, rules, messages);
      const { customError, error } = describeError({
        disabled,
        required,
        text,
        validate,
        requiredMessage: messages.requiredDate,
      });
      const visibleError = showError && error;

      useEffect(() => {
        inputRef.current?.setCustomValidity(customError);
      }, [customError, inputRef]);

      const inputHandlers = createInputHandlers({
        text,
        validate,
        commit,
        keepDraft,
        setShowError,
      });
      const { reset, select } = createActions({
        commit,
        initialValue,
        popover,
        setShowError,
      });
      useFormReset(inputRef, reset);

      return (
        <div {...layout} className={withClassName('ui-date-picker', className)}>
          <label htmlFor={inputId}>{label}</label>
          <div className="ui-date-picker__controls">
            <Input
              ref={attachInput}
              id={inputId}
              name={name}
              form={form}
              value={text}
              disabled={disabled}
              required={required}
              aria-describedby={visibleError ? `${hintId} ${errorId}` : hintId}
              aria-invalid={visibleError ? true : undefined}
              {...inputHandlers}
            />
            <CalendarPopover
              open={popover.open}
              disabled={disabled}
              onOpenChange={popover.onOpenChange}
              title={messages.calendarTitle}
              triggerLabel={messages.openCalendar}
              titleId={`${inputId}-calendar`}
              calendarRef={calendarRef}
              selected={selected}
              onSelect={select}
              calendarProps={calendarProps}
            />
          </div>
          <Feedback
            hintId={hintId}
            errorId={errorId}
            hint={messages.formatHint}
            error={visibleError || ''}
          />
        </div>
      );
    },
  ),
);
