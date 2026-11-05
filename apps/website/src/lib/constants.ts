export const VENDOR_WEB_URL = process.env.NEXT_PUBLIC_VENDOR_WEB_URL ?? 'http://localhost:3001'

export const VENDOR_REGISTER_URL = `${VENDOR_WEB_URL}/register`
export const VENDOR_LOGIN_URL = `${VENDOR_WEB_URL}/login`

/** Canonical address: Vercel forwards venohq.com here. */
export const SITE_URL = 'https://www.venohq.com'

export interface Category {
  name: string
  icon:
    | 'scissors'
    | 'wind'
    | 'sparkles'
    | 'gem'
    | 'palette'
    | 'flower'
    | 'heart-handshake'
    | 'eye'
    | 'shirt'
    | 'spray'
    | 'ruler'
    | 'dumbbell'
    | 'stethoscope'
    | 'person-standing'
  /** Duotone gradient stops used for the category's image tile. */
  gradient: [string, string]
  tagline: string
  /** Heading on the home page, worded the way people search for the service. */
  heading: string
  description: string
}

// Ordered so the strip and lists show the range: beauty is one group among many.
export const CATEGORIES: Category[] = [
  {
    name: 'Spa', icon: 'flower', gradient: ['#065F46', '#10B981'], tagline: 'Facials & body treatments',
    heading: 'Spas in Lagos',
    description: 'Book facials, body scrubs and full spa days at reviewed spas in Lagos. Compare treatments and prices, then pick a time that is really free.',
  },
  {
    name: 'Laundry', icon: 'shirt', gradient: ['#1E40AF', '#60A5FA'], tagline: 'Wash, dry & fold',
    heading: 'Laundry and dry cleaning in Lagos',
    description: 'Book wash, dry and fold, ironing or dry cleaning, from everyday clothes to duvets and native wear. Know the price before you drop anything off.',
  },
  {
    name: 'Tailoring', icon: 'ruler', gradient: ['#7C2D12', '#F59E0B'], tagline: 'Fittings, sewing & alterations',
    heading: 'Tailors and fashion designers in Lagos',
    description: 'Book a tailor for fittings, sewing and alterations, from agbada and aso ebi to suits and dresses. Your fitting is held, so there is no waiting around.',
  },
  {
    name: 'Salon', icon: 'scissors', gradient: ['#4338CA', '#7C3AED'], tagline: 'Cuts, color & styling',
    heading: 'Hair salons in Lagos',
    description: 'Book a haircut, colour, relaxer or hair treatment at a salon near you. See each service, its price and how long it takes before you book.',
  },
  {
    name: 'Cleaning', icon: 'spray', gradient: ['#166534', '#4ADE80'], tagline: 'Home & office cleaning',
    heading: 'Home and office cleaning in Lagos',
    description: 'Book house cleaners and office cleaners for a regular clean, a deep clean or a move-in clean, on the day and at the time that suits you.',
  },
  {
    name: 'Massage', icon: 'heart-handshake', gradient: ['#075985', '#38BDF8'], tagline: 'Deep tissue & relaxation',
    heading: 'Massage in Lagos',
    description: 'Book a deep tissue, Swedish or relaxation massage, or a couples session. See how long it lasts and what it costs before you pay.',
  },
  {
    name: 'Pilates', icon: 'person-standing', gradient: ['#BE123C', '#FDA4AF'], tagline: 'Mat, reformer & private classes',
    heading: 'Pilates classes in Lagos',
    description: 'Find mat and reformer Pilates classes and private sessions, for first-timers and regulars alike. See the open times and reserve your place in a minute.',
  },
  {
    name: 'Fitness', icon: 'dumbbell', gradient: ['#9F1239', '#FB7185'], tagline: 'Personal training & classes',
    heading: 'Personal trainers and fitness classes in Lagos',
    description: 'Book a personal trainer or a group fitness class that fits around work. Choose your session, see the price and lock in your time.',
  },
  {
    name: 'Barbershop', icon: 'scissors', gradient: ['#0F172A', '#334155'], tagline: 'Fades, shaves & grooming',
    heading: 'Barbers in Lagos',
    description: 'Book a fade, haircut, beard trim or shave at a barbershop near you, and walk in at your time instead of joining a queue.',
  },
  {
    name: 'Physio', icon: 'stethoscope', gradient: ['#134E4A', '#2DD4BF'], tagline: 'Physiotherapy & recovery',
    heading: 'Physiotherapy in Lagos',
    description: 'Book an appointment with a physiotherapist for back and neck pain, sports injuries or recovery, with reminders so you keep every session.',
  },
  {
    name: 'Makeup', icon: 'palette', gradient: ['#86198F', '#D946EF'], tagline: 'Glam, bridal & everyday',
    heading: 'Makeup artists in Lagos',
    description: 'Book a makeup artist for weddings, owambes, shoots or everyday glam. Hold your date early with a deposit where the artist asks for one.',
  },
  {
    name: 'Nails', icon: 'sparkles', gradient: ['#C2410C', '#FB923C'], tagline: 'Manicures & nail art',
    heading: 'Nail salons in Lagos',
    description: 'Book manicures, pedicures, gel, acrylics and nail art at a nail tech near you. See the prices first and choose a time that suits you.',
  },
  {
    name: 'Lashes & Brows', icon: 'eye', gradient: ['#5B21B6', '#8B5CF6'], tagline: 'Lash lifts & brow shaping',
    heading: 'Lash and brow technicians in Lagos',
    description: 'Book lash extensions, lash lifts, brow shaping and tints. Compare services and prices, then pick a free time in a minute.',
  },
  {
    name: 'Hair Styling', icon: 'wind', gradient: ['#9D174D', '#EC4899'], tagline: 'Blowouts, braids & updos',
    heading: 'Hair stylists and braiders in Lagos',
    description: 'Book braids, cornrows, locs, silk presses, blowouts and bridal updos. Know how long your style will take before you sit down.',
  },
  {
    name: 'Wig & Hair Extensions', icon: 'gem', gradient: ['#92400E', '#F59E0B'], tagline: 'Wigs, weaves & extensions',
    heading: 'Wig installs and hair extensions in Lagos',
    description: 'Book wig installs and revamps, weaves and hair extensions with specialists who show their prices up front.',
  },
]
