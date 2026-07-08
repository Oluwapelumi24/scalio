'use client'

import { motion } from 'motion/react'
import { ClipboardList, Settings2, LineChart, ArrowRight } from 'lucide-react'
import { DashboardMockup } from './DashboardMockup'
import { Reveal } from './Reveal'
import { VENDOR_REGISTER_URL, VENDOR_LOGIN_URL } from '@/lib/constants'

const STEPS = [
  {
    icon: ClipboardList,
    title: 'Register & get approved',
    body: 'Tell us about your business. Our team reviews every listing before it goes live — no bots, no spam vendors.',
  },
  {
    icon: Settings2,
    title: 'Set up in minutes',
    body: 'Add services, invite staff, and configure your hours, blackout dates, and pricing.',
  },
  {
    icon: LineChart,
    title: 'Run your day from one screen',
    body: 'Manage the booking calendar, track no-shows, and get paid — deposits or full prepayment, straight to your Paystack account.',
  },
]

const FEATURES = [
  'Per-staff logins with role-based access',
  'Configurable schedule & blackout dates',
  'Automated booking reminders for customers',
  'Customer CRM with booking history & notes',
  'Deposit or full-prepayment collection',
  'Real-time booking calendar',
]

export function VendorSection() {
  return (
    <section id="vendors" className="scroll-mt-20 bg-slate-900 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-start gap-14 lg:grid-cols-2">
          <div>
            <Reveal>
              <span className="text-sm font-semibold uppercase tracking-wide text-indigo-400">
                For businesses
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Run your business, not your booking book.
              </h2>
              <p className="mt-4 text-lg text-slate-300">
                Replace the notebook, the missed calls, and the group chat reminders with one
                dashboard built for service businesses.
              </p>
            </Reveal>

            <div className="mt-10 space-y-7">
              {STEPS.map((step, i) => (
                <Reveal key={step.title} delay={i * 0.1}>
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
                      <step.icon className="h-5 w-5" strokeWidth={2.25} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-400">{step.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.2} className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a
                href={VENDOR_REGISTER_URL}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
              >
                Register your business
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={VENDOR_LOGIN_URL}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5"
              >
                Vendor sign in
              </a>
            </Reveal>
          </div>

          <div className="lg:sticky lg:top-24">
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <DashboardMockup />
            </motion.div>

            <Reveal delay={0.15} className="mt-8 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <div key={f} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-400" />
                  {f}
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
