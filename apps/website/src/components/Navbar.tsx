'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { VENDOR_LOGIN_URL, VENDOR_REGISTER_URL } from '@/lib/constants'

const LINKS = [
  { label: 'Book', href: '/app' },
  { label: 'Users', href: '/#customers' },
  { label: 'Partners', href: '/partners' },
  { label: 'FAQ', href: '/#faq' },
]

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <img
      src={light ? '/brand/lockup-reversed.svg' : '/brand/lockup-color.svg'}
      alt="Veno"
      className="h-8 w-auto"
    />
  )
}

/** Fixed marketing nav — solid on the pale hero so Sign in stays readable. */
export function Navbar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const partnersPath = '/partners'
  const isPartners = pathname === partnersPath || pathname.startsWith(`${partnersPath}/`)
  const isActive = (href: string) => !href.includes('#') && pathname.startsWith(href)
  const signInHref = isPartners ? VENDOR_LOGIN_URL : '/app/sign-in'
  const signInClass =
    'inline-flex h-12 items-center justify-center rounded-[20px] border border-slate-300 px-5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50'
  const primary = isPartners
    ? { label: 'Register your business', href: VENDOR_REGISTER_URL }
    : { label: 'Book a service', href: '/app' }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" aria-label="Veno home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={`rounded-full px-4 py-2 text-[15px] font-medium transition-colors ${
                isActive(link.href) ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isPartners ? (
            <a href={signInHref} className={signInClass}>
              Sign in
            </a>
          ) : (
            <Link href={signInHref} className={signInClass}>
              Sign in
            </Link>
          )}
          <a
            href={primary.href}
            className="inline-flex h-12 items-center justify-center rounded-[20px] bg-navy px-5 text-sm font-semibold text-white transition-colors hover:bg-navy-deep"
          >
            {primary.label}
          </a>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center text-slate-800 md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open ? (
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
            {isPartners ? (
              <a href={signInHref} className="py-3.5 text-base font-medium text-slate-700">
                Sign in
              </a>
            ) : (
              <Link href={signInHref} onClick={() => setOpen(false)} className="py-3.5 text-base font-medium text-slate-700">
                Sign in
              </Link>
            )}
            <a
              href={primary.href}
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex h-12 items-center justify-center rounded-[20px] bg-navy px-4 text-center text-sm font-semibold text-white"
            >
              {primary.label}
            </a>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
