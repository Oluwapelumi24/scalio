import { Feather } from '@expo/vector-icons';
import type { Vendor } from '@scalio/shared-types';
import { INTERESTS, type Interest } from './interests';

type FeatherIconName = keyof typeof Feather.glyphMap;

interface CategoryMeta {
  icon: FeatherIconName;
  color: string;
  imageKeywords: string[];
  imageUrl: string;
}

export const CATEGORY_META: Record<Interest, CategoryMeta> = {
  Salon: {
    icon: 'scissors',
    color: '#FF6F91',
    imageKeywords: ['hair', 'salon'],
    imageUrl: 'https://loremflickr.com/320/320/salon?lock=101',
  },
  Barbershop: {
    icon: 'tool',
    color: '#2196F3',
    imageKeywords: ['barber', 'hair'],
    imageUrl: 'https://loremflickr.com/320/320/barber?lock=102',
  },
  Nails: {
    icon: 'star',
    color: '#E91E63',
    imageKeywords: ['nail', 'salon'],
    imageUrl: 'https://loremflickr.com/320/320/manicure?lock=103',
  },
  'Wig & Hair Extensions': {
    icon: 'user',
    color: '#9C27B0',
    imageKeywords: ['hair', 'wig'],
    imageUrl: 'https://loremflickr.com/320/320/wig?lock=104',
  },
  Makeup: {
    icon: 'feather',
    color: '#FF9800',
    imageKeywords: ['makeup', 'cosmetics'],
    imageUrl: 'https://loremflickr.com/320/320/makeup?lock=105',
  },
  Spa: {
    icon: 'sun',
    color: '#00BCD4',
    imageKeywords: ['spa', 'wellness'],
    imageUrl: 'https://loremflickr.com/320/320/spa?lock=106',
  },
  Massage: {
    icon: 'activity',
    color: '#4CAF50',
    imageKeywords: ['massage'],
    imageUrl: 'https://loremflickr.com/320/320/massage?lock=107',
  },
  'Fitness & Wellness': {
    icon: 'zap',
    color: '#FF5722',
    imageKeywords: ['fitness', 'gym'],
    imageUrl: 'https://loremflickr.com/320/320/fitness?lock=108',
  },
  Healthcare: {
    icon: 'heart',
    color: '#F44336',
    imageKeywords: ['healthcare', 'clinic'],
    imageUrl: 'https://loremflickr.com/320/320/doctor?lock=109',
  },
  'Lashes & Brows': {
    icon: 'eye',
    color: '#673AB7',
    imageKeywords: ['eyelash', 'beauty'],
    imageUrl: 'https://loremflickr.com/320/320/eyelash?lock=110',
  },
  'Tutors & Coaching': {
    icon: 'book',
    color: '#3F51B5',
    imageKeywords: ['tutoring', 'education'],
    imageUrl: 'https://loremflickr.com/320/320/study?lock=111',
  },
  Photography: {
    icon: 'camera',
    color: '#607D8B',
    imageKeywords: ['photography', 'studio'],
    imageUrl: 'https://loremflickr.com/320/320/photography?lock=112',
  },
  Laundry: {
    icon: 'wind',
    color: '#00ACC1',
    imageKeywords: ['laundry', 'washing'],
    imageUrl: 'https://loremflickr.com/320/320/laundry?lock=113',
  },
  Cleaning: {
    icon: 'droplet',
    color: '#26A69A',
    imageKeywords: ['cleaning', 'home'],
    imageUrl: 'https://loremflickr.com/320/320/cleaning?lock=114',
  },
  Studio: {
    icon: 'aperture',
    color: '#8B5CF6',
    imageKeywords: ['studio', 'creative'],
    imageUrl: 'https://loremflickr.com/320/320/studio?lock=115',
  },
};

const DEFAULT_CATEGORY_META: CategoryMeta = {
  icon: 'image',
  color: '#999999',
  imageKeywords: ['beauty', 'salon'],
  imageUrl: 'https://loremflickr.com/320/320/beauty?lock=1',
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
