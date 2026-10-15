'use client'

import { useState, useTransition } from 'react'
import { saveStaffSchedule } from '@/app/actions/staff-schedule'
import { minutesToTime, timeToMinutes, type StaffDay } from '@/lib/staff'

const DAYS = [1, 2, 3, 4, 5, 6, 0]
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface Row { working: boolean; start: string; end: string; hasBreak: boolean; breakStart: string; breakEnd: string }

function toRows(days: StaffDay[]): Record<number, Row> {
  return Object.fromEntries(
    DAYS.map((d) => {
      const r = days.find((x) => x.dayOfWeek === d)
      return [
        d,
        r
          ? {
              working: true,
              start: minutesToTime(r.startsAtMinutes),
              end: minutesToTime(r.endsAtMinutes),
              hasBreak: r.breakStartsAtMinutes != null,
              breakStart: minutesToTime(r.breakStartsAtMinutes ?? 780),
              breakEnd: minutesToTime(r.breakEndsAtMinutes ?? 840),
            }
          : { working: false, start: '09:00', end: '17:00', hasBreak: false, breakStart: '13:00', breakEnd: '14:00' },
      ]
    }),
  )
}

export function ScheduleEditor({ staffId, initial, canEdit }: { staffId: string; initial: StaffDay[]; canEdit: boolean }) {
  const [rows, setRows] = useState(() => toRows(initial))
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const update = (d: number, patch: Partial<Row>) => setRows((prev) => ({ ...prev, [d]: { ...prev[d], ...patch } }))
  const anyWorking = DAYS.some((d) => rows[d].working)

  const save = () =>
    startTransition(async () => {
      const days: StaffDay[] = DAYS.filter((d) => rows[d].working).map((d) => ({
        dayOfWeek: d,
        startsAtMinutes: timeToMinutes(rows[d].start),
        endsAtMinutes: timeToMinutes(rows[d].end),
        breakStartsAtMinutes: rows[d].hasBreak ? timeToMinutes(rows[d].breakStart) : null,
        breakEndsAtMinutes: rows[d].hasBreak ? timeToMinutes(rows[d].breakEnd) : null,
      }))
      const result = await saveStaffSchedule(staffId, days)
      setMessage(result ? { ok: false, text: result.error } : { ok: true, text: 'Saved. New bookings will follow these hours.' })
    })

  const input = 'rounded-md border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-50'

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <p className="px-5 pt-4 text-sm text-gray-500">
        {anyWorking
          ? 'Customers can only book this person on the days and times below.'
          : 'No days set — this person can be booked whenever the business is open.'}
      </p>
      <ul className="divide-y divide-gray-100 mt-2">
        {DAYS.map((d) => {
          const r = rows[d]
          return (
            <li key={d} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
              <label className="flex w-36 items-center gap-2 text-sm font-medium text-gray-900">
                <input type="checkbox" checked={r.working} disabled={!canEdit} onChange={(e) => update(d, { working: e.target.checked })} />
                {DAY_NAMES[d]}
              </label>
              {r.working ? (
                <>
                  <span className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="time" step={1800} className={input} value={r.start} disabled={!canEdit} onChange={(e) => update(d, { start: e.target.value })} aria-label={`${DAY_NAMES[d]} start`} />
                    to
                    <input type="time" step={1800} className={input} value={r.end} disabled={!canEdit} onChange={(e) => update(d, { end: e.target.value })} aria-label={`${DAY_NAMES[d]} end`} />
                  </span>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={r.hasBreak} disabled={!canEdit} onChange={(e) => update(d, { hasBreak: e.target.checked })} />
                    Break
                  </label>
                  {r.hasBreak && (
                    <span className="flex items-center gap-2 text-sm text-gray-600">
                      <input type="time" step={1800} className={input} value={r.breakStart} disabled={!canEdit} onChange={(e) => update(d, { breakStart: e.target.value })} aria-label={`${DAY_NAMES[d]} break start`} />
                      to
                      <input type="time" step={1800} className={input} value={r.breakEnd} disabled={!canEdit} onChange={(e) => update(d, { breakEnd: e.target.value })} aria-label={`${DAY_NAMES[d]} break end`} />
                    </span>
                  )}
                </>
              ) : (
                <span className="text-sm text-gray-400">Day off</span>
              )}
            </li>
          )
        })}
      </ul>
      {canEdit && (
        <div className="flex items-center gap-3 border-t border-gray-100 px-5 py-3">
          <button
            type="button"
            onClick={save}
            disabled={isPending}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isPending ? 'Saving…' : 'Save working hours'}
          </button>
          {message && <p className={`text-sm ${message.ok ? 'text-green-700' : 'text-red-600'}`}>{message.text}</p>}
        </div>
      )}
    </div>
  )
}
