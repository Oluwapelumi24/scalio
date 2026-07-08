import { ArrowRight, Smartphone } from 'lucide-react'
import { Reveal } from './Reveal'
import { VENDOR_REGISTER_URL } from '@/lib/constants'

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-indigo-600 py-20">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-400/30 blur-3xl" />

      <Reveal className="relative mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Which side of the counter are you on?
        </h2>
        <p className="mt-4 text-lg text-indigo-100">
          Book your next appointment in minutes, or get your business booking-ready this week.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href="#customers"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-indigo-600 transition-transform hover:scale-[1.02]"
          >
            <Smartphone className="h-4 w-4" />
            I want to book a service
          </a>
          <a
            href={VENDOR_REGISTER_URL}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Register your business
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </Reveal>
    </section>
  )
}
