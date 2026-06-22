import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { VendorTabs } from '../VendorTabs'
import { AdminItemList } from './AdminItemList'
import { AdminAddItemForm } from './AdminAddItemForm'

export interface ServiceItem {
  id: string
  serviceType: 'package' | 'service'
  name: string
  durationMinutes: number
  priceKobo: number
  paymentMode: string
  depositPercent: number | null
}

export default async function VendorServicesPage({ params }: { params: Promise<{ vendorId: string }> }) {
  const { vendorId } = await params
  const token = await requireToken()
  const items = await apiFetch<ServiceItem[]>(`/super-admin/vendors/${vendorId}/services`, token)

  const packages = items.filter((i) => i.serviceType === 'package')
  const services = items.filter((i) => i.serviceType === 'service')

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Services</h1>
      <p className="text-sm text-gray-500 mb-6">Manage packages and services for this vendor</p>
      <VendorTabs vendorId={vendorId} />

      <div className="mt-6 space-y-8">
        {/* Packages */}
        <section>
          <div className="mb-3">
            <h2 className="text-base font-semibold text-gray-900">Packages</h2>
            <p className="text-xs text-gray-500">Booking types — e.g. &ldquo;Self Service Wash&rdquo;, &ldquo;Drop Off&rdquo;</p>
          </div>
          <AdminItemList vendorId={vendorId} items={packages} emptyLabel="No packages yet." />
          <div className="mt-3">
            <AdminAddItemForm vendorId={vendorId} serviceType="package" placeholder="e.g. Self Service Wash" />
          </div>
        </section>

        <div className="border-t border-gray-200" />

        {/* Services */}
        <section>
          <div className="mb-3">
            <h2 className="text-base font-semibold text-gray-900">Services</h2>
            <p className="text-xs text-gray-500">What&apos;s being booked — e.g. &ldquo;Duvet Laundry&rdquo;, &ldquo;Clothing Laundry&rdquo;</p>
          </div>
          <AdminItemList vendorId={vendorId} items={services} emptyLabel="No services yet." />
          <div className="mt-3">
            <AdminAddItemForm vendorId={vendorId} serviceType="service" placeholder="e.g. Duvet Laundry" />
          </div>
        </section>
      </div>
    </div>
  )
}
