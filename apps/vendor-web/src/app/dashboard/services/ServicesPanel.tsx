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

export async function ServicesPanel() {
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
    <div className="space-y-4">
      <section className="rounded-[20px] bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold text-[#0a0a0a]">Packages</h2>
        <p className="mt-1 text-sm leading-6 text-[#4a4e57]">{examples.packagesHelp}</p>
        <div className="mt-5">
          <ItemList
            items={packages}
            emptyLabel="No packages yet."
            emptyHint="Add one below so customers have a booking type to pick."
          />
        </div>
        <div className="mt-4">
          <AddItemForm serviceType="package" placeholder={examples.packagePlaceholder} />
        </div>
      </section>

      <section className="rounded-[20px] bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold text-[#0a0a0a]">Services</h2>
        <p className="mt-1 text-sm leading-6 text-[#4a4e57]">{examples.servicesHelp}</p>
        <div className="mt-5">
          <ItemList
            items={services}
            emptyLabel="No services yet."
            emptyHint="Add at least one service so customers can book you."
          />
        </div>
        <div className="mt-4">
          <AddItemForm serviceType="service" placeholder={examples.servicePlaceholder} />
        </div>
      </section>
    </div>
  )
}
