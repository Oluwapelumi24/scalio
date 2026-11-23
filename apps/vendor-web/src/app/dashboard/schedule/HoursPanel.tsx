import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { ScheduleHoursForm } from './ScheduleHoursForm'
import { BlackoutDatesForm } from './BlackoutDatesForm'

interface HoursEntry {
  id: string
  dayOfWeek: number
  opensAtMinutes: number
  closesAtMinutes: number
}

interface BlackoutDate {
  id: string
  date: string
  reason: string | null
}

export async function HoursPanel() {
  const token = await requireToken()

  let hours: HoursEntry[] = []
  let blackouts: BlackoutDate[] = []

  try {
    ;[hours, blackouts] = await Promise.all([
      apiFetch<HoursEntry[]>('/vendor-admin/schedule/hours', token),
      apiFetch<BlackoutDate[]>('/vendor-admin/schedule/blackout-dates', token),
    ])
  } catch {
    /* show empty state */
  }

  return (
    <div className="grid max-w-5xl items-start gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-1 text-sm font-semibold text-gray-900">Business hours</h2>
        <p className="mb-4 text-xs text-gray-500">
          {hours.length === 0
            ? 'You haven’t set opening hours yet. Tick the days you’re open and save — customers can only book inside these times.'
            : 'Set the days and times your business is open for bookings.'}
        </p>
        <ScheduleHoursForm initialHours={hours} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-1 text-sm font-semibold text-gray-900">Blackout dates</h2>
        <p className="mb-4 text-xs text-gray-500">
          Block specific dates when no bookings should be accepted (holidays, closures, etc.).
        </p>
        <BlackoutDatesForm initialBlackouts={blackouts} />
      </div>
    </div>
  )
}
