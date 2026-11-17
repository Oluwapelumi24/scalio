import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, Star } from 'lucide-react'
import { ApiError, apiFetch } from '@/lib/api'
import { getCustomer } from '@/lib/customer-session'
import { BookDesk } from '@/components/product/BookDesk'
import { categoryLook, formatNaira, type ListedService } from '@/lib/product'

interface VendorRow {
  id: string
  businessName: string
  category: string
  description: string | null
  address: string | null
  logoUrl: string | null
  themeColor: string | null
  rating: number | null
  reviewCount: number | null
  timezone: string | null
}

export default async function BusinessPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ services?: string; at?: string; duration?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  let vendor: VendorRow
  try {
    vendor = await apiFetch<VendorRow>(`/vendors/${id}`)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound()
    throw err
  }

  const services = await apiFetch<ListedService[]>(`/vendors/${id}/services`).catch(() => [] as ListedService[])
  const user = await getCustomer()
  const look = categoryLook(vendor.category)

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10">
      <Link href="/app" className="text-sm font-semibold text-[#1e3a8a]">
        Back
      </Link>
      <div className="mt-4 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          {vendor.logoUrl ? (
            <img src={vendor.logoUrl} alt="" className="aspect-[16/7] w-full rounded-[24px] object-cover" />
          ) : (
            <div
              className="flex aspect-[16/7] w-full items-end rounded-[24px] p-6 text-2xl font-semibold text-white"
              style={{ backgroundImage: `linear-gradient(145deg, ${vendor.themeColor ?? look.gradient[0]}, ${look.gradient[1]})` }}
            >
              {vendor.businessName}
            </div>
          )}
          <p className="mt-6 text-sm font-semibold text-[#1e3a8a]">{vendor.category}</p>
          <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight">{vendor.businessName}</h1>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#4a4e57]">
            {vendor.rating != null ? (
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-[#c2410c] text-[#c2410c]" aria-hidden />
                {vendor.rating.toFixed(1)}
                {vendor.reviewCount ? ` (${vendor.reviewCount} reviews)` : ''}
              </span>
            ) : null}
            {vendor.address ? (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" aria-hidden />
                {vendor.address}
              </span>
            ) : null}
          </div>
          {vendor.description ? <p className="mt-4 max-w-xl text-sm leading-6 text-[#4a4e57]">{vendor.description}</p> : null}

          <h2 className="mt-8 text-[15px] font-bold">Services</h2>
          {services.length === 0 ? (
            <p className="mt-3 text-sm text-[#4a4e57]">No services listed yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-[#e4e6eb] rounded-[20px] border border-[#e4e6eb]">
              {services.map((service) => (
                <li key={service.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <span>
                    <span className="block text-sm font-semibold">{service.name}</span>
                    <span className="text-[13px] text-[#4a4e57]">{service.durationMinutes} min</span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums">{formatNaira(service.priceKobo)}</span>
                </li>
              ))}
            </ul>
          )}

          <h2 className="mt-8 text-[15px] font-bold">Cancellation policy</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#4a4e57]">
            Please cancel at least 24 hours in advance to avoid a cancellation fee. Late cancellations and no-shows may be charged.
          </p>
        </div>

        <div className="lg:sticky lg:top-8">
          {services.length === 0 ? (
            <div className="rounded-[24px] border border-[#e4e6eb] p-6 text-sm text-[#4a4e57]">This business hasn’t listed any services.</div>
          ) : (
            <BookDesk
              vendorId={vendor.id}
              category={vendor.category}
              timezone={vendor.timezone ?? 'Africa/Lagos'}
              services={services.map((service) => ({
                id: service.id,
                name: service.name,
                durationMinutes: service.durationMinutes,
                priceKobo: service.priceKobo,
                paymentMode: service.paymentMode,
                depositPercent: service.depositPercent,
              }))}
              signedIn={!!user}
              hasPhone={Boolean(user?.phone)}
              initialServiceIds={(query.services ?? '').split(',').filter(Boolean)}
              initialAt={query.at ?? null}
              initialDuration={query.duration ? Number(query.duration) : null}
            />
          )}
        </div>
      </div>
    </div>
  )
}
