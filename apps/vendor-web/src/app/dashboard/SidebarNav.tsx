'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ALL_NAV = [
  { href: '/dashboard', label: 'Home', roles: ['owner', 'manager', 'practitioner', 'front_desk'] },
  { href: '/dashboard/bookings', label: 'Bookings', roles: ['owner', 'manager', 'practitioner', 'front_desk'] },
  { href: '/dashboard/services', label: 'Services', roles: ['owner', 'manager'] },
  { href: '/dashboard/staff', label: 'Staff', roles: ['owner', 'manager'] },
  { href: '/dashboard/schedule', label: 'Schedule', roles: ['owner', 'manager'] },
  { href: '/dashboard/customers', label: 'Customers', roles: ['owner', 'manager', 'front_desk'] },
  { href: '/dashboard/attendance', label: 'Attendance', roles: ['owner', 'manager', 'practitioner', 'front_desk'] },
  { href: '/dashboard/content', label: 'Content studio', roles: ['owner', 'manager', 'front_desk'] },
  { href: '/dashboard/ads', label: 'Ads', roles: ['owner', 'manager', 'front_desk'] },
  { href: '/dashboard/leads', label: 'Leads', roles: ['owner', 'manager', 'practitioner', 'front_desk'] },
  { href: '/dashboard/feedback', label: 'Customer feedback', roles: ['owner', 'manager', 'practitioner', 'front_desk'] },
  { href: '/dashboard/reports', label: 'Reports', roles: ['owner', 'manager'] },
  { href: '/dashboard/performance', label: 'Performance', roles: ['owner', 'manager', 'practitioner'] },
  { href: '/dashboard/money', label: 'Money', roles: ['owner', 'manager'] },
  { href: '/dashboard/payroll', label: 'Payroll', roles: ['owner', 'manager'] },
  { href: '/dashboard/payments', label: 'Online payments', roles: ['owner', 'manager'] },
  { href: '/dashboard/interests', label: 'Your interests', roles: ['owner', 'manager'] },
]

export function SidebarNav({ role }: { role: string }) {
  const pathname = usePathname()
  const navItems = ALL_NAV.filter((item) => item.roles.includes(role))

  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {navItems.map(({ href, label }) => {
        // Home is the dashboard root, so it must match exactly or it would always be active.
        const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
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
