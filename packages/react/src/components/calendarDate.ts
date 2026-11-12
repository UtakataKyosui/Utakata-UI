/** A calendar day as an ISO 8601 date string, for example "2026-11-10". */
export type CalendarDate = `${number}-${number}-${number}`;

const pad = (value: number, length = 2) => String(value).padStart(length, '0');

export function formatDate(ms: number): CalendarDate {
  const date = new Date(ms);
  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}` as CalendarDate;
}

/** Epoch ms at UTC midnight, or null for anything but a real calendar day. */
export function parseDate(value: string | null | undefined): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!match) return null;
  const ms = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return formatDate(ms) === value ? ms : null;
}
