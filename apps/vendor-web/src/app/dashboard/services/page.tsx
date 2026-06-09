import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { CreateServiceForm } from './ServiceForm'
import { DeleteServiceButton } from './DeleteServiceButton'

interface Service {
  id: string
  name: string
  durationMinutes: number
  priceKobo: number
  paymentMode: string
  depositPercent: number | null
}

function formatPrice(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
}

function formatPaymentMode(mode: string, depositPercent: number | null) {
  if (mode === 'deposit' && depositPercent) return `Deposit (${depositPercent}%)`
  return { pay_on_arrival: 'Pay on arrival', deposit: 'Deposit', full_prepayment: 'Full prepayment' }[mode] ?? mode
}

export default async function ServicesPage() {
  const token = await requireToken()

  let services: Service[] = []
  try {
    services = await apiFetch<Service[]>('/vendor-admin/services', token)
  } catch {
    /* show empty state */
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Services</h1>

      {/* Services list */}
      {services.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center mb-6">
          <p className="text-gray-400 text-sm">No services yet. Add one below.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Duration
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Payment
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {services.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.durationMinutes} min</td>
                  <td className="px-4 py-3 text-gray-900">{formatPrice(s.priceKobo)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatPaymentMode(s.paymentMode, s.depositPercent)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteServiceButton serviceId={s.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add service form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Add a service</h2>
        <CreateServiceForm />
      </div>
    </div>
  )
}
