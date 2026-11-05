'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { Logo } from './Navbar'
import { VENDOR_LOGIN_URL, VENDOR_REGISTER_URL } from '@/lib/constants'

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'For users',
    links: [
      { label: 'How it works', href: '/#customers' },
      { label: 'Categories', href: '/#categories' },
      { label: 'Join the waitlist', href: '/#waitlist' },
      { label: 'Questions', href: '/#faq' },
    ],
  },
  {
    title: 'For partners',
    links: [
      { label: 'Veno for partners', href: '/partners' },
      { label: 'Get set up', href: '/partners#setup' },
      { label: 'Inside the app', href: '/partners#features' },
      { label: 'Register your business', href: VENDOR_REGISTER_URL },
      { label: 'Sign in', href: VENDOR_LOGIN_URL },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy policy', href: '#' },
      { label: 'Terms and conditions', href: '#' },
      { label: 'Cookie information', href: '#' },
    ],
  },
]

// Only Nigeria today; the selector is ready for the next market.
const COUNTRIES = [{ code: 'NG', name: 'Nigeria' }]

function Flag() {
  return (
    <span className="flex h-5 w-8 overflow-hidden rounded-[4px]" aria-hidden>
      <span className="flex-1 bg-[#008751]" />
      <span className="flex-1 bg-white" />
      <span className="flex-1 bg-[#008751]" />
    </span>
  )
}

export function Footer() {
  const [country] = useState(COUNTRIES[0])
  return (
    <footer className="bg-[#111111] text-white">
      <div className="mx-auto max-w-7xl px-6 pb-10 pt-20">
        <div className="grid gap-14 lg:grid-cols-[1fr_2.4fr]">
          <div className="space-y-8">
            <Logo light />
            <p className="max-w-xs text-sm leading-relaxed text-white/60">
              The booking platform for local service businesses, and the people who love them.
            </p>
            <button type="button" className="flex w-full max-w-[240px] items-center gap-3 rounded-2xl border border-white/25 px-4 py-3.5 text-left text-base" aria-label={`Country: ${country.name}`}>
              <Flag />
              <span className="flex-1">{country.name}</span>
              <ChevronDown className="h-5 w-5 text-white/70" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {COLUMNS.map((c) => (
              <div key={c.title}>
                <h4 className="text-base font-semibold">{c.title}</h4>
                <ul className="mt-6 space-y-3.5">
                  {c.links.map((l) => (
                    <li key={l.label}>
                      {l.href.startsWith('/') ? (
                        <Link href={l.href} className="text-[15px] text-white/65 transition-colors hover:text-white">{l.label}</Link>
                      ) : (
                        <a href={l.href} className="text-[15px] text-white/65 transition-colors hover:text-white">{l.label}</a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-16 flex flex-col justify-between gap-4 border-t border-white/15 pt-8 text-sm text-white/50 sm:flex-row">
          <p>© {new Date().getFullYear()} Veno. All rights reserved.</p>
          <p>Made in Lagos for the people who keep Lagos looking good.</p>
        </div>
      </div>
    </footer>
  )
}
