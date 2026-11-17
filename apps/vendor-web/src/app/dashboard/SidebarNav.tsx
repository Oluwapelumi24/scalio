'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Item {
  href: string
  label: string
  roles: string[]
  exact?: boolean
}

const PRIMARY: Item[] = [
  { href: '/dashboard', label: 'Home', roles: ['owner', 'manager', 'practitioner', 'front_desk'], exact: true },
  { href: '/dashboard/bookings', label: 'Bookings', roles: ['owner', 'manager', 'practitioner', 'front_desk'] },
  { href: '/dashboard/customers', label: 'Clients', roles: ['owner', 'manager', 'front_desk'] },
  { href: '/dashboard/inbox', label: 'Inbox', roles: ['owner', 'manager', 'front_desk'] },
]

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: 'Business',
    items: [
      { href: '/dashboard/services', label: 'Services', roles: ['owner', 'manager'] },
      { href: '/dashboard/staff', label: 'Team', roles: ['owner', 'manager'] },
      { href: '/dashboard/schedule', label: 'Hours', roles: ['owner', 'manager'] },
      { href: '/dashboard/attendance', label: 'Attendance', roles: ['owner', 'manager', 'practitioner', 'front_desk'] },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { href: '/dashboard/content', label: 'Content studio', roles: ['owner', 'manager', 'front_desk'] },
      { href: '/dashboard/ads', label: 'Ads', roles: ['owner', 'manager', 'front_desk'] },
      { href: '/dashboard/leads', label: 'Leads', roles: ['owner', 'manager', 'practitioner', 'front_desk'] },
      { href: '/dashboard/feedback', label: 'Feedback', roles: ['owner', 'manager', 'practitioner', 'front_desk'] },
    ],
  },
  {
    title: 'Money',
    items: [
      { href: '/dashboard/money', label: 'Money', roles: ['owner', 'manager'] },
      { href: '/dashboard/reports', label: 'Reports', roles: ['owner', 'manager'] },
      { href: '/dashboard/performance', label: 'Performance', roles: ['owner', 'manager', 'practitioner'] },
      { href: '/dashboard/payroll', label: 'Payroll', roles: ['owner', 'manager'] },
      { href: '/dashboard/payments', label: 'Online payments', roles: ['owner', 'manager'] },
    ],
  },
]

const CREATE: Item[] = [
  { href: '/dashboard/services', label: 'Add a service', roles: ['owner', 'manager'] },
  { href: '/dashboard/schedule', label: 'Block a day off', roles: ['owner', 'manager'] },
  { href: '/dashboard/content/new', label: 'New post', roles: ['owner', 'manager', 'front_desk'] },
]

function active(pathname: string, item: Item) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href)
}

function Row({ item, pathname, onNavigate }: { item: Item; pathname: string; onNavigate?: () => void }) {
  const on = active(pathname, item)
  return (
    <Link
      href={item.href}
      aria-current={on ? 'page' : undefined}
      onClick={onNavigate}
      className={`block rounded-xl px-3 py-2.5 text-sm font-medium ${
        on ? 'bg-[#e8edfa] text-[#1e3a8a]' : 'text-[#0a0a0a] hover:bg-[#f5f6f8]'
      }`}
    >
      {item.label}
    </Link>
  )
}

/** The vendor app's places, opened out for a wide screen: today on top, the rest grouped the way More groups them. */
export function SidebarNav({ role, onNavigate }: { role: string; onNavigate?: () => void }) {
  const pathname = usePathname()
  const [createOpen, setCreateOpen] = useState(false)
  const primary = PRIMARY.filter((item) => item.roles.includes(role))
  const create = CREATE.filter((item) => item.roles.includes(role))

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Business">
      {create.length > 0 ? (
        <div className="mb-3">
          <button
            type="button"
            onClick={() => setCreateOpen((open) => !open)}
            aria-expanded={createOpen}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#1e3a8a] text-sm font-semibold text-white"
          >
            <span aria-hidden className="text-lg leading-none">+</span>
            Create
          </button>
          {createOpen ? (
            <div className="mt-2 rounded-2xl border border-[#e4e6eb] p-1">
              {create.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => {
                    setCreateOpen(false)
                    onNavigate?.()
                  }}
                  className="block rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-[#f5f6f8]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-0.5">
        {primary.map((item) => (
          <Row key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
        ))}
      </div>

      {GROUPS.map((group) => {
        const items = group.items.filter((item) => item.roles.includes(role))
        if (items.length === 0) return null
        return (
          <div key={group.title} className="mt-6">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[#7d818b]">{group.title}</p>
            <div className="space-y-0.5">
              {items.map((item) => (
                <Row key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        )
      })}

      {(role === 'owner' || role === 'manager') && (
        <div className="mt-6">
          <Row item={{ href: '/dashboard/interests', label: 'Your interests', roles: ['owner', 'manager'] }} pathname={pathname} onNavigate={onNavigate} />
        </div>
      )}
    </nav>
  )
}
