'use client'

import { useState, useTransition } from 'react'
import { resetHomeLayout, setHiddenModules, setPinnedModules } from '@/app/actions/personalisation'
import type { HomeLayer } from '@/lib/personalisation'

export interface CustomiseRow { id: string; layer: HomeLayer; title: string }

const LAYER_TITLES: Partial<Record<HomeLayer, string>> = {
  overview: 'Business overview',
  quick_action: 'Quick actions',
  recommendation: 'Suggestions',
}

export function CustomiseList({
  rows,
  pinned: initialPinned,
  hidden: initialHidden,
}: {
  rows: CustomiseRow[]
  pinned: string[]
  hidden: string[]
}) {
  const [pinned, setPinned] = useState(initialPinned)
  const [hidden, setHidden] = useState(initialHidden)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Mirrors the backend rule: pinning un-hides, hiding un-pins.
  const togglePin = (id: string) => {
    const next = pinned.includes(id) ? pinned.filter((m) => m !== id) : [...pinned, id]
    setPinned(next)
    setHidden((h) => h.filter((m) => !next.includes(m)))
    startTransition(async () => {
      const r = await setPinnedModules(next)
      if (r) setError(r.error)
    })
  }

  const toggleHidden = (id: string) => {
    const next = hidden.includes(id) ? hidden.filter((m) => m !== id) : [...hidden, id]
    setHidden(next)
    setPinned((p) => p.filter((m) => !next.includes(m)))
    startTransition(async () => {
      const r = await setHiddenModules(next)
      if (r) setError(r.error)
    })
  }

  const reset = () => {
    if (!confirm('Reset your home screen? Pins, hidden items and learned order will be cleared. Your interests stay.')) return
    setPinned([])
    setHidden([])
    startTransition(async () => {
      const r = await resetHomeLayout()
      if (r) setError(r.error)
    })
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {(Object.keys(LAYER_TITLES) as HomeLayer[]).map((layer) => {
        const items = rows.filter((r) => r.layer === layer)
        if (items.length === 0) return null
        return (
          <section key={layer}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{LAYER_TITLES[layer]}</h2>
            <ul className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {items.map((row) => {
                const isPinned = pinned.includes(row.id)
                const isHidden = hidden.includes(row.id)
                return (
                  <li key={row.id} className="flex items-center gap-3 px-4 py-3">
                    <span className={`flex-1 text-sm ${isHidden ? 'text-gray-400' : 'text-gray-900'}`}>{row.title}</span>
                    <button
                      type="button"
                      onClick={() => togglePin(row.id)}
                      disabled={isPending}
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        isPinned ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {isPinned ? 'Pinned' : 'Pin'}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleHidden(row.id)}
                      disabled={isPending}
                      className="w-14 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      {isHidden ? 'Show' : 'Hide'}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
      <button type="button" onClick={reset} disabled={isPending} className="text-sm font-medium text-red-600 hover:text-red-800">
        Reset home screen
      </button>
    </div>
  )
}
