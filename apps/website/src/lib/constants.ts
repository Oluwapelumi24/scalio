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
}

export const CATEGORIES: Category[] = [
  { name: 'Salon', icon: 'scissors' },
  { name: 'Barbershop', icon: 'scissors' },
  { name: 'Hair Styling', icon: 'wind' },
  { name: 'Nails', icon: 'sparkles' },
  { name: 'Wig & Hair Extensions', icon: 'gem' },
  { name: 'Makeup', icon: 'palette' },
  { name: 'Spa', icon: 'flower' },
  { name: 'Massage', icon: 'heart-handshake' },
  { name: 'Lashes & Brows', icon: 'eye' },
  { name: 'Photography', icon: 'camera' },
  { name: 'Laundry', icon: 'shirt' },
  { name: 'Cleaning', icon: 'spray' },
  { name: 'Studio', icon: 'video' },
]
