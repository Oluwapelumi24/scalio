import { Dumbbell, Eye, Flower2, Gem, HeartHandshake, Palette, PersonStanding, Ruler, Scissors, Shirt, Sparkles, SprayCan, Stethoscope, Wind } from 'lucide-react'
import { CATEGORIES, type Category } from '@/lib/constants'

export const CATEGORY_ICONS: Record<Category['icon'], typeof Scissors> = {
  scissors: Scissors, wind: Wind, sparkles: Sparkles, gem: Gem, palette: Palette, flower: Flower2,
  'heart-handshake': HeartHandshake, eye: Eye, shirt: Shirt, spray: SprayCan,
  ruler: Ruler, dumbbell: Dumbbell, stethoscope: Stethoscope, 'person-standing': PersonStanding,
}

/**
 * An endless strip of what you can book, in a soft rounded band. Where other
 * sites put client logos, we show the categories themselves.
 */
export function CategoryMarquee({ flush = false }: { flush?: boolean }) {
  const row = [...CATEGORIES, ...CATEGORIES]
  return (
    <section
      id="categories"
      aria-label="Categories on Veno"
      className={`relative z-10 bg-white px-4 pb-6 sm:px-6 ${flush ? 'pt-2 sm:pt-4' : 'pt-10 sm:pt-12'}`}
    >
      <div className="relative mx-auto max-w-6xl overflow-hidden py-7 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        <ul className="animate-marquee flex w-max items-center gap-10 pr-10">
          {row.map((c, i) => {
            const Icon = CATEGORY_ICONS[c.icon]
            return (
              <li key={`${c.name}-${i}`} aria-hidden={i >= CATEGORIES.length} className="flex shrink-0 items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full text-white" style={{ background: `linear-gradient(135deg, ${c.gradient[0]}, ${c.gradient[1]})` }}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-display text-xl font-semibold tracking-tight text-slate-800">{c.name}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
