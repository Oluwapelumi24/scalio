'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  {
    q: 'How do I join?',
    a: 'Register your business, and our team reviews every application before it goes live. Once you are approved, you can sign in to the app and the web dashboard and start setting up.',
  },
  {
    q: 'Do my clients need to download an app?',
    a: 'No. Your booking link opens in any phone browser. Clients pick a service and a free time and get a confirmation. Clients who already use the Veno app can find and book you there too.',
  },
  {
    q: 'Can my staff have their own logins?',
    a: 'Yes. Every team member signs in with their own account, and their role decides what they see. Owners and managers see everything, practitioners (stylists, therapists, tailors, trainers) see their own appointments, and front desk runs the day without seeing your takings.',
  },
  {
    q: 'How do payments work?',
    a: 'You choose for each service: pay at the visit, a deposit when they book, or full payment up front. Online payments settle straight into your bank account.',
  },
  {
    q: 'What happens when a client does not turn up?',
    a: 'Mark the booking as a no-show from the calendar. If you took a deposit, it stays with you. Veno also sends clients a reminder before their appointment, so fewer people forget.',
  },
  {
    q: 'Can I still take walk-ins and phone bookings?',
    a: 'Yes. Tap a free time on the calendar, or the Walk-in button, and book them in. A returning walk-in is matched by phone number, so their history stays together.',
  },
  {
    q: 'What does it cost?',
    a: 'Starter is ₦15,000 a month for one person, Professional is ₦25,000 and Premium is ₦40,000. Each extra login is a seat, and annual billing saves 15%.',
  },
]

export function PartnerFaq({ variant = 'live' }: { variant?: 'live' | 'prelaunch' }) {
  const [open, setOpen] = useState<number | null>(0)
  const items =
    variant === 'prelaunch'
      ? FAQS.map((item) => {
          if (item.q === 'How do I join?') {
            return {
              ...item,
              a: 'Join the waitlist and choose “I’m a partner”. We will email you when registration opens. Every business is still reviewed before it goes live.',
            }
          }
          if (item.q === 'Do my clients need to download an app?') {
            return {
              ...item,
              a: 'No. Your booking link will open in any phone browser. Clients pick a service and a free time and get a confirmation. Clients on the Veno app will be able to find you there too.',
            }
          }
          return item
        })
      : FAQS
  return (
    <div className="divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-white">
      {items.map((f, i) => {
        const on = open === i
        return (
          <div key={f.q}>
            <button
              type="button"
              onClick={() => setOpen(on ? null : i)}
              aria-expanded={on}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
            >
              <span className="text-base font-semibold text-slate-900">{f.q}</span>
              <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${on ? 'rotate-180' : ''}`} />
            </button>
            {on ? <p className="px-6 pb-5 text-sm leading-relaxed text-slate-600">{f.a}</p> : null}
          </div>
        )
      })}
    </div>
  )
}
