'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { CATEGORIES, type Category } from '@/lib/constants'
import { CATEGORY_ICONS } from './CategoryMarquee'

const AUTO_SCROLL_MS = 2000
const COUNT = CATEGORIES.length
// Copies of the first cards after the last one, so the carousel can keep moving
// forward and jump back to the real cards without anyone seeing it rewind.
const COPIES = CATEGORIES.slice(0, 2)

function ServiceCard({ category: c, copy = false, onHover }: { category: Category; copy?: boolean; onHover: (hovering: boolean) => void }) {
  const Icon = CATEGORY_ICONS[c.icon]
  const Heading = copy ? 'p' : 'h3'
  return (
    <li
      aria-hidden={copy || undefined}
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') onHover(true)
      }}
      onPointerLeave={() => onHover(false)}
      className="w-[85%] shrink-0 snap-start sm:w-[60%] lg:w-full"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white">
        <div className="relative h-44 overflow-hidden lg:h-56" style={{ background: `linear-gradient(135deg, ${c.gradient[0]}, ${c.gradient[1]})` }}>
          <Icon className="absolute -bottom-8 -right-6 h-48 w-48 text-white/15 lg:h-60 lg:w-60" strokeWidth={1.25} aria-hidden />
          <span className="absolute left-6 top-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm">
            <Icon className="h-6 w-6" aria-hidden />
          </span>
          <span className="absolute bottom-6 left-6 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-900">{c.tagline}</span>
        </div>
        <div className="flex flex-1 flex-col p-6 lg:p-8">
          <Heading className="font-display text-2xl font-semibold leading-tight tracking-tight text-slate-900">{c.heading}</Heading>
          <p className="mt-3 flex-1 text-base leading-relaxed text-slate-600">{c.description}</p>
          <a href="#waitlist" tabIndex={copy ? -1 : undefined} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-navy hover:underline">
            Get early access <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </article>
    </li>
  )
}

/**
 * What you can book, one service at a time. It moves on by itself and pauses
 * while the mouse is on a card. Every card is always in the page, so all the
 * wording stays readable by search engines.
 */
export function ServicesDirectory() {
  const [slide, setSlide] = useState(0)
  const [onScreen, setOnScreen] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [focused, setFocused] = useState(false)
  const [touching, setTouching] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLUListElement>(null)
  // While the carousel scrolls to a chosen card, ignore where it is on the way.
  const target = useRef<number | null>(null)
  const targetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const paused = !onScreen || hovering || focused || touching

  const cardStep = useCallback(() => {
    const el = track.current
    if (!el || el.children.length < 2) return 0
    return (el.children[1] as HTMLElement).offsetLeft - (el.children[0] as HTMLElement).offsetLeft
  }, [])

  const move = useCallback(
    (by: number) => {
      const el = track.current
      const distance = cardStep()
      if (!el || !distance) return
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      let from = Math.round(el.scrollLeft / distance)
      // Going back from the first card: start from its copy past the end.
      if (from + by < 0) {
        from = COUNT
        el.scrollTo({ left: from * distance, behavior: 'instant' })
      }
      const to = from + by
      const logical = to % COUNT
      target.current = logical
      clearTimeout(targetTimer.current)
      targetTimer.current = setTimeout(() => {
        target.current = null
      }, 800)
      setSlide(logical)
      el.scrollTo({ left: to * distance, behavior: reduce ? 'auto' : 'smooth' })
    },
    [cardStep],
  )

  function onScroll() {
    const el = track.current
    const distance = cardStep()
    if (!el || !distance) return
    const nearest = Math.round(el.scrollLeft / distance)
    if (target.current !== null) {
      if (nearest % COUNT === target.current) target.current = null
    } else {
      setSlide(nearest % COUNT)
    }
    // Once it stops on a copy, swap to the real card. They look identical.
    clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(() => {
      const at = Math.round(el.scrollLeft / distance)
      if (at >= COUNT) el.scrollTo({ left: (at - COUNT) * distance, behavior: 'instant' })
    }, 150)
  }

  useEffect(() => {
    const el = root.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.35 })
    observer.observe(el)
    return () => {
      observer.disconnect()
      clearTimeout(targetTimer.current)
      clearTimeout(settleTimer.current)
    }
  }, [])

  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setTimeout(() => move(1), AUTO_SCROLL_MS)
    return () => clearTimeout(timer)
  }, [paused, slide, move])

  const arrowClass = 'flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:border-navy hover:bg-navy hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy'

  return (
    <section id="services" aria-labelledby="services-title" className="scroll-mt-20 overflow-hidden bg-white px-6 py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 id="services-title" className="font-display text-4xl font-bold leading-[1.04] tracking-tight text-slate-900 sm:text-5xl">
            Book local services near you
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-600">
            From your weekly laundry to a Pilates class or a bridal makeup artist, find a reviewed business and book a time that is really free.
          </p>
        </div>

        <div
          ref={root}
          className="min-w-0"
          onFocus={(e) => {
            if (e.target.matches(':focus-visible')) setFocused(true)
          }}
          onBlur={() => setFocused(false)}
          onTouchStart={() => setTouching(true)}
          onTouchEnd={() => setTouching(false)}
          onTouchCancel={() => setTouching(false)}
        >
          <ul
            ref={track}
            onScroll={onScroll}
            aria-label="Services you can book"
            className="relative -mx-6 flex snap-x snap-mandatory scroll-px-6 gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:none] lg:mx-0 lg:scroll-px-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
          >
            {CATEGORIES.map((c) => (
              <ServiceCard key={c.name} category={c} onHover={setHovering} />
            ))}
            {COPIES.map((c) => (
              <ServiceCard key={`copy-${c.name}`} category={c} copy onHover={setHovering} />
            ))}
          </ul>

          <div className="mt-5 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              {slide + 1} of {COUNT}: <span className="text-slate-900">{CATEGORIES[slide].name}</span>
            </p>
            <div className="flex gap-2">
              <button type="button" aria-label="Previous service" onClick={() => move(-1)} className={arrowClass}>
                <ChevronLeft className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </button>
              <button type="button" aria-label="Next service" onClick={() => move(1)} className={arrowClass}>
                <ChevronRight className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
