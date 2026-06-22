'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ALL_NAV = [
  { href: '/dashboard/bookings', label: 'Bookings', roles: ['owner', 'manager', 'practitioner', 'front_desk'] },
  { href: '/dashboard/services', label: 'Services', roles: ['owner', 'manager'] },
  { href: '/dashboard/staff', label: 'Staff', roles: ['owner', 'manager'] },
  { href: '/dashboard/schedule', label: 'Schedule', roles: ['owner', 'manager'] },
  { href: '/dashboard/customers', label: 'Customers', roles: ['owner', 'manager', 'front_desk'] },
]

export function SidebarNav({ role }: { role: string }) {
  const pathname = usePathname()
  const navItems = ALL_NAV.filter((item) => item.roles.includes(role))

  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {navItems.map(({ href, label }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              active
                ? 'bg-indigo-600 text-white'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
