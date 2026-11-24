import { UnauthorizedException } from '@nestjs/common';
import { UserJwtStrategy } from './user-jwt.strategy';

describe('UserJwtStrategy.validate', () => {
  const config = { get: () => 'test-secret-that-is-long-enough-32' };

  it('rejects a missing user', async () => {
    const auth = { findById: jest.fn().mockResolvedValue(null) };
    const strategy = new UserJwtStrategy(config as never, auth as never);
    await expect(strategy.validate({ sub: 'u1' })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a soft-deleted user', async () => {
    const auth = {
      findById: jest.fn().mockResolvedValue({
        id: 'u1',
        passwordHash: 'hashed',
        deletedAt: new Date(),
      }),
    };
    const strategy = new UserJwtStrategy(config as never, auth as never);
    await expect(strategy.validate({ sub: 'u1' })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an anonymised user with a null password hash', async () => {
    const auth = {
      findById: jest.fn().mockResolvedValue({
        id: 'u1',
        passwordHash: null,
        deletedAt: null,
      }),
    };
    const strategy = new UserJwtStrategy(config as never, auth as never);
    await expect(strategy.validate({ sub: 'u1' })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns an active user', async () => {
    const user = { id: 'u1', passwordHash: 'hashed', deletedAt: null };
    const auth = { findById: jest.fn().mockResolvedValue(user) };
    const strategy = new UserJwtStrategy(config as never, auth as never);
    await expect(strategy.validate({ sub: 'u1' })).resolves.toBe(user);
  });
});
