import { timingSafeEqual } from 'crypto';

export const VENO_CLIENT_IP_HEADER = 'x-veno-client-ip';
export const VENO_PROXY_SECRET_HEADER = 'x-veno-proxy-secret';

/**
 * Prefer the real browser IP forwarded by our Next server actions when the
 * shared INTERNAL_PROXY_SECRET matches. Otherwise fall back to Express `req.ip`
 * (which is the Next server behind Railway's proxy).
 */
export function resolveClientIp(req: Record<string, unknown>): string {
  const headers = (req.headers ?? {}) as Record<string, string | string[] | undefined>;
  const secret = process.env.INTERNAL_PROXY_SECRET?.trim();
  const provided = headerValue(headers[VENO_PROXY_SECRET_HEADER]);
  const forwarded = headerValue(headers[VENO_CLIENT_IP_HEADER]);

  if (secret && provided && forwarded && secretsMatch(secret, provided)) {
    const ip = forwarded.split(',')[0]?.trim();
    if (ip) return ip;
  }

  return typeof req.ip === 'string' && req.ip ? req.ip : 'unknown';
}

function headerValue(raw: string | string[] | undefined): string {
  if (Array.isArray(raw)) return raw[0]?.trim() ?? '';
  return typeof raw === 'string' ? raw.trim() : '';
}

function secretsMatch(expected: string, provided: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
