import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, Star } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { DesignSwitch } from '@/components/site/DesignSwitch'
import { SampleBook } from '@/components/samples/SampleBook'
import { designMode } from '@/lib/design-preview'
import { categoryFromSlug, categorySlug, formatNaira, listingBySlug } from '@/lib/samples'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>
}): Promise<Metadata> {
  const { category: categoryParam, slug } = await params
  const category = categoryFromSlug(categoryParam)
  const listing = category ? listingBySlug(category.name, slug) : null
  if (!listing) return { title: 'Listing' }
  return { title: `${listing.name} · ${listing.category}` }
}

export default async function SampleListingPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>
}) {
  const { category: categoryParam, slug } = await params
  const category = categoryFromSlug(categoryParam)
  if (!category) notFound()
  const listing = listingBySlug(category.name, slug)
  if (!listing) notFound()
  const mode = await designMode()

  return (
    <>
      <Navbar site="live" />
      <main className="bg-white px-6 pb-24 pt-32">
        <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <Link href={`/samples/${categorySlug(category.name)}`} className="text-sm font-semibold text-navy">
              {category.name} listings
            </Link>
            {listing.image ? (
              <img
                src={listing.image}
                alt={listing.alt}
                className={`mt-6 aspect-[16/8] w-full rounded-[28px] object-cover ${listing.position ?? ''}`}
              />
            ) : (
              <div
                className="mt-6 flex aspect-[16/8] w-full items-end rounded-[28px] p-8 text-3xl font-semibold text-white"
                style={{ backgroundImage: `linear-gradient(145deg, ${category.gradient[0]}, ${category.gradient[1]})` }}
              >
                {listing.name}
              </div>
            )}
            <p className="mt-6 text-sm font-semibold text-navy">{listing.category}</p>
            <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              {listing.name}
            </h1>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                {listing.rating}
                <span className="text-slate-500">({listing.reviews} reviews)</span>
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" aria-hidden />
                {listing.area}, Lagos · {listing.distance}
              </span>
            </div>
            <p className="mt-4 max-w-xl text-slate-600">{listing.blurb}</p>

            <h2 className="mt-8 font-display text-2xl font-semibold tracking-tight text-slate-950">Services</h2>
            <ul className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200">
              {listing.services.map((service) => (
                <li key={service.name} className="flex items-center justify-between gap-4 px-4 py-3.5">
                  <span>
                    <span className="block text-sm font-semibold text-slate-950">{service.name}</span>
                    <span className="text-[13px] text-slate-500">
                      {service.minutes} min
                      {service.deposit ? ` · ${formatNaira(service.deposit)} holds the time` : ''}
                    </span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-slate-950">{formatNaira(service.price)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:sticky lg:top-28">
            <SampleBook listing={listing} />
          </div>
        </div>
      </main>
      <Footer site="live" />
      <DesignSwitch mode={mode} />
    </>
  )
}
