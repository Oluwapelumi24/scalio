import Link from 'next/link'
import { ArrowRight, Bell, CalendarCheck, Check, Clock, CreditCard, MapPin, Search, ShieldCheck, Sparkles, Star, Wallet } from 'lucide-react'
import { Reveal } from '@/components/Reveal'

/* ── Find it. Book it. Show up. ─────────────────────────────────────────────── */

const TILES = [
  {
    body: 'Browse spas, laundromats, tailors, cleaners, salons and more near you, as a guest. Sign up only when you book.',
    scene: (
      <>
        <div className="absolute inset-0 bg-[linear-gradient(160deg,#065F46,#10B981_55%,#bbf7d0)]" />
        <div className="absolute left-1/2 top-[30%] w-[80%] -translate-x-1/2 rounded-2xl bg-white/95 px-4 py-3 shadow-xl">
          <p className="flex items-center gap-2 text-xs text-slate-500"><Search className="h-3.5 w-3.5" /> Near Lekki</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {['Spa', 'Laundry', 'Tailor', 'Cleaning', 'Salon'].map((c, i) => (
              <span key={c} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${i === 0 ? 'bg-navy text-white' : 'bg-slate-100 text-slate-700'}`}>{c}</span>
            ))}
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-900">48 places · 17 free today</p>
        </div>
      </>
    ),
  },
  {
    body: 'See the times that are actually free and book in a few taps. No calls, no waiting for a reply.',
    scene: (
      <div className="absolute inset-0 bg-[linear-gradient(160deg,#1e3a8a,#4f6fe0_55%,#ffc49b)]">
        <div className="absolute left-1/2 top-[30%] w-[74%] -translate-x-1/2 rotate-[-4deg] rounded-3xl bg-white p-4 shadow-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Saturday · Morning</p>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {['9:00', '9:30', '10:00', '10:30', '11:00', '11:30'].map((t) => (
              <span key={t} className={`rounded-lg py-1.5 text-center text-xs font-semibold ${t === '10:00' ? 'bg-navy text-white' : 'bg-slate-100 text-slate-700'}`}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    body: 'Get reminders before your visit, then rate it after. Your bookings and receipts stay in one place.',
    scene: (
      <>
        <div className="absolute inset-0 bg-[linear-gradient(160deg,#7C2D12,#C2410C_50%,#fcd34d)]" />
        <div className="absolute left-1/2 top-[30%] w-[80%] -translate-x-1/2 rounded-2xl bg-white/95 px-4 py-3 shadow-xl">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Bell className="h-4 w-4 text-navy" /> In 1 hour: Stitch &amp; Co.</p>
          <p className="mt-0.5 text-xs text-slate-500">Agbada fitting · 5:00 pm · Surulere</p>
        </div>
      </>
    ),
  },
]

export function HowItWorks() {
  return (
    <section className="bg-white px-6 py-24 sm:py-28">
      <Reveal className="mx-auto max-w-4xl text-center">
        <h2 className="font-display text-4xl font-bold leading-[1.04] tracking-tight text-slate-900 sm:text-6xl">Find it. Book it. Show up.</h2>
      </Reveal>
      <div className="mx-auto mt-16 grid max-w-6xl gap-12 md:grid-cols-3 md:gap-8">
        {TILES.map((t, i) => (
          <Reveal key={i} delay={i * 0.1} className="text-center">
            <div className="mask-arch relative mx-auto aspect-[0.95] w-full max-w-[340px] overflow-hidden">{t.scene}</div>
            <p className="mx-auto mt-7 max-w-xs text-lg leading-relaxed text-slate-700">{t.body}</p>
          </Reveal>
        ))}
      </div>
      <Reveal className="mt-14 flex flex-col items-center gap-6">
        <p className="flex items-center gap-3 text-center text-lg font-semibold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white"><Check className="h-5 w-5" strokeWidth={3} /></span>
          Browsing is free. You only pay for the service you book.
        </p>
        <a href="#waitlist" className="rounded-2xl bg-slate-900 px-8 py-4 text-base font-semibold text-white transition-transform hover:-translate-y-0.5">Get early access</a>
      </Reveal>
    </section>
  )
}

/* ── Pay the way you like (ribbon image on the right) ───────────────────────── */

export function PayYourWay() {
  const points = [
    { Icon: Wallet, text: 'Pay at the visit with cash, card or transfer, where the business allows it.' },
    { Icon: CreditCard, text: 'Or hold your time with a small deposit, and pay the rest when you arrive.' },
    { Icon: ShieldCheck, text: 'Prices are shown before you book, so the bill never surprises you.' },
  ]
  return (
    <section className="overflow-hidden bg-[#f7f7f7] px-6 py-24 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <Reveal>
            <h2 className="max-w-xl font-display text-4xl font-bold leading-[1.03] tracking-tight text-slate-900 sm:text-6xl">Pay the way you like, without stress</h2>
          </Reveal>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {points.map(({ Icon, text }, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                  <Icon className="h-5 w-5 text-navy" />
                </span>
                <p className="mt-4 text-base leading-relaxed text-slate-700">{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
        <Reveal delay={0.1}>
          <div className="mask-ribbon relative mx-auto aspect-[0.72] w-full max-w-[420px] overflow-hidden bg-[linear-gradient(180deg,#9cc0ff_0%,#cfe0ff_45%,#ffd7b5_100%)]">
            <div className="absolute -left-10 top-10 h-40 w-56 rounded-full bg-white/50 blur-2xl" />
            <div className="absolute right-0 top-40 h-32 w-48 rounded-full bg-white/40 blur-2xl" />
            <div className="absolute left-1/2 top-[22%] w-[72%] -translate-x-1/2 rotate-[5deg] rounded-3xl bg-white p-5 shadow-2xl">
              <p className="text-xs text-slate-500">Deposit to hold your time</p>
              <p className="mt-1 font-display text-3xl font-bold text-slate-900">₦7,500</p>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <span className="text-slate-500">Pay at visit</span><span className="font-semibold text-slate-900">₦17,500</span>
              </div>
            </div>
            <div className="absolute bottom-[16%] left-1/2 w-[64%] -translate-x-1/2 rotate-[-4deg] rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-2xl">
              <p className="flex items-center gap-2 text-sm font-semibold"><Check className="h-4 w-4 text-emerald-400" /> Paid · Booking confirmed</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ── Feature orbs ───────────────────────────────────────────────────────────── */

/** A soft pastel disc with a stacked, glossy icon "object" in the middle. */
function Orb({ tint, from, to, Icon }: { tint: string; from: string; to: string; Icon: typeof Star }) {
  return (
    <div className={`relative flex h-40 w-40 shrink-0 items-center justify-center rounded-full sm:h-48 sm:w-48 ${tint}`} aria-hidden>
      <div className="absolute h-20 w-20 translate-x-3 translate-y-3 rotate-12 rounded-[1.4rem] opacity-40 sm:h-24 sm:w-24" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }} />
      <div className="relative flex h-20 w-20 -rotate-6 items-center justify-center rounded-[1.4rem] shadow-2xl ring-1 ring-white/50 sm:h-24 sm:w-24" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
        <div className="absolute inset-x-2 top-1.5 h-1/3 rounded-full bg-white/35 blur-[2px]" />
        <Icon className="relative h-10 w-10 text-white drop-shadow sm:h-12 sm:w-12" strokeWidth={1.8} />
      </div>
    </div>
  )
}

const ORBS = [
  { title: 'Real availability', body: 'Times come straight from each business’s own calendar, so what you see is what is free. No double bookings.', tint: 'bg-[#dfe6ff]', from: '#1e3a8a', to: '#6d8cff', Icon: Clock },
  { title: 'Fair, clear prices', body: 'Every service shows its price and how long it takes before you book. Browsing and booking cost nothing extra.', tint: 'bg-[#ffe0ef]', from: '#be185d', to: '#f9a8d4', Icon: Sparkles },
  { title: 'Reviewed businesses', body: 'Our team checks every business before it appears on Veno. No unverified listings.', tint: 'bg-[#d9f7e6]', from: '#047857', to: '#6ee7b7', Icon: ShieldCheck },
  { title: 'Everything in one place', body: 'Upcoming visits, receipts, directions and the places you love, all on your phone.', tint: 'bg-[#ece6ff]', from: '#6d28d9', to: '#c4b5fd', Icon: CalendarCheck },
]

export function FeatureOrbs() {
  return (
    <section className="bg-white px-6 py-24 sm:py-28">
      <Reveal className="mx-auto max-w-6xl">
        <h2 className="max-w-4xl font-display text-4xl font-bold leading-[1.04] tracking-tight text-slate-900 sm:text-6xl">
          Booking you can trust, from the first tap to the last touch-up
        </h2>
      </Reveal>
      <div className="mx-auto mt-16 grid max-w-6xl gap-x-12 gap-y-14 md:grid-cols-2">
        {ORBS.map((o, i) => (
          <Reveal key={o.title} delay={(i % 2) * 0.08} className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <Orb tint={o.tint} from={o.from} to={o.to} Icon={o.Icon} />
            <div>
              <h3 className="font-display text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.75rem]">{o.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-slate-600">{o.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ── For business (dark cards that lead to /partners) ───────────────────────── */

const SOLUTIONS = [
  {
    title: 'Online booking',
    body: 'One link for WhatsApp and Instagram. Clients pick a service and a free time, day or night.',
    href: '/partners#setup',
    scene: (
      <div className="absolute inset-0 bg-[linear-gradient(150deg,#312e81,#7c3aed_55%,#f0abfc)]">
        <div className="absolute left-1/2 top-1/2 w-[70%] -translate-x-1/2 -translate-y-1/2 rotate-[-5deg] rounded-2xl bg-white p-4 shadow-2xl">
          <p className="text-[10px] text-slate-500">Book Serene Spa</p>
          <p className="text-sm font-bold text-slate-900">veno.app/book/serene-spa</p>
          <div className="mt-2 flex gap-1.5">{['WhatsApp', 'Instagram'].map((l) => <span key={l} className="rounded-full bg-wash px-2 py-0.5 text-[10px] font-semibold text-navy">{l}</span>)}</div>
        </div>
      </div>
    ),
  },
  {
    title: 'Calendar & team',
    body: 'Every team member’s day side by side, walk-ins in one tap, and logins for each role.',
    href: '/partners#features',
    scene: (
      <div className="absolute inset-0 bg-[linear-gradient(150deg,#064e3b,#10b981_60%,#a7f3d0)]">
        <div className="absolute left-1/2 top-1/2 grid w-[74%] -translate-x-1/2 -translate-y-1/2 rotate-[4deg] grid-cols-3 gap-1.5 rounded-2xl bg-white p-3 shadow-2xl">
          {['Ada', 'Chidi', 'Kemi'].map((n, i) => (
            <div key={n}>
              <p className="text-center text-[10px] font-bold text-slate-900">{n}</p>
              <div className="relative mt-1 h-20 rounded-lg bg-slate-50">
                <div className="absolute inset-x-1 rounded-md border-l-2 border-navy bg-wash" style={{ top: 6 + i * 14, height: 30 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'Payments & growth',
    body: 'Deposits that cut no-shows, payouts to your bank, captions, ads and ratings.',
    href: '/partners#features',
    scene: (
      <div className="absolute inset-0 bg-[linear-gradient(150deg,#1e3a8a,#60a5fa_55%,#fde68a)]">
        <div className="absolute left-1/2 top-1/2 w-[66%] -translate-x-1/2 -translate-y-1/2 rotate-[-3deg] rounded-2xl bg-slate-900 p-4 text-white shadow-2xl">
          <p className="text-[10px] text-white/60">This week</p>
          <p className="font-display text-2xl font-bold">₦386,000</p>
          <div className="mt-2 flex h-8 items-end gap-1">{[40, 62, 35, 80, 95, 100, 20].map((h, i) => <div key={i} className="flex-1 rounded-sm bg-white/70" style={{ height: `${h}%` }} />)}</div>
        </div>
      </div>
    ),
  },
]

export function ForBusiness() {
  return (
    <section id="vendors" className="scroll-mt-24 bg-[#111111] px-6 py-24 sm:py-28">
      <Reveal className="mx-auto max-w-3xl text-center">
        <span className="text-sm font-semibold uppercase tracking-[0.18em] text-white/50">For businesses</span>
        <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-white sm:text-6xl">Run the business, not the booking book</h2>
      </Reveal>
      <div className="mx-auto mt-14 grid max-w-6xl gap-5 md:grid-cols-3">
        {SOLUTIONS.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.08}>
            <div className="flex h-full flex-col overflow-hidden rounded-[1.8rem] bg-white">
              <div className="relative aspect-[1.6] overflow-hidden rounded-b-[1.8rem]">{s.scene}</div>
              <div className="flex flex-1 flex-col p-7">
                <h3 className="font-display text-2xl font-semibold tracking-tight text-slate-900">{s.title}</h3>
                <p className="mt-3 flex-1 text-base leading-relaxed text-slate-600">{s.body}</p>
                <Link href={s.href} className="mt-7 inline-flex w-fit items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy">
                  Learn more <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ── Closing call to action with an arched scene ────────────────────────────── */

export function ClosingCta({
  title,
  cta,
  href,
}: {
  title: string
  cta: string
  href: string
}) {
  return (
    <section className="bg-white px-6 py-24 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
        <Reveal>
          <div className="mask-arch relative mx-auto aspect-[0.92] w-full max-w-[520px] overflow-hidden bg-[linear-gradient(180deg,#0b1638_0%,#1e3a8a_40%,#6d8cff_70%,#ffcfa6_100%)]">
            <div className="absolute inset-x-0 top-0 h-1/2 opacity-60 [background-image:radial-gradient(1px_1px_at_20%_20%,#fff,transparent),radial-gradient(1px_1px_at_60%_12%,#fff,transparent),radial-gradient(1.5px_1.5px_at_80%_30%,#fff,transparent)]" />
            <div className="absolute left-[12%] top-[30%] w-[52%] rotate-[-6deg] rounded-2xl bg-white p-4 shadow-2xl">
              <p className="flex items-center gap-1.5 text-[11px] text-slate-500"><MapPin className="h-3 w-3" /> Surulere, Lagos</p>
              <p className="mt-1 text-sm font-bold text-slate-900">Stitch &amp; Co. Tailors</p>
              <p className="flex items-center gap-1 text-xs text-slate-600"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> 4.9 · Free 2:30pm</p>
            </div>
            <div className="absolute bottom-[26%] right-[10%] w-[50%] rotate-[5deg] rounded-2xl bg-white p-4 shadow-2xl">
              <p className="flex items-center gap-2 text-sm font-bold text-slate-900"><CalendarCheck className="h-4 w-4 text-emerald-600" /> Booked</p>
              <p className="mt-0.5 text-xs text-slate-500">Sat, 10:00 am</p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-[4rem]">{title}</h2>
          <a href={href} className="mt-9 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 text-base font-semibold text-white transition-transform hover:-translate-y-0.5">
            {cta} <ArrowRight className="h-4 w-4" />
          </a>
        </Reveal>
      </div>
    </section>
  )
}
