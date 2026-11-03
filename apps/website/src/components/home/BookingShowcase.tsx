'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Bell, Check, ChevronRight, CreditCard, Ruler, ShieldCheck, Star, X } from 'lucide-react'

// Each row on the left opens the matching sheet from the customer app on the right.
const ROWS = [
  { key: 'times', label: 'Real free times' },
  { key: 'pay', label: 'Pay your way' },
  { key: 'remind', label: 'Reminders that work' },
  { key: 'trust', label: 'Every business reviewed' },
  { key: 'rate', label: 'Rate your visit' },
] as const
type Key = (typeof ROWS)[number]['key']

function Sheet({ k }: { k: Key }) {
  const head = (title: string) => (
    <div className="flex items-center justify-between">
      <ArrowLeft className="h-5 w-5 text-slate-700" />
      <p className="text-base font-bold text-slate-900">{title}</p>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100"><X className="h-4 w-4 text-slate-700" /></span>
    </div>
  )
  if (k === 'times') {
    return (
      <>
        {head('Book a time')}
        <div className="mt-5 rounded-2xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Service</p>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-lg font-bold text-slate-900">Deep tissue massage</p>
            <p className="text-sm font-semibold text-slate-700">90m · ₦30,000</p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          {['Sat 7', 'Sun 8', 'Mon 9', 'Tue 10'].map((d, i) => (
            <span key={d} className={`flex-1 rounded-xl py-2 text-center text-xs font-semibold ${i === 0 ? 'bg-navy text-white' : 'border border-slate-200 text-slate-700'}`}>{d}</span>
          ))}
        </div>
        <div className="mt-3 flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          {['Morning', 'Afternoon', 'Evening'].map((p, i) => (
            <span key={p} className={`flex-1 rounded-lg py-1.5 text-center ${i === 0 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{p}</span>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {['9:00', '9:30', '10:00', '10:30', '11:00', '11:30'].map((t) => (
            <span key={t} className={`rounded-xl border py-2 text-center text-sm font-semibold ${t === '10:00' ? 'border-navy bg-navy text-white' : 'border-slate-200 text-slate-800'}`}>{t}</span>
          ))}
        </div>
        <div className="mt-5 rounded-2xl bg-slate-900 py-3.5 text-center text-sm font-semibold text-white">Book for 10:00am</div>
      </>
    )
  }
  if (k === 'pay') {
    return (
      <>
        {head('How to pay')}
        <div className="mt-5 space-y-2.5">
          {[
            ['Pay at the spa', 'Cash, card or transfer when you arrive', false],
            ['Pay a deposit now', '₦9,000 now, ₦21,000 at the visit', true],
            ['Pay in full now', '₦30,000, nothing to pay later', false],
          ].map(([t, s, on]) => (
            <div key={t as string} className={`flex items-center gap-3 rounded-2xl border p-4 ${on ? 'border-navy bg-wash' : 'border-slate-200'}`}>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${on ? 'border-navy' : 'border-slate-300'}`}>{on ? <span className="h-2.5 w-2.5 rounded-full bg-navy" /> : null}</span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{t}</p>
                <p className="text-xs text-slate-500">{s}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
          <span className="text-slate-600">Booking fee</span><span className="font-semibold text-navy">₦0.00</span>
        </div>
        <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-sm font-semibold text-white"><CreditCard className="h-4 w-4" /> Pay ₦9,000</div>
      </>
    )
  }
  if (k === 'remind') {
    return (
      <>
        {head('Notifications')}
        <div className="mt-5 space-y-2.5">
          {[
            ['Booking confirmed', "You're all set for Sat 10:00 am.", 'Now'],
            ['See you tomorrow', 'Deep tissue massage at Serene Spa, 10:00 am.', '1 day before'],
            ['Your appointment is coming up', 'Serene Spa in 1 hour. Tap for directions.', '1 hour before'],
          ].map(([t, b, w]) => (
            <div key={t} className="flex gap-3 rounded-2xl border border-slate-200 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-wash text-navy"><Bell className="h-4 w-4" /></span>
              <div className="flex-1">
                <div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-900">{t}</p><p className="text-[11px] text-slate-400">{w}</p></div>
                <p className="text-xs text-slate-600">{b}</p>
              </div>
            </div>
          ))}
        </div>
      </>
    )
  }
  if (k === 'trust') {
    return (
      <>
        {head('Stitch & Co. Tailors')}
        <div className="mt-5 flex h-36 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C2D12] via-[#C2410C] to-[#F59E0B]">
          <Ruler className="h-12 w-12 text-white/90" strokeWidth={1.5} />
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          <ShieldCheck className="h-5 w-5" /> Reviewed by Veno before listing
        </div>
        <div className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200">
          {[['Address checked', 'Bode Thomas, Surulere'], ['Prices shown up front', '12 services'], ['Opening hours', 'Mon–Sat, 9:00am – 7:00pm']].map(([a, b]) => (
            <div key={a} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="flex items-center gap-2 text-slate-700"><Check className="h-4 w-4 text-emerald-600" />{a}</span>
              <span className="text-xs text-slate-500">{b}</span>
            </div>
          ))}
        </div>
      </>
    )
  }
  return (
    <>
      {head('How was your visit?')}
      <p className="mt-5 text-center text-sm text-slate-600">Wash & fold at True Wash · Sat 7 Nov</p>
      <div className="mt-4 flex justify-center gap-2">
        {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-9 w-9 fill-amber-400 text-amber-400" />)}
      </div>
      <div className="mt-5 rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">Picked up on time, everything folded and smelling fresh. Thank you!</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {['On time', 'Friendly', 'Clean space', 'Great value'].map((t, i) => (
          <span key={t} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${i < 2 ? 'bg-navy text-white' : 'bg-slate-100 text-slate-700'}`}>{t}</span>
        ))}
      </div>
      <div className="mt-5 rounded-2xl bg-slate-900 py-3.5 text-center text-sm font-semibold text-white">Send rating</div>
    </>
  )
}

/** A dark headline card with five rows, beside the app sheet each row describes. */
export function BookingShowcase() {
  const [active, setActive] = useState<Key>('times')
  return (
    <section id="customers" className="scroll-mt-24 bg-[#f5f4fb] px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[0.95fr_1.25fr]">
        <div className="relative flex flex-col overflow-hidden rounded-[2rem] bg-[#121212] p-8 text-white sm:p-10">
          <div className="absolute right-8 top-8 h-20 w-20 rounded-full bg-gradient-to-br from-[#7aa2ff] via-[#c18cff] to-[#ffb38a] opacity-90 blur-[1px]" aria-hidden />
          <h2 className="max-w-sm font-display text-4xl font-bold leading-[1.02] tracking-tight sm:text-[3.4rem]">Your next appointment, sorted</h2>
          <p className="mt-5 max-w-sm text-base text-white/75 sm:text-lg">Everything you need to book the people who keep you looking and feeling good.</p>
          <ul className="mt-10 border-t border-white/15" role="tablist" aria-label="What booking on Veno is like">
            {ROWS.map((r) => {
              const on = r.key === active
              return (
                <li key={r.key} className="border-b border-white/15">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setActive(r.key)}
                    onMouseEnter={() => setActive(r.key)}
                    className={`flex w-full items-center justify-between py-5 text-left font-display text-2xl font-semibold tracking-tight transition-colors sm:text-[1.7rem] ${on ? 'text-white' : 'text-white/45 hover:text-white/80'}`}
                  >
                    {r.label}
                    <ChevronRight className={`h-5 w-5 transition-transform ${on ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'}`} />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="relative flex min-h-[560px] items-center justify-center overflow-hidden rounded-[2rem] bg-[#2a2a2e] p-6 sm:p-10">
          {/* A dimmed app behind the sheet, like a modal over the page */}
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(#3a3a40_1px,transparent_1px)] [background-size:100%_52px]" aria-hidden />
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              role="tabpanel"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-[400px] rounded-[1.6rem] bg-white p-5 shadow-2xl sm:p-6"
            >
              <Sheet k={active} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
