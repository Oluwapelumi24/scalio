/**
 * Resolve the connecting client IP from platform proxy headers.
 *
 * Prefer `x-real-ip` (set by Railway / Vercel to the TCP peer). Do not use the
 * leftmost `x-forwarded-for` entry — that is client-controlled and spoofable.
 * Fallback: the rightmost XFF hop (appended by the edge proxy).
 */
export function resolveForwardedClientIp(input: {
  xRealIp?: string | null;
  xForwardedFor?: string | null;
}): string | null {
  const realIp = firstHop(input.xRealIp);
  if (realIp) return realIp;

  const hops = splitHops(input.xForwardedFor);
  if (hops.length === 0) return null;
  return hops[hops.length - 1] ?? null;
}

function firstHop(raw: string | null | undefined): string | null {
  const hops = splitHops(raw);
  return hops[0] ?? null;
}

function splitHops(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}
