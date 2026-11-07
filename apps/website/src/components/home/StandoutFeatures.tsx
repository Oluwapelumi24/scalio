import { CalendarCheck, ListPlus, Zap } from 'lucide-react'
import { JoinWaitlist } from '@/components/site/JoinWaitlist'

const FEATURES = [
  {
    title: 'Syncs with your calendar',
    body: 'A confirmed visit lands on your phone calendar, with the place, the time, and a reminder before you need to leave.',
    Icon: CalendarCheck,
    tint: 'bg-[#e7eeff]',
  },
  {
    title: 'Join the waitlist',
    body: 'If the time you want is taken, join the list. When someone cancels, that slot is offered to you first.',
    Icon: ListPlus,
    tint: 'bg-[#fde8f4]',
  },
  {
    title: 'Priority when it’s urgent',
    body: 'Need it today? Mark the request urgent and businesses that can take you sooner rise to the top.',
    Icon: Zap,
    tint: 'bg-[#fff1e4]',
  },
] as const

/** The block under the service grid: the three things that set a Veno booking apart. */
export function StandoutFeatures({ prelaunch = false }: { prelaunch?: boolean }) {
  const features = prelaunch
    ? FEATURES.map((feature) =>
        feature.title === 'Join the waitlist'
          ? {
              ...feature,
              title: 'If the time is taken',
              body: 'If the time you want is taken, you can take the next opening. When someone cancels, that slot is offered to you first.',
            }
          : feature,
      )
    : FEATURES

  return (
    <section className="bg-white px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className={prelaunch ? 'text-center' : undefined}>
          <h2 className={`font-display text-4xl font-bold leading-[1.05] tracking-tight text-slate-950 sm:text-5xl ${prelaunch ? '' : 'max-w-2xl'}`}>
            The details that keep a booking
          </h2>
          <p className={`mt-4 text-lg leading-relaxed text-slate-600 ${prelaunch ? '' : 'max-w-xl'}`}>
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
            <li key={title} className={`rounded-2xl border px-6 py-8 ${prelaunch ? `${tint} border-transparent` : 'border-slate-200 bg-white'}`}>
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-navy ${prelaunch ? 'bg-white' : 'bg-wash'}`}>
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
