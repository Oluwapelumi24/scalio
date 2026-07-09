'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Scissors,
  Wind,
  Sparkles,
  Gem,
  Palette,
  Flower2,
  HeartHandshake,
  Eye,
  Camera,
  Shirt,
  SprayCan,
  Video,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { CATEGORIES, type Category } from '@/lib/constants'

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
}

// Four hand-placed blob layouts, cycled by index, so consecutive slides never
// repeat the same composition while staying fully deterministic (no
// Math.random — this renders on the server too, and random values there
// would mismatch the client on hydration).
const BLOB_LAYOUTS = [
  { a: { top: '-15%', right: '-10%', size: '55%' }, b: { bottom: '-20%', left: '-10%', size: '50%' } },
  { a: { top: '-20%', left: '5%', size: '45%' }, b: { bottom: '-15%', right: '0%', size: '60%' } },
  { a: { bottom: '-10%', left: '-15%', size: '55%' }, b: { top: '-10%', right: '10%', size: '45%' } },
  { a: { top: '10%', right: '-15%', size: '50%' }, b: { bottom: '-25%', left: '15%', size: '55%' } },
]

const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`,
)}")`

const AUTO_ADVANCE_MS = 5500

export function CategoryCarousel() {
  const [[index, direction], setState] = useState<[number, number]>([0, 0])
  const pausedRef = useRef(false)
  const count = CATEGORIES.length

  const goTo = useCallback(
    (next: number, dir: number) => {
      setState([((next % count) + count) % count, dir])
    },
    [count],
  )

  useEffect(() => {
    const id = setInterval(() => {
      if (!pausedRef.current) goTo(index + 1, 1)
    }, AUTO_ADVANCE_MS)
    return () => clearInterval(id)
  }, [index, goTo])

  const category = CATEGORIES[index]
  const Icon = ICONS[category.icon]
  const [from, to] = category.gradient
  const blobs = BLOB_LAYOUTS[index % BLOB_LAYOUTS.length]

  return (
    <div
      className="group/carousel relative"
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
      onFocus={() => (pausedRef.current = true)}
      onBlur={() => (pausedRef.current = false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Service categories"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') goTo(index + 1, 1)
        if (e.key === 'ArrowLeft') goTo(index - 1, -1)
      }}
    >
      <div className="relative h-[380px] overflow-hidden rounded-3xl shadow-xl shadow-slate-900/15 sm:h-[440px] lg:h-[520px]">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={category.name}
            custom={direction}
            initial={{ x: direction >= 0 ? '100%' : '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction >= 0 ? '-100%' : '100%', opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
            >
              <div
                className="absolute rounded-full bg-white/25 blur-3xl mix-blend-overlay"
                style={{ top: blobs.a.top, right: blobs.a.right, left: blobs.a.left, bottom: blobs.a.bottom, width: blobs.a.size, height: blobs.a.size }}
              />
              <div
                className="absolute rounded-full bg-black/25 blur-3xl mix-blend-overlay"
                style={{ top: blobs.b.top, right: blobs.b.right, left: blobs.b.left, bottom: blobs.b.bottom, width: blobs.b.size, height: blobs.b.size }}
              />
              <div
                className="absolute inset-0 opacity-70 mix-blend-overlay"
                style={{ backgroundImage: GRAIN }}
              />
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/5" />

            <div className="absolute top-5 left-5 inline-flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-2 shadow-sm backdrop-blur-sm">
              <Icon className="h-4 w-4 text-slate-900" strokeWidth={2.25} />
              <span className="text-xs font-semibold text-slate-900">{category.name}</span>
            </div>

            <div className="absolute top-5 right-5 rounded-full bg-black/25 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
              {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
            </div>

            <div className="absolute inset-x-6 bottom-6 sm:inset-x-8 sm:bottom-8">
              <h3 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                {category.name}
              </h3>
              <p className="mt-2 max-w-md text-sm text-white/80 sm:text-base">{category.tagline}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        <button
          type="button"
          onClick={() => goTo(index - 1, -1)}
          aria-label="Previous category"
          className="absolute top-1/2 left-4 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm transition-colors hover:bg-black/45"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => goTo(index + 1, 1)}
          aria-label="Next category"
          className="absolute top-1/2 right-4 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm transition-colors hover:bg-black/45"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-center gap-1.5">
        {CATEGORIES.map((cat, i) => (
          <button
            key={cat.name}
            type="button"
            onClick={() => goTo(i, i > index ? 1 : -1)}
            aria-label={`Go to ${cat.name}`}
            aria-current={i === index}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? 'w-6 bg-indigo-600' : 'w-1.5 bg-slate-200 hover:bg-slate-300'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
