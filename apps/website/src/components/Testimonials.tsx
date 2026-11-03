'use client'

import { useState } from 'react'
import { Quote } from 'lucide-react'
import { Reveal } from './Reveal'
import { visibleTestimonials, type Testimonial } from '@/lib/testimonials'

const LABEL: Record<Testimonial['audience'], string> = { partner: 'Partners', user: 'Users' }

/**
 * "What people are saying", for partners and users. On the partners page it
 * opens on partners; on the home page it opens on users. Hidden when there's
 * nothing real to show.
 */
export function Testimonials({ start = 'user', tone = 'light' }: { start?: Testimonial['audience']; tone?: 'light' | 'wash' }) {
  const [audience, setAudience] = useState<Testimonial['audience']>(start)
  const all = visibleTestimonials()
  if (all.length === 0) return null
  const available = (['partner', 'user'] as const).filter((a) => all.some((t) => t.audience === a))
  const current = available.includes(audience) ? audience : available[0]
  const items = all.filter((t) => t.audience === current)

  return (
    <section id="testimonials" className={`scroll-mt-20 py-24 ${tone === 'wash' ? 'bg-sky' : 'bg-white'}`}>
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">What people are saying</h2>
          <p className="mt-4 text-lg text-slate-600">From the businesses that run on Veno, and the people who book them.</p>
        </Reveal>

        {available.length > 1 ? (
          <div className="mt-8 flex justify-center">
            <div role="tablist" aria-label="Whose words" className="inline-flex rounded-2xl bg-slate-100 p-1">
              {available.map((a) => (
                <button
                  key={a}
                  type="button"
                  role="tab"
                  aria-selected={a === current}
                  onClick={() => setAudience(a)}
                  className={`rounded-xl px-5 py-2 text-sm font-semibold transition-colors ${a === current ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {LABEL[a]}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {items.map((t, i) => (
            <Reveal key={`${current}-${i}`} delay={i * 0.08}>
              <figure className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6">
                <Quote className="h-6 w-6 text-navy/30" />
                <blockquote className="mt-3 flex-1 text-base leading-relaxed text-slate-700">“{t.quote}”</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-wash text-sm font-bold text-navy">{t.name[0]}</span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">{t.name}</span>
                    <span className="block text-xs text-slate-500">{t.detail}</span>
                  </span>
                  {t.sample ? (
                    <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800" title="Replace with a real quote in src/lib/testimonials.ts">
                      Sample
                    </span>
                  ) : null}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
