import { UnauthorizedException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { VendorAuthService } from './vendor-auth.service';

function selectJoinResult(rows: unknown[]) {
  return {
    from: jest.fn(() => ({
      innerJoin: jest.fn(() => ({
        where: jest.fn(() => Promise.resolve(rows)),
      })),
    })),
  };
}

function selectResult(rows: unknown[]) {
  return {
    from: jest.fn(() => ({ where: jest.fn(() => Promise.resolve(rows)) })),
  };
}

function updateReturningResult(rows: unknown[]) {
  return {
    set: jest.fn(() => ({
      where: jest.fn(() => ({
        returning: jest.fn(() => Promise.resolve(rows)),
      })),
    })),
  };
}

function updateResult() {
  return {
    set: jest.fn(() => ({ where: jest.fn(() => Promise.resolve(undefined)) })),
  };
}

function makeDb() {
  return { select: jest.fn(), update: jest.fn() };
}

function makeInvites() {
  return {
    issueToken: jest.fn().mockResolvedValue('invite-token'),
    consumeToken: jest.fn(),
  };
}

function makeMail() {
  return { sendVendorInviteEmail: jest.fn().mockResolvedValue(undefined) };
}

function makePasswordReset() {
  return {
    issueCode: jest.fn().mockResolvedValue('123456'),
    consumeCode: jest.fn(),
  };
}

function makeJwt() {
  return { sign: jest.fn().mockReturnValue('signed-jwt') };
}

function makeConfig(values: Record<string, string> = {}) {
  return { get: jest.fn((key: string) => values[key]) };
}

const staffRow = {
  id: 'staff-1',
  vendorId: 'vendor-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  role: 'owner' as const,
  passwordHash: null as string | null,
  lastLoginAt: null,
  phone: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
};

describe('VendorAuthService', () => {
  describe('issueInvite', () => {
    it('mints a token and emails the setup link for an eligible, not-yet-activated account', async () => {
      const db = makeDb();
      const invites = makeInvites();
      const mail = makeMail();
      db.select.mockReturnValue(
        selectJoinResult([
          {
            staffId: 'staff-1',
            passwordHash: null,
            businessName: 'Glow Studio',
          },
        ]),
      );

      const service = new VendorAuthService(
        db as any,
        invites as any,
        makePasswordReset() as any,
        mail as any,
        makeJwt() as any,
        makeConfig({ VENDOR_WEB_URL: 'https://vendors.scalio.app' }) as any,
      );

      await service.issueInvite('ada@example.com');

      expect(invites.issueToken).toHaveBeenCalledWith('staff-1');
      expect(mail.sendVendorInviteEmail).toHaveBeenCalledWith(
        'ada@example.com',
        'Glow Studio',
        'https://vendors.scalio.app/accept-invite?token=invite-token',
      );
    });

    it('resolves quietly without minting a token when the email is unknown', async () => {
      const db = makeDb();
      const invites = makeInvites();
      const mail = makeMail();
      db.select.mockReturnValue(selectJoinResult([]));

      const service = new VendorAuthService(
        db as any,
        invites as any,
        makePasswordReset() as any,
        mail as any,
        makeJwt() as any,
        makeConfig() as any,
      );

      await service.issueInvite('nobody@example.com');

      expect(invites.issueToken).not.toHaveBeenCalled();
      expect(mail.sendVendorInviteEmail).not.toHaveBeenCalled();
    });

    it('resolves quietly without re-inviting an account that has already activated', async () => {
      const db = makeDb();
      const invites = makeInvites();
      const mail = makeMail();
      db.select.mockReturnValue(
        selectJoinResult([
          {
            staffId: 'staff-1',
            passwordHash: 'existing-hash',
            businessName: 'Glow Studio',
          },
        ]),
      );

      const service = new VendorAuthService(
        db as any,
        invites as any,
        makePasswordReset() as any,
        mail as any,
        makeJwt() as any,
        makeConfig() as any,
      );

      await service.issueInvite('ada@example.com');

      expect(invites.issueToken).not.toHaveBeenCalled();
      expect(mail.sendVendorInviteEmail).not.toHaveBeenCalled();
    });
  });

  describe('acceptInvite', () => {
    it('rejects an invalid, expired, or already-claimed token', async () => {
      const db = makeDb();
      const invites = makeInvites();
      invites.consumeToken.mockResolvedValue(null);

      const service = new VendorAuthService(
        db as any,
        invites as any,
        makePasswordReset() as any,
        makeMail() as any,
        makeJwt() as any,
        makeConfig() as any,
      );

      await expect(
        service.acceptInvite('stale-token', 'super-secret'),
      ).rejects.toThrow(UnauthorizedException);
      expect(db.update).not.toHaveBeenCalled();
    });

    it('hashes the password, activates the account, and signs the staff member in', async () => {
      const db = makeDb();
      const invites = makeInvites();
      const jwt = makeJwt();
      invites.consumeToken.mockResolvedValue('staff-1');
      db.update.mockReturnValue(
        updateReturningResult([{ ...staffRow, passwordHash: 'new-hash' }]),
      );

      const service = new VendorAuthService(
        db as any,
        invites as any,
        makePasswordReset() as any,
        makeMail() as any,
        jwt as any,
        makeConfig() as any,
      );

      const session = await service.acceptInvite('valid-token', 'super-secret');

      expect(jwt.sign).toHaveBeenCalledWith({
        sub: 'staff-1',
        vendorId: 'vendor-1',
        role: 'owner',
      });
      expect(session).toEqual({
        accessToken: 'signed-jwt',
        staff: {
          id: 'staff-1',
          vendorId: 'vendor-1',
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          role: 'owner',
        },
      });
    });
  });

  describe('login', () => {
    it('rejects an unknown email', async () => {
      const db = makeDb();
      db.select.mockReturnValue(selectResult([]));

      const service = new VendorAuthService(
        db as any,
        makeInvites() as any,
        makePasswordReset() as any,
        makeMail() as any,
        makeJwt() as any,
        makeConfig() as any,
      );

      await expect(
        service.login('nobody@example.com', 'whatever1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an account that has not activated yet (no password set)', async () => {
      const db = makeDb();
      db.select.mockReturnValue(selectResult([staffRow]));

      const service = new VendorAuthService(
        db as any,
        makeInvites() as any,
        makePasswordReset() as any,
        makeMail() as any,
        makeJwt() as any,
        makeConfig() as any,
      );

      await expect(
        service.login('ada@example.com', 'whatever1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an incorrect password', async () => {
      const db = makeDb();
      const passwordHash = await hash('correct-password', 10);
      db.select.mockReturnValue(selectResult([{ ...staffRow, passwordHash }]));

      const service = new VendorAuthService(
        db as any,
        makeInvites() as any,
        makePasswordReset() as any,
        makeMail() as any,
        makeJwt() as any,
        makeConfig() as any,
      );

      await expect(
        service.login('ada@example.com', 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('signs the staff member in on a matching password and records the login time', async () => {
      const db = makeDb();
      const jwt = makeJwt();
      const passwordHash = await hash('correct-password', 10);
      const select = selectResult([{ ...staffRow, passwordHash }]);
      const update = updateResult();
      db.select.mockReturnValue(select);
      db.update.mockReturnValue(update);

      const service = new VendorAuthService(
        db as any,
        makeInvites() as any,
        makePasswordReset() as any,
        makeMail() as any,
        jwt as any,
        makeConfig() as any,
      );

      const session = await service.login(
        'ada@example.com',
        'correct-password',
      );

      expect(update.set).toHaveBeenCalledWith({
        lastLoginAt: expect.any(Date) as Date,
      });
      expect(session.accessToken).toBe('signed-jwt');
      expect(session.staff.id).toBe('staff-1');
    });
  });

  describe('findActiveStaffById', () => {
    it('returns the staff record only when it has an active password', async () => {
      const db = makeDb();
      db.select
        .mockReturnValueOnce(
          selectResult([{ ...staffRow, passwordHash: 'a-hash' }]),
        )
        .mockReturnValueOnce(selectResult([staffRow]))
        .mockReturnValueOnce(selectResult([]));

      const service = new VendorAuthService(
        db as any,
        makeInvites() as any,
        makePasswordReset() as any,
        makeMail() as any,
        makeJwt() as any,
        makeConfig() as any,
      );

      await expect(
        service.findActiveStaffById('staff-1'),
      ).resolves.toMatchObject({ id: 'staff-1' });
      await expect(service.findActiveStaffById('staff-1')).resolves.toBeNull();
      await expect(service.findActiveStaffById('missing')).resolves.toBeNull();
    });
  });
});
