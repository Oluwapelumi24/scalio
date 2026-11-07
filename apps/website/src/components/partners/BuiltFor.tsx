import { ArrowRight } from 'lucide-react'
import { WAITLIST_CTA, WAITLIST_HREF } from '@/components/site/JoinWaitlist'

const AUDIENCES = [
  {
    title: 'Hair and beauty',
    body: 'Colour, cuts and styling booked in the right order.',
    image: '/people/stylist.jpg',
    alt: 'A stylist drying a client’s hair',
    position: 'object-[62%_center]',
  },
  {
    title: 'Spas and massage',
    body: 'Rooms, treatments and the time after each session.',
    image: '/listings/spa.jpg',
    alt: 'A therapist pouring oil during a massage',
    position: 'object-[center_40%]',
  },
  {
    title: 'Fitness',
    body: 'One-to-ones, classes and the spaces still left.',
    image: '/listings/trainer.jpg',
    alt: 'A trainer coaching a client through a push-up',
    position: 'object-[center_45%]',
  },
  {
    title: 'Tailoring',
    body: 'Fittings, alterations and when the piece is ready.',
    image: '/listings/tailor.jpg',
    alt: 'A person in a tailored suit',
    position: 'object-[center_20%]',
  },
] as const

/** Photo row of who Veno is built for. Replaces The people on the pre-launch partners page. */
export function BuiltFor() {
  return (
    <section id="built-for" className="bg-[#f5f6f8] px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy">Built for</p>
            <h2 className="mt-3 font-display text-4xl font-bold leading-[1.05] tracking-tight text-slate-950 sm:text-5xl">
              Made for businesses that run on appointments.
            </h2>
          </div>
          <a
            href={WAITLIST_HREF}
            className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-black/5 transition-transform duration-150 ease-out hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100"
          >
            {WAITLIST_CTA}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </div>

        <ul className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 [scrollbar-width:none] lg:grid lg:grid-cols-4 lg:overflow-visible [&::-webkit-scrollbar]:hidden">
          {AUDIENCES.map((item) => (
            <li key={item.title} className="w-[240px] shrink-0 snap-start sm:w-[260px] lg:w-auto">
              <article className="relative aspect-[3/4] overflow-hidden rounded-[1.35rem]">
                <img src={item.image} alt={item.alt} className={`absolute inset-0 h-full w-full object-cover ${item.position}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 via-[42%] to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="font-display text-xl font-semibold tracking-tight text-white">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-snug text-white/80">{item.body}</p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
