import { ConflictException, NotFoundException } from '@nestjs/common';
import { VendorStaffService } from './staff.service';

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

function makeVendorAuth() {
  return { issueInvite: jest.fn().mockResolvedValue(undefined) };
}

const staffRow = {
  id: 'staff-1',
  vendorId: 'vendor-1',
  name: 'Ada Lovelace',
  phone: null,
  email: 'ada@example.com',
  role: 'practitioner' as const,
  hasActivatedAccount: true,
  lastLoginAt: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
};

describe('VendorStaffService', () => {
  describe('list', () => {
    it('returns the vendor’s staff without leaking the password hash', async () => {
      const db = makeDb();
      const selectSpy = selectResult([staffRow]);
      db.select.mockReturnValueOnce(selectSpy);

      const service = new VendorStaffService(
        db as any,
        makeVendorAuth() as any,
      );
      const result = await service.list('vendor-1');

      expect(result).toEqual([staffRow]);
      const [projection] = db.select.mock.calls[0] as [Record<string, unknown>];
      expect(projection).not.toHaveProperty('passwordHash');
      expect(projection).toHaveProperty('hasActivatedAccount');
    });
  });

  describe('create', () => {
    it('creates the staff record and issues an invite when an email is given', async () => {
      const db = makeDb();
      const vendorAuth = makeVendorAuth();
      const inserted = insertResult([{ ...staffRow, passwordHash: null }]);
      db.insert.mockReturnValueOnce(inserted);
      db.select.mockReturnValueOnce(selectResult([]));
      const service = new VendorStaffService(db as any, vendorAuth as any);
      const result = await service.create('vendor-1', {
        name: 'Ada Lovelace',
        email: 'Ada@example.com',
        role: 'practitioner',
      });

      expect(result.id).toBe('staff-1');
      expect(result.inviteSent).toBe(true);
      expect(inserted.values).toHaveBeenCalledWith(expect.objectContaining({ email: 'ada@example.com' }));
      expect(vendorAuth.issueInvite).toHaveBeenCalledWith('ada@example.com');
    });

    it('rejects an email that already has a Veno login', async () => {
      const db = makeDb();
      const vendorAuth = makeVendorAuth();
      db.select.mockReturnValueOnce(selectResult([{ id: 'staff-9' }]));

      const service = new VendorStaffService(db as any, vendorAuth as any);

      await expect(
        service.create('vendor-1', {
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          role: 'practitioner',
        }),
      ).rejects.toThrow(ConflictException);
      expect(db.insert).not.toHaveBeenCalled();
      expect(vendorAuth.issueInvite).not.toHaveBeenCalled();
    });

    it('turns a unique-email race into the same message', async () => {
      const db = makeDb();
      const vendorAuth = makeVendorAuth();
      db.select.mockReturnValueOnce(selectResult([]));
      const duplicate = Object.assign(new Error('duplicate key'), { code: '23505' });
      db.insert.mockReturnValueOnce({
        values: jest.fn(() => ({
          returning: jest.fn(() => Promise.reject(duplicate)),
        })),
      });

      const service = new VendorStaffService(db as any, vendorAuth as any);

      await expect(
        service.create('vendor-1', {
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          role: 'practitioner',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('keeps the staff member when the invite email fails', async () => {
      const db = makeDb();
      const vendorAuth = makeVendorAuth();
      vendorAuth.issueInvite.mockRejectedValue(new Error('redis down'));
      db.select.mockReturnValueOnce(selectResult([]));
      db.insert.mockReturnValueOnce(
        insertResult([{ ...staffRow, passwordHash: null }]),
      );

      const service = new VendorStaffService(db as any, vendorAuth as any);
      const result = await service.create('vendor-1', {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        role: 'practitioner',
      });

      expect(result.id).toBe('staff-1');
      expect(result.inviteSent).toBe(false);
    });

    it('skips the invite when no email is given', async () => {
      const db = makeDb();
      const vendorAuth = makeVendorAuth();
      db.insert.mockReturnValueOnce(
        insertResult([{ ...staffRow, email: null, passwordHash: null }]),
      );

      const service = new VendorStaffService(db as any, vendorAuth as any);
      await service.create('vendor-1', {
        name: 'Ada Lovelace',
        role: 'practitioner',
      });

      expect(vendorAuth.issueInvite).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates a staff member owned by the vendor', async () => {
      const db = makeDb();
      const updated = { ...staffRow, name: 'Ada King' };
      db.update.mockReturnValueOnce(updateResult([updated]));

      const service = new VendorStaffService(
        db as any,
        makeVendorAuth() as any,
      );
      const result = await service.update('vendor-1', 'staff-1', {
        name: 'Ada King',
      });

      expect(result).toBe(updated);
    });

    it('throws NotFoundException when the staff member does not belong to the vendor', async () => {
      const db = makeDb();
      db.update.mockReturnValueOnce(updateResult([]));

      const service = new VendorStaffService(
        db as any,
        makeVendorAuth() as any,
      );

      await expect(
        service.update('vendor-1', 'staff-1', { name: 'Ada King' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes a staff member owned by the vendor', async () => {
      const db = makeDb();
      db.delete.mockReturnValueOnce(deleteResult([{ id: 'staff-1' }]));

      const service = new VendorStaffService(
        db as any,
        makeVendorAuth() as any,
      );

      await expect(
        service.remove('vendor-1', 'staff-1'),
      ).resolves.toBeUndefined();
    });

    it('throws NotFoundException when the staff member does not belong to the vendor', async () => {
      const db = makeDb();
      db.delete.mockReturnValueOnce(deleteResult([]));

      const service = new VendorStaffService(
        db as any,
        makeVendorAuth() as any,
      );

      await expect(service.remove('vendor-1', 'staff-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
