/**
 * When salaries can be paid. A business picks a pay day (1–28); payroll opens a
 * few days before it and closes a few days after. Outside that window — or
 * with no schedule, or a paused one — starting payroll is disabled, and the
 * app says why and when it next opens. All dates are the business's calendar.
 */
export interface PayrollScheduleInput {
  payDay: number;
  opensDaysBefore: number;
  closesDaysAfter: number;
  paused: boolean;
}

export type WindowState = 'not_set_up' | 'paused' | 'open' | 'closed';

export interface SalaryWindow {
  state: WindowState;
  /** 'YYYY-MM' of the pay day this window belongs to (open), or the next one (closed). */
  period: string | null;
  payDate: string | null;
  opensOn: string | null;
  closesOn: string | null;
  reason: string;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (isoDate: string, days: number) => {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return iso(d);
};
const payDateFor = (year: number, monthIndex: number, payDay: number) => iso(new Date(Date.UTC(year, monthIndex, payDay)));
const monthName = (period: string) =>
  new Date(`${period}-01T00:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const pretty = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

export function salaryWindow(schedule: PayrollScheduleInput | null, today: string): SalaryWindow {
  if (!schedule) {
    return { state: 'not_set_up', period: null, payDate: null, opensOn: null, closesOn: null, reason: 'Set a pay day to start paying salaries from Scalio.' };
  }
  const [y, m] = today.split('-').map(Number);
  // Windows can spill across month ends, so check last month's, this month's and next month's.
  const candidates = [-1, 0, 1].map((offset) => {
    const d = new Date(Date.UTC(y, m - 1 + offset, 1));
    const payDate = payDateFor(d.getUTCFullYear(), d.getUTCMonth(), schedule.payDay);
    return {
      period: payDate.slice(0, 7),
      payDate,
      opensOn: addDays(payDate, -schedule.opensDaysBefore),
      closesOn: addDays(payDate, schedule.closesDaysAfter),
    };
  });

  if (schedule.paused) {
    return { state: 'paused', period: null, payDate: null, opensOn: null, closesOn: null, reason: 'Payroll is paused. Resume it in payroll settings to pay salaries.' };
  }
  const open = candidates.find((c) => c.opensOn <= today && today <= c.closesOn);
  if (open) {
    return { state: 'open', ...open, reason: `${monthName(open.period)} payroll is open until ${pretty(open.closesOn)}.` };
  }
  const next = candidates.find((c) => c.opensOn > today)!;
  return { state: 'closed', ...next, reason: `Payroll opens on ${pretty(next.opensOn)}, ahead of pay day on ${pretty(next.payDate)}.` };
}
