export const STOREFRONT_TABS = [
  { id: 'page', label: 'Business page', href: '/dashboard/storefront?tab=page' },
  { id: 'services', label: 'Services', href: '/dashboard/storefront?tab=services' },
  { id: 'team', label: 'Team', href: '/dashboard/storefront?tab=team' },
  { id: 'hours', label: 'Hours', href: '/dashboard/storefront?tab=hours' },
] as const

export type StorefrontTabId = (typeof STOREFRONT_TABS)[number]['id']

export function parseStorefrontTab(raw: string | undefined): StorefrontTabId {
  const value = (raw ?? 'page').toLowerCase()
  if (value === 'services' || value === 'team' || value === 'hours' || value === 'page') return value
  // Aliases from old routes / setup copy
  if (value === 'listing' || value === 'business') return 'page'
  if (value === 'staff') return 'team'
  if (value === 'schedule') return 'hours'
  return 'page'
}
