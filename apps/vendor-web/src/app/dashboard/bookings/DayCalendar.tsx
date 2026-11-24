import Link from 'next/link'

export interface CalendarBooking {
  id: string
  status: string
  scheduledAt: string
  durationMinutes: number
  customer: { id: string; name: string; email: string | null } | null
  staff: { id: string; name: string } | null
  services: { id: string; name: string; priceKobo: number }[]
}

export interface CalendarStaff {
  id: string
  name: string
}

const HOUR_START = 7
const HOUR_END = 21
const PX_PER_MIN = 1.1

const STATUS_TINT: Record<string, string> = {
  pending_payment: 'border-amber-300 bg-amber-50 text-amber-950',
  confirmed: 'border-[#c7d2fe] bg-[#e8edfa] text-[#1e3a8a]',
  completed: 'border-[#bbf7d0] bg-[#e7f6ee] text-[#166534]',
  cancelled_by_customer: 'border-gray-200 bg-gray-50 text-gray-500 line-through',
  cancelled_by_vendor: 'border-gray-200 bg-gray-50 text-gray-500 line-through',
  no_show: 'border-gray-200 bg-gray-50 text-gray-500',
}

function serviceLabel(booking: CalendarBooking) {
  if (!booking.services.length) return 'Service'
  if (booking.services.length === 1) return booking.services[0].name
  return `${booking.services[0].name} +${booking.services.length - 1}`
}

function minutesFromMidnight(iso: string) {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

function formatHour(hour: number) {
  const d = new Date()
  d.setHours(hour, 0, 0, 0)
  return d.toLocaleTimeString('en-NG', { hour: 'numeric' })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' })
}

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function shiftDate(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  return isoDate(d)
}

function labelForDay(iso: string) {
  const d = new Date(`${iso}T12:00:00`)
  const today = isoDate(new Date())
  if (iso === today) return 'Today'
  const tomorrow = shiftDate(today, 1)
  if (iso === tomorrow) return 'Tomorrow'
  return d.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })
}

/** Staff-column day board — industry calendar default for salon ops. */
export function DayCalendar({
  date,
  staff,
  bookings,
}: {
  date: string
  staff: CalendarStaff[]
  bookings: CalendarBooking[]
}) {
  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)
  const gridHeight = (HOUR_END - HOUR_START) * 60 * PX_PER_MIN
  const hasUnassigned = bookings.some((b) => !b.staff?.id)
  const columns: CalendarStaff[] =
    staff.length > 0
      ? [...staff, ...(hasUnassigned ? [{ id: '_unassigned', name: 'Unassigned' }] : [])]
      : [{ id: '_unassigned', name: 'Bookings' }]

  const byStaff = new Map<string, CalendarBooking[]>()
  for (const col of columns) byStaff.set(col.id, [])
  for (const booking of bookings) {
    const key =
      booking.staff?.id && byStaff.has(booking.staff.id) ? booking.staff.id : '_unassigned'
    byStaff.get(key)?.push(booking)
  }

  const prev = shiftDate(date, -1)
  const next = shiftDate(date, 1)
  const today = isoDate(new Date())

  return (
    <div className="overflow-hidden rounded-[20px] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e4e6eb] px-4 py-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/bookings?date=${prev}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e4e6eb] text-[#0a0a0a] hover:bg-[#f5f6f8]"
            aria-label="Previous day"
          >
            ‹
          </Link>
          <p className="min-w-[9rem] text-center text-sm font-semibold">{labelForDay(date)}</p>
          <Link
            href={`/dashboard/bookings?date=${next}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e4e6eb] text-[#0a0a0a] hover:bg-[#f5f6f8]"
            aria-label="Next day"
          >
            ›
          </Link>
          {date !== today ? (
            <Link href="/dashboard/bookings" className="ml-1 text-sm font-semibold text-[#1e3a8a]">
              Today
            </Link>
          ) : null}
        </div>
        <p className="text-[13px] text-[#7d818b]">
          {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'}
        </p>
      </div>

      <div className="overflow-x-auto">
        <div
          className="grid min-w-[36rem]"
          style={{ gridTemplateColumns: `3.5rem repeat(${columns.length}, minmax(9rem, 1fr))` }}
        >
          <div className="sticky left-0 z-[1] border-b border-[#e4e6eb] bg-white" />
          {columns.map((col) => (
            <div
              key={col.id}
              className="border-b border-l border-[#e4e6eb] px-3 py-2.5 text-sm font-semibold text-[#0a0a0a]"
            >
              {col.name}
            </div>
          ))}

          <div className="relative sticky left-0 z-[1] bg-white" style={{ height: gridHeight }}>
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute right-2 -translate-y-1/2 text-[11px] font-medium text-[#7d818b]"
                style={{ top: (hour - HOUR_START) * 60 * PX_PER_MIN }}
              >
                {formatHour(hour)}
              </div>
            ))}
          </div>

          {columns.map((col) => (
            <div
              key={col.id}
              className="relative border-l border-[#e4e6eb]"
              style={{ height: gridHeight }}
            >
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute inset-x-0 border-t border-[#f0f1f4]"
                  style={{ top: (hour - HOUR_START) * 60 * PX_PER_MIN }}
                />
              ))}
              {(byStaff.get(col.id) ?? []).map((booking) => {
                const start = minutesFromMidnight(booking.scheduledAt)
                const top = (start - HOUR_START * 60) * PX_PER_MIN
                const height = Math.max(booking.durationMinutes * PX_PER_MIN, 28)
                if (top + height < 0 || top > gridHeight) return null
                return (
                  <div
                    key={booking.id}
                    className={`absolute inset-x-1 overflow-hidden rounded-lg border px-2 py-1 text-left shadow-sm ${STATUS_TINT[booking.status] ?? 'border-gray-200 bg-gray-50 text-gray-500'}`}
                    style={{ top: Math.max(top, 0), height }}
                    title={`${booking.customer?.name ?? 'Walk-in'} · ${serviceLabel(booking)}`}
                  >
                    <span className="block truncate text-[11px] font-semibold leading-4">
                      {formatTime(booking.scheduledAt)} · {booking.customer?.name ?? 'Walk-in'}
                    </span>
                    <span className="block truncate text-[11px] leading-4 opacity-80">{serviceLabel(booking)}</span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function todayIso() {
  return isoDate(new Date())
}
