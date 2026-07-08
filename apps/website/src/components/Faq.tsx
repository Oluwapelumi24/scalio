'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Reveal } from './Reveal'

const FAQS = [
  {
    q: 'Is Scalio free to use as a customer?',
    a: 'Yes. Browsing and booking is free — you only pay the vendor for the service you book, either online or on arrival, depending on what they allow.',
  },
  {
    q: 'How do vendor payments work?',
    a: 'Payments run through Paystack. Depending on the service, customers can pay a deposit, pay in full up front, or pay on arrival — vendors choose which options to offer.',
  },
  {
    q: 'Is every vendor verified?',
    a: 'Every business goes through manual review before it appears on Scalio. There\'s no public self-listing without approval.',
  },
  {
    q: 'Do I need an account to browse?',
    a: 'No — you can browse vendors and services as a guest. You\'ll only be asked to sign up when you\'re ready to actually book.',
  },
  {
    q: 'What does it cost to list my business?',
    a: 'Reach out after registering and our team will walk you through pricing for your business.',
  },
]

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-6 py-24">
      <Reveal>
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Frequently asked questions
        </h2>
      </Reveal>

      <div className="mt-12 space-y-2">
        {FAQS.map((item, i) => {
          const isOpen = openIndex === i
          return (
            <Reveal key={item.q} delay={i * 0.05}>
              <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold text-slate-900">{item.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <p className="px-5 pb-4 text-sm leading-relaxed text-slate-600">{item.a}</p>
                )}
              </div>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
