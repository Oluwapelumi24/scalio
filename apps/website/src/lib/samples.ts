import { CATEGORIES } from '@/lib/constants'

export interface SampleService {
  name: string
  minutes: number
  price: number
  /** Amount that holds the time. The rest is paid at the visit. */
  deposit?: number
}

export interface SampleListing {
  slug: string
  name: string
  category: string
  area: string
  distance: string
  next: string
  rating: string
  reviews: number
  image?: string
  alt: string
  position?: string
  blurb: string
  services: SampleService[]
}

export const SAMPLE_TIMES = ['10:00 am', '11:30 am', '2:30 pm', '4:00 pm', '6:00 pm'] as const

const LISTINGS: SampleListing[] = [
  {
    slug: 'serene-spa',
    name: 'Serene Spa',
    category: 'Spa',
    area: 'Ikoyi',
    distance: '1.4 km',
    next: 'Free today, 2:30 pm',
    rating: '4.9',
    reviews: 128,
    image: '/listings/spa.jpg',
    alt: 'A therapist pouring oil during a massage',
    position: 'object-[center_40%]',
    blurb: 'Facials, body scrubs and massage in a quiet room in Ikoyi. The time you see is held on their calendar.',
    services: [
      { name: 'Deep tissue massage', minutes: 90, price: 25000, deposit: 7500 },
      { name: 'Signature facial', minutes: 60, price: 18000, deposit: 5000 },
      { name: 'Body scrub', minutes: 45, price: 15000 },
    ],
  },
  {
    slug: 'palm-house',
    name: 'Palm House',
    category: 'Spa',
    area: 'Lekki',
    distance: '2.1 km',
    next: 'Free today, 4:00 pm',
    rating: '4.8',
    reviews: 86,
    image: '/listings/spa.jpg',
    alt: 'A calm treatment room',
    position: 'object-[center_60%]',
    blurb: 'A small spa on the Lekki side. Book a facial or a couples hour and pay the rest when you arrive.',
    services: [
      { name: 'Relaxation massage', minutes: 60, price: 20000, deposit: 6000 },
      { name: 'Couples massage', minutes: 90, price: 45000, deposit: 15000 },
    ],
  },
  {
    slug: 'true-wash',
    name: 'True Wash',
    category: 'Laundry',
    area: 'Yaba',
    distance: '3.2 km',
    next: 'Pickup from 5:00 pm',
    rating: '4.8',
    reviews: 210,
    image: '/listings/laundry.jpg',
    alt: 'A person carrying a stack of folded clothes',
    position: 'object-[72%_center]',
    blurb: 'Wash, dry and fold, with pickup. You see the price before the bag leaves your house.',
    services: [
      { name: 'Wash, dry and fold', minutes: 30, price: 4500 },
      { name: 'Ironing', minutes: 20, price: 3000 },
      { name: 'Duvet', minutes: 40, price: 6500 },
    ],
  },
  {
    slug: 'fresh-fold',
    name: 'Fresh Fold',
    category: 'Laundry',
    area: 'Lekki',
    distance: '0.8 km',
    next: 'Free today, 11:00 am',
    rating: '4.7',
    reviews: 64,
    image: '/listings/laundry.jpg',
    alt: 'Folded clothes ready for pickup',
    blurb: 'Same-day laundry in Lekki. Drop a bag or book a pickup window.',
    services: [
      { name: 'Same-day wash', minutes: 30, price: 5000 },
      { name: 'Dry cleaning', minutes: 20, price: 3500 },
    ],
  },
  {
    slug: 'stitch-and-co',
    name: 'Stitch & Co.',
    category: 'Tailoring',
    area: 'Surulere',
    distance: '4.6 km',
    next: 'Free today, 4:00 pm',
    rating: '4.9',
    reviews: 173,
    image: '/listings/tailor.jpg',
    alt: 'A person in a tailored suit',
    position: 'object-[center_20%]',
    blurb: 'Fittings, sewing and alterations. Your slot is held, so you are not waiting in the shop.',
    services: [
      { name: 'Fitting', minutes: 45, price: 8000 },
      { name: 'Alteration', minutes: 30, price: 6000 },
      { name: 'Bespoke consult', minutes: 60, price: 15000, deposit: 5000 },
    ],
  },
  {
    slug: 'atelier-ngozi',
    name: 'Atelier Ngozi',
    category: 'Tailoring',
    area: 'Ikoyi',
    distance: '1.9 km',
    next: 'Free tomorrow, 10:00 am',
    rating: '4.8',
    reviews: 91,
    image: '/listings/tailor.jpg',
    alt: 'Fabric and a measuring tape on a work table',
    blurb: 'Aso ebi, suits and dresses. Book the fitting, then the sewing follows.',
    services: [
      { name: 'Aso ebi fitting', minutes: 60, price: 12000, deposit: 4000 },
      { name: 'Suit alteration', minutes: 40, price: 9000 },
    ],
  },
  {
    slug: 'studio-ada',
    name: 'Studio Ada',
    category: 'Salon',
    area: 'Lekki',
    distance: '0.6 km',
    next: 'Free today, 1:00 pm',
    rating: '4.9',
    reviews: 240,
    image: '/people/stylist.jpg',
    alt: 'A stylist drying a client’s hair',
    position: 'object-[62%_center]',
    blurb: 'Cuts, colour and treatments. The price on the card is the price at the chair.',
    services: [
      { name: 'Cut and finish', minutes: 60, price: 12000 },
      { name: 'Colour', minutes: 120, price: 35000, deposit: 10000 },
      { name: 'Treatment', minutes: 45, price: 15000 },
    ],
  },
  {
    slug: 'colour-room',
    name: 'Colour Room',
    category: 'Salon',
    area: 'Victoria Island',
    distance: '2.4 km',
    next: 'Free today, 3:00 pm',
    rating: '4.7',
    reviews: 77,
    image: '/people/stylist.jpg',
    alt: 'A salon chair by a window',
    blurb: 'Colour and silk presses on the Island. Deposit holds a longer appointment.',
    services: [
      { name: 'Silk press', minutes: 90, price: 25000, deposit: 8000 },
      { name: 'Trim', minutes: 30, price: 8000 },
    ],
  },
  {
    slug: 'bright-home',
    name: 'Bright Home',
    category: 'Cleaning',
    area: 'Lekki',
    distance: '1.1 km',
    next: 'Free today, 9:00 am',
    rating: '4.8',
    reviews: 132,
    blurb: 'Home cleans with a fixed price before anyone arrives. Regular or a one-off deep clean.',
    alt: '',
    services: [
      { name: 'Regular clean', minutes: 180, price: 20000 },
      { name: 'Deep clean', minutes: 300, price: 35000, deposit: 10000 },
    ],
  },
  {
    slug: 'clear-desk',
    name: 'Clear Desk',
    category: 'Cleaning',
    area: 'Yaba',
    distance: '3.8 km',
    next: 'Free tomorrow, 8:00 am',
    rating: '4.6',
    reviews: 48,
    alt: '',
    blurb: 'Office cleans before the team gets in. Book the morning and they are gone by opening.',
    services: [
      { name: 'Office clean', minutes: 120, price: 18000 },
      { name: 'Move-in clean', minutes: 240, price: 40000, deposit: 12000 },
    ],
  },
  {
    slug: 'quiet-room',
    name: 'Quiet Room',
    category: 'Massage',
    area: 'Ikoyi',
    distance: '1.6 km',
    next: 'Free today, 2:30 pm',
    rating: '4.9',
    reviews: 156,
    image: '/listings/spa.jpg',
    alt: 'A massage in progress',
    position: 'object-[center_35%]',
    blurb: 'Deep tissue and relaxation, one client at a time. The rest of the bill waits until you leave.',
    services: [
      { name: 'Deep tissue', minutes: 90, price: 25000, deposit: 7500 },
      { name: 'Swedish', minutes: 60, price: 18000, deposit: 5000 },
    ],
  },
  {
    slug: 'adas-hands',
    name: "Ada's Hands",
    category: 'Massage',
    area: 'Lekki',
    distance: '2.0 km',
    next: 'Free today, 5:00 pm',
    rating: '4.8',
    reviews: 69,
    image: '/listings/spa.jpg',
    alt: 'Hands preparing a treatment',
    blurb: 'Sports and relaxation massage in Lekki. A deposit keeps the hour.',
    services: [
      { name: 'Sports massage', minutes: 60, price: 20000, deposit: 6000 },
      { name: 'Relaxation', minutes: 60, price: 16000 },
    ],
  },
  {
    slug: 'reform-lekki',
    name: 'Reform Lekki',
    category: 'Pilates',
    area: 'Lekki',
    distance: '1.3 km',
    next: 'Free today, 7:00 am',
    rating: '4.9',
    reviews: 98,
    image: '/listings/trainer.jpg',
    alt: 'A trainer coaching a client',
    position: 'object-[center_45%]',
    blurb: 'Mat and reformer classes, plus private hours. Your place is reserved, not a waiting list at the door.',
    services: [
      { name: 'Mat class', minutes: 50, price: 8000 },
      { name: 'Reformer class', minutes: 50, price: 14000 },
      { name: 'Private session', minutes: 55, price: 25000, deposit: 8000 },
    ],
  },
  {
    slug: 'mat-and-co',
    name: 'Mat & Co.',
    category: 'Pilates',
    area: 'Victoria Island',
    distance: '2.7 km',
    next: 'Free today, 6:00 pm',
    rating: '4.7',
    reviews: 54,
    image: '/listings/trainer.jpg',
    alt: 'A studio floor',
    blurb: 'Evening mat classes on the Island. Book the spot before you leave work.',
    services: [
      { name: 'Evening mat', minutes: 50, price: 9000 },
      { name: 'Intro private', minutes: 55, price: 22000, deposit: 7000 },
    ],
  },
  {
    slug: 'form-studio',
    name: 'Form Studio',
    category: 'Fitness',
    area: 'Lekki',
    distance: '2.8 km',
    next: 'Free today, 6:00 pm',
    rating: '4.8',
    reviews: 141,
    image: '/listings/trainer.jpg',
    alt: 'A trainer coaching a client through a push-up',
    position: 'object-[center_45%]',
    blurb: 'Personal training and small classes. You pick the hour, they hold it.',
    services: [
      { name: 'Personal training', minutes: 60, price: 20000 },
      { name: 'Small class', minutes: 45, price: 7000 },
    ],
  },
  {
    slug: 'rise-athletics',
    name: 'Rise Athletics',
    category: 'Fitness',
    area: 'Yaba',
    distance: '4.1 km',
    next: 'Free tomorrow, 6:30 am',
    rating: '4.7',
    reviews: 73,
    image: '/listings/trainer.jpg',
    alt: 'A morning training session',
    blurb: 'Early sessions before work. Pay at the visit, or hold the hour with a deposit.',
    services: [
      { name: 'Morning PT', minutes: 60, price: 18000, deposit: 5000 },
      { name: 'Conditioning class', minutes: 45, price: 6000 },
    ],
  },
  {
    slug: 'the-fade-room',
    name: 'The Fade Room',
    category: 'Barbershop',
    area: 'Victoria Island',
    distance: '2.2 km',
    next: 'Free today, 4:30 pm',
    rating: '4.9',
    reviews: 312,
    image: '/people/barber.jpg',
    alt: 'A barber trimming a client’s beard',
    position: 'object-[28%_18%]',
    blurb: 'Fades, cuts and shaves. You walk in at your time instead of joining the queue.',
    services: [
      { name: 'Fade', minutes: 40, price: 5000 },
      { name: 'Cut and beard', minutes: 50, price: 7000 },
      { name: 'Shave', minutes: 30, price: 4000 },
    ],
  },
  {
    slug: 'crown-cuts',
    name: 'Crown Cuts',
    category: 'Barbershop',
    area: 'Surulere',
    distance: '5.0 km',
    next: 'Free today, 12:00 pm',
    rating: '4.8',
    reviews: 188,
    image: '/people/barber.jpg',
    alt: 'A barber at work',
    blurb: 'A neighbourhood chair with real free times. The price does not change at the chair.',
    services: [
      { name: 'Haircut', minutes: 35, price: 4000 },
      { name: 'Beard trim', minutes: 20, price: 2500 },
    ],
  },
  {
    slug: 'recover-lab',
    name: 'Recover Lab',
    category: 'Physio',
    area: 'Ikoyi',
    distance: '1.8 km',
    next: 'Free today, 11:00 am',
    rating: '4.9',
    reviews: 64,
    blurb: 'Physiotherapy for backs, necks and sports injuries. Each session is on the calendar before you arrive.',
    alt: '',
    services: [
      { name: 'Assessment', minutes: 60, price: 25000 },
      { name: 'Follow-up', minutes: 45, price: 18000 },
    ],
  },
  {
    slug: 'move-well',
    name: 'Move Well',
    category: 'Physio',
    area: 'Lekki',
    distance: '2.5 km',
    next: 'Free tomorrow, 3:00 pm',
    rating: '4.8',
    reviews: 41,
    alt: '',
    blurb: 'Recovery sessions in Lekki. A reminder lands before you need to leave.',
    services: [
      { name: 'Recovery session', minutes: 45, price: 20000 },
      { name: 'Sports rehab', minutes: 60, price: 28000, deposit: 8000 },
    ],
  },
  {
    slug: 'glam-by-tola',
    name: 'Glam by Tola',
    category: 'Makeup',
    area: 'Lekki',
    distance: '1.2 km',
    next: 'Free today, 8:00 am',
    rating: '4.9',
    reviews: 205,
    blurb: 'Bridal, owambe and everyday glam. A deposit holds the morning.',
    alt: '',
    services: [
      { name: 'Everyday glam', minutes: 60, price: 25000, deposit: 10000 },
      { name: 'Bridal', minutes: 120, price: 80000, deposit: 30000 },
    ],
  },
  {
    slug: 'soft-light',
    name: 'Soft Light',
    category: 'Makeup',
    area: 'Victoria Island',
    distance: '2.6 km',
    next: 'Free tomorrow, 7:00 am',
    rating: '4.7',
    reviews: 58,
    alt: '',
    blurb: 'Shoot and event makeup. You see the full figure before you book the date.',
    services: [
      { name: 'Event glam', minutes: 75, price: 35000, deposit: 12000 },
      { name: 'Shoot', minutes: 90, price: 45000, deposit: 15000 },
    ],
  },
  {
    slug: 'nails-by-kemi',
    name: 'Nails by Kemi',
    category: 'Nails',
    area: 'Lekki',
    distance: '0.9 km',
    next: 'Free today, 3:15 pm',
    rating: '4.8',
    reviews: 176,
    image: '/listings/nails.jpg',
    alt: 'A hand with a fresh manicure',
    position: 'object-[center_72%]',
    blurb: 'Manicures, gel and nail art. Pick the set, then a time that is actually free.',
    services: [
      { name: 'Gel manicure', minutes: 60, price: 12000 },
      { name: 'Nail art', minutes: 75, price: 18000, deposit: 5000 },
      { name: 'Pedicure', minutes: 50, price: 10000 },
    ],
  },
  {
    slug: 'polish-house',
    name: 'Polish House',
    category: 'Nails',
    area: 'Ikoyi',
    distance: '1.7 km',
    next: 'Free today, 1:30 pm',
    rating: '4.7',
    reviews: 83,
    image: '/listings/nails.jpg',
    alt: 'Nail colour on a table',
    blurb: 'A quiet nail studio in Ikoyi. The set you choose is the set you pay for.',
    services: [
      { name: 'Classic manicure', minutes: 45, price: 8000 },
      { name: 'Acrylic set', minutes: 90, price: 22000, deposit: 7000 },
    ],
  },
  {
    slug: 'lash-bar',
    name: 'Lash Bar',
    category: 'Lashes & Brows',
    area: 'Victoria Island',
    distance: '2.3 km',
    next: 'Free today, 12:30 pm',
    rating: '4.9',
    reviews: 119,
    blurb: 'Lash sets, lifts and brow shaping. Longer sets take a deposit so the chair stays yours.',
    alt: '',
    services: [
      { name: 'Lash lift', minutes: 60, price: 18000 },
      { name: 'Classic set', minutes: 90, price: 25000, deposit: 8000 },
      { name: 'Brow shape and tint', minutes: 30, price: 8000 },
    ],
  },
  {
    slug: 'brow-room',
    name: 'Brow Room',
    category: 'Lashes & Brows',
    area: 'Lekki',
    distance: '1.0 km',
    next: 'Free today, 4:15 pm',
    rating: '4.8',
    reviews: 72,
    alt: '',
    blurb: 'Brows and a quick lash lift between meetings. The time on the card is the time they start.',
    services: [
      { name: 'Brow lamination', minutes: 45, price: 15000 },
      { name: 'Brow tint', minutes: 20, price: 6000 },
    ],
  },
  {
    slug: 'braids-by-amaka',
    name: 'Braids by Amaka',
    category: 'Hair Styling',
    area: 'Surulere',
    distance: '4.4 km',
    next: 'Free tomorrow, 9:00 am',
    rating: '4.9',
    reviews: 260,
    image: '/people/stylist.jpg',
    alt: 'A stylist at work on a client’s hair',
    blurb: 'Knotless braids, cornrows and updos. You know how long you will sit before you book.',
    services: [
      { name: 'Knotless braids', minutes: 300, price: 45000, deposit: 15000 },
      { name: 'Cornrows', minutes: 120, price: 15000, deposit: 5000 },
      { name: 'Updo', minutes: 90, price: 20000, deposit: 7000 },
    ],
  },
  {
    slug: 'silk-lekki',
    name: 'Silk Lekki',
    category: 'Hair Styling',
    area: 'Lekki',
    distance: '1.5 km',
    next: 'Free today, 2:00 pm',
    rating: '4.8',
    reviews: 97,
    image: '/people/stylist.jpg',
    alt: 'A finished blowout',
    blurb: 'Blowouts and silk presses the same day. A short appointment, a clear price.',
    services: [
      { name: 'Blowout', minutes: 60, price: 12000 },
      { name: 'Silk press', minutes: 90, price: 22000, deposit: 7000 },
    ],
  },
  {
    slug: 'wig-atelier',
    name: 'Wig Atelier',
    category: 'Wig & Hair Extensions',
    area: 'Lekki',
    distance: '1.8 km',
    next: 'Free today, 11:30 am',
    rating: '4.9',
    reviews: 144,
    blurb: 'Installs, revamps and weaves. The deposit holds the chair for the hours the install takes.',
    alt: '',
    services: [
      { name: 'Wig install', minutes: 120, price: 25000, deposit: 10000 },
      { name: 'Revamp', minutes: 90, price: 18000, deposit: 6000 },
      { name: 'Weave', minutes: 180, price: 40000, deposit: 15000 },
    ],
  },
  {
    slug: 'crown-installs',
    name: 'Crown Installs',
    category: 'Wig & Hair Extensions',
    area: 'Victoria Island',
    distance: '2.9 km',
    next: 'Free tomorrow, 1:00 pm',
    rating: '4.7',
    reviews: 61,
    alt: '',
    blurb: 'Extensions and frontal installs on the Island. You see the full charge before you sit down.',
    services: [
      { name: 'Frontal install', minutes: 150, price: 35000, deposit: 12000 },
      { name: 'Extension refresh', minutes: 90, price: 20000, deposit: 7000 },
    ],
  },
]

export function categorySlug(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function categoryFromSlug(slug: string) {
  return CATEGORIES.find((category) => categorySlug(category.name) === slug) ?? null
}

export function listingsFor(category: string) {
  return LISTINGS.filter((listing) => listing.category === category)
}

export function listingBySlug(category: string, slug: string) {
  return LISTINGS.find((listing) => listing.category === category && listing.slug === slug) ?? null
}

export function formatNaira(amount: number) {
  return `₦${amount.toLocaleString('en-NG')}`
}
