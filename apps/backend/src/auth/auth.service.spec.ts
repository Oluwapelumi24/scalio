import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(async (plain: string, hash: string) => plain === 'secret' && hash === 'hashed'),
  hash: jest.fn(async () => 'hashed'),
}));

describe('AuthService.deleteAccount', () => {
  it('rejects a wrong password', async () => {
    const db = {
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 'u1', passwordHash: 'hashed' }]),
        }),
      }),
    };
    const svc = new AuthService(db as never, {} as never, {} as never, {} as never, {} as never);
    await expect(svc.deleteAccount('u1', 'wrong')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('cancels future bookings and anonymises the user', async () => {
    const updateWhere = jest.fn().mockResolvedValue([]);
    const db = {
      select: jest
        .fn()
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ id: 'u1', passwordHash: 'hashed' }]),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([{ id: 'b1' }, { id: 'b2' }]),
            }),
          }),
        }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({ where: updateWhere }),
      }),
    };
    const bookings = { cancelByCustomer: jest.fn().mockResolvedValue({}) };
    const svc = new AuthService(db as never, {} as never, {} as never, {} as never, bookings as never);

    await svc.deleteAccount('u1', 'secret');

    expect(bookings.cancelByCustomer).toHaveBeenCalledWith('b1', 'Account deleted');
    expect(bookings.cancelByCustomer).toHaveBeenCalledWith('b2', 'Account deleted');
    expect(updateWhere).toHaveBeenCalled();
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
