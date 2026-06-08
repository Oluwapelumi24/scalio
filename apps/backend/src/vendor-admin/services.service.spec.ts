import { NotFoundException } from '@nestjs/common';
import { VendorServicesService } from './services.service';

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

function updateResult(rows: unknown[]) {
  return {
    set: jest.fn(() => ({
      where: jest.fn(() => ({
        returning: jest.fn(() => Promise.resolve(rows)),
      })),
    })),
  };
}

function deleteResult(rows: unknown[]) {
  return {
    where: jest.fn(() => ({
      returning: jest.fn(() => Promise.resolve(rows)),
    })),
  };
}

function makeDb() {
  return {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

const serviceRow = {
  id: 'service-1',
  vendorId: 'vendor-1',
  name: 'Haircut',
  durationMinutes: 30,
  priceKobo: 500000,
  paymentMode: 'pay_on_arrival' as const,
  depositPercent: null,
};

describe('VendorServicesService', () => {
  describe('list', () => {
    it('returns the vendor’s services', async () => {
      const db = makeDb();
      db.select.mockReturnValueOnce(selectResult([serviceRow]));

      const service = new VendorServicesService(db as any);
      const result = await service.list('vendor-1');

      expect(result).toEqual([serviceRow]);
    });
  });

  describe('create', () => {
    it('inserts a service scoped to the vendor', async () => {
      const db = makeDb();
      db.insert.mockReturnValueOnce(insertResult([serviceRow]));

      const service = new VendorServicesService(db as any);
      const result = await service.create('vendor-1', {
        name: 'Haircut',
        durationMinutes: 30,
        priceKobo: 500000,
      });

      expect(result).toBe(serviceRow);
      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates a service owned by the vendor', async () => {
      const db = makeDb();
      const updated = { ...serviceRow, name: 'Beard trim' };
      db.update.mockReturnValueOnce(updateResult([updated]));

      const service = new VendorServicesService(db as any);
      const result = await service.update('vendor-1', 'service-1', {
        name: 'Beard trim',
      });

      expect(result).toBe(updated);
    });

    it('throws NotFoundException when the service does not belong to the vendor', async () => {
      const db = makeDb();
      db.update.mockReturnValueOnce(updateResult([]));

      const service = new VendorServicesService(db as any);

      await expect(
        service.update('vendor-1', 'service-1', { name: 'Beard trim' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes a service owned by the vendor', async () => {
      const db = makeDb();
      db.delete.mockReturnValueOnce(deleteResult([{ id: 'service-1' }]));

      const service = new VendorServicesService(db as any);

      await expect(
        service.remove('vendor-1', 'service-1'),
      ).resolves.toBeUndefined();
    });

    it('throws NotFoundException when the service does not belong to the vendor', async () => {
      const db = makeDb();
      db.delete.mockReturnValueOnce(deleteResult([]));

      const service = new VendorServicesService(db as any);

      await expect(service.remove('vendor-1', 'service-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
