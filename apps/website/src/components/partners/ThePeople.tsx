const FACTS = [
  { figure: '1 link', caption: 'for WhatsApp and Instagram' },
  { figure: '4 roles', caption: 'from owner to front desk' },
  { figure: '1 calendar', caption: 'for the whole team' },
  { figure: 'Your bank', caption: 'where deposits settle' },
]

/** Editorial block before Get started: the people a booking is actually for. */
export function ThePeople() {
  return (
    <section id="people" className="bg-[#f3efe8] px-6 py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
        <div>
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            <span className="h-px w-8 bg-slate-400" aria-hidden />
            The people
          </p>
          <h2 className="mt-5 font-display text-[1.85rem] font-bold leading-[1.12] tracking-tight text-slate-950 sm:text-[2.15rem] lg:text-[2.45rem]">
            <span className="block">The person in the chair,</span>
            <span className="mt-1 block font-serif text-[1.02em] font-normal italic text-navy">and the one who runs the day.</span>
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-slate-600 sm:text-[17px]">
            A booking is one person showing up for another. Veno keeps the day clear for the stylist, the therapist, the tailor and the front desk, so the visit is the only thing left to get right.
          </p>
          <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-7 border-t border-slate-300/80 pt-8">
            {FACTS.map((fact) => (
              <div key={fact.figure}>
                <dt className="font-display text-2xl font-semibold tracking-tight text-slate-950">{fact.figure}</dt>
                <dd className="mt-1 text-sm leading-snug text-slate-500">{fact.caption}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto w-full max-w-xl pb-6 lg:max-w-none lg:pb-10">
          <img
            src="/people/stylist.jpg"
            alt="A stylist drying a client’s hair in the salon"
            className="aspect-[4/5] w-[78%] rounded-[1.75rem] object-cover object-[62%_center] sm:w-[80%]"
          />
          <img
            src="/people/barber.jpg"
            alt="A barber trimming a client’s beard"
            className="absolute bottom-0 right-0 aspect-[4/5] w-[46%] rounded-[1.35rem] object-cover object-[28%_18%] ring-[6px] ring-[#f3efe8] sm:w-[42%]"
          />
        </div>
      </div>
    </section>
  )
}
