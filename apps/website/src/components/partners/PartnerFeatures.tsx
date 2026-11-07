import { ArrowRight, Bell, CalendarDays, CreditCard, BarChart3, Link2, Users } from 'lucide-react'

const FEATURES = [
  {
    title: 'Online booking page',
    body: 'Your own booking page with your services, prices and real free times. One link for WhatsApp, Instagram and your bio.',
    plan: 'Every plan',
    Icon: Link2,
    tint: 'bg-[#e7eeff]',
    icon: 'bg-white text-[#3b5bdb]',
    badge: 'border-[#3b5bdb]/20 bg-white/70 text-[#3b5bdb]',
  },
  {
    title: 'Day and week calendar',
    body: 'Every team member’s day side by side. Tap a free time to add a walk-in, and see who is next.',
    plan: 'Every plan',
    Icon: CalendarDays,
    tint: 'bg-[#e8f6ef]',
    icon: 'bg-white text-[#0f766e]',
    badge: 'border-[#0f766e]/20 bg-white/70 text-[#0f766e]',
  },
  {
    title: 'Reminders before the visit',
    body: 'A reminder an hour before, with the place and the time, so fewer people forget to show up.',
    plan: 'Every plan',
    Icon: Bell,
    tint: 'bg-[#fde8f4]',
    icon: 'bg-white text-[#be185d]',
    badge: 'border-[#be185d]/20 bg-white/70 text-[#be185d]',
  },
  {
    title: 'Deposits and payments',
    body: 'Take a deposit or the full price when someone books. Online payments settle into your bank.',
    plan: 'Every plan',
    Icon: CreditCard,
    tint: 'bg-[#fff1e4]',
    icon: 'bg-white text-[#c2410c]',
    badge: 'border-[#c2410c]/20 bg-white/70 text-[#c2410c]',
  },
  {
    title: 'Staff and roles',
    body: 'A login for owner, manager, practitioner and front desk. Each person only sees what their job needs.',
    plan: 'Professional',
    Icon: Users,
    tint: 'bg-[#e0f2fe]',
    icon: 'bg-white text-[#0369a1]',
    badge: 'border-[#0369a1]/20 bg-white/70 text-[#0369a1]',
  },
  {
    title: 'Reports',
    body: 'Bookings, no-shows and takings for the week and the month, ready when you need the numbers.',
    plan: 'Premium',
    Icon: BarChart3,
    tint: 'bg-[#fef9c3]',
    icon: 'bg-white text-[#a16207]',
    badge: 'border-[#a16207]/20 bg-white/70 text-[#a16207]',
  },
] as const

/** Feature grid in place of pricing on the pre-launch partners page. */
export function PartnerFeatures() {
  return (
    <section id="partner-features" className="relative overflow-hidden bg-[#f5f6f8] px-6 py-20 sm:py-24">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-20 top-10 h-80 w-80 rounded-full bg-[#f9a8d4] opacity-45 blur-[110px]" />
        <div className="absolute -right-16 top-1/3 h-96 w-96 rounded-full bg-[#a5b4fc] opacity-50 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#86efac] opacity-40 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy">Features</p>
        <div className="mt-3 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-slate-950 sm:text-5xl">
              Everything the front desk does, minus the phone tag.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
              Booking, reminders, payments and the team calendar in one place, so you stop copying the day between a book, WhatsApp and your phone.
            </p>
          </div>
          <a
            href="#features"
            className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white transition-transform duration-150 ease-out hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100"
          >
            All features
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </div>

        <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ title, body, plan, Icon, tint, icon, badge }) => (
            <li key={title} className={`flex flex-col rounded-[1.35rem] ${tint} p-6`}>
              <div className="flex items-start justify-between gap-3">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${icon}`}>
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${badge}`}>{plan}</span>
              </div>
              <h3 className="mt-6 font-display text-xl font-semibold tracking-tight text-slate-950">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{body}</p>
              <a href="#features" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-950">
                Learn more
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
