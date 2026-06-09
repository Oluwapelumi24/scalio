'use client'

import { useState, useTransition } from 'react'
import { setBusinessHours } from '@/app/actions/schedule'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface HoursEntry {
  dayOfWeek: number
  opensAtMinutes: number
  closesAtMinutes: number
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60).toString().padStart(2, '0')
  const min = (m % 60).toString().padStart(2, '0')
  return `${h}:${min}`
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m ?? 0)
}

interface DayState {
  enabled: boolean
  opens: string
  closes: string
}

function buildInitial(entries: HoursEntry[]): DayState[] {
  const map = new Map(entries.map((e) => [e.dayOfWeek, e]))
  return DAYS.map((_, i) => {
    const e = map.get(i)
    return e
      ? { enabled: true, opens: minutesToTime(e.opensAtMinutes), closes: minutesToTime(e.closesAtMinutes) }
      : { enabled: false, opens: '09:00', closes: '17:00' }
  })
}

export function ScheduleHoursForm({ initialHours }: { initialHours: HoursEntry[] }) {
  const [days, setDays] = useState<DayState[]>(() => buildInitial(initialHours))
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const update = (i: number, patch: Partial<DayState>) =>
    setDays((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)))

  const handleSave = () => {
    setError(null)
    setSuccess(false)
    const payload = days
      .map((d, i) => ({ ...d, dayOfWeek: i }))
      .filter((d) => d.enabled)
      .map((d) => ({
        dayOfWeek: d.dayOfWeek,
        opensAtMinutes: timeToMinutes(d.opens),
        closesAtMinutes: timeToMinutes(d.closes),
      }))

    startTransition(async () => {
      const result = await setBusinessHours(payload)
      if (result?.error) setError(result.error)
      else setSuccess(true)
    })
  }

  return (
    <div>
      <div className="space-y-2">
        {DAYS.map((dayName, i) => (
          <div key={i} className="flex items-center gap-3">
            <label className="flex items-center gap-2 w-32">
              <input
                type="checkbox"
                checked={days[i].enabled}
                onChange={(e) => update(i, { enabled: e.target.checked })}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">{dayName}</span>
            </label>

            {days[i].enabled ? (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={days[i].opens}
                  onChange={(e) => update(i, { opens: e.target.value })}
                  className="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-gray-400 text-sm">to</span>
                <input
                  type="time"
                  value={days[i].closes}
                  onChange={(e) => update(i, { closes: e.target.value })}
                  className="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            ) : (
              <span className="text-sm text-gray-400">Closed</span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {isPending ? 'Saving…' : 'Save hours'}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">Saved!</p>}
      </div>
    </div>
  )
}
