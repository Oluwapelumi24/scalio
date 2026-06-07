import { SlotLockService } from './slot-lock.service';

describe('SlotLockService', () => {
  function makeService(redis: any) {
    return new SlotLockService(redis);
  }

  it('builds a key namespaced by vendor, staff, and minute-precision time', () => {
    const service = makeService({});
    expect(service.buildKey('vendor-1', 'staff-1', '2026-06-07T10:00')).toBe(
      'slot:vendor-1:staff-1:2026-06-07T10:00',
    );
    expect(service.buildKey('vendor-1', 'any', '2026-06-07T10:00')).toBe(
      'slot:vendor-1:any:2026-06-07T10:00',
    );
  });

  it('acquires the lock when the key is free (SET NX succeeds)', async () => {
    const set = jest.fn().mockResolvedValue('OK');
    const service = makeService({ set });

    const handle = await service.acquire('slot:v:s:t');

    expect(handle).not.toBeNull();
    expect(handle?.key).toBe('slot:v:s:t');
    expect(set).toHaveBeenCalledWith('slot:v:s:t', expect.any(String), 'EX', 600, 'NX');
  });

  it('returns null when the slot is already held (SET NX fails)', async () => {
    const set = jest.fn().mockResolvedValue(null);
    const service = makeService({ set });

    const handle = await service.acquire('slot:v:s:t');

    expect(handle).toBeNull();
  });

  it('releases via a compare-and-delete script with the handle key and token', async () => {
    const evalFn = jest.fn().mockResolvedValue(1);
    const service = makeService({ eval: evalFn });

    await service.release({ key: 'slot:v:s:t', token: 'abc-123' });

    expect(evalFn).toHaveBeenCalledWith(expect.any(String), 1, 'slot:v:s:t', 'abc-123');
  });
});
