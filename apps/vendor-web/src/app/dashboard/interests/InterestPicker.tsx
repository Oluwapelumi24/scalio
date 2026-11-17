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
    <div className="pb-44 md:pb-28">
      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.id}>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#7d818b]">{group.title}</h2>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {group.interests.map((interest) => {
                const on = selected.includes(interest.id)
                return (
                  <button
                    key={interest.id}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => toggle(interest.id)}
                    className={`keep-height relative flex min-h-16 w-full items-center rounded-2xl border-2 px-4 py-3 pr-14 text-left text-[15px] font-semibold leading-snug ${
                      on
                        ? 'border-[#1e3a8a] bg-[#e8edfa] text-[#1e3a8a]'
                        : 'border-[#e4e6eb] bg-white text-[#0a0a0a]'
                    }`}
                  >
                    <span className="min-w-0">{interest.label}</span>
                    <span
                      aria-hidden
                      className={`absolute right-4 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border-2 text-xs ${
                        on ? 'border-[#1e3a8a] bg-[#1e3a8a] text-white' : 'border-[#c9ced8] bg-white'
                      }`}
                    >
                      {on ? '✓' : ''}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      <div
        className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] z-30 border-t border-[#e4e6eb] bg-white/95 backdrop-blur md:bottom-0 md:left-60"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-8">
          <p className="text-xs leading-5 text-[#4a4e57]">You can change these choices anytime in Settings.</p>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex items-center gap-2">
            {welcome ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() => save(selected)}
                className="keep-height h-12 shrink-0 rounded-full px-4 text-sm font-semibold text-[#4a4e57]"
              >
                Skip
              </button>
            ) : null}
            <button
              type="button"
              disabled={isPending}
              onClick={() => save(selected)}
              className="h-12 min-w-0 flex-1 rounded-full bg-[#1e3a8a] px-6 text-sm font-semibold text-white disabled:opacity-50 md:flex-none"
            >
              {isPending ? 'Saving…' : selected.length > 0 ? `Continue (${selected.length})` : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
