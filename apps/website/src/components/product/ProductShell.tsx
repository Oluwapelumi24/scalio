'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, Compass, Home, LogIn, UserRound } from 'lucide-react'
import type { Customer } from '@/lib/customer-session'

const NAV = [
  { href: '/app', label: 'Home', icon: Home, exact: true },
  { href: '/app/explore', label: 'Explore', icon: Compass, exact: false },
  { href: '/app/bookings', label: 'Bookings', icon: Calendar, exact: false },
  { href: '/app/profile', label: 'Profile', icon: UserRound, exact: false },
] as const

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      {NAV.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[15px] font-medium transition-colors ${
              active ? 'bg-[#e8edfa] text-[#1e3a8a]' : 'text-[#0a0a0a] hover:bg-[#f5f6f8]'
            }`}
          >
            <Icon className="h-5 w-5" aria-hidden />
            {item.label}
          </Link>
        )
      })}
    </>
  )
}

/** Desktop rail for the four places in the customer app. */
export function ProductShell({ user, children }: { user: Customer | null; children: React.ReactNode }) {
  const pathname = usePathname()
  const first = user?.name.split(' ')[0]
  return (
    <div className="min-h-screen bg-white text-[#0a0a0a]">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-[#e4e6eb] px-4 py-6 lg:flex">
          <Link href="/app" className="px-2">
            <img src="/brand/lockup-color.svg" alt="Veno" className="h-8 w-auto" />
          </Link>
          <nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Veno">
            <NavLinks pathname={pathname} />
          </nav>
          <div className="border-t border-[#e4e6eb] px-2 pt-4">
            {user ? (
              <Link href="/app/profile" className="flex items-center gap-3 rounded-2xl px-1 py-1 hover:bg-[#f5f6f8]">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e3a8a] text-xs font-bold text-white">
                  {user.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{first}</span>
                  <span className="block truncate text-xs text-[#7d818b]">{user.email}</span>
                </span>
              </Link>
            ) : (
              <Link
                href="/app/sign-in"
                className="flex h-12 items-center justify-center gap-2 rounded-[20px] bg-[#1e3a8a] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(30,58,138,0.28)] hover:bg-[#0b1638]"
              >
                <LogIn className="h-4 w-4" aria-hidden />
                Sign in
              </Link>
            )}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center border-b border-[#e4e6eb] bg-white/90 px-5 py-3 backdrop-blur lg:hidden">
            <Link href="/app">
              <img src="/brand/lockup-color.svg" alt="Veno" className="h-7 w-auto" />
            </Link>
          </header>
          <div className="flex-1 pb-24 lg:pb-0">{children}</div>
        </div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-[#e4e6eb] bg-white pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Veno">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${active ? 'text-[#1e3a8a]' : 'text-[#7d818b]'}`}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
