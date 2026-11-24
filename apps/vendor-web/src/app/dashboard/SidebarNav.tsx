'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Icon, type IconName } from '@/components/Icon'

interface Item {
  href: string
  label: string
  icon: IconName
  roles: string[]
  exact?: boolean
  /** Match storefront tab id when href includes ?tab= */
  storefrontTab?: string
}

const PRIMARY: Item[] = [
  { href: '/dashboard', label: 'Home', icon: 'home', roles: ['owner', 'manager', 'practitioner', 'front_desk'], exact: true },
  { href: '/dashboard/bookings', label: 'Calendar', icon: 'calendar', roles: ['owner', 'manager', 'practitioner', 'front_desk'] },
  { href: '/dashboard/customers', label: 'Clients', icon: 'users', roles: ['owner', 'manager', 'front_desk'] },
  { href: '/dashboard/inbox', label: 'Inbox', icon: 'inbox', roles: ['owner', 'manager', 'front_desk'] },
  { href: '/dashboard/attendance', label: 'Attendance', icon: 'check', roles: ['owner', 'manager', 'practitioner', 'front_desk'] },
]

interface Group {
  title: string
  /** When true, group stays hidden until the listing is approved. */
  requiresSuite?: boolean
  items: (Item & { requiresSuite?: boolean })[]
}

const GROUPS: Group[] = [
  {
    title: 'Marketing',
    requiresSuite: true,
    items: [
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
      { href: '/dashboard/payroll', label: 'Payroll', icon: 'credit-card', roles: ['owner', 'manager'] },
      { href: '/dashboard/performance', label: 'Performance', icon: 'trending-up', roles: ['owner', 'manager', 'practitioner'] },
    ],
  },
]

const CREATE: (Item & { requiresSuite?: boolean })[] = [
  { href: '/dashboard/bookings/new', label: 'New booking', icon: 'calendar', roles: ['owner', 'manager', 'practitioner', 'front_desk'] },
  { href: '/dashboard/storefront?tab=services', label: 'Add a service', icon: 'plus', roles: ['owner', 'manager'] },
  { href: '/dashboard/storefront?tab=hours', label: 'Block a day off', icon: 'clock', roles: ['owner', 'manager'] },
]

function active(pathname: string, searchTab: string | null, item: Item) {
  const pathOnly = item.href.split('?')[0]

  if (item.storefrontTab) {
    if (pathname.startsWith('/dashboard/staff')) return item.storefrontTab === 'team'
    if (!pathname.startsWith('/dashboard/storefront')) return false
    const tab = searchTab || 'page'
    return tab === item.storefrontTab
  }

  if (pathOnly === '/dashboard/bookings') {
    return pathname.startsWith('/dashboard/bookings')
  }

  return item.exact ? pathname === pathOnly : pathname.startsWith(pathOnly)
}

function Row({
  item,
  pathname,
  searchTab,
  onNavigate,
}: {
  item: Item
  pathname: string
  searchTab: string | null
  onNavigate?: () => void
}) {
  const on = active(pathname, searchTab, item)
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
  const searchParams = useSearchParams()
  const searchTab = searchParams.get('tab')
  const [createOpen, setCreateOpen] = useState(false)
  const createRef = useRef<HTMLDivElement>(null)
  const primary = PRIMARY.filter((item) => item.roles.includes(role))
  const create = CREATE.filter(
    (item) => item.roles.includes(role) && (suiteUnlocked || !item.requiresSuite),
  )

  useEffect(() => {
    setCreateOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!createOpen) return
    const onPointer = (event: PointerEvent) => {
      if (!createRef.current?.contains(event.target as Node)) setCreateOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCreateOpen(false)
    }
    window.addEventListener('pointerdown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [createOpen])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-visible">
      {create.length > 0 ? (
        <div ref={createRef} className="relative z-30 shrink-0 px-5 pb-1 pt-2">
          <button
            type="button"
            onClick={() => setCreateOpen((open) => !open)}
            aria-expanded={createOpen}
            aria-haspopup="menu"
            className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#1e3a8a] text-sm font-semibold text-white"
          >
            <Icon name="plus" className="h-4 w-4" />
            Create
          </button>
          {createOpen ? (
            <div
              role="menu"
              className="absolute top-full z-40 mt-2 w-full rounded-2xl border border-[#e4e6eb] bg-white p-1 shadow-lg md:top-2 md:left-full md:mt-0 md:ml-2 md:w-52"
            >
              {create.map((item) => (
                <Link
                  key={item.label}
                  role="menuitem"
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

      <nav className="min-h-0 flex-1 overflow-y-auto px-5 py-2" aria-label="Dashboard">
        <div className="space-y-0.5">
          {primary.map((item) => (
            <Row key={item.href} item={item} pathname={pathname} searchTab={searchTab} onNavigate={onNavigate} />
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
                  <Row key={item.href} item={item} pathname={pathname} searchTab={searchTab} onNavigate={onNavigate} />
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      <div className="shrink-0 border-t border-[#e4e6eb] px-5 py-3">
        <Link
          href="/dashboard/help"
          onClick={onNavigate}
          className="flex flex-col items-center rounded-2xl bg-[#e8edfa] px-4 py-5 text-center hover:bg-[#dce4f7]"
        >
          <Icon name="help-circle" className="h-6 w-6 text-[#1e3a8a]" />
          <span className="mt-2.5 text-sm font-semibold text-[#0a0a0a]">Help and support</span>
          <span className="mt-1 text-[12px] leading-4 text-[#4a4e57]">We’re here if you get stuck</span>
        </Link>
      </div>
    </div>
  )
}
