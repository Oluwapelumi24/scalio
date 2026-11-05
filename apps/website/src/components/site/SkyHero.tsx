'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { CalendarHeart, Store } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * Who you are, as a choice of what you came to do: "Book" or "Get booked".
 * It reads as one sentence ("I want to… book / get booked"), with the white
 * pill on the current side. It's navigation, not state: individuals live on
 * the home page, businesses on /partners.
 */
export function AudienceSwitch({ active }: { active: 'individuals' | 'business' }) {
  const options = [
    { key: 'individuals', href: '/', label: 'Book', Icon: CalendarHeart },
    { key: 'business', href: '/partners', label: 'Get booked', Icon: Store },
  ] as const
  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">I want to</span>
      <nav
        aria-label="Who Veno is for"
        className="relative flex rounded-full bg-white/10 p-1.5 ring-1 ring-white/20 backdrop-blur-md [box-shadow:inset_0_1px_0_rgba(255,255,255,0.18)]"
      >
        {options.map(({ key, href, label, Icon }) => {
          const on = key === active
          return (
            <Link
              key={key}
              href={href}
              aria-current={on ? 'page' : undefined}
              className={`group relative flex items-center gap-2.5 rounded-full py-2 pl-2 pr-5 transition-colors ${on ? 'text-navy' : 'text-white/75 hover:text-white'}`}
            >
              {on ? (
                <motion.span
                  layoutId="audience-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-full bg-white shadow-[0_8px_30px_-8px_rgba(11,22,56,0.6)]"
                />
              ) : null}
              <span
                className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                  on ? 'bg-navy text-white' : 'bg-white/10 text-white group-hover:bg-white/20'
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="relative text-[15px] font-semibold">{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

/**
 * The Lagos-at-dusk sky both landing pages open on: deep navy up top, warming
 * to a soft glow at the horizon, with drifting light. `stage` rises out of the
 * bottom edge and overlaps the next section.
 */
export function SkyHero({
  audience,
  title,
  subtitle,
  stage,
}: {
  audience: 'individuals' | 'business'
  title: ReactNode
  subtitle: ReactNode
  stage: ReactNode
}) {
  return (
    <section className="relative isolate overflow-hidden bg-navy-deep pt-28 sm:pt-32">
      {/* Sky */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#0b1638_0%,#1e3a8a_38%,#4f6fe0_66%,#f3b28a_92%,#ffd9b8_100%)]" />
      <div className="absolute -left-40 top-24 -z-10 h-[420px] w-[620px] rounded-full bg-[#7aa2ff]/30 blur-[110px]" />
      <div className="absolute -right-32 top-48 -z-10 h-[380px] w-[520px] rounded-full bg-[#c18cff]/25 blur-[110px]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-72 bg-[radial-gradient(60%_100%_at_50%_100%,#ffd2a8_0%,rgba(255,210,168,0)_70%)]" />
      {/* Stars */}
      <div className="absolute inset-x-0 top-0 -z-10 h-1/2 opacity-60 [background-image:radial-gradient(1px_1px_at_12%_20%,#fff,transparent),radial-gradient(1px_1px_at_28%_8%,#fff,transparent),radial-gradient(1.5px_1.5px_at_44%_26%,#fff,transparent),radial-gradient(1px_1px_at_63%_12%,#fff,transparent),radial-gradient(1px_1px_at_78%_30%,#fff,transparent),radial-gradient(1.5px_1.5px_at_90%_10%,#fff,transparent),radial-gradient(1px_1px_at_6%_40%,#fff,transparent)]" />

      <div className="mx-auto max-w-6xl px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <AudienceSwitch active={audience} />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="mt-9 font-display text-[2.25rem] font-bold leading-[1.06] tracking-[-0.03em] text-white sm:whitespace-nowrap sm:text-[length:min(3rem,calc((100vw_-_3rem)/21.5))]"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mx-auto mt-5 max-w-4xl text-balance text-lg leading-relaxed text-white/80 sm:text-xl"
        >
          {subtitle}
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto mt-16 max-w-6xl px-6"
      >
        {stage}
      </motion.div>
    </section>
  )
}
