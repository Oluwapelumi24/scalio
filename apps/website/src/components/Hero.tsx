'use client'

import { motion } from 'motion/react'
import { ArrowRight, Smartphone } from 'lucide-react'
import { PhoneMockup } from './PhoneMockup'
import { VENDOR_REGISTER_URL } from '@/lib/constants'

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/60 via-white to-white">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-200/30 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-8 sm:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              One platform, two sides of the counter
            </span>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Book trusted local services.
              <br />
              <span className="text-indigo-600">Or grow the business behind them.</span>
            </h1>

            <p className="mt-5 max-w-lg text-lg text-slate-600">
              Scalio connects everyday customers with vetted salons, spas, barbers,
              photographers, cleaners and more — real-time booking on one side,
              a full booking &amp; payments toolkit on the other.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#customers"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                <Smartphone className="h-4 w-4" />
                I want to book a service
              </a>
              <a
                href={VENDOR_REGISTER_URL}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                I run a service business
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center lg:justify-end"
          >
            <PhoneMockup />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
