'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { WAITLIST_CTA, WAITLIST_HREF } from '@/components/site/JoinWaitlist'
import { VENDOR_REGISTER_URL } from '@/lib/constants'

const PLANS = [
  {
    name: 'Starter',
    audience: 'For one person getting started',
    solo: 15000,
    seat: 10000,
    popular: false,
    points: [
      'A booking link for WhatsApp and Instagram',
      'Your calendar and opening hours',
      'Reminders before each visit',
      'Pay at the visit, or take a deposit',
      'Payouts to your bank',
    ],
  },
  {
    name: 'Professional',
    audience: 'For a team that shares the day',
    solo: 25000,
    seat: 15000,
    popular: true,
    points: [
      'Everything in Starter',
      'Logins for owner, manager, practitioner and front desk',
      'One calendar for the whole team',
      'Inbox for WhatsApp and Instagram',
      'Client notes and visit history',
      'The bell for bookings, payments and chats',
    ],
  },
  {
    name: 'Premium',
    audience: 'The whole toolkit',
    solo: 40000,
    seat: 25000,
    popular: false,
    points: [
      'Everything in Professional',
      'Payroll and commission',
      'Reports for the week and the month',
      'Captions and ads that open your booking link',
      'A rating request after every visit',
    ],
  },
] as const

const naira = (amount: number) => `₦${amount.toLocaleString('en-NG')}`

/** Monthly rate, or the same plan at 15% off when billed once a year. */
function rate(monthly: number, yearly: boolean) {
  return yearly ? Math.round(monthly * 0.85) : monthly
}

export function PricingPlans({ prelaunch = false }: { prelaunch?: boolean }) {
  const [yearly, setYearly] = useState(false)

  return (
    <section id="pricing" className="scroll-mt-20 bg-navy-deep px-6 py-24 text-white sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">A plan for the size of the day</h2>
          <p className="mt-4 text-lg text-white/70">
            One login is the solo price. Each extra person is a seat. Annual saves 15%.
          </p>
          <div role="radiogroup" aria-label="Billing period" className="mx-auto mt-8 inline-flex rounded-full bg-white/10 p-1">
            <button
              type="button"
              role="radio"
              aria-checked={!yearly}
              onClick={() => setYearly(false)}
              className={`rounded-full px-5 py-2 text-sm font-semibold ${yearly ? 'text-white/70' : 'bg-white text-navy-deep'}`}
            >
              Monthly
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={yearly}
              onClick={() => setYearly(true)}
              className={`rounded-full px-5 py-2 text-sm font-semibold ${yearly ? 'bg-white text-navy-deep' : 'text-white/70'}`}
            >
              Yearly
              <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[11px] font-bold ${yearly ? 'bg-navy-deep/10 text-navy-deep' : 'bg-white/15 text-white'}`}>-15%</span>
            </button>
          </div>
        </div>

        <ul className="mt-12 grid items-stretch gap-4 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <li
              key={plan.name}
              className={`flex flex-col rounded-3xl p-6 ${
                plan.popular ? 'bg-white/[0.08] ring-1 ring-white/40' : 'bg-white/[0.04] ring-1 ring-white/10'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-2xl font-semibold tracking-tight">{plan.name}</h3>
                {plan.popular ? (
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white/80">Popular</span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-white/60">{plan.audience}</p>
              <p className="mt-6 flex items-baseline gap-1.5">
                <span className="font-display text-4xl font-semibold tracking-tight tabular-nums">{naira(rate(plan.solo, yearly))}</span>
                <span className="text-sm text-white/55">/month solo</span>
              </p>
              <p className="mt-1 flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-semibold tracking-tight tabular-nums">{naira(rate(plan.seat, yearly))}</span>
                <span className="text-sm text-white/55">/month per seat</span>
              </p>
              <p className="mt-2 text-sm text-white/45">{yearly ? 'Billed once a year' : 'Billed each month'}</p>
              <ul className="mt-6 flex-1 space-y-3 border-t border-white/10 pt-6">
                {plan.points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm leading-snug text-white/80">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-white/70" aria-hidden />
                    {point}
                  </li>
                ))}
              </ul>
              <a
                href={prelaunch ? WAITLIST_HREF : VENDOR_REGISTER_URL}
                className={`mt-8 inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold ${
                  plan.popular ? 'bg-white text-navy-deep' : 'bg-white/10 text-white'
                }`}
              >
                {prelaunch ? WAITLIST_CTA : 'Register your business'}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
