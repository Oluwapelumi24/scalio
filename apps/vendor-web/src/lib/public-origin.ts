import type { NextRequest } from 'next/server'

/**
 * Railway (and similar hosts) forward the public hostname in
 * x-forwarded-host while request.url still shows the container bind
 * address 0.0.0.0. Redirects must use the public origin or the browser
 * lands on a non-routable IP.
 */
export function publicOrigin(request: NextRequest): string {
  const forwardedHost = firstHeader(request, 'x-forwarded-host')
  const host = forwardedHost || firstHeader(request, 'host')
  const proto = firstHeader(request, 'x-forwarded-proto') || 'https'

  if (host && !isBindAddress(host)) {
    return `${proto}://${host}`
  }

  const fromEnv = (
    process.env.VENDOR_WEB_PUBLIC_URL ||
    process.env.RAILWAY_PUBLIC_DOMAIN ||
    ''
  )
    .trim()
    .replace(/\/$/, '')

  if (fromEnv) {
    if (/^https?:\/\//i.test(fromEnv)) return fromEnv
    return `https://${fromEnv}`
  }

  // Last resort: whatever Next saw (local dev).
  return new URL(request.url).origin
}

function firstHeader(request: NextRequest, name: string): string | null {
  const raw = request.headers.get(name)
  if (!raw) return null
  return raw.split(',')[0]?.trim() || null
}

function isBindAddress(host: string): boolean {
  const hostname = host.replace(/:\d+$/, '').toLowerCase()
  return hostname === '0.0.0.0' || hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '[::]'
}
