'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BrandLink } from '@/components/BrandLink'
import { Icon, type IconName } from '@/components/Icon'
import { SidebarNav } from './SidebarNav'

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  manager: 'Manager',
  practitioner: 'Practitioner',
  front_desk: 'Front Desk',
}

const TABS: { href: string; label: string; icon: IconName; roles: string[]; exact?: boolean }[] = [
  { href: '/dashboard', label: 'Home', icon: 'home', roles: ['owner', 'manager', 'practitioner', 'front_desk'], exact: true },
  { href: '/dashboard/bookings', label: 'Bookings', icon: 'calendar', roles: ['owner', 'manager', 'practitioner', 'front_desk'] },
  { href: '/dashboard/customers', label: 'Clients', icon: 'users', roles: ['owner', 'manager', 'front_desk'] },
  { href: '/dashboard/inbox', label: 'Inbox', icon: 'message-circle', roles: ['owner', 'manager', 'front_desk'] },
]

function tabOn(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname.startsWith(href)
}

export function DashboardChrome({
  name,
  role,
  initials,
  unread,
  logout,
  banner,
  suiteUnlocked = true,
  children,
}: {
  name: string
  role: string
  initials: string
  unread: number
  logout: () => Promise<void>
  banner?: React.ReactNode
  /** When false, Marketing / Money / Attendance stay hidden so day-1 stays on setup. */
  suiteUnlocked?: boolean
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const tabs = TABS.filter((tab) => tab.roles.includes(role))

  useEffect(() => {
    setMenuOpen(false)
    setAccountOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!accountOpen) return
    const onPointer = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false)
    }
    window.addEventListener('pointerdown', onPointer)
    return () => window.removeEventListener('pointerdown', onPointer)
  }, [accountOpen])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <div className="dashboard-shell flex h-dvh min-h-0 w-full max-h-dvh flex-col overflow-hidden bg-white pt-[env(safe-area-inset-top)] text-[#0a0a0a] md:flex-row md:pt-0">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-[#e4e6eb] bg-white md:flex md:min-h-0">
        <div className="px-5 py-5">
          <BrandLink className="h-7 w-auto" />
        </div>
        <SidebarNav role={role} suiteUnlocked={suiteUnlocked} />
        <Account name={name} role={role} initials={initials} logout={logout} />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[#e4e6eb] bg-white px-4 md:justify-end md:px-8">
          <span className="md:hidden">
            <BrandLink className="h-6 w-auto" />
          </span>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/notifications"
              aria-current={pathname.startsWith('/dashboard/notifications') ? 'page' : undefined}
              aria-label={unread > 0 ? `Notifications, ${unread} new` : 'Notifications'}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#0a0a0a] hover:bg-[#f5f6f8]"
            >
              <Icon name="bell" className="h-5 w-5" />
              {unread > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c2410c] px-1 text-[10px] font-bold leading-none text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              ) : null}
            </Link>
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                className="keep-height flex h-10 w-10 items-center justify-center rounded-full bg-[#1e3a8a] text-[11px] font-bold text-white"
                aria-expanded={accountOpen}
                aria-label={`Your profile, ${name}`}
                onClick={() => setAccountOpen((open) => !open)}
              >
                {initials}
              </button>
              {accountOpen ? (
                <div className="absolute right-0 top-12 z-40 w-56 rounded-2xl border border-[#e4e6eb] bg-white p-3 shadow-lg">
                  <p className="truncate text-sm font-semibold">{name}</p>
                  <p className="text-xs text-[#7d818b]">{ROLE_LABELS[role] ?? role}</p>
                  <form action={logout} className="mt-3">
                    <button type="submit" className="keep-height h-11 w-full rounded-full text-sm font-semibold text-[#4a4e57]">
                      Sign out
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-[#f7f8fa]">
          {banner}
          <div className="min-w-0 p-4 pb-8 md:p-8">{children}</div>
        </main>
      </div>

      <nav
        className="grid shrink-0 border-t border-[#e4e6eb] bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
        style={{ gridTemplateColumns: `repeat(${tabs.length + 1}, minmax(0, 1fr))` }}
        aria-label="Main"
      >
        {tabs.map((tab) => {
          const on = tabOn(pathname, tab.href, tab.exact)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={on ? 'page' : undefined}
              className={`flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
                on ? 'text-[#1e3a8a]' : 'text-[#7d818b]'
              }`}
            >
              <Icon name={tab.icon} className="h-5 w-5" />
              {tab.label}
            </Link>
          )
        })}
        <button
          type="button"
          className="keep-height flex h-14 flex-col items-center justify-center gap-0.5 rounded-none text-[11px] font-semibold text-[#7d818b]"
          aria-expanded={menuOpen}
          aria-controls={titleId}
          onClick={() => setMenuOpen(true)}
        >
          <Icon name="menu" className="h-5 w-5" />
          Menu
        </button>
      </nav>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="keep-height absolute inset-0 h-full w-full rounded-none bg-[#0a0a0a]/40"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute inset-y-0 left-0 flex w-[min(20rem,calc(100%-3rem))] flex-col bg-white shadow-xl"
          >
            <div className="flex items-center justify-between px-5 py-4">
              <p id={titleId} className="text-sm font-semibold">Menu</p>
              <button
                type="button"
                className="keep-height flex h-10 w-10 items-center justify-center rounded-full text-[#0a0a0a]"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              >
                <Icon name="x" className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav role={role} suiteUnlocked={suiteUnlocked} onNavigate={() => setMenuOpen(false)} />
            <Account name={name} role={role} initials={initials} logout={logout} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Account({
  name,
  role,
  initials,
  logout,
}: {
  name: string
  role: string
  initials: string
  logout: () => Promise<void>
}) {
  return (
    <div className="border-t border-[#e4e6eb] px-4 pb-4 pt-5">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1e3a8a] text-[11px] font-bold text-white">
          {initials}
        </span>
        <span className="min-w-0">
          <p className="truncate text-sm font-semibold leading-5">{name}</p>
          <p className="mt-0.5 text-xs leading-4 text-[#7d818b]">{ROLE_LABELS[role] ?? role}</p>
        </span>
      </div>
      <form action={logout} className="mt-3">
        <button
          type="submit"
          className="keep-height h-10 w-full rounded-full text-left text-sm font-semibold text-[#4a4e57] hover:bg-[#f5f6f8] px-3"
        >
          Sign out
        </button>
      </form>
    </div>
  )
}
