import { isLeadDue } from './lead-due';

const now = new Date('2026-10-16T12:00:00Z');
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);

describe('isLeadDue', () => {
  it('is due once the follow-up time arrives', () => {
    expect(isLeadDue({ status: 'contacted', followUpAt: hoursAgo(1), createdAt: hoursAgo(48) }, now)).toBe(true);
    expect(isLeadDue({ status: 'contacted', followUpAt: hoursAgo(-1), createdAt: hoursAgo(48) }, now)).toBe(false);
  });

  it('flags new leads left untouched for a day', () => {
    expect(isLeadDue({ status: 'new', followUpAt: null, createdAt: hoursAgo(25) }, now)).toBe(true);
    expect(isLeadDue({ status: 'new', followUpAt: null, createdAt: hoursAgo(2) }, now)).toBe(false);
  });

  it('a planned follow-up overrides the untouched rule', () => {
    expect(isLeadDue({ status: 'new', followUpAt: hoursAgo(-24), createdAt: hoursAgo(72) }, now)).toBe(false);
  });

  it('closed leads are never due', () => {
    expect(isLeadDue({ status: 'won', followUpAt: hoursAgo(5), createdAt: hoursAgo(72) }, now)).toBe(false);
    expect(isLeadDue({ status: 'lost', followUpAt: null, createdAt: hoursAgo(72) }, now)).toBe(false);
  });
});
