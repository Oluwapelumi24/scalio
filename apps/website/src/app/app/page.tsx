import { ApiError, apiFetch } from '@/lib/api'
import { getCustomer } from '@/lib/customer-session'
import { DiscoverHome } from '@/components/product/DiscoverHome'
import { INTERESTS, type ListedVendor } from '@/lib/product'

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; where?: string; category?: string }>
}) {
  const { q, where, category } = await searchParams
  const user = await getCustomer()
  const initialCategory = category && INTERESTS.includes(category) ? category : ''
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
    return <DiscoverHome user={user} vendors={vendors} error={null} initialQuery={q ?? ''} initialArea={where ?? ''} initialCategory={initialCategory} />
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Could not load businesses.'
    return <DiscoverHome user={user} vendors={[]} error={message} initialQuery={q ?? ''} initialArea={where ?? ''} initialCategory={initialCategory} />
  }
}
