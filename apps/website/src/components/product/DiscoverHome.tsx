'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, MapPin, Search, SlidersHorizontal, Star, X } from 'lucide-react'
import {
  INTERESTS,
  POPULAR_AREAS,
  areaOf,
  categoryLook,
  inLocation,
  LOCATION_KEY,
  shortAddress,
  type ListedVendor,
} from '@/lib/product'
import type { Customer } from '@/lib/customer-session'

interface Filters {
  minRating: number | null
  areas: string[]
  categories: string[]
}

const NO_FILTERS: Filters = { minRating: null, areas: [], categories: [] }
const RATINGS: { label: string; value: number | null }[] = [
  { label: 'Any', value: null },
  { label: '3.5+', value: 3.5 },
  { label: '4.0+', value: 4 },
  { label: '4.5+', value: 4.5 },
]

function countFilters(filters: Filters) {
  return (filters.minRating ? 1 : 0) + filters.areas.length + filters.categories.length
}

function sameCategory(vendorCategory: string, selected: string) {
  const left = vendorCategory.toLowerCase()
  const right = selected.toLowerCase()
  return left === right || (right === 'laundry' && left === 'laundromat')
}

function matchesFilters(vendor: ListedVendor, filters: Filters) {
  if (filters.minRating && (vendor.rating ?? 0) < filters.minRating) return false
  if (filters.areas.length > 0 && !filters.areas.includes(areaOf(vendor.address) ?? '')) return false
  if (filters.categories.length > 0 && !filters.categories.some((category) => sameCategory(vendor.category, category))) return false
  return true
}

function VendorFace({ vendor, className }: { vendor: ListedVendor; className: string }) {
  const look = categoryLook(vendor.category)
  if (vendor.logoUrl) {
    return <img src={vendor.logoUrl} alt="" className={`${className} object-cover`} />
  }
  return (
    <div
      className={`${className} flex items-end p-3 text-sm font-semibold text-white`}
      style={{ backgroundImage: `linear-gradient(145deg, ${look.gradient[0]}, ${look.gradient[1]})` }}
    >
      {look.label}
    </div>
  )
}

function Rating({ vendor }: { vendor: ListedVendor }) {
  if (vendor.rating == null && vendor.reviewCount == null) return null
  return (
    <p className="flex items-center gap-1 text-[13px]">
      <Star className="h-3.5 w-3.5 fill-[#c2410c] text-[#c2410c]" aria-hidden />
      {vendor.rating != null ? <span className="font-semibold">{vendor.rating.toFixed(1)}</span> : null}
      {vendor.reviewCount != null ? <span className="text-[#4a4e57]">({vendor.reviewCount})</span> : null}
    </p>
  )
}

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`h-10 rounded-full border px-4 text-sm font-medium ${
        selected ? 'border-[#1e3a8a] bg-[#1e3a8a] text-white' : 'border-[#c9ced8] bg-white text-[#0a0a0a] hover:bg-[#f5f6f8]'
      }`}
    >
      {label}
    </button>
  )
}

