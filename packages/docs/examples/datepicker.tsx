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
        label="予約日"
        name="bookingDate"
        required
        value={date}
        defaultValue="2026-11-10"
        today="2026-11-10"
        minDate="2026-11-05"
        maxDate="2026-12-31"
        onValueChange={setDate}
      />
      <Button type="reset" variant="outline">
        日付を戻す
      </Button>
    </form>
  );
}
