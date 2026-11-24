import { headers } from 'next/headers'

/**
 * Forwards the browser IP to the API so per-IP rate limits apply per user,
 * not to the Next server. Server-side only — never import from client components.
 */
export async function venoProxyHeaders(): Promise<Record<string, string>> {
  const secret = process.env.INTERNAL_PROXY_SECRET?.trim()
  if (!secret) return {}

  try {
    const incoming = await headers()
    const forwarded =
      incoming.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      incoming.get('x-real-ip')?.trim() ||
      ''
    if (!forwarded) return {}
    return {
      'x-veno-client-ip': forwarded,
      'x-veno-proxy-secret': secret,
    }
  } catch {
    return {}
  }
}
