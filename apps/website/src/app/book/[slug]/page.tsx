import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, Star } from 'lucide-react'
import { ApiError, apiFetch } from '@/lib/api'
import { formatClock, PAYMENT_LABEL, type PublicVendor } from '@/lib/booking-page'
import { getCustomer } from '@/lib/customer-session'
import { AvailabilityPicker } from './AvailabilityPicker'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const FALLBACK_ACCENT = '#1e3a8a'

async function loadVendor(slug: string, preview?: string): Promise<PublicVendor | null> {
  try {
    const q = preview ? `?preview=${encodeURIComponent(preview)}` : ''
    return await apiFetch<PublicVendor>(`/vendors/by-slug/${encodeURIComponent(slug)}${q}`)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null
    throw err
  }
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { preview } = await searchParams
  const vendor = await loadVendor(slug, preview)
  if (!vendor) return { title: 'Business not found — Veno' }
  return {
    title: vendor.preview ? `Preview ${vendor.businessName} — Veno` : `Book ${vendor.businessName} — Veno`,
    description: vendor.description ?? `See services, prices and open times for ${vendor.businessName}.`,
    robots: vendor.preview ? { index: false, follow: false } : undefined,
  }
}

// The link a business shares on WhatsApp, Instagram or Facebook. Customers can
// see services, prices, hours and live open times without installing anything.
export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ services?: string; at?: string; preview?: string }>
}) {
  const { slug } = await params
  const query = await searchParams
  const vendor = await loadVendor(slug, query.preview)
  if (!vendor) notFound()
  const user = await getCustomer()

  const accent = vendor.themeColor?.trim() || FALLBACK_ACCENT
  const hours = new Map(vendor.businessHours.map((h) => [h.dayOfWeek, h]))
  const paymentModes = [...new Set(vendor.services.map((s) => s.paymentMode))]
  const today = new Date().getDay()

  return (
    <div
      className="min-h-screen bg-[#f7f8fb] text-slate-950"
      style={{ ['--book-accent' as string]: accent }}
    >
      {vendor.preview ? (
        <div
          role="status"
          className="border-b border-[#fde8d8] bg-[#fff7ed] px-4 py-2.5 text-center text-[13px] font-medium text-[#9a3412]"
        >
          Preview only — customers can’t open this page until you’re approved.
        </div>
      ) : null}

      <header className="relative overflow-hidden text-white">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: `linear-gradient(155deg, color-mix(in srgb, ${accent} 92%, #0b1638) 0%, ${accent} 48%, color-mix(in srgb, ${accent} 78%, #ffffff) 100%)`,
          }}
        />
        <div
          aria-hidden
          className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-black/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-5xl px-5 pb-12 pt-7 sm:px-8 sm:pb-14 sm:pt-8">
          <Link
            href="/"
            className="inline-flex text-[13px] font-semibold tracking-wide text-white/75 transition-colors hover:text-white"
          >
            Veno
          </Link>

          <div className="mt-8 flex items-start gap-4 sm:mt-10 sm:gap-5">
            {vendor.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={vendor.logoUrl}
                alt=""
                className="h-[72px] w-[72px] shrink-0 rounded-[22px] bg-white object-cover shadow-[0_8px_24px_rgba(0,0,0,0.18)] outline outline-1 outline-black/10 -outline-offset-1 sm:h-20 sm:w-20"
              />
            ) : (
              <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[22px] bg-white/15 text-3xl font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-sm sm:h-20 sm:w-20">
                {vendor.businessName.charAt(0)}
              </div>
            )}
            <div className="min-w-0 pt-0.5">
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/70">
                {vendor.category}
              </p>
              <h1 className="mt-1 font-display text-[2rem] font-semibold leading-[1.1] tracking-tight sm:text-4xl">
                {vendor.businessName}
              </h1>
              <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/80">
                {vendor.rating != null ? (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
                    <span className="font-semibold text-white">{vendor.rating.toFixed(1)}</span>
                    {vendor.reviewCount ? (
                      <span className="text-white/65">({vendor.reviewCount})</span>
                    ) : null}
                  </span>
                ) : null}
                {vendor.address ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {vendor.address}
                  </span>
                ) : null}
              </p>
            </div>
          </div>

          {vendor.description ? (
            <p className="mt-6 max-w-2xl text-[15px] leading-6 text-white/88">{vendor.description}</p>
          ) : null}
        </div>
      </header>

      <main className="relative mx-auto grid max-w-5xl gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10">
        <AvailabilityPicker
          vendorId={vendor.id}
          slug={vendor.slug}
          businessName={vendor.businessName}
          timezone={vendor.timezone}
          services={vendor.services}
          signedIn={!!user}
          hasPhone={Boolean(user?.phone)}
          initialServiceIds={(query.services ?? '').split(',').filter(Boolean)}
          initialAt={query.at ?? null}
          preview={Boolean(vendor.preview)}
          previewToken={query.preview}
          accent={accent}
        />

        <aside className="space-y-4 lg:pt-1">
          <section className="rounded-[24px] bg-white px-5 py-5 shadow-[0_1px_0_rgba(15,15,20,0.04),0_8px_24px_rgba(15,15,20,0.04)]">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Opening hours</h2>
            {vendor.businessHours.length === 0 ? (
              <p className="mt-3 text-sm leading-5 text-slate-500">Hours not listed yet.</p>
            ) : (
              <dl className="mt-3 space-y-1.5">
                {DAY_NAMES.map((name, day) => {
                  const h = hours.get(day)
                  const isToday = day === today
                  return (
                    <div
                      key={name}
                      className={`flex items-baseline justify-between gap-3 rounded-xl px-2.5 py-1.5 text-sm ${
                        isToday ? 'bg-[color-mix(in_srgb,var(--book-accent)_10%,white)]' : ''
                      }`}
                    >
                      <dt className={isToday ? 'font-semibold text-slate-950' : 'text-slate-500'}>
                        {name.slice(0, 3)}
                        {isToday ? <span className="sr-only"> (today)</span> : null}
                      </dt>
                      <dd
                        className={`tabular-nums ${
                          h
                            ? isToday
                              ? 'font-semibold text-slate-950'
                              : 'text-slate-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {h ? `${formatClock(h.opensAtMinutes)} – ${formatClock(h.closesAtMinutes)}` : 'Closed'}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            )}
          </section>

          {paymentModes.length > 0 ? (
            <section className="rounded-[24px] bg-white px-5 py-5 shadow-[0_1px_0_rgba(15,15,20,0.04),0_8px_24px_rgba(15,15,20,0.04)]">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Payment</h2>
              <ul className="mt-3 space-y-2 text-sm leading-5 text-slate-700">
                {paymentModes.map((mode) => {
                  const example = vendor.services.find((s) => s.paymentMode === mode)!
                  return <li key={mode}>{PAYMENT_LABEL[mode](example)}</li>
                })}
              </ul>
            </section>
          ) : null}
        </aside>
      </main>

      <footer className="pb-10 text-center text-xs text-slate-400">
        Powered by{' '}
        <Link href="/" className="font-semibold text-slate-500 hover:text-navy">
          Veno
        </Link>
      </footer>
    </div>
  )
}
