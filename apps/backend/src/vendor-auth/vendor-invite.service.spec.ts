import {
  VendorInviteService,
  VENDOR_INVITE_TTL_SECONDS,
} from './vendor-invite.service';

describe('VendorInviteService', () => {
  it('builds a key namespaced by token', () => {
    const service = new VendorInviteService({} as any);

    expect(service.buildKey('abc123')).toBe('vendor-invite:abc123');
  });

  it('mints a random token, binds it to the staff id, and stores it with a TTL', async () => {
    const set = jest.fn().mockResolvedValue('OK');
    const service = new VendorInviteService({ set } as any);

    const token = await service.issueToken('staff-1');

    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(set).toHaveBeenCalledWith(
      `vendor-invite:${token}`,
      'staff-1',
      'EX',
      VENDOR_INVITE_TTL_SECONDS,
    );
  });

  it('resolves and consumes a valid token via the get-and-delete script', async () => {
    const evalFn = jest.fn().mockResolvedValue('staff-1');
    const service = new VendorInviteService({ eval: evalFn } as any);

    const staffId = await service.consumeToken('abc123');

    expect(staffId).toBe('staff-1');
    expect(evalFn).toHaveBeenCalledWith(
      expect.any(String),
      1,
      'vendor-invite:abc123',
    );
  });

  it('returns null for a token that is unknown, expired, or already claimed', async () => {
    const evalFn = jest.fn().mockResolvedValue(false);
    const service = new VendorInviteService({ eval: evalFn } as any);

    const staffId = await service.consumeToken('stale-token');

    expect(staffId).toBeNull();
  });
});
