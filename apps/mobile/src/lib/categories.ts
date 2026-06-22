import { Feather } from '@expo/vector-icons';
import type { Vendor } from '@scalio/shared-types';
import { INTERESTS, type Interest } from './interests';

type FeatherIconName = keyof typeof Feather.glyphMap;

interface CategoryMeta {
  icon: FeatherIconName;
  color: string;
  imageKeywords: string[];
  // number = local require(), string = remote URI
  image: number | string;
}

export const CATEGORY_META: Record<Interest, CategoryMeta> = {
  Salon: {
    icon: 'scissors',
    color: '#FF6F91',
    imageKeywords: ['hair', 'salon'],
    image: require('../../assets/interests/salon.jpg'),
  },
  Barbershop: {
    icon: 'tool',
    color: '#2196F3',
    imageKeywords: ['barber', 'hair'],
    image: require('../../assets/interests/barbershop.jpg'),
  },
  'Hair Styling': {
    icon: 'scissors',
    color: '#F06292',
    imageKeywords: ['hair', 'styling'],
    image: require('../../assets/interests/hair-styling.jpg'),
  },
  Nails: {
    icon: 'star',
    color: '#E91E63',
    imageKeywords: ['nail', 'salon'],
    image: require('../../assets/interests/nails.jpg'),
  },
  'Wig & Hair Extensions': {
    icon: 'user',
    color: '#9C27B0',
    imageKeywords: ['hair', 'wig'],
    image: require('../../assets/interests/wig-extensions.jpg'),
  },
  Makeup: {
    icon: 'feather',
    color: '#FF9800',
    imageKeywords: ['makeup', 'cosmetics'],
    image: require('../../assets/interests/makeup.jpg'),
  },
  Spa: {
    icon: 'sun',
    color: '#00BCD4',
    imageKeywords: ['spa', 'wellness'],
    image: require('../../assets/interests/spa.jpg'),
  },
  Massage: {
    icon: 'activity',
    color: '#4CAF50',
    imageKeywords: ['massage'],
    image: require('../../assets/interests/massage.jpg'),
  },
  'Lashes & Brows': {
    icon: 'eye',
    color: '#673AB7',
    imageKeywords: ['eyelash', 'beauty'],
    image: require('../../assets/interests/lashes-brows.jpg'),
  },
  Photography: {
    icon: 'camera',
    color: '#607D8B',
    imageKeywords: ['photography', 'studio'],
    image: require('../../assets/interests/photography.jpg'),
  },
  Laundry: {
    icon: 'wind',
    color: '#00ACC1',
    imageKeywords: ['laundry', 'washing'],
    image: require('../../assets/interests/laundry.jpg'),
  },
  Cleaning: {
    icon: 'droplet',
    color: '#26A69A',
    imageKeywords: ['cleaning', 'home'],
    image: require('../../assets/interests/cleaning.jpg'),
  },
  Studio: {
    icon: 'aperture',
    color: '#8B5CF6',
    imageKeywords: ['studio', 'creative'],
    image: require('../../assets/interests/studio.jpg'),
  },
};

const DEFAULT_CATEGORY_META: CategoryMeta = {
  icon: 'image',
  color: '#999999',
  imageKeywords: ['beauty', 'salon'],
  image: 'https://loremflickr.com/320/320/beauty?lock=1',
};

export function getCategoryMeta(category: string): CategoryMeta {
  const match = INTERESTS.find((interest) => interest.toLowerCase() === category.toLowerCase());
  return match ? CATEGORY_META[match] : DEFAULT_CATEGORY_META;
}

function hashString(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return Math.abs(hash);
}

export function getVendorImageUrl(vendor: Pick<Vendor, 'slug' | 'logoUrl' | 'category'>): string {
  if (vendor.logoUrl) return vendor.logoUrl;
  const { imageKeywords } = getCategoryMeta(vendor.category);
  const seed = hashString(vendor.slug) % 10000;
  return `https://loremflickr.com/600/400/${imageKeywords.join(',')}?lock=${seed}`;
}

export function getVendorAccentColor(vendor: Pick<Vendor, 'category' | 'themeColor'>): string {
  return vendor.themeColor ?? getCategoryMeta(vendor.category).color;
}
