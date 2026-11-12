import { Button, type CalendarDate, DatePicker } from '@utakata-ui/react';
import { useState } from 'react';

export default function DatePickerExample() {
  const [date, setDate] = useState<CalendarDate | null>('2026-11-10');
  return (
    <form
      ref={(form) => {
        if (!form) return;
        const prevent = (event: Event) => event.preventDefault();
        form.addEventListener('submit', prevent);
        return () => form.removeEventListener('submit', prevent);
      }}
    >
      <DatePicker
        label="Booking date"
        name="bookingDate"
        required
        value={date}
        defaultValue="2026-11-10"
        today="2026-11-10"
        minDate="2026-11-05"
        maxDate="2026-12-31"
        onValueChange={setDate}
        locale="en-US"
        labels={{
          openCalendar: 'Open calendar',
          calendarTitle: 'Choose a booking date',
          formatHint: 'Use YYYY-MM-DD.',
          invalidDate: 'Enter a valid date in YYYY-MM-DD format.',
          unavailableDate: 'Enter an available date.',
          requiredDate: 'Enter a booking date.',
        }}
        calendarLabels={{
          previousMonth: 'Previous month',
          nextMonth: 'Next month',
          selected: 'Selected',
        }}
      />
      <Button type="reset" variant="outline">
        Reset date
      </Button>
    </form>
  );
}
