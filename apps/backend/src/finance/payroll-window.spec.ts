import { salaryWindow } from './payroll-window';

const monthly25 = { payDay: 25, opensDaysBefore: 3, closesDaysAfter: 5, paused: false };

describe('salaryWindow', () => {
  it('is not set up without a schedule', () => {
    expect(salaryWindow(null, '2026-10-16').state).toBe('not_set_up');
  });

  it('is paused when the owner pauses it', () => {
    expect(salaryWindow({ ...monthly25, paused: true }, '2026-10-24')).toMatchObject({ state: 'paused' });
  });

  it('is closed before the window, and says when it opens', () => {
    const w = salaryWindow(monthly25, '2026-10-16');
    expect(w).toMatchObject({ state: 'closed', period: '2026-10', payDate: '2026-10-25', opensOn: '2026-10-22', closesOn: '2026-10-30' });
    expect(w.reason).toContain('Payroll opens on');
  });

  it('opens a few days before pay day and stays open a few days after', () => {
    expect(salaryWindow(monthly25, '2026-10-22')).toMatchObject({ state: 'open', period: '2026-10' });
    expect(salaryWindow(monthly25, '2026-10-30')).toMatchObject({ state: 'open', period: '2026-10' });
    expect(salaryWindow(monthly25, '2026-10-31')).toMatchObject({ state: 'closed', period: '2026-11', opensOn: '2026-11-22' });
  });

  it('handles windows that cross into the next month and year', () => {
    const early = { payDay: 2, opensDaysBefore: 4, closesDaysAfter: 2, paused: false };
    // Pay day 2 Jan 2027: window opens 29 Dec 2026, belongs to the January period.
    expect(salaryWindow(early, '2026-12-30')).toMatchObject({ state: 'open', period: '2027-01', opensOn: '2026-12-29', closesOn: '2027-01-04' });
    // Late pay day: 28 Nov + 5 days closes on 3 Dec.
    expect(salaryWindow({ ...monthly25, payDay: 28 }, '2026-12-02')).toMatchObject({ state: 'open', period: '2026-11' });
  });
});
