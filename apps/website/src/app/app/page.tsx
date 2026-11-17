import { ApiError, apiFetch } from '@/lib/api'
import { getCustomer } from '@/lib/customer-session'
import { DiscoverHome } from '@/components/product/DiscoverHome'
import type { ListedVendor } from '@/lib/product'

export default async function DiscoverPage() {
  const user = await getCustomer()
  try {
    const rows = await apiFetch<ListedVendor[]>('/vendors')
    const vendors = rows.map((vendor) => ({
      id: vendor.id,
      slug: vendor.slug,
      businessName: vendor.businessName,
      category: vendor.category,
      logoUrl: vendor.logoUrl,
      themeColor: vendor.themeColor,
      featured: Boolean(vendor.featured),
      address: vendor.address,
      rating: vendor.rating,
      reviewCount: vendor.reviewCount,
    }))
    return <DiscoverHome user={user} vendors={vendors} error={null} />
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Could not load businesses.'
    return <DiscoverHome user={user} vendors={[]} error={message} />
  }
}
