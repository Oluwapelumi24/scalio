export interface StaffDay {
  dayOfWeek: number
  startsAtMinutes: number
  endsAtMinutes: number
  breakStartsAtMinutes: number | null
  breakEndsAtMinutes: number | null
}

export interface TimeOff { id: string; startDate: string; endDate: string; reason: string | null }

export interface StaffSchedule { staffId: string; name: string; days: StaffDay[]; timeOff: TimeOff[] }

export interface TeamShiftStatus { id: string; name: string; role: string; clockedIn: boolean; since: string | null }

export interface ShiftRecord {
  id: string
  staffId: string
  staffName: string
  clockInAt: string
  clockOutAt: string | null
  source: 'self' | 'manager'
}

export interface StaffPerformance {
  staffId: string | null
  name: string
  role: string | null
  bookings: number
  completed: number
  noShows: number
  cancelledByBusiness: number
  cancelledByCustomer: number
  upcoming: number
  salesKobo: number
  averageSaleKobo: number | null
  completionRate: number | null
  uniqueCustomers: number
  repeatCustomers: number
  attendance: { workedMinutes: number; scheduledMinutes: number | null; rate: number | null; clockedInNow: boolean } | null
  rating: { average: number; count: number } | null
}

export interface PerformanceReport {
  from: string
  to: string
  definitions: Record<string, string>
  tracksAttendance: boolean
  staff: StaffPerformance[]
}

export const minutesToTime = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

export const timeToMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m ?? 0)
}

export function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`
}
