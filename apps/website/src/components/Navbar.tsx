'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { VENDOR_LOGIN_URL, VENDOR_REGISTER_URL } from '@/lib/constants'

// Absolute paths so the links work from every page; Partners has its own page.
const LINKS = [
  { label: 'Users', href: '/#customers' },
  { label: 'Partners', href: '/partners' },
  { label: 'Waitlist', href: '/#waitlist' },
  { label: 'FAQ', href: '/#faq' },
]

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`flex h-8 w-8 items-center justify-center rounded-xl font-display text-base font-bold ${light ? 'bg-white text-navy' : 'bg-navy text-white'}`}>
        V
      </span>
      <span className={`font-display text-xl font-bold tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}>veno</span>
    </span>
  )
}

/**
 * Sits on top of the sky hero in white, and turns solid once you scroll past
 * it, so it always reads against what's underneath.
 */
export function Navbar() {
  const [open, setOpen] = useState(false)
  const [solid, setSolid] = useState(false)
  const pathname = usePathname()
  const isPartners = pathname.startsWith('/partners')
  const isActive = (href: string) => !href.includes('#') && pathname.startsWith(href)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const light = !solid && !open
  const primary = isPartners
    ? { label: 'Register your business', href: VENDOR_REGISTER_URL }
    : { label: 'Join the waitlist', href: '/#waitlist' }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        light ? 'bg-transparent' : 'border-b border-slate-200/70 bg-white/90 backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" aria-label="Veno home">
          <Logo light={light} />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={`rounded-full px-4 py-2 text-[15px] font-medium transition-colors ${
                light
                  ? isActive(link.href) ? 'bg-white/15 text-white' : 'text-white/80 hover:text-white'
                  : isActive(link.href) ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href={VENDOR_LOGIN_URL}
            className={`rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors ${
              light ? 'border-white/60 text-white hover:bg-white/10' : 'border-slate-300 text-slate-900 hover:bg-slate-50'
            }`}
          >
            Partner sign in
          </a>
          <a
            href={primary.href}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${
              light ? 'bg-white text-slate-900 hover:bg-white/90' : 'bg-navy text-white hover:bg-navy-deep'
            }`}
          >
            {primary.label}
          </a>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className={`md:hidden ${light ? 'text-white' : 'text-slate-800'}`}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-white px-6 pb-6 pt-2 md:hidden">
          <nav className="flex flex-col" aria-label="Main">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={`border-b border-slate-100 py-3.5 text-base font-medium ${isActive(link.href) ? 'text-navy' : 'text-slate-700'}`}
              >
                {link.label}
              </Link>
            ))}
            <a href={VENDOR_LOGIN_URL} className="py-3.5 text-base font-medium text-slate-700">Partner sign in</a>
            <a href={primary.href} onClick={() => setOpen(false)} className="mt-2 rounded-xl bg-navy px-4 py-3.5 text-center text-sm font-semibold text-white">
              {primary.label}
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
