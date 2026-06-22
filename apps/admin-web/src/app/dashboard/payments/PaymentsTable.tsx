'use client'

import type { Payment } from './page'

const STATUS_BADGE: Record<string, string> = {
  pending_payment: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled_by_customer: 'bg-red-100 text-red-700',
  cancelled_by_vendor: 'bg-red-100 text-red-700',
  no_show: 'bg-gray-100 text-gray-500',
}

const MODE_LABEL: Record<string, string> = {
  pay_on_arrival: 'On arrival',
  deposit: 'Deposit',
  full_prepayment: 'Prepaid',
}

function formatNaira(k: number) {
  return `₦${(k / 100).toLocaleString('en-NG')}`
}

export function PaymentsTable({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-gray-400 text-sm">No payment transactions found.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Ref</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Vendor</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Mode</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Due</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Paid</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-400">
                  {p.paystackReference ? p.paystackReference.slice(0, 12) + '…' : p.id.slice(0, 8)}
                </td>
                <td className="px-4 py-3 text-gray-700 font-medium">{p.vendorName}</td>
                <td className="px-4 py-3 text-gray-600">{p.customerName ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {MODE_LABEL[p.paymentMode] ?? p.paymentMode}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-700">{formatNaira(p.amountDueKobo)}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                  {p.amountPaidKobo > 0 ? formatNaira(p.amountPaidKobo) : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[p.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {p.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {new Date(p.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
