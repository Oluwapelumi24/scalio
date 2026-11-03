export const VENDOR_WEB_URL = process.env.NEXT_PUBLIC_VENDOR_WEB_URL ?? 'http://localhost:3001'

export const VENDOR_REGISTER_URL = `${VENDOR_WEB_URL}/register`
export const VENDOR_LOGIN_URL = `${VENDOR_WEB_URL}/login`

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
    | 'camera'
    | 'shirt'
    | 'spray'
    | 'video'
    | 'ruler'
    | 'car'
    | 'dumbbell'
    | 'paw'
    | 'stethoscope'
  /** Duotone gradient stops used for the category's image tile. */
  gradient: [string, string]
  tagline: string
}

// Ordered so the strip and lists show the range: beauty is one group among many.
export const CATEGORIES: Category[] = [
  { name: 'Spa', icon: 'flower', gradient: ['#065F46', '#10B981'], tagline: 'Facials & body treatments' },
  { name: 'Laundry', icon: 'shirt', gradient: ['#1E40AF', '#60A5FA'], tagline: 'Wash, dry & fold' },
  { name: 'Tailoring', icon: 'ruler', gradient: ['#7C2D12', '#F59E0B'], tagline: 'Fittings, sewing & alterations' },
  { name: 'Salon', icon: 'scissors', gradient: ['#4338CA', '#7C3AED'], tagline: 'Cuts, color & styling' },
  { name: 'Photography', icon: 'camera', gradient: ['#18181B', '#52525B'], tagline: 'Portraits & event shoots' },
  { name: 'Cleaning', icon: 'spray', gradient: ['#166534', '#4ADE80'], tagline: 'Home & office cleaning' },
  { name: 'Massage', icon: 'heart-handshake', gradient: ['#075985', '#38BDF8'], tagline: 'Deep tissue & relaxation' },
  { name: 'Car Wash', icon: 'car', gradient: ['#0C4A6E', '#22D3EE'], tagline: 'Wash, valet & detailing' },
  { name: 'Fitness', icon: 'dumbbell', gradient: ['#9F1239', '#FB7185'], tagline: 'Personal training & classes' },
  { name: 'Barbershop', icon: 'scissors', gradient: ['#0F172A', '#334155'], tagline: 'Fades, shaves & grooming' },
  { name: 'Physio', icon: 'stethoscope', gradient: ['#134E4A', '#2DD4BF'], tagline: 'Physiotherapy & recovery' },
  { name: 'Makeup', icon: 'palette', gradient: ['#86198F', '#D946EF'], tagline: 'Glam, bridal & everyday' },
  { name: 'Studio', icon: 'video', gradient: ['#581C87', '#C026D3'], tagline: 'Recording & rehearsal space' },
  { name: 'Pet Grooming', icon: 'paw', gradient: ['#92400E', '#FBBF24'], tagline: 'Baths, trims & nail clips' },
  { name: 'Nails', icon: 'sparkles', gradient: ['#C2410C', '#FB923C'], tagline: 'Manicures & nail art' },
  { name: 'Lashes & Brows', icon: 'eye', gradient: ['#5B21B6', '#8B5CF6'], tagline: 'Lash lifts & brow shaping' },
  { name: 'Hair Styling', icon: 'wind', gradient: ['#9D174D', '#EC4899'], tagline: 'Blowouts, braids & updos' },
  { name: 'Wig & Hair Extensions', icon: 'gem', gradient: ['#92400E', '#F59E0B'], tagline: 'Wigs, weaves & extensions' },
]
