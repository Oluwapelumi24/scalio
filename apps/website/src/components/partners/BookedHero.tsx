import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarCheck,
  CalendarDays,
  Check,
  CreditCard,
  Users,
  UserRound,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { AudienceSwitch } from '@/components/site/SkyHero'
import { WAITLIST_CTA } from '@/components/site/JoinWaitlist'
import { VENDOR_REGISTER_URL } from '@/lib/constants'

const PROOF = ['One link for WhatsApp and Instagram', 'No app for clients to install', 'Deposits settle to your bank']

const NAV = [
  { label: 'Calendar', Icon: CalendarDays, on: true },
  { label: 'Bookings', Icon: CalendarCheck, on: false },
  { label: 'Clients', Icon: Users, on: false },
  { label: 'Staff', Icon: UserRound, on: false },
  { label: 'Reminders', Icon: Bell, on: false },
  { label: 'Payments', Icon: CreditCard, on: false },
  { label: 'Reports', Icon: BarChart3, on: false },
]

/** One hour is 72px, starting at 9:00. */
const HOUR = 72

const STAFF = [
  {
    name: 'Ada',
    initial: 'A',
    tint: 'bg-[#e7eeff] text-navy',
    blocks: [
      { start: 0, span: 1.5, service: 'Deep tissue', client: 'Femisola Adeyemi', tone: 'bg-[#e4ecff]' },
      { start: 2.25, span: 0.75, service: 'Facial', client: 'Kemi Balogun', tone: 'bg-[#e4ecff]' },
    ],
  },
  {
    name: 'Chidi',
    initial: 'C',
    tint: 'bg-emerald-50 text-emerald-800',
    blocks: [
      { start: 0.5, span: 1, service: 'Sports massage', client: 'Tunde Adewale', tone: 'bg-emerald-50' },
      { start: 1.75, span: 1, service: 'Body scrub', client: 'Uche Nwosu', tone: 'bg-emerald-50' },
    ],
  },
  {
    name: 'Bisi',
    initial: 'B',
    tint: 'bg-amber-50 text-amber-800',
    blocks: [
      { start: 0, span: 1.5, service: 'Couples massage', client: 'Zainab Kareem', tone: 'bg-amber-50' },
      { start: 2, span: 0.75, service: 'Brow tint', client: 'Amaka Obi', tone: 'bg-amber-50' },
    ],
  },
  {
    name: 'Tunde',
    initial: 'T',
    tint: 'bg-rose-50 text-rose-800',
    blocks: [
      { start: 1, span: 1.25, service: 'Hot stone', client: 'Chioma Eze', tone: 'bg-rose-50', note: 'Deposit paid · ₦7,500' },
      { start: 2.25, span: 0.75, service: 'Relaxation', client: 'Bisi Alabi', tone: 'bg-rose-50' },
    ],
  },
] as const

const HOURS = ['9:00', '10:00', '11:00', '12:00']

/**
 * The Get booked hero: a pale page, one promise, then the team calendar
 * the business actually runs.
 */
