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
    const svc = new AuthService(db as never, {} as never, {} as never, {} as never, {} as never);
    await expect(svc.deleteAccount('u1', 'wrong')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('cancels future bookings, unlinks customers, and anonymises in a transaction', async () => {
    const userUpdateWhere = jest.fn().mockResolvedValue([]);
    const customerUpdateWhere = jest.fn().mockResolvedValue([]);
    const tx = {
      update: jest
        .fn()
        .mockReturnValueOnce({
          set: jest.fn().mockReturnValue({ where: customerUpdateWhere }),
        })
        .mockReturnValueOnce({
          set: jest.fn().mockReturnValue({ where: userUpdateWhere }),
        }),
    };
    const db = {
      select: jest
        .fn()
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ id: 'u1', passwordHash: 'hashed', deletedAt: null }]),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([{ id: 'b1' }, { id: 'b2' }]),
            }),
          }),
        }),
      transaction: jest.fn(async (fn: (t: typeof tx) => Promise<void>) => fn(tx)),
    };
    const bookings = { cancelByCustomer: jest.fn().mockResolvedValue({}) };
    const svc = new AuthService(db as never, {} as never, {} as never, {} as never, bookings as never);

    await svc.deleteAccount('u1', 'secret');

    expect(bookings.cancelByCustomer).toHaveBeenCalledWith('b1', 'Account deleted');
    expect(bookings.cancelByCustomer).toHaveBeenCalledWith('b2', 'Account deleted');
    expect(db.transaction).toHaveBeenCalled();
    expect(customerUpdateWhere).toHaveBeenCalled();
    expect(userUpdateWhere).toHaveBeenCalled();
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
