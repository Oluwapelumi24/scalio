'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { VENDOR_LOGIN_URL, VENDOR_REGISTER_URL } from '@/lib/constants'

const LINKS = [
  { label: 'Users', href: '#customers' },
  { label: 'Partners', href: '#vendors' },
  { label: 'Waitlist', href: '#waitlist' },
  { label: 'FAQ', href: '#faq' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            S
          </div>
          <span className="text-lg font-bold text-slate-900">Scalio</span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href={VENDOR_LOGIN_URL}
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            Vendor sign in
          </a>
          <a
            href={VENDOR_REGISTER_URL}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Register your business
          </a>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="text-slate-700 md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-white px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-slate-600"
              >
                {link.label}
              </a>
            ))}
            <a href={VENDOR_LOGIN_URL} className="text-sm font-medium text-slate-600">
              Vendor sign in
            </a>
            <a
              href={VENDOR_REGISTER_URL}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white"
            >
              Register your business
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