export function DiscoverHome({
  user,
  vendors,
  error,
  initialQuery = '',
  initialArea = '',
  initialCategory = '',
}: {
  user: Customer | null
  vendors: ListedVendor[]
  error: string | null
  initialQuery?: string
  initialArea?: string
  initialCategory?: string
}) {
  const router = useRouter()
  const [location, setLocation] = useState(initialArea || 'Yaba, Lagos')
  const [locationOpen, setLocationOpen] = useState(false)
  const [query, setQuery] = useState(initialQuery)
  const [locationQuery, setLocationQuery] = useState('')
  const [filters, setFilters] = useState<Filters>(
    initialCategory ? { ...NO_FILTERS, categories: [initialCategory] } : NO_FILTERS,
  )
  const [draft, setDraft] = useState<Filters>(NO_FILTERS)
  const [filterOpen, setFilterOpen] = useState(false)

  useEffect(() => {
    if (initialArea) {
      window.localStorage.setItem(LOCATION_KEY, initialArea)
      return
    }
    const saved = window.localStorage.getItem(LOCATION_KEY)
    if (saved) setLocation(saved)
  }, [initialArea])

  function chooseLocation(next: string) {
    setLocation(next)
    window.localStorage.setItem(LOCATION_KEY, next)
    setLocationOpen(false)
    setLocationQuery('')
  }

  const areas = useMemo(
    () => [...new Set(vendors.map((vendor) => areaOf(vendor.address)).filter((area): area is string => !!area))].sort(),
    [vendors],
  )

  const filterCount = countFilters(filters)
  const searching = query.trim().length > 0 || filterCount > 0
  const q = query.trim().toLowerCase()
  const located = vendors.filter((vendor) => inLocation(vendor.address, location))
  function matchesText(vendor: ListedVendor, filtersToUse: Filters) {
    const matchesQuery =
      !q ||
      vendor.businessName.toLowerCase().includes(q) ||
      vendor.category.toLowerCase().includes(q) ||
      (vendor.address ?? '').toLowerCase().includes(q)
    return matchesQuery && matchesFilters(vendor, filtersToUse)
  }
  const results = located.filter((vendor) => matchesText(vendor, filters))
  const draftCount = located.filter((vendor) => matchesText(vendor, draft)).length

  const recommended = located.filter((vendor) => vendor.featured)
  const rest = located.filter((vendor) => !vendor.featured)
  const firstName = user?.name.split(' ')[0] ?? null
  const suggestions = locationQuery.trim()
    ? POPULAR_AREAS.filter((area) => area.toLowerCase().includes(locationQuery.trim().toLowerCase()))
    : POPULAR_AREAS

  function openVendor(vendor: ListedVendor) {
    router.push(`/app/business/${vendor.id}`)
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10 lg:py-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="font-display text-[28px] font-semibold tracking-tight">Hey{firstName ? `, ${firstName}` : ' there'}</h1>
          <button
            type="button"
            onClick={() => setLocationOpen((open) => !open)}
            className="mt-2 flex items-center gap-1.5 text-sm font-medium"
            aria-expanded={locationOpen}
          >
            <MapPin className="h-4 w-4 text-[#1e3a8a]" aria-hidden />
            <span className="max-w-[240px] truncate">{location}</span>
            <ChevronDown className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/app/profile" className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1e3a8a] text-xs font-bold text-white" aria-label="Profile">
              {user.name.slice(0, 2).toUpperCase()}
            </Link>
          ) : (
            <Link href="/app/sign-in" className="flex items-center rounded-[20px] bg-[#1e3a8a] px-4 text-sm font-semibold text-white hover:bg-[#0b1638] h-12">
              Sign in
            </Link>
          )}
        </div>
      </div>

      {locationOpen ? (
        <div className="relative mt-3 max-w-md">
          <div className="absolute z-10 w-full rounded-3xl border border-[#e4e6eb] bg-white p-3 shadow-lg">
            <div className="flex h-12 items-center gap-2 rounded-full border border-[#c9ced8] px-4">
              <Search className="h-4 w-4" aria-hidden />
              <input
                autoFocus
                value={locationQuery}
                onChange={(event) => setLocationQuery(event.target.value)}
                placeholder="Neighbourhood, street or city"
                aria-label="Search for a location"
                className="w-full bg-transparent text-sm outline-none"
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && locationQuery.trim()) chooseLocation(locationQuery.trim())
                }}
              />
            </div>
            <p className="px-2 pb-1 pt-3 text-xs font-semibold text-[#4a4e57]">Popular in Lagos</p>
            <ul className="max-h-64 overflow-y-auto">
              {suggestions.map((area) => (
                <li key={area}>
                  <button type="button" onClick={() => chooseLocation(area)} className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left text-sm hover:bg-[#f5f6f8]">
                    <MapPin className="h-4 w-4 text-[#4a4e57]" aria-hidden />
                    {area}
                  </button>
                </li>
              ))}
              {locationQuery.trim() && suggestions.length === 0 ? (
                <li>
                  <button type="button" onClick={() => chooseLocation(locationQuery.trim())} className="w-full rounded-2xl px-2 py-2.5 text-left text-sm hover:bg-[#f5f6f8]">
                    Use “{locationQuery.trim()}”
                  </button>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      ) : null}

      <div className="mt-7 flex items-center gap-3">
        <label className="flex h-[52px] min-w-0 flex-1 items-center gap-3 rounded-full border border-[#c9ced8] bg-[#f5f6f8] px-5">
          <Search className="h-5 w-5 shrink-0" aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search businesses and services"
            className="w-full bg-transparent text-sm outline-none placeholder:text-[#7d818b]"
          />
          {query ? (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear search">
              <X className="h-4 w-4 text-[#7d818b]" />
            </button>
          ) : null}
        </label>
        <button
          type="button"
          onClick={() => {
            setDraft(filters)
            setFilterOpen((open) => !open)
          }}
          className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full border border-[#c9ced8] bg-white"
          aria-label="Filter"
          aria-expanded={filterOpen}
        >
          <SlidersHorizontal className="h-5 w-5" />
          {filterCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[#1e3a8a] px-1 text-[11px] font-bold text-white">
              {filterCount}
            </span>
          ) : null}
        </button>
      </div>

      {filterOpen ? (
        <div className="mt-3 rounded-3xl border border-[#e4e6eb] bg-[#f5f6f8] p-5">
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold">Filter</p>
            <button type="button" onClick={() => setFilterOpen(false)} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4">
            <p className="text-sm font-semibold">Rating</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {RATINGS.map((option) => (
                <Chip key={option.label} label={option.label} selected={draft.minRating === option.value} onClick={() => setDraft({ ...draft, minRating: option.value })} />
              ))}
            </div>
          </div>
          {areas.length > 0 ? (
            <div className="mt-4">
              <p className="text-sm font-semibold">Location</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {areas.map((area) => (
                  <Chip
                    key={area}
                    label={area}
                    selected={draft.areas.includes(area)}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        areas: draft.areas.includes(area) ? draft.areas.filter((item) => item !== area) : [...draft.areas, area],
                      })
                    }
                  />
                ))}
              </div>
            </div>
          ) : null}
          <div className="mt-4">
            <p className="text-sm font-semibold">Category</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {INTERESTS.map((category) => (
                <Chip
                  key={category}
                  label={category}
                  selected={draft.categories.includes(category)}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      categories: draft.categories.includes(category)
                        ? draft.categories.filter((item) => item !== category)
                        : [...draft.categories, category],
                    })
                  }
                />
              ))}
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <button type="button" onClick={() => setDraft(NO_FILTERS)} className="h-12 flex-1 rounded-full border border-[#c9ced8] bg-white text-sm font-semibold">
              Clear all
            </button>
            <button
              type="button"
              disabled={draftCount === 0}
              onClick={() => {
                setFilters(draft)
                setFilterOpen(false)
              }}
              className="h-12 flex-[1.4] rounded-full bg-[#1e3a8a] text-sm font-semibold text-white disabled:opacity-40"
            >
              {draftCount === 1 ? 'Show 1 result' : `Show ${draftCount} results`}
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <Empty title="Couldn’t load businesses" body={error} />
      ) : searching ? (
        <section className="mt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-bold tracking-tight">
              {results.length === 0 ? 'No results' : `${results.length} result${results.length === 1 ? '' : 's'}`}
            </h2>
            {filterCount > 0 ? (
              <button type="button" onClick={() => setFilters(NO_FILTERS)} className="text-sm font-semibold text-[#1e3a8a]">
                Clear filters
              </button>
            ) : null}
          </div>
          {results.length === 0 ? (
            <div>
              <Empty title="Nothing matches" body={location === 'Lagos' ? 'Try a different word or clear the filters.' : `Nothing in ${location} matches. Try another area, or look across Lagos.`} />
              {location !== 'Lagos' ? (
                <button type="button" onClick={() => chooseLocation('Lagos')} className="mx-auto mt-4 flex h-12 items-center rounded-full border border-[#c9ced8] px-5 text-sm font-semibold">
                  Show all of Lagos
                </button>
              ) : null}
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-[#e4e6eb] overflow-hidden rounded-[20px] border border-[#e4e6eb]">
              {results.map((vendor) => (
                <li key={vendor.id}>
                  <button type="button" onClick={() => openVendor(vendor)} className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-[#f5f6f8]">
                    <VendorFace vendor={vendor} className="h-16 w-16 shrink-0 rounded-2xl" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{vendor.businessName}</span>
                      <Rating vendor={vendor} />
                      <span className="block truncate text-[13px] text-[#4a4e57]">
                        {vendor.category}
                        {vendor.address ? ` · ${shortAddress(vendor.address)}` : ''}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : located.length === 0 && vendors.length > 0 ? (
        <div className="mt-8">
          <Empty title={`Nothing in ${location} yet`} body="Try another area, or look across Lagos." />
          <button type="button" onClick={() => chooseLocation('Lagos')} className="mx-auto mt-4 flex h-12 items-center rounded-full bg-[#1e3a8a] px-5 text-sm font-semibold text-white">
            Show all of Lagos
          </button>
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
            {INTERESTS.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setFilters({ ...NO_FILTERS, categories: [category] })}
                className="flex flex-col items-center gap-2"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e8edfa] text-sm font-semibold text-[#1e3a8a]">
                  {category.slice(0, 1)}
                </span>
                <span className="line-clamp-2 text-center text-xs font-medium">{category}</span>
              </button>
            ))}
          </div>
          <VendorRow title="Recommended" vendors={recommended} onOpen={openVendor} />
          {rest.length > 0 ? <VendorRow title="New to Veno" vendors={rest} onOpen={openVendor} /> : null}
        </>
      )}
    </div>
  )
}

function VendorRow({ title, vendors, onOpen }: { title: string; vendors: ListedVendor[]; onOpen: (vendor: ListedVendor) => void }) {
  return (
    <section className="mt-10">
      <h2 className="text-[15px] font-bold tracking-tight">{title}</h2>
      {vendors.length === 0 ? (
        <p className="mt-3 text-sm text-[#7d818b]">Nothing here yet.</p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {vendors.map((vendor) => (
            <li key={vendor.id}>
              <button type="button" onClick={() => onOpen(vendor)} className="w-full overflow-hidden rounded-[20px] border border-[#e4e6eb] text-left hover:border-[#c9ced8]">
                <VendorFace vendor={vendor} className="aspect-[4/3] w-full" />
                <span className="block p-3.5">
                  <span className="block truncate text-sm font-semibold">{vendor.businessName}</span>
                  <Rating vendor={vendor} />
                  {vendor.address ? <span className="mt-0.5 block truncate text-[13px] text-[#4a4e57]">{shortAddress(vendor.address)}</span> : null}
                  <span className="mt-1 block truncate text-[13px] font-semibold text-[#1e3a8a]">{vendor.category}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-8 rounded-[20px] border border-[#e4e6eb] px-6 py-10 text-center">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-[#4a4e57]">{body}</p>
    </div>
  )
}
