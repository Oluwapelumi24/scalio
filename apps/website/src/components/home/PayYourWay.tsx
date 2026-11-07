import { JoinWaitlist } from '@/components/site/JoinWaitlist'

const LINES = [
  { label: 'Service', amount: '₦25,000' },
  { label: 'Deposit to hold the time', amount: '₦7,500' },
]

function Bill() {
  return (
    <>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">Deep tissue massage · 90m</p>
          <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Serene Spa, Ikoyi
          </p>
        </div>
        <p className="text-sm font-medium text-slate-500 sm:text-right">
          Saturday
          <span className="mt-0.5 block font-display text-lg font-semibold text-slate-950">10:00 am</span>
        </p>
      </div>

      <dl className="mt-8 border-t border-slate-200">
        {LINES.map((line) => (
          <div key={line.label} className="flex items-baseline justify-between gap-6 border-b border-slate-100 py-4">
            <dt className="text-sm text-slate-500">{line.label}</dt>
            <dd className="font-medium tabular-nums text-slate-950">{line.amount}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-6 py-6">
          <dt className="text-base font-semibold text-slate-950">At the visit</dt>
          <dd className="font-display text-4xl font-semibold tabular-nums tracking-tight text-slate-950 sm:text-5xl">
            ₦17,500
          </dd>
        </div>
      </dl>
    </>
  )
}

/** A single bill, not a second step-and-panel. The price is the layout. */
export function PayYourWay({ prelaunch = false }: { prelaunch?: boolean }) {
  if (!prelaunch) {
    return (
      <section className="bg-[#f6f7f9] px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-medium text-slate-500">Payment</p>
          <h2 className="mt-3 max-w-xl font-display text-4xl font-bold leading-[1.02] tracking-tight text-slate-950 sm:text-5xl">
            Pay the way you like.
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-600">
            Hold the time with a deposit, or pay when you arrive. The price is settled before you book.
          </p>

          <article className="mt-12 rounded-2xl border border-slate-200 bg-white">
            <div className="px-6 py-7 sm:px-10 sm:py-9">
              <Bill />
            </div>
            <ul className="grid border-t border-slate-200 sm:grid-cols-3">
              <li className="border-b border-slate-200 px-6 py-6 sm:border-b-0 sm:px-10 sm:border-l-0">
                <p className="font-semibold tracking-tight text-slate-950">Pay at the visit</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                  Cash, card or transfer, where the business allows it.
                </p>
              </li>
              <li className="border-b border-slate-200 px-6 py-6 sm:border-b-0 sm:border-l sm:px-10">
                <p className="font-semibold tracking-tight text-slate-950">Or hold it</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                  A deposit keeps the time. The rest waits until you arrive.
                </p>
              </li>
              <li className="px-6 py-6 sm:border-l sm:px-10">
                <p className="font-semibold tracking-tight text-slate-950">See it first</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                  The figure on the bill is the whole charge. It does not change at the door.
                </p>
              </li>
            </ul>
          </article>
        </div>
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden bg-[#f6f7f9] px-6 py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-24 top-16 h-96 w-96 rounded-full bg-[#f9a8d4] opacity-45 blur-[120px]" />
        <div className="absolute right-[-8rem] top-24 h-[28rem] w-[28rem] rounded-full bg-[#a5b4fc] opacity-50 blur-[130px]" />
        <div className="absolute -bottom-16 -right-20 h-80 w-80 rounded-full bg-[#86efac] opacity-35 blur-[110px]" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-slate-500">Payment</p>
          <h2 className="mt-3 font-display text-4xl font-bold leading-[1.02] tracking-tight text-slate-950 sm:text-5xl">
            Pay the way you like.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-slate-600">
            Hold the time with a deposit, or pay when you arrive. The price is settled before you book.
          </p>
        </div>

        {/* Stage: photo + bill */}
        <div className="mt-12 overflow-hidden rounded-[1.75rem] border border-black/5 bg-white lg:grid lg:grid-cols-[1.05fr_0.95fr]">
          <figure className="relative aspect-[4/3] overflow-hidden lg:aspect-auto lg:min-h-[26rem]">
            <img
              src="/listings/spa.jpg"
              alt="A therapist pouring oil during a massage at Serene Spa"
              className="absolute inset-0 h-full w-full object-cover object-[center_35%] outline outline-1 outline-offset-[-1px] outline-black/10"
            />
            <div className="absolute left-5 top-5 rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-slate-900 backdrop-blur-sm">
              Saturday · 10:00 am
            </div>
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-6 pb-6 pt-24 sm:px-8">
              <p className="text-sm font-medium text-white/75">Serene Spa · Ikoyi</p>
              <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-white">Deep tissue · 90 minutes</p>
            </figcaption>
          </figure>

          <div className="relative flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-10">
            <div
              className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rotate-12 rounded-full border border-dashed border-emerald-400/50"
              aria-hidden
            />
            <Bill />
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              ₦7,500 holds the Saturday slot. The rest is due when you arrive.
            </p>
          </div>
        </div>

        {/* Three distinct artifacts — not the same card thrice */}
        <ul className="mt-5 grid gap-4 lg:grid-cols-12 lg:gap-4">
          {/* 1 — Arrival: photo-led, dark, amount due */}
          <li className="relative min-h-[17.5rem] overflow-hidden rounded-[1.5rem] lg:col-span-5">
            <img
              src="/listings/nails.jpg"
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover outline outline-1 outline-offset-[-1px] outline-black/10"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b1638] via-[#0b1638]/75 to-[#0b1638]/25" />
            <div className="relative flex h-full flex-col justify-between p-6 sm:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">At the door</p>
              <div>
                <p className="font-display text-3xl font-semibold tracking-tight text-white sm:text-[2.15rem]">
                  Pay at the visit
                </p>
                <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-white/75">
                  Cash, card or transfer — wherever the business takes it.
                </p>
                <p className="mt-5 font-display text-2xl font-semibold tabular-nums tracking-tight text-white">
                  ₦17,500
                  <span className="ml-2 text-sm font-sans font-medium text-white/55">due on arrival</span>
                </p>
              </div>
            </div>
          </li>

          {/* 2 — Hold: perforated deposit ticket */}
          <li className="relative overflow-hidden rounded-[1.5rem] bg-[#dff7ea] lg:col-span-4">
            <div className="relative flex h-full flex-col p-6 sm:p-7">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800/70">
                  Deposit ticket
                </p>
                <span className="rounded-full bg-emerald-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-50">
                  Held
                </span>
              </div>
              <p className="mt-6 font-serif text-[2.65rem] font-medium leading-none tracking-tight text-emerald-950 tabular-nums">
                ₦7,500
              </p>
              <p className="mt-3 font-display text-xl font-semibold tracking-tight text-emerald-950">Or hold it</p>
              <p className="mt-1.5 text-sm leading-relaxed text-emerald-900/70">
                A deposit keeps Saturday 10:00. The rest waits until you arrive.
              </p>
              <div className="mt-auto border-t border-dashed border-emerald-800/25 pt-4">
                <p className="font-mono text-[11px] uppercase tracking-wider text-emerald-800/55">
                  Slot · Sat 10:00 · Serene Spa
                </p>
              </div>
            </div>
          </li>

          {/* 3 — Locked price stamp */}
          <li className="relative overflow-hidden rounded-[1.5rem] bg-[#ffe8d4] lg:col-span-3">
            <div className="relative flex h-full flex-col p-6 sm:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a3412]/70">
                Price lock
              </p>
              <div className="mt-8 flex flex-1 flex-col justify-center">
                <span className="inline-flex w-fit -rotate-6 rounded-md border-2 border-[#c2410c] px-3 py-1.5 font-display text-sm font-bold uppercase tracking-[0.12em] text-[#c2410c]">
                  Locked
                </span>
                <p className="mt-5 font-display text-[1.85rem] font-semibold leading-none tracking-tight text-[#7c2d12] tabular-nums">
                  ₦25,000
                </p>
                <p className="mt-4 font-display text-xl font-semibold tracking-tight text-[#7c2d12]">See it first</p>
                <p className="mt-1.5 text-sm leading-relaxed text-[#9a3412]/80">
                  The bill is the whole charge. Nothing new at the door.
                </p>
              </div>
            </div>
          </li>
        </ul>

        <div className="mt-10 flex justify-center">
          <JoinWaitlist />
        </div>
      </div>
    </section>
  )
}
