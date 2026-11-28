import path from 'node:path'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(__dirname, '..', '.env') })

export const HOSTS = {
  website: process.env.WEBSITE_URL?.replace(/\/$/, '') || 'https://www.venohq.com',
  vendor:
    process.env.VENDOR_URL?.replace(/\/$/, '') ||
    'https://vendor-web-production-a59cdbc0.up.railway.app',
  admin: process.env.ADMIN_URL?.replace(/\/$/, '') || 'https://admin.venohq.com',
} as const

export const CREDENTIALS = {
  customer: {
    email: process.env.CUSTOMER_EMAIL || '',
    password: process.env.CUSTOMER_PASSWORD || '',
  },
  vendor: {
    email: process.env.VENDOR_EMAIL || '',
    password: process.env.VENDOR_PASSWORD || '',
  },
  admin: {
    email: process.env.ADMIN_EMAIL || '',
    password: process.env.ADMIN_PASSWORD || '',
  },
}

export const RUN_AUTHENTICATED = process.env.RUN_AUTHENTICATED === '1'

export function hasCredentials(role: keyof typeof CREDENTIALS): boolean {
  const c = CREDENTIALS[role]
  return Boolean(c.email && c.password)
}

/** Portrait widths requested for the audit. */
export const PORTRAIT_WIDTHS = [320, 360, 375, 390, 412, 430, 440, 768, 1024, 1280, 1440, 1920] as const

/** Landscape: swap typical phone heights as width; keep tablets/desktops. */
export const LANDSCAPE_VIEWPORTS = [
  { width: 568, height: 320, label: 'iphone-se-landscape' },
  { width: 667, height: 375, label: 'iphone-8-landscape' },
  { width: 844, height: 390, label: 'iphone-12-landscape' },
  { width: 926, height: 428, label: 'iphone-14-pro-max-landscape' },
  { width: 915, height: 412, label: 'pixel-landscape' },
  { width: 1024, height: 768, label: 'ipad-landscape' },
] as const

export function portraitViewport(width: number) {
  // Approximate device heights for common phone widths; desktops use 900+.
  const heightByWidth: Record<number, number> = {
    320: 568,
    360: 640,
    375: 667,
    390: 844,
    412: 915,
    430: 932,
    440: 956,
    768: 1024,
    1024: 768,
    1280: 800,
    1440: 900,
    1920: 1080,
  }
  return { width, height: heightByWidth[width] ?? Math.round(width * 1.8) }
}

/** Public marketing + customer routes on www.venohq.com */
export const WEBSITE_PUBLIC_ROUTES = [
  { path: '/', name: 'Home', critical: true },
  { path: '/partners', name: 'Partners', critical: true },
  { path: '/app', name: 'Customer home', critical: true },
  { path: '/app/explore', name: 'Explore', critical: true },
  { path: '/app/sign-in', name: 'Customer sign-in', critical: true },
  { path: '/app/sign-up', name: 'Customer sign-up', critical: true },
  { path: '/app/bookings', name: 'Bookings (auth gate)', critical: true },
  { path: '/app/profile', name: 'Profile (auth gate)', critical: false },
  { path: '/app/bookings/return', name: 'Booking return', critical: false },
  { path: '/forgot-password', name: 'Forgot password (legacy)', critical: false },
  { path: '/privacy', name: 'Privacy', critical: false },
  { path: '/terms', name: 'Terms', critical: false },
  { path: '/cookies', name: 'Cookies', critical: false },
  { path: '/samples/spa', name: 'Sample category Spa', critical: false },
  { path: '/samples/spa/serene-spa', name: 'Sample listing Serene Spa', critical: true },
  { path: '/book/serene-spa', name: 'Booking page Serene Spa', critical: true },
] as const

/** Vendor portal public (unauthenticated) routes */
export const VENDOR_PUBLIC_ROUTES = [
  { path: '/login', name: 'Vendor login', critical: true },
  { path: '/register', name: 'Vendor register', critical: true },
  { path: '/forgot-password', name: 'Vendor forgot password', critical: false },
  { path: '/reset-password', name: 'Vendor reset password', critical: false },
  { path: '/accept-invite', name: 'Vendor accept invite', critical: false },
] as const

/** Vendor authenticated dashboard routes (require credentials) */
export const VENDOR_AUTH_ROUTES = [
  { path: '/dashboard', name: 'Vendor dashboard', critical: true },
  { path: '/dashboard/bookings', name: 'Vendor bookings', critical: true },
  { path: '/dashboard/bookings/new', name: 'New booking', critical: true },
  { path: '/dashboard/schedule', name: 'Schedule', critical: true },
  { path: '/dashboard/services', name: 'Services', critical: true },
  { path: '/dashboard/staff', name: 'Staff', critical: true },
  { path: '/dashboard/customers', name: 'Customers', critical: true },
  { path: '/dashboard/settings', name: 'Settings', critical: true },
  { path: '/dashboard/payments', name: 'Payments', critical: true },
  { path: '/dashboard/storefront', name: 'Storefront', critical: false },
  { path: '/dashboard/listing', name: 'Listing', critical: false },
  { path: '/dashboard/notifications', name: 'Notifications', critical: false },
  { path: '/dashboard/help', name: 'Help', critical: false },
  { path: '/dashboard/inbox', name: 'Inbox', critical: false },
  { path: '/dashboard/money', name: 'Money', critical: false },
  { path: '/dashboard/attendance', name: 'Attendance', critical: false },
  { path: '/dashboard/payroll', name: 'Payroll', critical: false },
  { path: '/dashboard/customise', name: 'Customise', critical: false },
  { path: '/dashboard/performance', name: 'Performance', critical: false },
  { path: '/dashboard/reports', name: 'Reports', critical: false },
  { path: '/dashboard/leads', name: 'Leads', critical: false },
  { path: '/dashboard/ads', name: 'Ads', critical: false },
  { path: '/dashboard/content', name: 'Content', critical: false },
  { path: '/dashboard/feedback', name: 'Feedback', critical: false },
  { path: '/dashboard/interests', name: 'Interests', critical: false },
] as const

export const ADMIN_PUBLIC_ROUTES = [
  { path: '/login', name: 'Admin login', critical: true },
  { path: '/forgot-password', name: 'Admin forgot password', critical: false },
  { path: '/reset-password', name: 'Admin reset password', critical: false },
  { path: '/accept-invite', name: 'Admin accept invite', critical: false },
] as const

export const ADMIN_AUTH_ROUTES = [
  { path: '/dashboard', name: 'Admin dashboard', critical: true },
  { path: '/dashboard/vendors', name: 'Vendors', critical: true },
  { path: '/dashboard/vendors/reviews', name: 'Vendor reviews', critical: true },
  { path: '/dashboard/vendors/new', name: 'New vendor', critical: false },
  { path: '/dashboard/bookings', name: 'Admin bookings', critical: false },
  { path: '/dashboard/customers', name: 'Admin customers', critical: false },
  { path: '/dashboard/payments', name: 'Admin payments', critical: false },
  { path: '/dashboard/metrics', name: 'Metrics', critical: false },
  { path: '/dashboard/reports', name: 'Admin reports', critical: false },
  { path: '/dashboard/team', name: 'Team', critical: false },
] as const

export const ARTIFACTS_DIR = path.join(__dirname, '..', 'artifacts')
export const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots')
export const REPORTS_DIR = path.join(__dirname, '..', 'reports')
