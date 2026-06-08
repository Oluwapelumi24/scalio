import { ConflictException, NotFoundException } from '@nestjs/common';
import { VendorScheduleService } from './schedule.service';

function selectResult(rows: unknown[]) {
  return {
    from: jest.fn(() => ({ where: jest.fn(() => Promise.resolve(rows)) })),
  };
}

function insertResult(rows: unknown[]) {
  return {
    values: jest.fn(() => ({
      returning: jest.fn(() => Promise.resolve(rows)),
    })),
  };
}

function deleteResult(rows: unknown[]) {
  return {
    where: jest.fn(() => Promise.resolve(rows)),
  };
}

function deleteReturningResult(rows: unknown[]) {
  return {
    where: jest.fn(() => ({
      returning: jest.fn(() => Promise.resolve(rows)),
    })),
  };
}

interface FakeDb {
  select: jest.Mock;
  insert: jest.Mock;
  delete: jest.Mock;
  transaction: jest.Mock;
}

function makeDb(): FakeDb {
  const db: FakeDb = {
    select: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
    transaction: jest.fn(),
  };
  db.transaction.mockImplementation((fn: (tx: FakeDb) => unknown) => fn(db));
  return db;
}

describe('VendorScheduleService', () => {
  describe('getBusinessHours', () => {
    it('returns the vendor’s configured weekly hours', async () => {
      const db = makeDb();
      const rows = [
        {
          id: 'hours-1',
          vendorId: 'vendor-1',
          dayOfWeek: 1,
          opensAtMinutes: 540,
          closesAtMinutes: 1020,
        },
      ];
      db.select.mockReturnValueOnce(selectResult(rows));

      const service = new VendorScheduleService(db as any);
      await expect(service.getBusinessHours('vendor-1')).resolves.toEqual(rows);
    });
  });

  describe('setBusinessHours', () => {
    it('atomically replaces the weekly schedule', async () => {
      const db = makeDb();
      const days = [
        { dayOfWeek: 1, opensAtMinutes: 540, closesAtMinutes: 1020 },
        { dayOfWeek: 2, opensAtMinutes: 540, closesAtMinutes: 1020 },
      ];
      const created = days.map((d, i) => ({
        id: `hours-${i}`,
        vendorId: 'vendor-1',
        ...d,
      }));
      db.delete.mockReturnValueOnce(deleteResult(undefined as any));
      db.insert.mockReturnValueOnce(insertResult(created));

      const service = new VendorScheduleService(db as any);
      const result = await service.setBusinessHours('vendor-1', { days });

      expect(result).toEqual(created);
      expect(db.transaction).toHaveBeenCalled();
      expect(db.delete).toHaveBeenCalled();
      expect(db.insert).toHaveBeenCalled();
    });

    it('clears the schedule without inserting when given an empty list', async () => {
      const db = makeDb();
      db.delete.mockReturnValueOnce(deleteResult(undefined as any));

      const service = new VendorScheduleService(db as any);
      const result = await service.setBusinessHours('vendor-1', { days: [] });

      expect(result).toEqual([]);
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('rejects duplicate weekday entries', async () => {
      const db = makeDb();
      const service = new VendorScheduleService(db as any);

      await expect(
        service.setBusinessHours('vendor-1', {
          days: [
            { dayOfWeek: 1, opensAtMinutes: 540, closesAtMinutes: 1020 },
            { dayOfWeek: 1, opensAtMinutes: 600, closesAtMinutes: 900 },
          ],
        }),
      ).rejects.toThrow(ConflictException);
      expect(db.transaction).not.toHaveBeenCalled();
    });

    it('rejects an entry where opening time is not before closing time', async () => {
      const db = makeDb();
      const service = new VendorScheduleService(db as any);

      await expect(
        service.setBusinessHours('vendor-1', {
          days: [{ dayOfWeek: 1, opensAtMinutes: 1020, closesAtMinutes: 540 }],
        }),
      ).rejects.toThrow(ConflictException);
      expect(db.transaction).not.toHaveBeenCalled();
    });
  });

  describe('getBlackoutDates', () => {
    it('returns the vendor’s blackout dates', async () => {
      const db = makeDb();
      const rows = [
        {
          id: 'blk-1',
          vendorId: 'vendor-1',
          date: '2026-12-25',
          reason: 'Christmas',
        },
      ];
      db.select.mockReturnValueOnce(selectResult(rows));

      const service = new VendorScheduleService(db as any);
      await expect(service.getBlackoutDates('vendor-1')).resolves.toEqual(rows);
    });
  });

  describe('addBlackoutDate', () => {
    it('creates a blackout date when none exists for that day yet', async () => {
      const db = makeDb();
      const created = {
        id: 'blk-1',
        vendorId: 'vendor-1',
        date: '2026-12-25',
        reason: 'Christmas',
      };
      db.select.mockReturnValueOnce(selectResult([]));
      db.insert.mockReturnValueOnce(insertResult([created]));

      const service = new VendorScheduleService(db as any);
      const result = await service.addBlackoutDate('vendor-1', {
        date: '2026-12-25',
        reason: 'Christmas',
      });

      expect(result).toBe(created);
    });

    it('raises a conflict when the date is already blocked off', async () => {
      const db = makeDb();
      db.select.mockReturnValueOnce(selectResult([{ id: 'blk-1' }]));

      const service = new VendorScheduleService(db as any);

      await expect(
        service.addBlackoutDate('vendor-1', { date: '2026-12-25' }),
      ).rejects.toThrow(ConflictException);
      expect(db.insert).not.toHaveBeenCalled();
    });
  });

  describe('removeBlackoutDate', () => {
    it('deletes a blackout date owned by the vendor', async () => {
      const db = makeDb();
      db.delete.mockReturnValueOnce(deleteReturningResult([{ id: 'blk-1' }]));

      const service = new VendorScheduleService(db as any);

      await expect(
        service.removeBlackoutDate('vendor-1', 'blk-1'),
      ).resolves.toBeUndefined();
    });

    it('throws NotFoundException when the blackout date does not belong to the vendor', async () => {
      const db = makeDb();
      db.delete.mockReturnValueOnce(deleteReturningResult([]));

      const service = new VendorScheduleService(db as any);

      await expect(
        service.removeBlackoutDate('vendor-1', 'blk-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
