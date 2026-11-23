import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, Star } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { DesignSwitchGate } from '@/components/site/DesignSwitchGate'
import { designMode } from '@/lib/design-preview'
import { categoryFromSlug, listingsFor } from '@/lib/samples'

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: slug } = await params
  const category = categoryFromSlug(slug)
  if (!category) return { title: 'Listings' }
  return { title: `${category.heading.replace(' near you', '')} · Sample listings` }
}

export default async function SampleListingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>
  searchParams: Promise<{ where?: string }>
}) {
  const { category: slug } = await params
  const { where } = await searchParams
  const category = categoryFromSlug(slug)
  if (!category) notFound()
  const listings = listingsFor(category.name)
  const mode = await designMode()
  const prelaunch = mode === 'prelaunch'
  const place = where?.trim()

  return (
    <>
      <Navbar site={prelaunch ? 'prelaunch' : 'live'} />
      <main className="bg-white px-6 pb-24 pt-32">
        <div className="mx-auto max-w-6xl">
          <Link href="/#categories" className="text-sm font-semibold text-navy">
            All services
          </Link>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-navy">Sample listings</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            {category.heading}
          </h1>
          <p className="mt-3 flex items-center gap-1.5 text-slate-600">
            <MapPin className="h-4 w-4" aria-hidden />
            {place || 'Lekki, Lagos'}
          </p>
          <p className="mt-4 max-w-xl text-slate-600">{category.description}</p>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((place) => (
              <li key={place.slug}>
                <Link
                  href={`/samples/${slug}/${place.slug}`}
                  className="block h-full overflow-hidden rounded-2xl border border-slate-200 bg-white transition-colors hover:border-navy/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                >
                  {place.image ? (
                    <img
                      src={place.image}
                      alt={place.alt}
                      className={`aspect-[4/3] w-full object-cover ${place.position ?? ''}`}
                    />
                  ) : (
                    <div
                      className="flex aspect-[4/3] w-full items-end p-5 text-lg font-semibold text-white"
                      style={{ backgroundImage: `linear-gradient(145deg, ${category.gradient[0]}, ${category.gradient[1]})` }}
                    >
                      {place.name}
                    </div>
                  )}
                  <div className="px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-display text-lg font-semibold tracking-tight text-slate-950">{place.name}</p>
                      <p className="mt-0.5 flex shrink-0 items-center gap-1 text-sm font-semibold text-slate-800">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                        {place.rating}
                      </p>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {place.category} · {place.area}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-slate-700">{place.distance}</span>
                      <span className="font-semibold text-emerald-700">{place.next}</span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <Footer site={prelaunch ? 'prelaunch' : 'live'} />
      <DesignSwitchGate mode={mode} />
    </>
  )
}
