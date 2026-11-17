import Link from 'next/link'
import { ApiError, apiFetch } from '@/lib/api'
import { categoryLook, INTERESTS, type ListedVendor } from '@/lib/product'

export default async function ExplorePage() {
  let vendors: ListedVendor[] = []
  let error: string | null = null
  try {
    const rows = await apiFetch<ListedVendor[]>('/vendors')
    vendors = rows.map((vendor) => ({
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
  } catch (err) {
    error = err instanceof ApiError ? err.message : 'Could not load businesses.'
  }

  const sections = INTERESTS.map((category) => ({
    category,
    vendors: vendors.filter((vendor) => vendor.category.toLowerCase() === category.toLowerCase() || (category === 'Laundry' && vendor.category.toLowerCase() === 'laundromat')),
  })).filter((section) => section.vendors.length > 0)

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10 lg:py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Explore</h1>
      <p className="mt-2 text-sm text-[#4a4e57]">Browse businesses near you by category.</p>
      {error ? <p className="mt-8 text-sm text-[#dc2626]">{error}</p> : null}
      {!error && sections.length === 0 ? (
        <div className="mt-8 rounded-[20px] border border-[#e4e6eb] px-6 py-10 text-center">
          <p className="font-semibold">Nothing to explore yet</p>
          <p className="mt-1 text-sm text-[#4a4e57]">Check back soon for new businesses.</p>
        </div>
      ) : null}
      <div className="mt-8 space-y-10">
        {sections.map((section) => (
          <section key={section.category}>
            <h2 className="text-[15px] font-bold tracking-tight">{section.category}</h2>
            <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {section.vendors.map((vendor) => {
                const look = categoryLook(vendor.category)
                return (
                  <li key={vendor.id}>
                    <Link href={`/app/business/${vendor.id}`} className="block">
                      {vendor.logoUrl ? (
                        <img src={vendor.logoUrl} alt="" className="aspect-[4/3] w-full rounded-[18px] object-cover" />
                      ) : (
                        <div
                          className="flex aspect-[4/3] w-full items-end rounded-[18px] p-3 text-sm font-semibold text-white"
                          style={{ backgroundImage: `linear-gradient(145deg, ${look.gradient[0]}, ${look.gradient[1]})` }}
                        >
                          {look.label}
                        </div>
                      )}
                      <p className="mt-2 truncate text-sm font-semibold">{vendor.businessName}</p>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
