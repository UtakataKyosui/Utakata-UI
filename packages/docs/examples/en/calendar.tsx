import {
  Calendar,
  type CalendarDate,
  type CalendarRange,
} from '@utakata-ui/react';
import { useState } from 'react';

// Dates are "YYYY-MM-DD" strings. Weekends cannot be selected.
const isWeekend = (date: CalendarDate) => {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
};

export default function CalendarExample() {
  const [date, setDate] = useState<CalendarDate | null>(null);
  const [stay, setStay] = useState<CalendarRange | null>(null);
  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <Calendar
        aria-label="Booking date"
        locale="en-US"
        defaultMonth="2026-11"
        minDate="2026-11-03"
        isDateDisabled={isWeekend}
        weekStartsOn={1}
        labels={{
          previousMonth: 'Previous month',
          nextMonth: 'Next month',
          selected: 'Selected',
        }}
        value={date}
        onValueChange={setDate}
      />
      <p>Selected date: {date ?? 'none'}</p>
      <Calendar
        aria-label="Stay"
        mode="range"
        locale="en-US"
        defaultMonth="2026-11"
        labels={{
          previousMonth: 'Previous month',
          nextMonth: 'Next month',
          selected: 'Selected',
        }}
        value={stay}
        onValueChange={setStay}
      />
      <p>
        Stay:{' '}
        {stay ? `${stay.from} to ${stay.to ?? '(choose an end date)'}` : 'none'}
      </p>
    </div>
  );
}
