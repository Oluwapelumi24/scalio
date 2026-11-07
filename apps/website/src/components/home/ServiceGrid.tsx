'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import {
  Camera,
  Car,
  ChevronDown,
  Dumbbell,
  Eye,
  Flower2,
  Gem,
  HeartHandshake,
  Palette,
  PawPrint,
  Ruler,
  Scissors,
  Shirt,
  Sparkles,
  SprayCan,
  Stethoscope,
  Video,
  Wind,
} from 'lucide-react'
import Link from 'next/link'
import { CATEGORIES, type Category } from '@/lib/constants'
import { WAITLIST_CTA } from '@/components/site/JoinWaitlist'

const ICONS: Record<Category['icon'], typeof Scissors> = {
  scissors: Scissors,
  wind: Wind,
  sparkles: Sparkles,
  gem: Gem,
  palette: Palette,
  flower: Flower2,
  'heart-handshake': HeartHandshake,
  eye: Eye,
  camera: Camera,
  shirt: Shirt,
  spray: SprayCan,
  video: Video,
  ruler: Ruler,
  car: Car,
  dumbbell: Dumbbell,
  paw: PawPrint,
  stethoscope: Stethoscope,
}

/**
 * The section under the hero: a grid of services. Choosing one starts the
 * waitlist with that service already named.
 */
export function ServiceGrid({ prelaunch = false }: { prelaunch?: boolean }) {
  const listRef = useRef<HTMLUListElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [clip, setClip] = useState<{ height: number; hiddenFrom: number } | null>(null)

  useLayoutEffect(() => {
    if (!prelaunch) return
    const list = listRef.current
    if (!list) return

    const measure = () => {
      const items = [...list.children] as HTMLElement[]
      if (items.length === 0) return
      const firstTop = items[0].offsetTop
      const nextRow = items.find((item) => item.offsetTop > firstTop + 4)
      const card = items[0].offsetHeight
      const stride = nextRow ? nextRow.offsetTop - firstTop : card
      const height = stride * 2 + card * 0.5
      const hiddenFrom = items.findIndex((item) => item.offsetTop >= height - 8)
      const nextHidden = hiddenFrom === -1 ? items.length : hiddenFrom
      setClip((current) =>
        current && current.height === height && current.hiddenFrom === nextHidden
          ? current
          : { height, hiddenFrom: nextHidden },
      )
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(list)
    return () => observer.disconnect()
  }, [prelaunch])

  const collapsed = prelaunch && !expanded && clip != null

  return (
    <section id="categories" aria-labelledby="services-heading" className="scroll-mt-20 bg-white px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <h2
          id="services-heading"
          className="text-center font-display text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl"
        >
          {prelaunch ? 'Services opening on Veno' : 'Services you can book'}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-slate-600">
          {prelaunch ? 'Pick one and join the waitlist. We’ll write when you can book it.' : 'Spas, salons, laundry, tailors and more.'}
        </p>

        <div className="relative">
        <ul
          ref={listRef}
          className={`mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5 ${collapsed ? 'overflow-hidden' : ''}`}
          style={collapsed && clip ? { maxHeight: clip.height } : undefined}
        >
          {CATEGORIES.map((category, index) => {
            const hidden = collapsed && clip != null && index >= clip.hiddenFrom
            const Icon = ICONS[category.icon]
            const body = (
              <>
                <Icon className="h-7 w-7 text-navy" strokeWidth={1.25} aria-hidden />
                <span className="mt-4 font-display text-lg font-semibold tracking-tight text-slate-950">
                  {category.name}
                </span>
                <span className="mt-1.5 text-sm leading-snug text-slate-500">{category.tagline}</span>
                {prelaunch ? <span className="mt-4 text-sm font-semibold text-navy">{WAITLIST_CTA}</span> : null}
              </>
            )
            return (
              <li
                key={category.name}
                inert={hidden || undefined}
                aria-hidden={hidden || undefined}
                className={index === CATEGORIES.length - 3 ? 'lg:col-start-2' : undefined}
              >
                {prelaunch ? (
                  <Link
                    href={`/prelaunch?service=${encodeURIComponent(category.name)}#waitlist`}
                    className="flex h-full flex-col items-center rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center transition-colors hover:border-navy/30 hover:bg-sky focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="flex h-full flex-col items-center rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center">
                    {body}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
        {collapsed ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" aria-hidden />
        ) : null}
        </div>
        {prelaunch ? (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpanded((open) => !open)}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-navy transition-colors duration-150 hover:bg-sky focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
            >
              {expanded ? 'Show fewer' : 'Show all services'}
              <ChevronDown className={`h-4 w-4 transition-transform duration-150 ${expanded ? 'rotate-180' : ''}`} aria-hidden />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
