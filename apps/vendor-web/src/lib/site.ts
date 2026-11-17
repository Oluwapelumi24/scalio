/** The public marketing site. Vendor portal lives on its own host. */
export const WEBSITE_URL =
  process.env.NEXT_PUBLIC_WEBSITE_URL ??
  (process.env.NODE_ENV === 'production' ? 'https://www.venohq.com' : 'http://localhost:3003')
