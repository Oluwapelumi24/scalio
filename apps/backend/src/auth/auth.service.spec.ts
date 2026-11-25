import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(async (plain: string, hash: string) => plain === 'secret' && hash === 'hashed'),
  hash: jest.fn(async () => 'hashed'),
}));

describe('AuthService.signIn', () => {
  it('rejects a deleted user even when the password would match', async () => {
    const db = {
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([
            { id: 'u1', email: 'a@b.com', passwordHash: 'hashed', deletedAt: new Date() },
          ]),
        }),
      }),
    };
    const jwt = { sign: jest.fn() };
    const svc = new AuthService(db as never, jwt as never, {} as never, {} as never, {} as never);
    await expect(svc.signIn('a@b.com', 'secret')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwt.sign).not.toHaveBeenCalled();
  });

  it('issues a session for an active user', async () => {
    const db = {
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([
            { id: 'u1', name: 'Ada', email: 'a@b.com', passwordHash: 'hashed', deletedAt: null },
          ]),
        }),
      }),
    };
    const jwt = { sign: jest.fn().mockReturnValue('tok') };
    const svc = new AuthService(db as never, jwt as never, {} as never, {} as never, {} as never);
    await expect(svc.signIn('a@b.com', 'secret')).resolves.toEqual({
      accessToken: 'tok',
      user: { id: 'u1', name: 'Ada', email: 'a@b.com' },
    });
  });
});

describe('AuthService.deleteAccount', () => {
  it('rejects a wrong password', async () => {
    const db = {
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 'u1', passwordHash: 'hashed', deletedAt: null }]),
        }),
      }),
    };
    const mail = { sendAccountDeletedEmail: jest.fn() };
    const svc = new AuthService(db as never, {} as never, {} as never, mail as never, {} as never);
    await expect(svc.deleteAccount('u1', 'wrong')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(mail.sendAccountDeletedEmail).not.toHaveBeenCalled();
  });

  it('anonymises linked customers across two vendors and emails once', async () => {
    const customerSets: Array<Record<string, unknown>> = [];
    const leadSets: Array<Record<string, unknown>> = [];
    const conversationSets: Array<Record<string, unknown>> = [];
    const userSets: Array<Record<string, unknown>> = [];
    let updateCall = 0;

    const tx = {
      select: jest
        .fn()
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            // Two CRM rows — one per vendor — for this user only.
            where: jest.fn().mockResolvedValue([{ id: 'c-v1' }, { id: 'c-v2' }]),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ id: 'lead-1' }]),
          }),
        }),
      update: jest.fn(() => {
        const call = updateCall++;
        return {
          set: (values: Record<string, unknown>) => ({
            where: async () => {
              if (call === 0) customerSets.push(values);
              else if (call === 1) leadSets.push(values);
              else if (call === 2) conversationSets.push(values);
              else userSets.push(values);
              return [];
            },
          }),
        };
      }),
    };

    const db = {
      select: jest
        .fn()
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([
              {
                id: 'u1',
                name: 'Ada Lovelace',
                email: 'ada@example.com',
                passwordHash: 'hashed',
                deletedAt: null,
              },
            ]),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([{ id: 'b1' }]),
            }),
          }),
        }),
      transaction: jest.fn(async (fn: (t: typeof tx) => Promise<void>) => fn(tx)),
    };
    const bookings = { cancelByCustomer: jest.fn().mockResolvedValue({}) };
    const mail = { sendAccountDeletedEmail: jest.fn().mockResolvedValue(undefined) };
    const svc = new AuthService(db as never, {} as never, {} as never, mail as never, bookings as never);

    await svc.deleteAccount('u1', 'secret');

    expect(bookings.cancelByCustomer).toHaveBeenCalledWith('b1', 'Account deleted');
    expect(customerSets[0]).toEqual({
      name: 'Deleted customer',
      phone: null,
      email: null,
      notes: null,
      userId: null,
    });
    // Scoped by userId in the service — other vendors' walk-ins / clients are not selected.
    expect(tx.select).toHaveBeenCalled();
    expect(leadSets[0]).toMatchObject({
      name: 'Deleted customer',
      phone: null,
      email: null,
      note: null,
    });
    expect(conversationSets[0]).toMatchObject({ customerName: 'Deleted customer' });
    expect(userSets[0]).toMatchObject({
      name: 'Deleted user',
      email: 'deleted+u1@tombstone.invalid',
      passwordHash: null,
    });
    // Bookings / ledger tables are never updated here — totals stay as-is.
    expect(tx.update).toHaveBeenCalledTimes(4);
    expect(mail.sendAccountDeletedEmail).toHaveBeenCalledTimes(1);
    expect(mail.sendAccountDeletedEmail).toHaveBeenCalledWith('ada@example.com', 'Ada Lovelace');
  });

  it('still deletes when the confirmation email fails', async () => {
    const tx = {
      select: jest
        .fn()
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ id: 'c1' }]),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([]) }),
      }),
    };
    const db = {
      select: jest
        .fn()
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([
              { id: 'u1', name: 'Ada', email: 'ada@example.com', passwordHash: 'hashed', deletedAt: null },
            ]),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      transaction: jest.fn(async (fn: (t: typeof tx) => Promise<void>) => fn(tx)),
    };
    const mail = {
      sendAccountDeletedEmail: jest.fn().mockRejectedValue(new Error('resend down')),
    };
    const svc = new AuthService(db as never, {} as never, {} as never, mail as never, {
      cancelByCustomer: jest.fn(),
    } as never);

    await expect(svc.deleteAccount('u1', 'secret')).resolves.toBeUndefined();
    expect(db.transaction).toHaveBeenCalled();
    expect(mail.sendAccountDeletedEmail).toHaveBeenCalledTimes(1);
  });
});

describe('AuthService.requestPasswordReset', () => {
  it('is silent when the email is unknown', async () => {
    const db = {
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      }),
    };
    const passwordReset = { issueCode: jest.fn() };
    const mail = { sendPasswordResetEmail: jest.fn() };
    const svc = new AuthService(db as never, {} as never, passwordReset as never, mail as never, {} as never);

    await svc.requestPasswordReset('missing@test.com');

    expect(passwordReset.issueCode).not.toHaveBeenCalled();
    expect(mail.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('is silent when the issue cap returns null', async () => {
    const db = {
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 'u1' }]),
        }),
      }),
    };
    const passwordReset = { issueCode: jest.fn().mockResolvedValue(null) };
    const mail = { sendPasswordResetEmail: jest.fn() };
    const svc = new AuthService(db as never, {} as never, passwordReset as never, mail as never, {} as never);

    await svc.requestPasswordReset('a@b.com');

    expect(mail.sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});
