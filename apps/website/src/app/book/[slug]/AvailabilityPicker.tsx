'use client'

import { useState, useTransition } from 'react'
import { getAvailability } from '@/app/actions/availability'
import { formatDuration, formatNaira, type PublicService } from '@/lib/booking-page'

function nextDays(timeZone: string, count: number) {
  const fmtDate = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
  const fmtLabel = new Intl.DateTimeFormat('en-NG', { timeZone, weekday: 'short', day: 'numeric', month: 'short' })
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.now() + i * 86_400_000)
    return { value: fmtDate.format(d), label: i === 0 ? 'Today' : fmtLabel.format(d) }
  })
}

export function AvailabilityPicker({
  vendorId,
  businessName,
  timezone,
  services,
}: {
  vendorId: string
  businessName: string
  timezone: string
  services: PublicService[]
}) {
  const days = nextDays(timezone, 7)
  const [selected, setSelected] = useState<string[]>([])
  const [date, setDate] = useState(days[0].value)
  const [slots, setSlots] = useState<string[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const timeFmt = new Intl.DateTimeFormat('en-NG', { timeZone: timezone, hour: 'numeric', minute: '2-digit' })
  const chosen = services.filter((s) => selected.includes(s.id))
  const total = chosen.reduce((sum, s) => sum + s.priceKobo, 0)
  const duration = chosen.reduce((sum, s) => sum + s.durationMinutes, 0)

  function check(nextDate = date, nextSelected = selected) {
    setError(null)
    startTransition(async () => {
      const res = await getAvailability(vendorId, nextDate, nextSelected)
      if ('error' in res) {
        setError(res.error)
        setSlots(null)
      } else setSlots(res.slots)
    })
  }

  function toggle(id: string) {
    const next = selected.includes(id) ? selected.filter((v) => v !== id) : [...selected, id]
    setSelected(next)
    if (slots) check(date, next)
  }

  function pickDate(value: string) {
    setDate(value)
    check(value)
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-bold text-slate-900">Services</h2>
        {services.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">{businessName} hasn&apos;t listed any services yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
            {services.map((s) => {
              const on = selected.includes(s.id)
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => toggle(s.id)}
                    className={`flex w-full items-center gap-4 px-5 py-4 text-left transition-colors ${on ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                  >
                    <span
                      aria-hidden
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-[10px] ${on ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'}`}
                    >
                      {on ? '✓' : ''}
                    </span>
                    <span className="flex-1">
                      <span className="block font-medium text-slate-900">{s.name}</span>
                      <span className="block text-sm text-slate-500">{formatDuration(s.durationMinutes)}</span>
                    </span>
                    <span className="font-semibold text-slate-900">{formatNaira(s.priceKobo)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold text-slate-900">Available times</h2>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {days.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => pickDate(d.value)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${
                slots !== null && date === d.value
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
          {isPending ? (
            <p className="text-sm text-slate-500">Checking times…</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : slots === null ? (
            <p className="text-sm text-slate-500">Pick a day to see open times{selected.length === 0 ? ' (choose services first for an exact fit)' : ''}.</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-slate-500">No open times on this day. Try another day.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((iso) => (
                <span key={iso} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700">
                  {timeFmt.format(new Date(iso))}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {chosen.length > 0 && (
        <div className="rounded-2xl bg-slate-900 p-5 text-white">
          <p className="text-sm text-white/60">Your selection</p>
          <p className="mt-1 text-lg font-semibold">
            {formatNaira(total)} · {formatDuration(duration)}
          </p>
          {/* Online booking from this page needs guest checkout, which isn't built yet.
              Say so plainly rather than offering a button that can't complete. */}
          <p className="mt-3 text-sm text-white/70">
            Booking straight from this page is coming soon. For now, book in the Scalio app or contact {businessName}.
          </p>
        </div>
      )}
    </div>
  )
}
