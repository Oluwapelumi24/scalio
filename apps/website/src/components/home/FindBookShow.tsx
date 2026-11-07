'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Bell, Calendar, Check, MapPin, Star } from 'lucide-react'
import { JoinWaitlist } from '@/components/site/JoinWaitlist'

const STEPS = [
  {
    key: 'find',
    title: 'Find it',
    body: 'Browse spas, laundromats, tailors and more near you, and see who is actually free.',
    Icon: MapPin,
  },
  {
    key: 'book',
    title: 'Book it',
    body: 'Pick a real free time in a few taps. No calls, and no waiting on a reply.',
    Icon: Calendar,
  },
  {
    key: 'show',
    title: 'Show up',
    body: 'Get a reminder before you leave. Your booking and receipt stay in one place.',
    Icon: Bell,
  },
] as const

type StepKey = (typeof STEPS)[number]['key']

function FindPanel() {
  const places = [
    ['Serene Spa', 'Spa · Ikoyi', '4.9', 'Free today 2:30pm'],
    ['True Wash', 'Laundry · Yaba', '4.8', 'Pickup from 5:00pm'],
    ['Stitch & Co.', 'Tailor · Surulere', '4.9', 'Free today 4:00pm'],
  ]
  return (
    <div>
      <p className="flex items-center gap-1.5 text-sm text-slate-500">
        <MapPin className="h-4 w-4" aria-hidden /> Near Lekki
      </p>
      <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-slate-950">48 places · 17 free today</p>
      <ul className="mt-5 divide-y divide-slate-100 rounded-2xl border border-slate-200">
        {places.map(([name, where, rating, free]) => (
          <li key={name} className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div>
              <p className="font-semibold text-slate-950">{name}</p>
              <p className="text-sm text-slate-500">{where}</p>
            </div>
            <div className="text-right">
              <p className="flex items-center justify-end gap-1 text-sm font-semibold text-slate-800">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                {rating}
              </p>
              <p className="text-xs font-semibold text-emerald-700">{free}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function BookPanel() {
  const times = ['9:00', '9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30']
  return (
    <div>
      <p className="text-sm text-slate-500">Deep tissue massage · 90m</p>
      <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-slate-950">Saturday · Morning</p>
      <div className="mt-5 grid grid-cols-4 gap-2">
        {times.map((time) => (
          <span
            key={time}
            className={`rounded-xl py-3 text-center text-sm font-semibold ${
              time === '10:00' ? 'bg-navy text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {time}
          </span>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between rounded-2xl bg-navy px-5 py-4 text-white">
        <span className="font-semibold">Book 10:00</span>
        <span className="text-sm text-white/80">₦30,000</span>
      </div>
    </div>
  )
}

function ShowPanel() {
  return (
    <div>
      <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
        <Check className="h-4 w-4" aria-hidden /> Booking confirmed
      </p>
      <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950">Sat, 10:00 am</p>
      <p className="mt-1 text-slate-600">Deep tissue massage · Serene Spa, Ikoyi</p>
      <ul className="mt-5 space-y-2.5">
        {[
          ['On your calendar', 'Added the moment you booked'],
          ['Reminder', '1 hour before, with directions'],
          ['Receipt', '₦30,000 · pay at the visit'],
        ].map(([title, detail]) => (
          <li key={title} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3.5">
            <span className="font-semibold text-slate-950">{title}</span>
            <span className="text-sm text-slate-500">{detail}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const PANELS: Record<StepKey, () => ReactNode> = {
  find: FindPanel,
  book: BookPanel,
  show: ShowPanel,
}

const STEP_MS = 5000

/** Find / book / show. Each step plays in turn, and its line fills for that step. */
export function FindBookShow({ prelaunch = false }: { prelaunch?: boolean }) {
  const [index, setIndex] = useState(0)
  const [cycle, setCycle] = useState(0)
  const [progress, setProgress] = useState(0)
  const reduce = useReducedMotion()
  const active = STEPS[index].key
  const Panel = PANELS[active]

  useEffect(() => {
    if (reduce) return
    const started = Date.now()
    setProgress(0)
    const tick = window.setInterval(() => {
      setProgress(Math.min(1, (Date.now() - started) / STEP_MS))
    }, 50)
    const done = window.setTimeout(() => {
      setIndex((current) => (current + 1) % STEPS.length)
      setCycle((current) => current + 1)
    }, STEP_MS)
    return () => {
      window.clearInterval(tick)
      window.clearTimeout(done)
    }
  }, [index, cycle, reduce])

  function select(next: number) {
    setIndex(next)
    setCycle((current) => current + 1)
  }

  return (
    <section id="customers" className="relative scroll-mt-24 overflow-hidden bg-[#f4f3ef] px-6 py-20 sm:py-28">
      {prelaunch ? (
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -left-16 top-8 h-80 w-80 rounded-full bg-[#f9a8d4] opacity-80 blur-[100px]" />
          <div className="absolute -right-20 top-1/3 h-96 w-96 rounded-full bg-[#c4b5fd] opacity-80 blur-[110px]" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#ffe0ef] opacity-90 blur-[100px]" />
        </div>
      ) : null}
      <div className="relative mx-auto max-w-6xl">
        {prelaunch ? (
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-medium text-slate-500">How it works</p>
            <h2 className="mt-3 font-display text-5xl font-bold leading-[0.95] tracking-tight text-slate-950 sm:text-6xl lg:text-[4.25rem]">
              Find it. Book it. Show up.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-slate-600">
              See who’s free, hold a real time, and get there without a phone call.
            </p>
          </div>
        ) : (
          <div className="grid items-end gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-sm font-medium text-slate-500">How it works</p>
              <h2 className="mt-3 max-w-xl font-display text-5xl font-bold leading-[0.95] tracking-tight text-slate-950 sm:text-6xl lg:text-[4.25rem]">
                Find it. Book it. Show up.
              </h2>
            </div>
            <p className="max-w-sm text-base leading-relaxed text-slate-600 lg:mb-2 lg:ml-auto lg:text-right">
              See who’s free, hold a real time, and get there without a phone call.
            </p>
          </div>
        )}

        <div className="mt-14 grid items-center gap-10 lg:mt-20 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
          <div role="tablist" aria-label="How a booking works">
            {STEPS.map(({ key, title, body, Icon }, stepIndex) => {
              const on = key === active
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => select(stepIndex)}
                  className="w-full py-5 text-left"
                >
                  <span className="flex items-start gap-4">
                    <span
                      className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        on ? 'bg-navy text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200'
                      }`}
                    >
                      <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
                    </span>
                    <span>
                      <span className="block text-lg font-semibold tracking-tight text-slate-950">{title}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-slate-500">{body}</span>
                    </span>
                  </span>
                  <span className="relative mt-5 block h-0.5 overflow-hidden bg-slate-200" aria-hidden>
                    {on ? (
                      <span
                        className="absolute inset-y-0 left-0 bg-navy"
                        style={{ width: `${(reduce ? 1 : progress) * 100}%` }}
                      />
                    ) : null}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="rounded-[28px] border border-black/5 bg-white p-6 sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                role="tabpanel"
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <Panel />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        {prelaunch ? (
          <div className="mt-12 flex justify-center">
            <JoinWaitlist />
          </div>
        ) : null}
      </div>
    </section>
  )
}
