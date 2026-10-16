import { createHmac } from 'node:crypto';
import { signedMediaUrl, verifyMediaSignature } from '../content-studio/media-url';
import { renderConnectPage } from './connect-page';
import { parseSignedRequest } from './meta-graph';

describe('signed media links', () => {
  const now = Date.parse('2026-10-16T12:00:00Z');
  const id = '11111111-1111-1111-1111-111111111111';

  it('verify for an hour, then expire', () => {
    const u = new URL(signedMediaUrl('https://api.example.com/', id, now));
    expect(u.pathname).toBe(`/public/content-media/${id}`);
    const [exp, sig] = [u.searchParams.get('exp')!, u.searchParams.get('sig')!];
    expect(verifyMediaSignature(id, exp, sig, now + 59 * 60_000)).toBe(true);
    expect(verifyMediaSignature(id, exp, sig, now + 61 * 60_000)).toBe(false);
  });

  it('reject a signature for a different photo or a changed expiry', () => {
    const u = new URL(signedMediaUrl('https://api.example.com', id, now));
    const [exp, sig] = [u.searchParams.get('exp')!, u.searchParams.get('sig')!];
    expect(verifyMediaSignature('22222222-2222-2222-2222-222222222222', exp, sig, now)).toBe(false);
    expect(verifyMediaSignature(id, String(Number(exp) + 3600), sig, now)).toBe(false);
  });
});

describe('parseSignedRequest', () => {
  const secret = 'app-secret';
  const make = (payload: object, key = secret) => {
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${createHmac('sha256', key).update(body).digest('base64url')}.${body}`;
  };

  it('accepts Meta-signed requests', () => {
    expect(parseSignedRequest(make({ user_id: '42', algorithm: 'HMAC-SHA256' }), secret)?.user_id).toBe('42');
  });

  it('rejects anything signed with another key', () => {
    expect(parseSignedRequest(make({ user_id: '42' }, 'other'), secret)).toBeNull();
    expect(parseSignedRequest('garbage', secret)).toBeNull();
  });
});

describe('renderConnectPage', () => {
  it('escapes Page names', () => {
    const html = renderConnectPage({
      kind: 'choose', title: 'Pick', message: 'm', returnUrl: null, pendingId: 'p',
      pages: [{ id: '1', name: '<script>alert(1)</script>', instagram: null }],
    });
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
  });
});
