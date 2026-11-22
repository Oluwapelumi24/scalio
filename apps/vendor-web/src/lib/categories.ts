import { BUSINESS_CATEGORIES, type BusinessCategory } from '@veno/shared-types'

export { BUSINESS_CATEGORIES, type BusinessCategory }

export interface VendorProfile {
  businessName: string
  category: string
  address: string | null
  description: string | null
  logoUrl: string | null
  approvalStatus: 'pending_review' | 'approved' | 'rejected'
  reviewNote: string | null
  slug: string
}

export function listingReady(profile: VendorProfile | null): boolean {
  return !!profile && profile.category !== 'Other' && !!profile.address?.trim()
}

/** Example package / service names shown on the services empty state and forms. */
export function serviceExamples(category: string | null | undefined): {
  packagesHelp: string
  packagePlaceholder: string
  servicesHelp: string
  servicePlaceholder: string
} {
  switch (category) {
    case 'Laundry':
      return {
        packagesHelp: 'Booking types customers select — e.g. “Self Service Wash”, “Drop Off”',
        packagePlaceholder: 'e.g. Self Service Wash',
        servicesHelp: 'What customers are booking — e.g. “Duvet Laundry”, “Clothing Laundry”',
        servicePlaceholder: 'e.g. Duvet Laundry',
      }
    case 'Spa':
    case 'Massage':
    case 'Physio':
      return {
        packagesHelp: 'Booking types customers select — e.g. “Relax package”, “Deep tissue”',
        packagePlaceholder: 'e.g. Relax package',
        servicesHelp: 'What customers are booking — e.g. “Swedish massage”, “Hot stone”',
        servicePlaceholder: 'e.g. Swedish massage',
      }
    case 'Barbershop':
      return {
        packagesHelp: 'Booking types customers select — e.g. “Cut & beard”, “Kids cut”',
        packagePlaceholder: 'e.g. Cut & beard',
        servicesHelp: 'What customers are booking — e.g. “Skin fade”, “Beard trim”',
        servicePlaceholder: 'e.g. Skin fade',
      }
    case 'Nails':
      return {
        packagesHelp: 'Booking types customers select — e.g. “Mani & pedi”, “Gel set”',
        packagePlaceholder: 'e.g. Mani & pedi',
        servicesHelp: 'What customers are booking — e.g. “Gel polish”, “Acrylic fill”',
        servicePlaceholder: 'e.g. Gel polish',
      }
    case 'Lashes & Brows':
      return {
        packagesHelp: 'Booking types customers select — e.g. “Lash & brow”, “Full set”',
        packagePlaceholder: 'e.g. Lash & brow',
        servicesHelp: 'What customers are booking — e.g. “Classic lashes”, “Brow wax”',
        servicePlaceholder: 'e.g. Classic lashes',
      }
    case 'Makeup':
      return {
        packagesHelp: 'Booking types customers select — e.g. “Bridal glam”, “Soft glam”',
        packagePlaceholder: 'e.g. Bridal glam',
        servicesHelp: 'What customers are booking — e.g. “Evening makeup”, “Trial”',
        servicePlaceholder: 'e.g. Evening makeup',
      }
    case 'Wig & Hair Extensions':
      return {
        packagesHelp: 'Booking types customers select — e.g. “Install”, “Retouch”',
        packagePlaceholder: 'e.g. Install package',
        servicesHelp: 'What customers are booking — e.g. “Closure install”, “Sew-in”',
        servicePlaceholder: 'e.g. Closure install',
      }
    case 'Cleaning':
      return {
        packagesHelp: 'Booking types customers select — e.g. “Deep clean”, “Weekly tidy”',
        packagePlaceholder: 'e.g. Deep clean',
        servicesHelp: 'What customers are booking — e.g. “2-bedroom clean”, “Office clean”',
        servicePlaceholder: 'e.g. 2-bedroom clean',
      }
    case 'Tailoring':
      return {
        packagesHelp: 'Booking types customers select — e.g. “Alterations”, “Custom fit”',
        packagePlaceholder: 'e.g. Alterations',
        servicesHelp: 'What customers are booking — e.g. “Hem trousers”, “Agbada”',
        servicePlaceholder: 'e.g. Hem trousers',
      }
    case 'Pilates':
    case 'Fitness':
      return {
        packagesHelp: 'Booking types customers select — e.g. “Intro pack”, “Private session”',
        packagePlaceholder: 'e.g. Intro pack',
        servicesHelp: 'What customers are booking — e.g. “1:1 session”, “Group class”',
        servicePlaceholder: 'e.g. 1:1 session',
      }
    case 'Salon':
    case 'Hair Styling':
    default:
      return {
        packagesHelp: 'Booking types customers select — e.g. “Wash & style”, “Colour package”',
        packagePlaceholder: 'e.g. Wash & style',
        servicesHelp: 'What customers are booking — e.g. “Box braids”, “Silk press”',
        servicePlaceholder: 'e.g. Box braids',
      }
  }
}
