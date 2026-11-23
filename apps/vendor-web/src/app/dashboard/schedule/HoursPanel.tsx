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
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <div className="min-w-0 rounded-[20px] bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold text-[#0a0a0a]">Business hours</h2>
        <p className="mt-1 text-sm leading-6 text-[#4a4e57]">
          {hours.length === 0
            ? 'You haven’t set opening hours yet. Tick the days you’re open and save — customers can only book inside these times.'
            : 'Set the days and times your business is open for bookings.'}
        </p>
        <div className="mt-5">
          <ScheduleHoursForm initialHours={hours} />
        </div>
      </div>

      <div className="min-w-0 rounded-[20px] bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold text-[#0a0a0a]">Blackout dates</h2>
        <p className="mt-1 text-sm leading-6 text-[#4a4e57]">
          Block specific dates when no bookings should be accepted (holidays, closures, etc.).
        </p>
        <div className="mt-5">
          <BlackoutDatesForm initialBlackouts={blackouts} />
        </div>
      </div>
    </div>
  )
}
