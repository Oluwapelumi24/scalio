import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { serviceExamples, type VendorProfile } from '@/lib/categories'
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

  const profile = await apiFetch<VendorProfile>('/vendor-admin/profile', token).catch(() => null)
  const examples = serviceExamples(profile?.category)

  const packages = items.filter((i) => i.serviceType === 'package')
  const services = items.filter((i) => i.serviceType === 'service')

  return (
    <div className="space-y-8">
      {/* Packages */}
      <section>
        <div className="mb-3">
          <h2 className="text-lg font-bold text-gray-900">Packages</h2>
          <p className="text-sm text-gray-500">{examples.packagesHelp}</p>
        </div>
        <ItemList
          items={packages}
          emptyLabel="No packages yet."
          emptyHint="Add one below so customers have a booking type to pick."
        />
        <div className="mt-3">
          <AddItemForm serviceType="package" placeholder={examples.packagePlaceholder} />
        </div>
      </section>

      <div className="border-t border-gray-200" />

      {/* Services */}
      <section>
        <div className="mb-3">
          <h2 className="text-lg font-bold text-gray-900">Services</h2>
          <p className="text-sm text-gray-500">{examples.servicesHelp}</p>
        </div>
        <ItemList
          items={services}
          emptyLabel="No services yet."
          emptyHint="Add at least one service so customers can book you."
        />
        <div className="mt-3">
          <AddItemForm serviceType="service" placeholder={examples.servicePlaceholder} />
        </div>
      </section>
    </div>
  )
}
