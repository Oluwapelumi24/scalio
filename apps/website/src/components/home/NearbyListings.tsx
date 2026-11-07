import Link from 'next/link'
import { MapPin, Star } from 'lucide-react'
import { JoinWaitlist, WAITLIST_CTA } from '@/components/site/JoinWaitlist'

const LISTINGS = [
  {
    name: 'Studio Ada',
    category: 'Salon',
    area: 'Lekki',
    distance: '0.6 km',
    next: 'Free today, 1:00 pm',
    rating: '4.9',
    image: '/people/stylist.jpg',
    alt: 'A stylist drying a client’s hair',
    position: 'object-[62%_center]',
  },
  {
    name: 'Nails by Kemi',
    category: 'Nails',
    area: 'Lekki',
    distance: '0.9 km',
    next: 'Free today, 3:15 pm',
    rating: '4.8',
    image: '/listings/nails.jpg',
    alt: 'A hand with a fresh manicure',
    position: 'object-[center_72%]',
  },
  {
    name: 'Serene Spa',
    category: 'Spa',
    area: 'Ikoyi',
    distance: '1.4 km',
    next: 'Free today, 2:30 pm',
    rating: '4.9',
    image: '/listings/spa.jpg',
    alt: 'A therapist pouring oil during a massage',
    position: 'object-[center_40%]',
  },
  {
    name: 'The Fade Room',
    category: 'Barbershop',
    area: 'Victoria Island',
    distance: '2.2 km',
    next: 'Free today, 4:30 pm',
    rating: '4.9',
    image: '/people/barber.jpg',
    alt: 'A barber trimming a client’s beard',
    position: 'object-[28%_18%]',
  },
  {
    name: 'Form Studio',
    category: 'Fitness',
    area: 'Lekki',
    distance: '2.8 km',
    next: 'Free today, 6:00 pm',
    rating: '4.8',
    image: '/listings/trainer.jpg',
    alt: 'A trainer coaching a client through a push-up',
    position: 'object-[center_45%]',
  },
  {
    name: 'Stitch & Co.',
    category: 'Tailoring',
    area: 'Surulere',
    distance: '11 km',
    next: 'Free today, 4:00 pm',
    rating: '4.9',
    image: '/listings/tailor.jpg',
    alt: 'A person in a tailored suit',
    position: 'object-[center_20%]',
  },
  {
    name: 'True Wash',
    category: 'Laundry',
    area: 'Yaba',
    distance: '14 km',
    next: 'Pickup from 5:00 pm',
    rating: '4.8',
    image: '/listings/laundry.jpg',
    alt: 'A person carrying a stack of folded clothes',
    position: 'object-[72%_center]',
  },
] as const

function ListingCard({
  place,
  action,
}: {
  place: (typeof LISTINGS)[number]
  action?: string
}) {
  return (
    <>
      <img
        src={place.image}
        alt={place.alt}
        className={`aspect-[4/3] w-full object-cover ${place.position}`}
      />
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
          <span className={action ? 'font-semibold text-navy' : 'font-semibold text-emerald-700'}>
            {action ?? place.next}
          </span>
        </div>
      </div>
    </>
  )
}

/** Horizontal row of places near the visitor, directly under the category grid. */
export function NearbyListings({ prelaunch = false }: { prelaunch?: boolean }) {
  return (
    <section aria-labelledby="nearby-heading" className="bg-white pb-6 sm:pb-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-6 px-6">
        <div>
          <h2
            id="nearby-heading"
            className="font-display text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl"
          >
            {prelaunch ? 'A first look at Lagos' : 'Listings close to you'}
          </h2>
          <p className="mt-3 flex items-center gap-1.5 text-slate-600">
            <MapPin className="h-4 w-4" aria-hidden />
            {prelaunch ? 'Preview · Lekki, Lagos' : 'Lekki, Lagos'}
          </p>
        </div>
        {prelaunch ? <JoinWaitlist /> : null}
      </div>

      <div className="mt-10 overflow-x-auto overscroll-x-contain scroll-px-6 snap-x snap-mandatory [scrollbar-width:none] sm:scroll-px-[max(1.5rem,calc((100%-72rem)/2+1.5rem))] [&::-webkit-scrollbar]:hidden">
        <ul className="flex w-max gap-4 px-6 pb-1 sm:px-[max(1.5rem,calc((100%-72rem)/2+1.5rem))]">
          {LISTINGS.map((place) => (
            <li key={place.name} className="w-[280px] shrink-0 snap-start sm:w-[300px]">
              {prelaunch ? (
                <Link
                  href={`/?service=${encodeURIComponent(place.category)}#waitlist`}
                  className="block overflow-hidden rounded-2xl border border-slate-200 bg-white transition-colors hover:border-navy/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                >
                  <ListingCard place={place} action={WAITLIST_CTA} />
                </Link>
              ) : (
                <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <ListingCard place={place} />
                </article>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
