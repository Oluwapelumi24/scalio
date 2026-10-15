import { BadRequestException } from '@nestjs/common';
import { businessDayBounds } from '../common/business-day';
import type { PerfRange } from './performance';

const MAX_DAYS = 366;

/** Today's date in the business's calendar, 'YYYY-MM-DD'. */
export function businessToday(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

/** Turns inclusive business-calendar dates into the instants they cover. */
export function resolvePeriod(from: string, to: string, timeZone: string, now: Date): PerfRange {
  const fromDate = from.slice(0, 10);
  const toDate = to.slice(0, 10);
  if (fromDate > toDate) throw new BadRequestException('"from" must be on or before "to".');
  const days = (Date.parse(toDate) - Date.parse(fromDate)) / 86_400_000 + 1;
  if (days > MAX_DAYS) throw new BadRequestException(`Choose a period of at most ${MAX_DAYS} days.`);

  // Noon UTC falls on the same calendar date in every timezone within ±12h.
  const start = businessDayBounds(new Date(`${fromDate}T12:00:00Z`), timeZone).start;
  const end = businessDayBounds(new Date(`${toDate}T12:00:00Z`), timeZone).end;
  return { fromDate, toDate, start, end, today: businessToday(now, timeZone) };
}
