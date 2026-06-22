import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { PaymentsTable } from './PaymentsTable'

export interface Payment {
  id: string
  status: string
  paymentMode: string
  amountDueKobo: number
  amountPaidKobo: number
  paystackReference: string | null
  scheduledAt: string
  createdAt: string
  vendorId: string
  vendorName: string
  customerName: string | null
  customerEmail: string | null
}

function formatNaira(k: number) {
  return `₦${(k / 100).toLocaleString('en-NG')}`
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; from?: string; to?: string; vendorId?: string }>
}) {
  const { mode, from, to, vendorId } = await searchParams
  const token = await requireToken()

  const qs = new URLSearchParams()
  if (mode) qs.set('mode', mode)
  if (from) qs.set('from', from)
  if (to) qs.set('to', to)
  if (vendorId) qs.set('vendorId', vendorId)

  const payments = await apiFetch<Payment[]>(`/super-admin/payments?${qs}`, token)

  const totalCollected = payments.filter((p) => p.status === 'completed').reduce((s, p) => s + p.amountPaidKobo, 0)
  const totalPending = payments.filter((p) => p.status === 'pending_payment').reduce((s, p) => s + p.amountDueKobo, 0)
  const payOnArrival = payments.filter((p) => p.paymentMode === 'pay_on_arrival').length
  const onlinePayments = payments.filter((p) => p.paymentMode !== 'pay_on_arrival').length

  const statCards = [
    { label: 'Total collected', value: formatNaira(totalCollected), sub: 'completed bookings', color: 'text-emerald-600' },
    { label: 'Pending', value: formatNaira(totalPending), sub: 'awaiting payment', color: 'text-amber-600' },
    { label: 'Pay on arrival', value: payOnArrival.toLocaleString(), sub: 'transactions', color: 'text-blue-600' },
    { label: 'Online payments', value: onlinePayments.toLocaleString(), sub: 'via Paystack', color: 'text-indigo-600' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-sm text-gray-500 mt-1">All transactions across the platform</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {statCards.map(({ label, value, sub, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap items-end gap-3">
        <form className="flex flex-wrap gap-3 items-end w-full">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Payment mode</label>
            <select name="mode" defaultValue={mode ?? ''}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
              <option value="">All modes</option>
              <option value="pay_on_arrival">Pay on arrival</option>
              <option value="deposit">Deposit</option>
              <option value="full_prepayment">Full prepayment</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
            <input type="date" name="from" defaultValue={from ?? ''}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
            <input type="date" name="to" defaultValue={to ?? ''}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <button type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
            Filter
          </button>
          {(mode || from || to) && (
            <a href="/dashboard/payments" className="text-sm text-gray-400 hover:text-gray-600 py-2">Clear</a>
          )}
        </form>
      </div>

      <PaymentsTable payments={payments} />
    </div>
  )
}
