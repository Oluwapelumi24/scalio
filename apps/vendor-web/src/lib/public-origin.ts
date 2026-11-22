import type { NextRequest } from 'next/server'

/**
 * Railway serves the app on 0.0.0.0 inside the container. request.url and
 * sometimes Host reflect that bind address. Prefer forwarded public headers,
 * then RAILWAY_PUBLIC_DOMAIN (bracket access so Next does not inline empty
 * at build time).
 */
export function publicOrigin(request: NextRequest): string {
  const proto = firstHeader(request, 'x-forwarded-proto') || 'https'

  for (const name of ['x-forwarded-host', 'x-original-host', 'host']) {
    const host = firstHeader(request, name)
    if (host && !isBindAddress(host)) {
      return `${proto}://${host}`
    }
  }

  const fromEnv = (
    process.env['VENDOR_WEB_PUBLIC_URL'] ||
    process.env['RAILWAY_PUBLIC_DOMAIN'] ||
    ''
  )
    .trim()
    .replace(/\/$/, '')

  if (fromEnv) {
    return /^https?:\/\//i.test(fromEnv) ? fromEnv : `https://${fromEnv}`
  }

  return new URL(request.url).origin
}

function firstHeader(request: NextRequest, name: string): string | null {
  const raw = request.headers.get(name)
  if (!raw) return null
  return raw.split(',')[0]?.trim() || null
}

function isBindAddress(host: string): boolean {
  const hostname = host.replace(/:\d+$/, '').toLowerCase()
  return (
    hostname === '0.0.0.0' ||
    hostname === '127.0.0.1' ||
    hostname === 'localhost' ||
    hostname === '[::]' ||
    hostname === '::'
  )
}
