import type { IconName } from '@/components/Icon'

/** Storefront / business-setup links — live in the header, not the sidebar. */
export const BUSINESS_NAV: {
  href: string
  label: string
  icon: IconName
  roles: string[]
  storefrontTab: string
}[] = [
  { href: '/dashboard/storefront?tab=page', label: 'Business page', icon: 'shopping-bag', roles: ['owner', 'manager'], storefrontTab: 'page' },
  { href: '/dashboard/storefront?tab=services', label: 'Services', icon: 'package', roles: ['owner', 'manager'], storefrontTab: 'services' },
  { href: '/dashboard/storefront?tab=team', label: 'Team', icon: 'users', roles: ['owner', 'manager'], storefrontTab: 'team' },
  { href: '/dashboard/storefront?tab=hours', label: 'Hours', icon: 'clock', roles: ['owner', 'manager'], storefrontTab: 'hours' },
]

export function businessNavActive(pathname: string, searchTab: string | null, storefrontTab: string) {
  if (pathname.startsWith('/dashboard/staff')) return storefrontTab === 'team'
  if (!pathname.startsWith('/dashboard/storefront')) return false
  return (searchTab || 'page') === storefrontTab
}
