'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: 'Profile', path: '' },
  { label: 'Services', path: '/services' },
  { label: 'Staff', path: '/staff' },
  { label: 'Schedule', path: '/schedule' },
  { label: 'Bookings', path: '/bookings' },
  { label: 'Customers', path: '/customers' },
]

export function VendorTabs({ vendorId }: { vendorId: string }) {
  const pathname = usePathname()
  const base = `/dashboard/vendors/${vendorId}`

  return (
    <div className="flex gap-1 border-b border-gray-200">
      {TABS.map(({ label, path }) => {
        const href = `${base}${path}`
        const active = path === '' ? pathname === base : pathname.startsWith(href)
        return (
          <Link key={href} href={href}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              active ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {label}
          </Link>
        )
      })}
    </div>
  )
}
