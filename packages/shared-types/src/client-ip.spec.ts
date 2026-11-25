import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveForwardedClientIp } from './client-ip.ts';

describe('resolveForwardedClientIp', () => {
  it('prefers x-real-ip over x-forwarded-for', () => {
    assert.equal(
      resolveForwardedClientIp({
        xRealIp: '203.0.113.10',
        xForwardedFor: '198.51.100.1, 203.0.113.10',
      }),
      '203.0.113.10',
    );
  });

  it('ignores a spoofed leftmost X-Forwarded-For entry', () => {
    assert.equal(
      resolveForwardedClientIp({
        xRealIp: null,
        xForwardedFor: '1.2.3.4, 198.51.100.9',
      }),
      '198.51.100.9',
    );
  });

  it('falls back to the rightmost X-Forwarded-For hop', () => {
    assert.equal(
      resolveForwardedClientIp({
        xForwardedFor: ' spoofed.example , 10.0.0.1 , 203.0.113.55 ',
      }),
      '203.0.113.55',
    );
  });

  it('returns null when neither header is present', () => {
    assert.equal(resolveForwardedClientIp({}), null);
    assert.equal(resolveForwardedClientIp({ xRealIp: '  ', xForwardedFor: ',' }), null);
  });
});
