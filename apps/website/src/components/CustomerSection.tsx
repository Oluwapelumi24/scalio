import { Search, CalendarCheck, Wallet } from 'lucide-react'
import { Reveal } from './Reveal'
import { CategoryCarousel } from './CategoryCarousel'
import { AppBadges } from './AppBadges'

const STEPS = [
  {
    icon: Search,
    title: 'Discover nearby vendors',
    body: 'Browse by category — salon, spa, barbershop, photography and more — without creating an account first.',
  },
  {
    icon: CalendarCheck,
    title: 'Book a time that works',
    body: 'See real availability and lock in a slot in a couple of taps. No back-and-forth calls.',
  },
  {
    icon: Wallet,
    title: 'Pay your way',
    body: 'Pay online through Paystack, put down a deposit, or pay on arrival — whatever the vendor allows.',
  },
]

export function CustomerSection() {
  return (
    <section id="customers" className="mx-auto max-w-6xl px-6 py-24 scroll-mt-20">
      <Reveal>
        <span className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
          For customers
        </span>
        <h2 className="mt-3 max-w-xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Find it. Book it. Show up.
        </h2>
        <p className="mt-4 max-w-xl text-lg text-slate-600">
          No calling around, no guessing if they&apos;re open. Browse as a guest, and only
          sign up when you&apos;re ready to book.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-8 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <Reveal key={step.title} delay={i * 0.1}>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <step.icon className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">{step.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{step.body}</p>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.15} className="mt-20">
        <h3 className="text-lg font-semibold text-slate-900">Everything, in one app</h3>
        <p className="mt-1.5 text-sm text-slate-600">
          Salons, spas, barbers, photographers, and more — thirteen categories and counting.
        </p>
        <div className="mt-6">
          <CategoryCarousel />
        </div>
      </Reveal>

      <Reveal delay={0.1} className="mt-16 flex flex-col items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Get the Scalio app</h3>
          <p className="mt-1 text-sm text-slate-600">Book on the go and get reminders before every appointment.</p>
        </div>
        <AppBadges />
      </Reveal>
    </section>
  )
}
