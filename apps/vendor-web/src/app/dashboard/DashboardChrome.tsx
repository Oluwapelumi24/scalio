'use client'

import { Suspense, useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BrandLink } from '@/components/BrandLink'
import { Icon, type IconName } from '@/components/Icon'
import { ShareBusinessSheet } from './ShareBusinessSheet'
import { SidebarNav } from './SidebarNav'

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  manager: 'Manager',
  practitioner: 'Practitioner',
  front_desk: 'Front Desk',
}

const TABS: { href: string; label: string; icon: IconName; roles: string[]; exact?: boolean }[] = [
  { href: '/dashboard', label: 'Home', icon: 'home', roles: ['owner', 'manager', 'practitioner', 'front_desk'], exact: true },
  { href: '/dashboard/bookings', label: 'Calendar', icon: 'calendar', roles: ['owner', 'manager', 'practitioner', 'front_desk'] },
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
  previewUrl = null,
  shareUrl = null,
  businessName = null,
  shareLive = false,
  children,
}: {
  name: string
  role: string
  initials: string
  unread: number
  logout: () => Promise<void>
  banner?: React.ReactNode
  /** When false, Marketing / Money stay hidden so day-1 stays on setup. */
  suiteUnlocked?: boolean
  previewUrl?: string | null
  /** Public /book/:slug link customers use to check the business out and book. */
  shareUrl?: string | null
  businessName?: string | null
  shareLive?: boolean
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const tabs = TABS.filter((tab) => tab.roles.includes(role))

  useEffect(() => {
    setMenuOpen(false)
    setAccountOpen(false)
    setShareOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!accountOpen) return
    const onPointer = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAccountOpen(false)
    }
    window.addEventListener('pointerdown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
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
      <aside className="hidden w-60 shrink-0 flex-col overflow-visible border-r border-[#e4e6eb] bg-white md:flex md:min-h-0">
        <div className="px-5 py-5">
          <BrandLink className="h-7 w-auto" />
        </div>
        <Suspense fallback={<div className="flex-1" />}>
          <SidebarNav role={role} suiteUnlocked={suiteUnlocked} />
        </Suspense>
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
                className="flex h-10 max-w-[16rem] items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-[#f5f6f8] sm:pr-2.5"
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                aria-label={`${name}, ${ROLE_LABELS[role] ?? role}`}
                onClick={() => setAccountOpen((open) => !open)}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1e3a8a] text-[11px] font-bold text-white">
                  {initials}
                </span>
                <span className="min-w-0 text-left">
                  <span className="block truncate text-sm font-semibold leading-4">{name}</span>
                  <span className="block truncate text-[11px] leading-4 text-[#7d818b]">{ROLE_LABELS[role] ?? role}</span>
                </span>
                <Icon
                  name="chevron-down"
                  className={`h-4 w-4 shrink-0 text-[#7d818b] transition-transform duration-150 ${accountOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {accountOpen ? (
                <AccountMenu
                  role={role}
                  previewUrl={previewUrl}
                  canShare={Boolean(shareUrl)}
                  logout={logout}
                  onNavigate={() => setAccountOpen(false)}
                  onShare={() => {
                    setAccountOpen(false)
                    setShareOpen(true)
                  }}
                />
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
            <Suspense fallback={<div className="flex-1" />}>
              <SidebarNav role={role} suiteUnlocked={suiteUnlocked} onNavigate={() => setMenuOpen(false)} />
            </Suspense>
          </div>
        </div>
      ) : null}

      {shareUrl && businessName ? (
        <ShareBusinessSheet
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          url={shareUrl}
          businessName={businessName}
          live={shareLive}
        />
      ) : null}
    </div>
  )
}

function AccountMenu({
  role,
  previewUrl,
  canShare,
  logout,
  onNavigate,
  onShare,
}: {
  role: string
  previewUrl: string | null
  canShare: boolean
  logout: () => Promise<void>
  onNavigate: () => void
  onShare: () => void
}) {
  const canManage = role === 'owner' || role === 'manager'
  const item = 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#0a0a0a] hover:bg-[#f5f6f8]'
  return (
    <div role="menu" className="absolute right-0 top-12 z-40 w-64 rounded-2xl border border-[#e4e6eb] bg-white p-1.5 shadow-lg">
      {canManage ? (
        <Link href="/dashboard/storefront?tab=page" role="menuitem" onClick={onNavigate} className={item}>
          <Icon name="shopping-bag" className="h-[18px] w-[18px] shrink-0 text-[#7d818b]" />
          Business page
        </Link>
      ) : null}
      {previewUrl ? (
        <a href={previewUrl} target="_blank" rel="noopener noreferrer" role="menuitem" onClick={onNavigate} className={item}>
          <Icon name="eye" className="h-[18px] w-[18px] shrink-0 text-[#7d818b]" />
          Preview booking page
        </a>
      ) : null}
      {canShare ? (
        <button type="button" role="menuitem" onClick={onShare} className={`${item} w-full text-left`}>
          <Icon name="share" className="h-[18px] w-[18px] shrink-0 text-[#7d818b]" />
          Share business
        </button>
      ) : null}
      <Link href="/dashboard/settings" role="menuitem" onClick={onNavigate} className={item}>
        <Icon name="sliders" className="h-[18px] w-[18px] shrink-0 text-[#7d818b]" />
        Settings
      </Link>
      <div className="my-1.5 border-t border-[#e4e6eb]" />
      <Link
        href="/dashboard/help"
        role="menuitem"
        onClick={onNavigate}
        className="mx-0.5 mb-1 flex items-start gap-3 rounded-xl bg-[#f5f6f8] px-3 py-3 hover:bg-[#eef0f4]"
      >
        <Icon name="help-circle" className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#1e3a8a]" />
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-[#0a0a0a]">Help and support</span>
          <span className="mt-0.5 block text-[12px] leading-4 text-[#7d818b]">Guides, FAQs, and email us</span>
        </span>
      </Link>
      <form action={logout}>
        <button
          type="submit"
          role="menuitem"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#b91c1c] hover:bg-[#fef2f2]"
        >
          Sign out
        </button>
      </form>
    </div>
  )
}
