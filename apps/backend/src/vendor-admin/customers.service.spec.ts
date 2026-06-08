import { NotFoundException } from '@nestjs/common';
import { VendorCustomersService } from './customers.service';

function selectResult(rows: unknown[]) {
  return {
    from: jest.fn(() => ({ where: jest.fn(() => Promise.resolve(rows)) })),
  };
}

function selectOrderedResult(rows: unknown[]) {
  return {
    from: jest.fn(() => ({
      where: jest.fn(() => ({ orderBy: jest.fn(() => Promise.resolve(rows)) })),
    })),
  };
}

function updateResult(rows: unknown[]) {
  return {
    set: jest.fn(() => ({
      where: jest.fn(() => ({
        returning: jest.fn(() => Promise.resolve(rows)),
      })),
    })),
  };
}

function makeDb() {
  return { select: jest.fn(), update: jest.fn() };
}

const customerRow = {
  id: 'customer-1',
  vendorId: 'vendor-1',
  userId: 'user-1',
  name: 'Grace Hopper',
  phone: '+2348000000000',
  email: 'grace@example.com',
  visitCount: 3,
  lifetimeValueKobo: 1500000,
  noShowCount: 0,
  lastVisitAt: new Date('2026-05-01T10:00:00Z'),
  notes: null,
};

describe('VendorCustomersService', () => {
  describe('list', () => {
    it('returns the vendor’s customers ordered by most recent visit', async () => {
      const db = makeDb();
      db.select.mockReturnValueOnce(selectOrderedResult([customerRow]));

      const service = new VendorCustomersService(db as any);
      await expect(service.list('vendor-1')).resolves.toEqual([customerRow]);
    });
  });

  describe('getById', () => {
    it('returns a customer owned by the vendor', async () => {
      const db = makeDb();
      db.select.mockReturnValueOnce(selectResult([customerRow]));

      const service = new VendorCustomersService(db as any);
      await expect(service.getById('vendor-1', 'customer-1')).resolves.toBe(
        customerRow,
      );
    });

    it('throws NotFoundException when the customer does not belong to the vendor', async () => {
      const db = makeDb();
      db.select.mockReturnValueOnce(selectResult([]));

      const service = new VendorCustomersService(db as any);

      await expect(service.getById('vendor-1', 'customer-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateNotes', () => {
    it('updates the notes on a customer owned by the vendor', async () => {
      const db = makeDb();
      const updated = { ...customerRow, notes: 'Prefers afternoon slots' };
      db.update.mockReturnValueOnce(updateResult([updated]));

      const service = new VendorCustomersService(db as any);
      const result = await service.updateNotes('vendor-1', 'customer-1', {
        notes: 'Prefers afternoon slots',
      });

      expect(result).toBe(updated);
    });

    it('throws NotFoundException when the customer does not belong to the vendor', async () => {
      const db = makeDb();
      db.update.mockReturnValueOnce(updateResult([]));

      const service = new VendorCustomersService(db as any);

      await expect(
        service.updateNotes('vendor-1', 'customer-1', { notes: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
