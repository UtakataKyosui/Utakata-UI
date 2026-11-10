import {
  Calendar,
  type CalendarDate,
  type CalendarRange,
} from '@utakata-ui/react';
import { useState } from 'react';

// 日付は "YYYY-MM-DD" の文字列です。土日は選択できません。
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
        aria-label="予約日"
        defaultMonth="2026-11"
        minDate="2026-11-03"
        isDateDisabled={isWeekend}
        weekStartsOn={1}
        value={date}
        onValueChange={setDate}
      />
      <p>選択した日: {date ?? '未選択'}</p>
      <Calendar
        aria-label="宿泊期間"
        mode="range"
        defaultMonth="2026-11"
        value={stay}
        onValueChange={setStay}
      />
      <p>
        宿泊期間:{' '}
        {stay ? `${stay.from} から ${stay.to ?? '（終了日を選択）'}` : '未選択'}
      </p>
    </div>
  );
}
