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

export default async function SchedulePage() {
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
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Business hours</h2>
        <p className="text-xs text-gray-500 mb-4">Set the days and times your business is open for bookings.</p>
        <ScheduleHoursForm initialHours={hours} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Blackout dates</h2>
        <p className="text-xs text-gray-500 mb-4">
          Block specific dates when no bookings should be accepted (holidays, closures, etc.).
        </p>
        <BlackoutDatesForm initialBlackouts={blackouts} />
      </div>
    </div>
  )
}
