import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NavigationProp } from '@react-navigation/native';
import type { ComponentProps } from 'react';
import type { Feather } from '@expo/vector-icons';
import type { RootStackParamList } from '../navigation/types';

/**
 * Advanced features. Each one opens on an intro page (what it does, three
 * benefits, Start now) until the business has started it once; after that the
 * menu goes straight to the feature.
 */
export type FeatureKey =
  | 'content_studio'
  | 'social_accounts'
  | 'ads'
  | 'leads'
  | 'feedback'
  | 'payroll'
  | 'online_payments';

/** Routes a feature can open: ones that take no params. */
type PlainRoute = {
  [K in keyof RootStackParamList]: undefined extends RootStackParamList[K] ? K : never;
}[keyof RootStackParamList];

export interface Feature {
  key: FeatureKey;
  /** Small label above the headline. */
  eyebrow: 'included' | 'new' | 'soon';
  name: string;
  icon: ComponentProps<typeof Feather>['name'];
  headline: string;
  body: string;
  bullets: [string, string, string];
  cta: string;
  route: PlainRoute;
  /** The example card under the benefits. */
  preview: { title: string; sub: string; figure: string; note: string };
}

export const FEATURES: Record<FeatureKey, Feature> = {
  content_studio: {
    key: 'content_studio',
    eyebrow: 'included',
    name: 'Content studio',
    icon: 'edit-3',
    headline: 'Post every week without the blank page',
    body: 'Add a photo and a few words. Scalio writes the caption and hashtags, and you plan when it goes out.',
    bullets: [
      'Captions and hashtags written for your business',
      'Plan posts for the days you want them out',
      'See what you posted and what is still a draft',
    ],
    cta: 'Start now',
    route: 'ContentStudio',
    preview: { title: 'Weekend special', sub: 'Planned for Saturday, 10:00', figure: 'Instagram · Facebook', note: 'Caption written for you' },
  },
  social_accounts: {
    key: 'social_accounts',
    eyebrow: 'included',
    name: 'Social accounts',
    icon: 'share-2',
    headline: 'Publish to Instagram and Facebook from Scalio',
    body: 'Connect your pages once, then post, run ads and answer messages without switching apps.',
    bullets: [
      'Post straight to your Instagram and Facebook pages',
      'Messages from both arrive in your Scalio inbox',
      'Needed for ads that bring in bookings',
    ],
    cta: 'Connect accounts',
    route: 'SocialAccounts',
    preview: { title: 'Your pages', sub: 'Instagram · Facebook', figure: 'Connected', note: 'Disconnect at any time' },
  },
  ads: {
    key: 'ads',
    eyebrow: 'new',
    name: 'Ads',
    icon: 'trending-up',
    headline: 'Get more customers with Instagram and Facebook ads',
    body: 'Pick who to reach and a daily budget. People who tap your ad book straight into your calendar.',
    bullets: [
      'Reach people near you who are likely to book',
      'Set a daily budget and stop whenever you like',
      'See how many bookings each ad brought in',
    ],
    cta: 'Start now',
    route: 'AdCampaigns',
    preview: { title: 'Weekend promo', sub: 'Lagos · 5 km around you', figure: '₦5,000 / day', note: 'About 4,000 people a day' },
  },
  leads: {
    key: 'leads',
    eyebrow: 'included',
    name: 'Leads',
    icon: 'inbox',
    headline: 'Turn enquiries into bookings',
    body: 'Keep everyone who asked about your business in one list, with a reminder when to follow up.',
    bullets: [
      'Add people from DMs, calls and walk-ins',
      'Get a nudge when a follow-up is due',
      'See who booked and who went quiet',
    ],
    cta: 'Start now',
    route: 'Leads',
    preview: { title: 'Ada asked about braids', sub: 'Follow up tomorrow', figure: 'Instagram DM', note: '3 follow-ups due this week' },
  },
  feedback: {
    key: 'feedback',
    eyebrow: 'included',
    name: 'Customer feedback',
    icon: 'star',
    headline: 'Know how every visit went',
    body: 'Clients rate their visit after each booking. Unhappy ones come to you first, so you can call them back.',
    bullets: [
      'A rating request after every completed booking',
      'Unhappy clients flagged for a call back',
      'Your average rating and how it is changing',
    ],
    cta: 'Start now',
    route: 'Feedback',
    preview: { title: 'Overall rating', sub: 'Last 30 days', figure: '4.8 ★', note: '36 ratings' },
  },
  payroll: {
    key: 'payroll',
    eyebrow: 'included',
    name: 'Payroll',
    icon: 'credit-card',
    headline: 'Pay your team on time, every month',
    body: 'Set a pay day and salaries once. Scalio reminds you when payroll opens and keeps a record of every payout.',
    bullets: [
      'Salaries and bank details for each team member',
      'A reminder when it is time to pay',
      'A record of who was paid and when',
    ],
    cta: 'Set up now',
    route: 'Payroll',
    preview: { title: 'October payroll', sub: 'Pay day: 28th', figure: '₦480,000', note: '4 people to pay' },
  },
  online_payments: {
    key: 'online_payments',
    eyebrow: 'included',
    name: 'Online payments',
    icon: 'shield',
    headline: 'Take deposits and cut no-shows',
    body: 'Add your bank account and clients can pay a deposit or in full when they book. Money goes straight to you.',
    bullets: [
      'Ask for a deposit on your busiest services',
      'Payments settle straight into your bank account',
      'Fewer no-shows and late cancellations',
    ],
    cta: 'Set up now',
    route: 'PaymentsSetup',
    preview: { title: 'Deposit received', sub: 'Box braids · Sat 10:00', figure: '₦10,000', note: 'Paid by card' },
  },
};

const KEY = (k: FeatureKey) => `feature_started:${k}`;
const started = new Set<FeatureKey>();
let loaded = false;

async function loadStarted() {
  if (loaded) return;
  const pairs = await AsyncStorage.multiGet(Object.keys(FEATURES).map((k) => KEY(k as FeatureKey))).catch(() => []);
  for (const [key, value] of pairs) if (value === '1') started.add(key.slice('feature_started:'.length) as FeatureKey);
  loaded = true;
}

export async function markFeatureStarted(k: FeatureKey) {
  started.add(k);
  await AsyncStorage.setItem(KEY(k), '1').catch(() => {});
}

/** Opens a feature, or its intro page the first time. */
export async function openFeature(navigation: NavigationProp<RootStackParamList>, k: FeatureKey) {
  await loadStarted();
  if (started.has(k)) navigation.navigate(FEATURES[k].route as never);
  else navigation.navigate('FeatureIntro', { feature: k });
}
