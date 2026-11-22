/**
 * Where the signed-in business dashboard lives. Prefer a server-only
 * VENDOR_WEB_URL so production can open the dashboard without also redirecting
 * /register and /login off this site (those still use NEXT_PUBLIC_VENDOR_WEB_URL).
 * app.venohq.com is unpublished and must never be used.
 */
export function dashboardPortalUrl(): string {
  let raw = (process.env.VENDOR_WEB_URL || '').trim().replace(/\/$/, '')

  // Fall back only when the public var is a real host — never app.venohq.com.
  if (!raw) {
    const publicUrl = (process.env.NEXT_PUBLIC_VENDOR_WEB_URL || '').trim().replace(/\/$/, '')
    if (publicUrl && !publicUrl.includes('app.venohq.com')) raw = publicUrl
  }

  if (!raw) {
    return process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001'
  }

  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`

  try {
    const url = new URL(raw)
    if (url.hostname === 'app.venohq.com') return ''
    // Bind addresses are for the container, not a browser.
    if (url.hostname === '0.0.0.0' || url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
      if (process.env.NODE_ENV === 'production') return ''
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
    return url.origin
  } catch {
    return ''
  }
}

export function dashboardPortalLinked(): boolean {
  return dashboardPortalUrl().startsWith('http')
}
