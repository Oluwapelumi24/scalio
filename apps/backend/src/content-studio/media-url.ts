import { createHmac, timingSafeEqual } from 'node:crypto';

// Signed, short-lived public links to a studio photo. Instagram and Facebook
// fetch the image themselves from a URL, so it can't sit behind Scalio sign-in.

const TTL_SECONDS = 60 * 60;

function secret(): string {
  const s = process.env.MEDIA_URL_SECRET ?? process.env.VENDOR_JWT_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === 'production') throw new Error('MEDIA_URL_SECRET is required in production');
  return 'scalio-dev-only-media-url-secret';
}

const sign = (mediaId: string, exp: number) => createHmac('sha256', secret()).update(`${mediaId}.${exp}`).digest('base64url');

export function signedMediaUrl(publicApiUrl: string, mediaId: string, now = Date.now()): string {
  const exp = Math.floor(now / 1000) + TTL_SECONDS;
  return `${publicApiUrl.replace(/\/$/, '')}/public/content-media/${mediaId}?exp=${exp}&sig=${sign(mediaId, exp)}`;
}

export function verifyMediaSignature(mediaId: string, exp: string, sig: string, now = Date.now()): boolean {
  const e = Number(exp);
  if (!Number.isInteger(e) || e * 1000 < now) return false;
  const expected = Buffer.from(sign(mediaId, e));
  const given = Buffer.from(String(sig));
  return expected.length === given.length && timingSafeEqual(expected, given);
}
