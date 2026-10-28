import { Feather } from '@expo/vector-icons';
import type { ImageSourcePropType } from 'react-native';
import type { Vendor } from '@scalio/shared-types';
import { INTERESTS, type Interest } from './interests';

type FeatherIconName = keyof typeof Feather.glyphMap;

interface CategoryMeta {
  icon: FeatherIconName;
  color: string;
  // number = local require(), string = remote URI
  image: number | string;
}

export const CATEGORY_META: Record<Interest, CategoryMeta> = {
  Salon: {
    icon: 'scissors',
    color: '#FF6F91',
    image: require('../../assets/interests/salon.jpg'),
  },
  Barbershop: {
    icon: 'tool',
    color: '#2196F3',
    image: require('../../assets/interests/barbershop.jpg'),
  },
  'Hair Styling': {
    icon: 'scissors',
    color: '#F06292',
    image: require('../../assets/interests/hair-styling.jpg'),
  },
  Nails: {
    icon: 'star',
    color: '#E91E63',
    image: require('../../assets/interests/nails.jpg'),
  },
  'Wig & Hair Extensions': {
    icon: 'user',
    color: '#9C27B0',
    image: require('../../assets/interests/wig-extensions.jpg'),
  },
  Makeup: {
    icon: 'feather',
    color: '#FF9800',
    image: require('../../assets/interests/makeup.jpg'),
  },
  Spa: {
    icon: 'sun',
    color: '#00BCD4',
    image: require('../../assets/interests/spa.jpg'),
  },
  Massage: {
    icon: 'activity',
    color: '#4CAF50',
    image: require('../../assets/interests/massage.jpg'),
  },
  'Lashes & Brows': {
    icon: 'eye',
    color: '#673AB7',
    image: require('../../assets/interests/lashes-brows.jpg'),
  },
  Photography: {
    icon: 'camera',
    color: '#607D8B',
    image: require('../../assets/interests/photography.jpg'),
  },
  Laundry: {
    icon: 'wind',
    color: '#00ACC1',
    image: require('../../assets/interests/laundry.jpg'),
  },
  Cleaning: {
    icon: 'droplet',
    color: '#26A69A',
    image: require('../../assets/interests/cleaning.jpg'),
  },
  Studio: {
    icon: 'aperture',
    color: '#8B5CF6',
    image: require('../../assets/interests/studio.jpg'),
  },
};

const DEFAULT_CATEGORY_META: CategoryMeta = {
  icon: 'image',
  color: '#999999',
  image: require('../../assets/interests/salon.jpg'),
};

// Vendor categories that predate the interest taxonomy
const CATEGORY_ALIASES: Record<string, Interest> = {
  barbing: 'Barbershop',
  lashes: 'Lashes & Brows',
  brows: 'Lashes & Brows',
  laundromat: 'Laundry',
};

function findInterest(category: string): Interest | undefined {
  const key = category.toLowerCase();
  return INTERESTS.find((interest) => interest.toLowerCase() === key) ?? CATEGORY_ALIASES[key];
}

export function getCategoryMeta(category: string): CategoryMeta {
  const match = findInterest(category);
  return match ? CATEGORY_META[match] : DEFAULT_CATEGORY_META;
}

function hashString(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return Math.abs(hash);
}

export function getVendorImageSource(
  vendor: Pick<Vendor, 'slug' | 'logoUrl' | 'category'>,
): ImageSourcePropType {
  if (vendor.logoUrl) return { uri: vendor.logoUrl };
  const match = findInterest(vendor.category);
  // Uncategorised vendors get a stable pick from the bundled photos
  const interest = match ?? INTERESTS[hashString(vendor.slug) % INTERESTS.length];
  return CATEGORY_META[interest].image as ImageSourcePropType;
}

export function getVendorAccentColor(vendor: Pick<Vendor, 'category' | 'themeColor'>): string {
  return vendor.themeColor ?? getCategoryMeta(vendor.category).color;
}
