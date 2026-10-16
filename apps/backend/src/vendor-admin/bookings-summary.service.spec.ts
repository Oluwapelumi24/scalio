import { NotFoundException } from '@nestjs/common';
import { BookingsSummaryService } from './bookings-summary.service';

function selectResult(rows: unknown[]) {
  return { from: jest.fn(() => ({ where: jest.fn(() => Promise.resolve(rows)) })) };
}

describe('BookingsSummaryService.today', () => {
  const now = new Date('2026-10-17T09:00:00Z');

  it("returns today's bookings and sales in the business's calendar", async () => {
    const db = { select: jest.fn() };
    db.select
      .mockReturnValueOnce(selectResult([{ timezone: 'Africa/Lagos' }]))
      .mockReturnValueOnce(selectResult([{ bookings: 14, sales: 18_600_000 }]));
    await expect(new BookingsSummaryService(db as any).today('v-1', { now, includeSales: true })).resolves.toEqual({
      date: '2026-10-17',
      bookings: 14,
      salesKobo: 18_600_000,
    });
  });

  it('hides sales from roles that do not see money', async () => {
    const db = { select: jest.fn() };
    db.select
      .mockReturnValueOnce(selectResult([{ timezone: 'Africa/Lagos' }]))
      .mockReturnValueOnce(selectResult([{ bookings: 3, sales: 900_000 }]));
    const summary = await new BookingsSummaryService(db as any).today('v-1', { now, staffId: 's-1', includeSales: false });
    expect(summary.salesKobo).toBeNull();
    expect(summary.bookings).toBe(3);
  });

  it('404s for an unknown business', async () => {
    const db = { select: jest.fn().mockReturnValueOnce(selectResult([])) };
    await expect(new BookingsSummaryService(db as any).today('nope', { now, includeSales: true })).rejects.toBeInstanceOf(NotFoundException);
  });
});
