'use client'

import { useRouter } from 'next/navigation'
import { DESIGN_COOKIE, type DesignMode } from '@/lib/design-mode'

const YEAR = 60 * 60 * 24 * 365

const OPTIONS: { value: DesignMode; label: string }[] = [
  { value: 'prelaunch', label: 'Pre-launch' },
  { value: 'launch', label: 'Launch' },
]

/** Temporary corner control for comparing the two marketing designs. */
export function DesignSwitch({ mode }: { mode: DesignMode }) {
  const router = useRouter()

  function choose(next: DesignMode) {
    if (next === mode) return
    document.cookie = `${DESIGN_COOKIE}=${next}; path=/; max-age=${YEAR}; samesite=lax`
    router.refresh()
  }

  return (
    <div className="fixed bottom-4 right-4 z-[80] sm:bottom-6 sm:right-6">
      <div
        role="group"
        aria-label="Preview design"
        className="flex items-center gap-1 rounded-full bg-white p-1.5 shadow-[0_10px_30px_rgba(15,23,42,0.18)] ring-1 ring-slate-200"
      >
        {OPTIONS.map(({ value, label }) => {
          const on = mode === value
          return (
            <button
              key={value}
              type="button"
              aria-pressed={on}
              onClick={() => choose(value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                on ? 'bg-navy text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
