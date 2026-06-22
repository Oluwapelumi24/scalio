import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { ItemList } from './ItemList'
import { AddItemForm } from './AddItemForm'

export interface ServiceItem {
  id: string
  serviceType: 'package' | 'service'
  name: string
  durationMinutes: number
  priceKobo: number
  paymentMode: string
  depositPercent: number | null
}

export default async function ServicesPage() {
  const token = await requireToken()

  let items: ServiceItem[] = []
  try {
    items = await apiFetch<ServiceItem[]>('/vendor-admin/services', token)
  } catch {
    /* show empty state */
  }

  const packages = items.filter((i) => i.serviceType === 'package')
  const services = items.filter((i) => i.serviceType === 'service')

  return (
    <div className="space-y-8">
      {/* Packages */}
      <section>
        <div className="mb-3">
          <h2 className="text-lg font-bold text-gray-900">Packages</h2>
          <p className="text-sm text-gray-500">Booking types customers select — e.g. &ldquo;Self Service Wash&rdquo;, &ldquo;Drop Off&rdquo;</p>
        </div>
        <ItemList items={packages} emptyLabel="No packages yet." />
        <div className="mt-3">
          <AddItemForm serviceType="package" placeholder="e.g. Self Service Wash" />
        </div>
      </section>

      <div className="border-t border-gray-200" />

      {/* Services */}
      <section>
        <div className="mb-3">
          <h2 className="text-lg font-bold text-gray-900">Services</h2>
          <p className="text-sm text-gray-500">What customers are booking — e.g. &ldquo;Duvet Laundry&rdquo;, &ldquo;Clothing Laundry&rdquo;</p>
        </div>
        <ItemList items={services} emptyLabel="No services yet." />
        <div className="mt-3">
          <AddItemForm serviceType="service" placeholder="e.g. Duvet Laundry" />
        </div>
      </section>
    </div>
  )
}
