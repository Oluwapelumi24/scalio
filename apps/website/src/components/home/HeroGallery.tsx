'use client'

import { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const SLIDES = [
  {
    src: '/people/stylist.jpg',
    alt: 'A stylist drying a client’s hair',
    label: 'Hair',
    position: 'object-[62%_center]',
  },
  {
    src: '/listings/spa.jpg',
    alt: 'A therapist pouring oil during a massage',
    label: 'Spa',
    position: 'object-[center_35%]',
  },
  {
    src: '/listings/nails.jpg',
    alt: 'A hand with a black and tortoiseshell manicure',
    label: 'Nails',
    position: 'object-[center_62%]',
  },
  {
    src: '/people/barber.jpg',
    alt: 'A barber trimming a beard',
    label: 'Barbershop',
    position: 'object-[center_22%]',
  },
  {
    src: '/listings/trainer.jpg',
    alt: 'A trainer coaching a client through a push-up',
    label: 'Fitness',
    position: 'object-[center_42%]',
  },
  {
    src: '/listings/tailor.jpg',
    alt: 'A tailored green suit',
    label: 'Tailoring',
    position: 'object-[center_18%]',
  },
  {
    src: '/listings/laundry.jpg',
    alt: 'Folded knitwear ready for laundry',
    label: 'Laundry',
    position: 'object-[center_40%]',
  },
  {
    src: '/people/colour.jpg',
    alt: 'Long highlighted hair against a pink wall',
    label: 'Colour',
    position: 'object-[center_28%]',
  },
] as const

/**
 * Photo strip under the pre-launch hero. Two copies of the row let it loop
 * without a visible jump back to the start.
 */
export function HeroGallery() {
  const scroller = useRef<HTMLDivElement>(null)
  const hover = useRef(false)
  const holding = useRef(false)
  const reduced = useRef(false)
  const ignoreScroll = useRef(false)

  function metrics() {
    const el = scroller.current
    const card = el?.querySelector<HTMLElement>('[data-slide]')
    if (!el || !card) return null
    const gap = Number.parseFloat(getComputedStyle(el).columnGap || getComputedStyle(el).gap) || 16
    return { el, delta: card.offsetWidth + gap, setWidth: el.scrollWidth / 2 }
  }

  function normalize() {
    const current = metrics()
    if (!current || ignoreScroll.current) return
    if (current.el.scrollLeft >= current.setWidth) {
      ignoreScroll.current = true
      current.el.scrollLeft -= current.setWidth
      ignoreScroll.current = false
    }
  }

  function step(dir: 1 | -1) {
    const current = metrics()
    if (!current) return
    if (dir < 0 && current.el.scrollLeft < 2) {
      ignoreScroll.current = true
      current.el.scrollLeft = current.setWidth
      ignoreScroll.current = false
    }
    current.el.scrollBy({ left: dir * current.delta, behavior: reduced.current ? 'auto' : 'smooth' })
  }

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncMotion = () => {
      reduced.current = motion.matches
    }
    syncMotion()
    motion.addEventListener('change', syncMotion)

    const el = scroller.current
    let settle = 0
    const onScroll = () => {
      if (ignoreScroll.current) return
      window.clearTimeout(settle)
      settle = window.setTimeout(normalize, 160)
    }
    el?.addEventListener('scroll', onScroll, { passive: true })
    el?.addEventListener('scrollend', normalize)

    const timer = window.setInterval(() => {
      if (reduced.current || hover.current || holding.current || document.hidden) return
      step(1)
    }, 3200)

    return () => {
      motion.removeEventListener('change', syncMotion)
      el?.removeEventListener('scroll', onScroll)
      el?.removeEventListener('scrollend', normalize)
      window.clearTimeout(settle)
      window.clearInterval(timer)
    }
  }, [])

  return (
    <div
      className="relative mt-14"
      role="region"
      aria-roledescription="carousel"
      aria-label="Services on Veno"
      onMouseEnter={() => {
        hover.current = true
      }}
      onMouseLeave={() => {
        hover.current = false
      }}
      onFocus={() => {
        hover.current = true
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) hover.current = false
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') {
          event.preventDefault()
          step(1)
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault()
          step(-1)
        }
      }}
    >
      <div
        ref={scroller}
        className="flex gap-4 overflow-x-auto [scrollbar-width:none] [mask-image:linear-gradient(90deg,transparent,#000_5%,#000_95%,transparent)] [&::-webkit-scrollbar]:hidden"
        onPointerDown={() => {
          holding.current = true
        }}
        onPointerUp={() => {
          holding.current = false
        }}
        onPointerCancel={() => {
          holding.current = false
        }}
      >
        {[0, 1].map((copy) =>
          SLIDES.map((slide) => (
            <figure
              key={`${copy}-${slide.label}`}
              data-slide
              aria-hidden={copy === 1 || undefined}
              className="relative aspect-[3/2] w-[min(78vw,340px)] shrink-0 overflow-hidden rounded-[1.35rem] shadow-[0_16px_40px_rgba(15,23,42,0.14)] sm:w-[380px]"
            >
              <img src={slide.src} alt={copy === 1 ? '' : slide.alt} className={`absolute inset-0 h-full w-full object-cover ${slide.position}`} />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent px-4 pb-4 pt-16">
                <span className="font-display text-lg font-semibold tracking-tight text-white">{slide.label}</span>
              </figcaption>
            </figure>
          )),
        )}
      </div>

      <button
        type="button"
        aria-label="Previous photo"
        onClick={() => step(-1)}
        className="absolute left-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-950 shadow-[0_8px_24px_rgba(15,23,42,0.16)] ring-1 ring-black/5 transition-transform duration-150 ease-out active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy motion-reduce:transition-none motion-reduce:active:scale-100 sm:left-5"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden />
      </button>
      <button
        type="button"
        aria-label="Next photo"
        onClick={() => step(1)}
        className="absolute right-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-950 shadow-[0_8px_24px_rgba(15,23,42,0.16)] ring-1 ring-black/5 transition-transform duration-150 ease-out active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy motion-reduce:transition-none motion-reduce:active:scale-100 sm:right-5"
      >
        <ChevronRight className="h-5 w-5" aria-hidden />
      </button>
    </div>
  )
}
