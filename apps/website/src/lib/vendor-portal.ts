/**
 * Where the signed-in business dashboard lives.
 *
 * Prefer server-only VENDOR_WEB_URL so production can hand off after login
 * without forcing NEXT_PUBLIC_* (which also redirects /register and /login).
 */
export function dashboardPortalUrl(): string {
  let raw = (process.env.VENDOR_WEB_URL || '').trim().replace(/\/$/, '')

  // Fall back to the public var when the server-only one is unset.
  if (!raw) {
    raw = (process.env.NEXT_PUBLIC_VENDOR_WEB_URL || '').trim().replace(/\/$/, '')
  }

  if (!raw) {
    return process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001'
  }

  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`

  try {
    const url = new URL(raw)
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

export function dashboardLoginUrl(): string {
  const portal = dashboardPortalUrl()
  return portal ? `${portal}/login` : '/login'
}

export function dashboardRegisterUrl(): string {
  const portal = dashboardPortalUrl()
  return portal ? `${portal}/register` : '/register'
}
