'use client'

import { useState, useTransition } from 'react'
import { saveInterests } from '@/app/actions/personalisation'
import type { InterestGroup } from '@/lib/personalisation'

export function InterestPicker({
  groups,
  initial,
  welcome,
}: {
  groups: InterestGroup[]
  initial: string[]
  welcome: boolean
}) {
  const [selected, setSelected] = useState<string[]>(initial)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]))

  const save = (interests: string[]) =>
    startTransition(async () => {
      const result = await saveInterests(interests)
      if (result) setError(result.error)
    })

  return (
    <div className="pb-28">
      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.id}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">{group.title}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              {group.interests.map((interest) => {
                const on = selected.includes(interest.id)
                return (
                  <button
                    key={interest.id}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => toggle(interest.id)}
                    className={`relative min-h-24 rounded-xl border-2 p-4 text-left text-sm font-medium transition-colors ${
                      on
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-800'
                        : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300'
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full border-2 text-[10px] ${
                        on ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300'
                      }`}
                    >
                      {on ? '✓' : ''}
                    </span>
                    <span className="block pr-6">{interest.label}</span>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Stays reachable however far the list scrolls */}
      <div className="fixed bottom-0 left-56 right-0 border-t border-gray-200 bg-white/95 backdrop-blur px-8 py-4">
        <div className="flex items-center justify-between gap-4 max-w-6xl">
          <p className="text-xs text-gray-500">You can change these choices anytime in Settings.</p>
          <div className="flex items-center gap-3">
            {error && <p className="text-sm text-red-600">{error}</p>}
            {welcome && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => save(selected)}
                className="text-sm font-medium text-gray-500 hover:text-gray-800"
              >
                Skip
              </button>
            )}
            <button
              type="button"
              disabled={isPending}
              onClick={() => save(selected)}
              className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {isPending ? 'Saving…' : selected.length > 0 ? `Continue (${selected.length})` : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
