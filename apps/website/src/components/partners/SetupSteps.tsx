'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Clock, CreditCard, Scissors, Share2 } from 'lucide-react'
import { PhoneFrame } from './VendorPhone'

// The same four steps as the vendor app's "Continue setup" flow, in the same order.
const STEPS = [
  {
    key: 'services',
    Icon: Scissors,
    title: 'Add your services',
    body: 'What clients can book, with a price and how long it takes. Your calendar uses the time to keep the right gap free.',
  },
  {
    key: 'hours',
    Icon: Clock,
    title: 'Set your opening hours',
    body: 'Clients can only book when you are open. Close for a holiday in one tap, and your calendar shades the hours you are shut.',
  },
  {
    key: 'payments',
    Icon: CreditCard,
    title: 'Take payments online',
    body: 'Optional. Ask for a deposit or full payment when clients book. It cuts no-shows and settles straight to your bank account.',
    optional: true,
  },
  {
    key: 'share',
    Icon: Share2,
    title: 'Share your booking link',
    body: 'One link for WhatsApp, Instagram and your bio. Clients pick a service and a free time, day or night. No app needed.',
  },
] as const

type Key = (typeof STEPS)[number]['key']

function Preview({ step }: { step: Key }) {
  if (step === 'services') {
    return (
      <div className="space-y-2.5 px-4 pt-14">
        <p className="text-[15px] font-bold text-slate-900">Services</p>
        {[
          ['Wash & fold', '2h', '₦3,500'],
          ['Duvet laundry', '4h', '₦3,000'],
          ['Iron & press (10 items)', '1h', '₦2,500'],
        ].map(([name, time, price]) => (
          <div key={name} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
            <div className="h-9 w-1 rounded-full bg-navy" />
            <div className="flex-1">
              <p className="text-[12px] font-semibold text-slate-900">{name}</p>
              <p className="text-[10px] text-slate-500">{time}</p>
            </div>
            <p className="text-[11px] font-semibold text-slate-900">{price}</p>
          </div>
        ))}
        <div className="mt-2 rounded-full border border-dashed border-slate-300 py-2.5 text-center text-[11px] font-semibold text-navy">+ Add a service</div>
      </div>
    )
  }
  if (step === 'hours') {
    return (
      <div className="px-4 pt-14">
        <p className="text-[15px] font-bold text-slate-900">Opening hours</p>
        <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-100">
          {[
            ['Mon', '9:00 – 7:00pm', true],
            ['Tue', '9:00 – 7:00pm', true],
            ['Wed', '9:00 – 7:00pm', true],
            ['Thu', '9:00 – 7:00pm', true],
            ['Fri', '9:00 – 9:00pm', true],
            ['Sat', '10:00 – 9:00pm', true],
            ['Sun', 'Closed', false],
          ].map(([d, t, on]) => (
            <div key={d as string} className="flex items-center justify-between px-3 py-2.5">
              <span className="text-[11px] font-semibold text-slate-900">{d}</span>
              <span className={`text-[11px] ${on ? 'text-slate-600' : 'text-slate-400'}`}>{t}</span>
              <span className={`flex h-4 w-7 items-center rounded-full px-0.5 ${on ? 'justify-end bg-navy' : 'justify-start bg-slate-200'}`}>
                <span className="h-3 w-3 rounded-full bg-white" />
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  if (step === 'payments') {
    return (
      <div className="px-4 pt-14">
        <p className="text-[15px] font-bold text-slate-900">Take payments online</p>
        <p className="mt-1 text-[10px] text-slate-500">Choose per service. You can change it any time.</p>
        <div className="mt-3 space-y-2">
          {[
            ['Pay at visit', 'Clients pay when they arrive', false],
            ['Deposit', 'e.g. 30% to hold the time', true],
            ['Full payment', 'Paid in full when they book', false],
          ].map(([t, s, on]) => (
            <div key={t as string} className={`flex items-center gap-3 rounded-xl border p-3 ${on ? 'border-navy bg-wash' : 'border-slate-100'}`}>
              <span className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${on ? 'border-navy' : 'border-slate-300'}`}>
                {on ? <span className="h-2 w-2 rounded-full bg-navy" /> : null}
              </span>
              <div>
                <p className="text-[12px] font-semibold text-slate-900">{t}</p>
                <p className="text-[10px] text-slate-500">{s}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-[10px] text-emerald-800">Money settles straight into your bank account.</div>
      </div>
    )
  }
  return (
    <div className="px-4 pt-14">
      <p className="text-[15px] font-bold text-slate-900">Your booking link</p>
      <div className="mt-3 rounded-2xl bg-navy p-4 text-white">
        <p className="text-[10px] text-white/70">Clients book you at</p>
        <p className="mt-1 text-[13px] font-bold">veno.app/book/true-wash</p>
        <div className="mt-3 flex gap-2">
          {['WhatsApp', 'Instagram', 'Copy'].map((l) => (
            <span key={l} className="rounded-full bg-white/15 px-2.5 py-1 text-[9px] font-semibold">{l}</span>
          ))}
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-slate-100 p-3">
        <p className="text-[10px] font-semibold text-slate-500">What clients see</p>
        <p className="mt-1.5 text-[12px] font-bold text-slate-900">True Wash Laundromat</p>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {['9:00', '9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30'].map((t, i) => (
            <span key={t} className={`rounded-md border py-1 text-center text-[9px] font-semibold ${i === 2 ? 'border-navy bg-navy text-white' : 'border-slate-200 text-slate-700'}`}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SetupSteps() {
  const [active, setActive] = useState<Key>('services')
  const index = STEPS.findIndex((s) => s.key === active)

  return (
    <div className="grid items-center gap-12 lg:grid-cols-[1fr_auto]">
      <div>
        {/* The app's segmented progress bar */}
        <div className="mb-6 flex gap-1.5" aria-hidden>
          {STEPS.map((s, i) => (
            <div key={s.key} className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
              <motion.div className="h-full bg-navy" initial={false} animate={{ width: i <= index ? '100%' : '0%' }} transition={{ duration: 0.4 }} />
            </div>
          ))}
        </div>
        <ol className="space-y-3" role="tablist" aria-label="Set-up steps">
          {STEPS.map((s, i) => {
            const on = s.key === active
            const done = i < index
            return (
              <li key={s.key}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setActive(s.key)}
                  onMouseEnter={() => setActive(s.key)}
                  className={`flex w-full gap-4 rounded-2xl border p-4 text-left transition-colors ${on ? 'border-navy/30 bg-sky' : 'border-transparent hover:bg-slate-50'}`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      done ? 'bg-emerald-600 text-white' : on ? 'bg-navy text-white' : 'bg-wash text-navy'
                    }`}
                  >
                    {done ? <Check className="h-5 w-5" strokeWidth={2.5} /> : i + 1}
                  </span>
                  <span>
                    <span className="flex items-center gap-2 text-base font-semibold text-slate-900">
                      {s.title}
                      {'optional' in s && s.optional ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">Optional</span> : null}
                    </span>
                    <span className={`mt-1 block text-sm leading-relaxed text-slate-600 ${on ? '' : 'line-clamp-1'}`}>{s.body}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>

      <PhoneFrame className="hidden sm:block">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0"
          >
            <Preview step={active} />
          </motion.div>
        </AnimatePresence>
      </PhoneFrame>
    </div>
  )
}
