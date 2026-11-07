'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Reveal } from './Reveal'

const FAQS = [
  {
    q: 'What services can I book on Veno?',
    a: 'You can book spas, massage, Pilates, fitness and personal trainers, physiotherapy, hair salons, hair stylists and braiders, wig installs and hair extensions, barbers, nails, lashes and brows, makeup artists, tailors, laundry and dry cleaning, and home and office cleaning.',
  },
  {
    q: 'Is Veno free to use as a customer?',
    a: 'Yes. Browsing and booking is free — you only pay the vendor for the service you book, either online or on arrival, depending on what they allow.',
  },
  {
    q: 'How do vendor payments work?',
    a: 'Depending on the service, customers can pay a deposit, pay in full up front, or pay on arrival. Each business chooses which options to offer, and online payments settle straight into its bank account.',
  },
  {
    q: 'Is every vendor verified?',
    a: 'Every business goes through manual review before it appears on Veno. There\'s no public self-listing without approval.',
  },
  {
    q: 'Do I need an account to browse?',
    a: 'No — you can browse vendors and services as a guest. You\'ll only be asked to sign up when you\'re ready to actually book.',
  },
  {
    q: 'What does it cost to list my business?',
    a: 'Plans start at ₦15,000 a month for one person. Teams pay per seat, and annual billing saves 15%. The full list is on the partners page.',
  },
]

const PRELAUNCH_FAQS = [
  {
    q: 'When can I book?',
    a: 'Veno is not open yet. Join the waitlist and we will email you the day booking opens in Lagos.',
  },
  {
    q: 'What happens after I join the waitlist?',
    a: 'We keep your email and write once, when it is your turn. You choose whether you are booking for yourself or listing a business.',
  },
  {
    q: 'Which services will be on Veno?',
    a: 'Spas, salons, barbershops, laundry, tailors, fitness and more across Lagos. Name a service when you join and we will mention it in that email.',
  },
  {
    q: 'Will booking be free?',
    a: 'Yes. Browsing and booking will be free. You pay the business for the service, either online or when you arrive.',
  },
  {
    q: 'I run a business. Can I join?',
    a: 'Yes. Choose “I’m a partner” on the waitlist. We will email you when registration opens. Plans start at ₦15,000 a month for one person.',
  },
]

export function Faq({ variant = 'live' }: { variant?: 'live' | 'prelaunch' }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const items = variant === 'prelaunch' ? PRELAUNCH_FAQS : FAQS

  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-6 py-24">
      <Reveal>
        <h2 className="text-center font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Frequently asked questions
        </h2>
      </Reveal>

      <div className="mt-12 space-y-2">
        {items.map((item, i) => {
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
