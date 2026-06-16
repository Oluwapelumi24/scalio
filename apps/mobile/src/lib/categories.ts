import { Feather } from '@expo/vector-icons';
import type { Vendor } from '@scalio/shared-types';
import { INTERESTS, type Interest } from './interests';

type FeatherIconName = keyof typeof Feather.glyphMap;

interface CategoryMeta {
  icon: FeatherIconName;
  color: string;
  imageKeywords: string[];
}

export const CATEGORY_META: Record<Interest, CategoryMeta> = {
  Salon: { icon: 'scissors', color: '#FF6F91', imageKeywords: ['hair', 'salon'] },
  Barbershop: { icon: 'tool', color: '#2196F3', imageKeywords: ['barber', 'hair'] },
  Nails: { icon: 'star', color: '#E91E63', imageKeywords: ['nail', 'salon'] },
  'Wig & Hair Extensions': { icon: 'user', color: '#9C27B0', imageKeywords: ['hair', 'wig'] },
  Makeup: { icon: 'feather', color: '#FF9800', imageKeywords: ['makeup', 'cosmetics'] },
  Spa: { icon: 'sun', color: '#00BCD4', imageKeywords: ['spa', 'wellness'] },
  Massage: { icon: 'activity', color: '#4CAF50', imageKeywords: ['massage'] },
  'Fitness & Wellness': { icon: 'zap', color: '#FF5722', imageKeywords: ['fitness', 'gym'] },
  Healthcare: { icon: 'heart', color: '#F44336', imageKeywords: ['healthcare', 'clinic'] },
  'Lashes & Brows': { icon: 'eye', color: '#673AB7', imageKeywords: ['eyelash', 'beauty'] },
  'Tutors & Coaching': { icon: 'book', color: '#3F51B5', imageKeywords: ['tutoring', 'education'] },
  Photography: { icon: 'camera', color: '#607D8B', imageKeywords: ['photography', 'studio'] },
  Laundromat: { icon: 'wind', color: '#00ACC1', imageKeywords: ['laundry', 'cleaning'] },
  Cleaning: { icon: 'droplet', color: '#26A69A', imageKeywords: ['cleaning', 'home'] },
};

const DEFAULT_CATEGORY_META: CategoryMeta = {
  icon: 'image',
  color: '#999999',
  imageKeywords: ['beauty', 'salon'],
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
