'use client'

import { useActionState, useTransition } from 'react'
import { addStaffTimeOff, removeStaffTimeOff } from '@/app/actions/staff-schedule'
import type { TimeOff as TimeOffRow } from '@/lib/staff'

export function TimeOff({ staffId, items, canEdit }: { staffId: string; items: TimeOffRow[]; canEdit: boolean }) {
  const [state, formAction, adding] = useActionState(addStaffTimeOff.bind(null, staffId), null)
  const [removing, startRemove] = useTransition()

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">No time off coming up.</p>
      ) : (
        <ul className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {items.map((t) => (
            <li key={t.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <span>
                <span className="font-medium text-gray-900">
                  {t.startDate}
                  {t.endDate !== t.startDate ? ` → ${t.endDate}` : ''}
                </span>
                {t.reason && <span className="ml-2 text-gray-500">{t.reason}</span>}
              </span>
              {canEdit && (
                <button
                  type="button"
                  disabled={removing}
                  onClick={() => startRemove(async () => void (await removeStaffTimeOff(staffId, t.id)))}
                  className="text-xs font-medium text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canEdit && (
        <form action={formAction} className="flex flex-wrap items-end gap-3 bg-white rounded-xl border border-gray-200 px-5 py-4">
          <label className="text-xs text-gray-500">
            From
            <input type="date" name="startDate" required className="mt-1 block rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900" />
          </label>
          <label className="text-xs text-gray-500">
            To (optional)
            <input type="date" name="endDate" className="mt-1 block rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900" />
          </label>
          <label className="flex-1 min-w-40 text-xs text-gray-500">
            Reason (optional)
            <input type="text" name="reason" maxLength={200} className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900" />
          </label>
          <button type="submit" disabled={adding} className="rounded-lg border border-indigo-600 px-4 py-1.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 disabled:opacity-50">
            Add time off
          </button>
          {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
        </form>
      )}
    </div>
  )
}