export function BookedHero({
  prelaunch = false,
}: {
  prelaunch?: boolean
}) {
  const subtitle: ReactNode = prelaunch ? (
    <>
      <span className="block">A booking page, a shared calendar and reminders that cut no-shows.</span>
      <span className="block">Join the waitlist. Registration opens soon.</span>
    </>
  ) : (
    <>
      <span className="block">A booking page, a shared calendar and reminders that cut no-shows.</span>
      <span className="block">Set it up in an afternoon.</span>
    </>
  )

  return (
    <section className="relative isolate bg-[#f6f7fb] pt-40 sm:pt-48">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(70%_46%_at_50%_0%,#ffffff_0%,rgba(255,255,255,0)_68%),radial-gradient(80%_42%_at_50%_100%,#d9e3fb_0%,rgba(246,247,251,0)_72%)]" />

      <div className="mx-auto max-w-5xl px-6 text-center">
        <AudienceSwitch active="business" surface="light" base={prelaunch ? '/prelaunch' : ''} />

        {prelaunch ? (
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-navy">Opening soon in Lagos</p>
        ) : null}

        <h1 className={`mx-auto font-display text-[clamp(1.85rem,4.4vw,4.15rem)] font-bold leading-[1.05] tracking-[-0.035em] text-slate-950 ${prelaunch ? 'mt-4' : 'mt-10'}`}>
          <span className="block">Let clients book themselves,</span>
          <span className="block">and actually show up.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">{subtitle}</p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={prelaunch ? '#waitlist' : VENDOR_REGISTER_URL}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-navy px-6 py-3 text-[15px] font-semibold text-white transition-transform duration-150 ease-out hover:bg-navy-deep active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            {prelaunch ? WAITLIST_CTA : 'Register your business'}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
          {prelaunch ? null : (
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-[15px] font-semibold text-slate-950 transition-transform duration-150 ease-out hover:bg-slate-50 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy motion-reduce:transition-none motion-reduce:active:scale-100"
            >
              See every feature
            </a>
          )}
        </div>

        <ul className="mt-6 flex flex-col items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-600 sm:flex-row">
          {PROOF.map((item) => (
            <li key={item} className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-navy" strokeWidth={2.5} aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-0 mx-auto -mb-36 mt-16 max-w-6xl px-4 sm:-mb-44 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white" aria-hidden>
          <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-2.5">
            <span className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            </span>
            <span className="mx-auto truncate rounded-md bg-slate-100 px-3 py-1 text-xs text-slate-500">veno.app/calendar</span>
            <span className="w-10" />
          </div>

          <div className="flex">
            <aside className="hidden w-48 shrink-0 border-r border-slate-200 p-3 md:block">
              <div className="flex items-center gap-2 px-2 py-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy font-display text-sm font-bold text-white">S</span>
                <span>
                  <span className="block text-sm font-semibold text-slate-950">Serene Spa</span>
                  <span className="block text-xs text-slate-500">4 on the team</span>
                </span>
              </div>
              <ul className="mt-3 space-y-0.5">
                {NAV.map(({ label, Icon, on }) => (
                  <li key={label}>
                    <span className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm ${on ? 'bg-wash font-semibold text-navy' : 'text-slate-600'}`}>
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            </aside>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
                <div className="text-left">
                  <p className="font-display text-lg font-semibold tracking-tight text-slate-950">Saturday 7 Nov</p>
                  <p className="text-xs text-slate-500">18 bookings · 3 gaps left</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex rounded-full bg-slate-100 p-1 text-sm">
                    <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-950">Day</span>
                    <span className="px-3 py-1 text-slate-500">Week</span>
                  </span>
                  <span className="rounded-full bg-navy px-3.5 py-1.5 text-sm font-semibold text-white">+ New booking</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="grid min-w-[680px] grid-cols-[52px_repeat(4,1fr)]">
                  <div className="border-b border-slate-100" />
                  {STAFF.map((person) => (
                    <div key={person.name} className="border-b border-l border-slate-100 px-2 py-3 text-center">
                      <span className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${person.tint}`}>
                        {person.initial}
                      </span>
                      <p className="mt-1.5 text-sm font-semibold text-slate-950">{person.name}</p>
                    </div>
                  ))}

                  <div className="relative" style={{ height: HOUR * HOURS.length }}>
                    {HOURS.map((hour, index) => (
                      <span key={hour} className="absolute right-2 text-[11px] text-slate-400" style={{ top: index * HOUR + 4 }}>
                        {hour}
                      </span>
                    ))}
                  </div>

                  {STAFF.map((person) => (
                    <div key={person.name} className="relative border-l border-slate-100" style={{ height: HOUR * HOURS.length }}>
                      {HOURS.map((hour, index) => (
                        <span key={hour} className="absolute inset-x-0 border-t border-slate-100" style={{ top: index * HOUR }} />
                      ))}
                      {person.blocks.map((block) => (
                        <div
                          key={block.client}
                          className={`absolute inset-x-1.5 overflow-hidden rounded-lg px-2 py-1.5 ${block.tone}`}
                          style={{ top: block.start * HOUR + 4, height: block.span * HOUR - 8 }}
                        >
                          <p className="truncate text-[11px] font-medium text-slate-500">
                            {labelTime(block.start)} – {labelTime(block.start + block.span)}
                          </p>
                          <p className="truncate text-sm font-semibold text-slate-950">{block.service}</p>
                          <p className="truncate text-xs text-slate-600">{block.client}</p>
                          {'note' in block ? (
                            <p className="mt-1 flex items-center gap-1 truncate text-[11px] font-semibold text-emerald-700">
                              <Check className="h-3 w-3 shrink-0" strokeWidth={2.5} />
                              {block.note}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function labelTime(offset: number) {
  const minutes = 9 * 60 + Math.round(offset * 60)
  const hour = Math.floor(minutes / 60)
  const min = minutes % 60
  return `${hour}:${min.toString().padStart(2, '0')}`
}
