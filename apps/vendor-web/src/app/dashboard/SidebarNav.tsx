'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon, type IconName } from '@/components/Icon'

interface Item {
  href: string
  label: string
  icon: IconName
  roles: string[]
  exact?: boolean
}

const PRIMARY: Item[] = [
  { href: '/dashboard', label: 'Home', icon: 'home', roles: ['owner', 'manager', 'practitioner', 'front_desk'], exact: true },
  { href: '/dashboard/bookings', label: 'Bookings', icon: 'calendar', roles: ['owner', 'manager', 'practitioner', 'front_desk'] },
  { href: '/dashboard/customers', label: 'Clients', icon: 'users', roles: ['owner', 'manager', 'front_desk'] },
  { href: '/dashboard/inbox', label: 'Inbox', icon: 'inbox', roles: ['owner', 'manager', 'front_desk'] },
]

interface Group {
  title: string
  /** When true, group stays hidden until the listing is approved. */
  requiresSuite?: boolean
  items: (Item & { requiresSuite?: boolean })[]
}

const GROUPS: Group[] = [
  {
    title: 'Business',
    items: [
      { href: '/dashboard/listing', label: 'Business page', icon: 'map-pin', roles: ['owner', 'manager'] },
      { href: '/dashboard/services', label: 'Services', icon: 'package', roles: ['owner', 'manager'] },
      { href: '/dashboard/staff', label: 'Team', icon: 'users', roles: ['owner', 'manager'] },
      { href: '/dashboard/schedule', label: 'Hours', icon: 'clock', roles: ['owner', 'manager'] },
      { href: '/dashboard/attendance', label: 'Attendance', icon: 'check', roles: ['owner', 'manager', 'practitioner', 'front_desk'], requiresSuite: true },
    ],
  },
  {
    title: 'Marketing',
    requiresSuite: true,
    items: [
      { href: '/dashboard/content', label: 'Content studio', icon: 'image', roles: ['owner', 'manager', 'front_desk'] },
      { href: '/dashboard/ads', label: 'Ads', icon: 'target', roles: ['owner', 'manager', 'front_desk'] },
      { href: '/dashboard/leads', label: 'Leads', icon: 'phone', roles: ['owner', 'manager', 'practitioner', 'front_desk'] },
      { href: '/dashboard/feedback', label: 'Feedback', icon: 'star', roles: ['owner', 'manager', 'practitioner', 'front_desk'] },
    ],
  },
  {
    title: 'Money',
    requiresSuite: true,
    items: [
      { href: '/dashboard/money', label: 'Money', icon: 'dollar', roles: ['owner', 'manager'] },
      { href: '/dashboard/reports', label: 'Reports', icon: 'chart', roles: ['owner', 'manager'] },
      { href: '/dashboard/performance', label: 'Performance', icon: 'trending-up', roles: ['owner', 'manager', 'practitioner'] },
      { href: '/dashboard/payroll', label: 'Payroll', icon: 'users', roles: ['owner', 'manager'] },
      { href: '/dashboard/payments', label: 'Online payments', icon: 'credit-card', roles: ['owner', 'manager'] },
    ],
  },
]

const CREATE: (Item & { requiresSuite?: boolean })[] = [
  { href: '/dashboard/bookings/new', label: 'New booking', icon: 'calendar', roles: ['owner', 'manager', 'practitioner', 'front_desk'] },
  { href: '/dashboard/services', label: 'Add a service', icon: 'plus', roles: ['owner', 'manager'] },
  { href: '/dashboard/schedule', label: 'Block a day off', icon: 'clock', roles: ['owner', 'manager'] },
  { href: '/dashboard/content/new', label: 'New post', icon: 'edit', roles: ['owner', 'manager', 'front_desk'], requiresSuite: true },
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
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
        on ? 'bg-[#e8edfa] text-[#1e3a8a]' : 'text-[#0a0a0a] hover:bg-[#f5f6f8]'
      }`}
    >
      <Icon name={item.icon} className={`h-[18px] w-[18px] shrink-0 ${on ? 'text-[#1e3a8a]' : 'text-[#7d818b]'}`} />
      <span className="min-w-0 truncate">{item.label}</span>
    </Link>
  )
}

/** The vendor app's places, opened out for a wide screen: today on top, the rest grouped the way More groups them. */
export function SidebarNav({
  role,
  suiteUnlocked = true,
  onNavigate,
}: {
  role: string
  /** False while the listing is still in review — keeps day-1 focused on setup. */
  suiteUnlocked?: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const [createOpen, setCreateOpen] = useState(false)
  const primary = PRIMARY.filter((item) => item.roles.includes(role))
  const create = CREATE.filter(
    (item) => item.roles.includes(role) && (suiteUnlocked || !item.requiresSuite),
  )

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
            <Icon name="plus" className="h-4 w-4" />
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
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-[#f5f6f8]"
                >
                  <Icon name={item.icon} className="h-[18px] w-[18px] shrink-0 text-[#7d818b]" />
                  <span className="min-w-0 truncate">{item.label}</span>
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
        if (group.requiresSuite && !suiteUnlocked) return null
        const items = group.items.filter(
          (item) => item.roles.includes(role) && (suiteUnlocked || !item.requiresSuite),
        )
        if (items.length === 0) return null
        return (
          <div key={group.title} className="mt-6">
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7d818b]">{group.title}</p>
            <div className="space-y-0.5">
              {items.map((item) => (
                <Row key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        )
      })}

      {(role === 'owner' || role === 'manager') && suiteUnlocked ? (
        <div className="mt-6">
          <Row
            item={{ href: '/dashboard/interests', label: 'Your interests', icon: 'sliders', roles: ['owner', 'manager'] }}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        </div>
      ) : null}
    </nav>
  )
}
