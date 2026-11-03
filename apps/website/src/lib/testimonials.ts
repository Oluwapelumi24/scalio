/**
 * What partners (businesses) and users (customers) say about Veno.
 *
 * Every entry below is a SAMPLE written to lay out the section. Replace each
 * one with a real quote (with the person's permission) and set `sample: false`.
 * Sample quotes show in development with a "Sample" label and are never shown
 * in a production build, so nothing made up reaches real visitors.
 */
export interface Testimonial {
  quote: string
  name: string
  /** Partners: business and area. Users: what they book and where. */
  detail: string
  audience: 'partner' | 'user'
  sample: boolean
}

export const TESTIMONIALS: Testimonial[] = [
  {
    audience: 'partner',
    sample: true,
    quote: 'Clients book massages from the link in our bio, even at midnight. We stopped answering "are you free on Saturday?" all day.',
    name: 'Sample partner',
    detail: 'Spa · Ikoyi',
  },
  {
    audience: 'partner',
    sample: true,
    quote: 'Pickups are booked with a deposit now, so no more wasted trips. When someone is not home, at least the run was paid for.',
    name: 'Sample partner',
    detail: 'Laundromat · Yaba',
  },
  {
    audience: 'partner',
    sample: true,
    quote: 'Our front desk sees every fitting on one screen, and each tailor only sees their own clients.',
    name: 'Sample partner',
    detail: 'Tailor · Surulere',
  },
  {
    audience: 'user',
    sample: true,
    quote: 'I can see real free times and book in a minute, without waiting for a reply on WhatsApp.',
    name: 'Sample user',
    detail: 'Books laundry pickups · Ikeja',
  },
  {
    audience: 'user',
    sample: true,
    quote: 'The reminder an hour before saved me from missing my appointment twice already.',
    name: 'Sample user',
    detail: 'Books physio · Surulere',
  },
  {
    audience: 'user',
    sample: true,
    quote: 'Knowing every business is reviewed before it is listed makes me comfortable trying somewhere new.',
    name: 'Sample user',
    detail: 'Books home cleaning · Lekki',
  },
]

/** The quotes a visitor may see: real ones always, samples only outside production. */
export function visibleTestimonials(audience?: Testimonial['audience']): Testimonial[] {
  const showSamples = process.env.NODE_ENV !== 'production'
  return TESTIMONIALS.filter((t) => (!audience || t.audience === audience) && (showSamples || !t.sample))
}
