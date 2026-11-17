/** Only return the visitor to a page on this site. Blocks open redirects. */
export function safeNextPath(value: string | null | undefined, fallback = '/app'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\') || value.includes('://')) {
    return fallback
  }
  const path = value.split('?')[0] ?? ''
  if (path.startsWith('/app') || path.startsWith('/book/')) return value
  return fallback
}
