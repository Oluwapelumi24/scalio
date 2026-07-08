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
} from 'lucide-react'
import { CATEGORIES, type Category } from '@/lib/constants'
import { Reveal } from './Reveal'

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

export function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {CATEGORIES.map((cat, i) => {
        const Icon = ICONS[cat.icon]
        return (
          <Reveal key={cat.name} delay={i * 0.03}>
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3.5 shadow-sm shadow-slate-200/40 transition-transform hover:-translate-y-0.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Icon className="h-4 w-4" strokeWidth={2} />
              </div>
              <span className="text-sm font-medium text-slate-800">{cat.name}</span>
            </div>
          </Reveal>
        )
      })}
    </div>
  )
}
