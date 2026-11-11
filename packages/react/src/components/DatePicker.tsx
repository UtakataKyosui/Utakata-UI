'use client';

import {
  forwardRef,
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

export const DatePicker = withLism(
  forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(
    {
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
    },
    ref,
  ) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = `${inputId}-hint`;
    const errorId = `${inputId}-error`;
    const titleId = `${inputId}-calendar`;
    const inputRef = useRef<HTMLInputElement | null>(null);
    const calendarRef = useRef<HTMLDivElement>(null);
    const attachInput = useCallback(
      (input: HTMLInputElement | null) => {
        inputRef.current = input;
        if (typeof ref === 'function') return ref(input);
        if (ref) ref.current = input;
      },
      [ref],
    );
    const initialValue = useRef(defaultValue);
    const [localValue, setLocalValue] = useState(defaultValue);
    const selected = value === undefined ? localValue : value;
    const [draft, setDraft] = useState<Draft | null>(null);
    const text = draft?.selection === selected ? draft.text : (selected ?? '');
    const [showError, setShowError] = useState(false);
    const [open, setOpen] = useState(false);
    const messages = { ...defaultLabels, ...labels };

    useEffect(() => {
      setDraft((current) => (current?.selection === selected ? current : null));
    }, [selected]);

    useEffect(() => {
      if (disabled) setOpen(false);
    }, [disabled]);

    const commit = useCallback(
      (next: CalendarDate | null) => {
        setDraft(null);
        if (value === undefined) setLocalValue(next);
        if (next !== selected) onValueChange?.(next);
      },
      [onValueChange, selected, value],
    );

    const minimum = parseDate(minDate);
    const maximum = parseDate(maxDate);
    function validate(input: string) {
      if (!input) return '';
      const timestamp = parseDate(input);
      if (timestamp === null)
        return messages.invalidDate.trim() || defaultLabels.invalidDate;
      if (
        (minimum !== null && timestamp < minimum) ||
        (maximum !== null && timestamp > maximum) ||
        isDateDisabled?.(input as CalendarDate)
      ) {
        return messages.unavailableDate.trim() || defaultLabels.unavailableDate;
      }
      return '';
    }

    const customError = disabled ? '' : validate(text);
    const error = disabled
      ? ''
      : customError || (required && !text ? messages.requiredDate : '');
    const visibleError = showError && error;

    useEffect(() => {
      inputRef.current?.setCustomValidity(customError);
    }, [customError]);

    useEffect(() => {
      // Listen on the document to respect form reassociation through the form ID.
      const input = inputRef.current;
      if (!input) return;
      function reset(event: Event) {
        if (event.target !== input?.form) return;
        // A form handler may cancel reset later in the event propagation.
        queueMicrotask(() => {
          if (event.defaultPrevented || !input?.isConnected) return;
          commit(initialValue.current);
          setOpen(false);
          setShowError(false);
        });
      }
      input.ownerDocument.addEventListener('reset', reset, true);
      return () =>
        input.ownerDocument.removeEventListener('reset', reset, true);
    }, [commit]);

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
            onBlur={() => {
              if (text) setShowError(true);
            }}
            onInvalid={() => setShowError(true)}
            onChange={(event) => {
              const next = event.currentTarget.value;
              const invalid = validate(next);
              event.currentTarget.setCustomValidity(invalid);
              if (invalid) {
                setDraft({ text: next, selection: selected });
              } else {
                commit(next ? (next as CalendarDate) : null);
                setShowError(false);
              }
            }}
          />
          <Popover.Root
            open={open && !disabled}
            onOpenChange={(next) => setOpen(next && !disabled)}
          >
            <Popover.Trigger
              render={<Button type="button" variant="outline" />}
              disabled={disabled}
            >
              {messages.openCalendar}
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
                  <Popover.Title id={titleId}>
                    {messages.calendarTitle}
                  </Popover.Title>
                  <Calendar
                    ref={calendarRef}
                    aria-labelledby={titleId}
                    value={selected}
                    onValueChange={(date) => {
                      commit(date);
                      setShowError(false);
                      setOpen(false);
                    }}
                    {...(locale !== undefined ? { locale } : {})}
                    {...(weekStartsOn !== undefined ? { weekStartsOn } : {})}
                    {...(today !== undefined ? { today } : {})}
                    {...(minDate !== undefined ? { minDate } : {})}
                    {...(maxDate !== undefined ? { maxDate } : {})}
                    {...(isDateDisabled !== undefined
                      ? { isDateDisabled }
                      : {})}
                    {...(calendarLabels !== undefined
                      ? { labels: calendarLabels }
                      : {})}
                  />
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        </div>
        <p id={hintId} className="ui-date-picker__hint">
          {messages.formatHint}
        </p>
        {visibleError && (
          <p id={errorId} className="ui-date-picker__error">
            {error}
          </p>
        )}
      </div>
    );
  }),
);
