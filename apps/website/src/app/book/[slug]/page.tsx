import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, Star } from 'lucide-react'
import { ApiError, apiFetch } from '@/lib/api'
import { formatClock, PAYMENT_LABEL, type PublicVendor } from '@/lib/booking-page'
import { AvailabilityPicker } from './AvailabilityPicker'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

async function loadVendor(slug: string): Promise<PublicVendor | null> {
  try {
    return await apiFetch<PublicVendor>(`/vendors/by-slug/${encodeURIComponent(slug)}`)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null
    throw err
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const vendor = await loadVendor((await params).slug)
  if (!vendor) return { title: 'Business not found — Scalio' }
  return {
    title: `Book ${vendor.businessName} — Scalio`,
    description: vendor.description ?? `See services, prices and open times for ${vendor.businessName}.`,
  }
}

// The link a business shares on WhatsApp, Instagram or Facebook. Customers can
// see services, prices, hours and live open times without installing anything.
export default async function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const vendor = await loadVendor((await params).slug)
  if (!vendor) notFound()

  const brand = vendor.themeColor ?? '#4f46e5'
  const hours = new Map(vendor.businessHours.map((h) => [h.dayOfWeek, h]))
  const paymentModes = [...new Set(vendor.services.map((s) => s.paymentMode))]

  return (
    <div className="min-h-screen bg-slate-50">
      <header style={{ backgroundColor: brand }} className="text-white">
        <div className="mx-auto max-w-3xl px-6 pb-10 pt-8">
          <Link href="/" className="text-sm font-semibold text-white/80 hover:text-white">Scalio</Link>
          <div className="mt-6 flex items-center gap-4">
            {vendor.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={vendor.logoUrl} alt="" className="h-16 w-16 rounded-2xl bg-white object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold">
                {vendor.businessName.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">{vendor.businessName}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/80">
                <span>{vendor.category}</span>
                {vendor.rating != null && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-current" aria-hidden /> {vendor.rating.toFixed(1)}
                    {vendor.reviewCount ? ` (${vendor.reviewCount})` : ''}
                  </span>
                )}
                {vendor.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" aria-hidden /> {vendor.address}
                  </span>
                )}
              </p>
            </div>
          </div>
          {vendor.description && <p className="mt-5 max-w-xl text-white/90">{vendor.description}</p>}
        </div>
      </header>

      <main className="mx-auto grid max-w-3xl gap-8 px-6 py-8 md:grid-cols-[1fr_220px]">
        <AvailabilityPicker
          vendorId={vendor.id}
          businessName={vendor.businessName}
          timezone={vendor.timezone}
          services={vendor.services}
        />

        <aside className="space-y-6">
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Opening hours</h2>
            {vendor.businessHours.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Hours not listed yet.</p>
            ) : (
              <dl className="mt-2 space-y-1 text-sm">
                {DAY_NAMES.map((name, day) => {
                  const h = hours.get(day)
                  return (
                    <div key={name} className="flex justify-between gap-3">
                      <dt className="text-slate-600">{name.slice(0, 3)}</dt>
                      <dd className={h ? 'text-slate-900' : 'text-slate-400'}>
                        {h ? `${formatClock(h.opensAtMinutes)} – ${formatClock(h.closesAtMinutes)}` : 'Closed'}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            )}
          </section>

          {paymentModes.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Payment</h2>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {paymentModes.map((mode) => {
                  const example = vendor.services.find((s) => s.paymentMode === mode)!
                  return <li key={mode}>{PAYMENT_LABEL[mode](example)}</li>
                })}
              </ul>
            </section>
          )}
        </aside>
      </main>

      <footer className="pb-10 text-center text-xs text-slate-400">Powered by Scalio</footer>
    </div>
  )
}
