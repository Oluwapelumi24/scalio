import { CalendarCheck, Clock, Wallet } from 'lucide-react'
import { JoinWaitlist } from '@/components/site/JoinWaitlist'

const FEATURES = [
  {
    title: 'A time that is free',
    body: 'Open times come from the business’s own book. The slot you pick is held when the booking goes through.',
    Icon: CalendarCheck,
    tint: 'bg-[#e7eeff]',
  },
  {
    title: 'Change your mind',
    body: 'Cancel an upcoming visit from Bookings. The business sees it straight away and the time opens up again.',
    Icon: Clock,
    tint: 'bg-[#fde8f4]',
  },
  {
    title: 'Pay the way they offer',
    body: 'Some visits are paid when you arrive. Where a business takes a deposit or full payment, you can pay with Paystack.',
    Icon: Wallet,
    tint: 'bg-[#fff1e4]',
  },
] as const

/** The block under the service grid: the three things that set a Veno booking apart. */
export function StandoutFeatures({ prelaunch = false }: { prelaunch?: boolean }) {
  const features = FEATURES

  return (
    <section className="bg-white px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-slate-950 sm:text-5xl">
            The details that keep a booking
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Free times are the start. These are what make the visit actually happen.
          </p>
          {prelaunch ? (
            <div className="mt-8 flex justify-center">
              <JoinWaitlist />
            </div>
          ) : null}
        </div>
        <ul className="mt-12 grid gap-4 md:grid-cols-3">
          {features.map(({ title, body, Icon, tint }) => (
            <li key={title} className={`rounded-2xl border border-transparent px-6 py-8 ${tint}`}>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-navy">
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold tracking-tight text-slate-950">{title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
