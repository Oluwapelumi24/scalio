// Types for the Phase 5 insights API: reports and customer feedback.

export type ReportKind = 'sales' | 'bookings' | 'expenses' | 'cashflow' | 'customers' | 'retention'
export interface ReportGroup { key: string; label: string; count: number; amountKobo?: number }

export interface ReportsOverview {
  from: string
  to: string
  definitions: Record<string, string>
  sales: { salesKobo: number; completed: number; averageSaleKobo: number | null; byService: ReportGroup[]; byStaff: ReportGroup[]; byDay: ReportGroup[] }
  bookings: { total: number; cancellationRate: number | null; noShowRate: number | null; byStatus: ReportGroup[]; byWeekday: ReportGroup[] }
  expenses: { totalKobo: number; byCategory: ReportGroup[] }
  cashflow: { inKobo: number; outKobo: number; netKobo: number; groups: ReportGroup[]; byDay: { date: string; inKobo: number; outKobo: number }[] }
  customers: { newCustomers: number; visited: number; bySource: ReportGroup[] }
  retention: { served: number; returning: number; firstVisits: number; returningRate: number | null; repeatRate: number | null; lapsed: number; groups: ReportGroup[] }
}

export interface ReportRecord {
  type: 'booking' | 'expense' | 'ledger' | 'customer'
  id: string
  at: string | null
  amountKobo?: number
  customerName?: string | null
  name?: string
  phone?: string | null
  staffName?: string | null
  services?: string[]
  status?: string
  label?: string
  note?: string | null
  direction?: 'in' | 'out'
  visits?: number
}

export interface FeedbackItem {
  id: string
  rating: number
  comment: string | null
  submittedAt: string
  followedUpAt: string | null
  needsFollowUp: boolean
  bookingId: string
  scheduledAt: string
  customer: { id: string; name: string; phone: string | null }
  staffName: string | null
}

export interface FeedbackOverview {
  from: string
  to: string
  average: number | null
  count: number
  asked: number
  needsFollowUp: number
  distribution: { stars: number; count: number }[]
  items: FeedbackItem[]
}

export const pct = (r: number | null) => (r === null ? '—' : `${Math.round(r * 100)}%`)

export const REPORT_TITLES: Record<ReportKind, string> = {
  sales: 'Sales', bookings: 'Bookings', expenses: 'Expenses', cashflow: 'Cash flow', customers: 'New customers', retention: 'Customers served',
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Named periods for the report pages: this month, last month, last 90 days. */
export function periodRange(id: string | undefined, now = new Date()): { id: string; from: string; to: string } {
  if (id === 'last') return { id, from: iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)), to: iso(new Date(now.getFullYear(), now.getMonth(), 0)) }
  if (id === '90') return { id, from: iso(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89)), to: iso(now) }
  return { id: 'month', from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: iso(now) }
}

export const PERIOD_LABELS = [
  { id: 'month', label: 'This month' },
  { id: 'last', label: 'Last month' },
  { id: '90', label: 'Last 90 days' },
]
