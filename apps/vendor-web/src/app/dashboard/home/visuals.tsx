import { Icon, type IconName } from '@/components/Icon'

const ICONS: Record<string, IconName> = {
  calendar: 'calendar',
  clock: 'clock',
  bell: 'bell',
  'credit-card': 'credit-card',
  image: 'image',
  'share-2': 'share',
  star: 'star',
  users: 'users',
  'user-plus': 'user-plus',
  'user-check': 'users',
  'user-minus': 'users',
  'user-x': 'users',
  'bar-chart-2': 'chart',
  'message-circle': 'message-circle',
  target: 'target',
  'map-pin': 'map-pin',
  'trending-up': 'trending-up',
  package: 'package',
  repeat: 'repeat',
  'plus-circle': 'plus',
  plus: 'plus',
  gift: 'gift',
  zap: 'zap',
  sliders: 'sliders',
  shield: 'shield',
  'dollar-sign': 'dollar',
  award: 'award',
  'edit-3': 'edit',
  inbox: 'inbox',
  'phone-call': 'phone',
  frown: 'star',
  list: 'calendar',
  'shopping-bag': 'shopping-bag',
}

const TINTS: Record<string, { bg: string; fg: string }> = {
  calendar: { bg: '#e8edfa', fg: '#1e3a8a' },
  clock: { bg: '#fde8d8', fg: '#9a3412' },
  bell: { bg: '#fde8d8', fg: '#9a3412' },
  'credit-card': { bg: '#e7f6ee', fg: '#166534' },
  image: { bg: '#fce7f3', fg: '#9d174d' },
  'share-2': { bg: '#e7f6ee', fg: '#166534' },
  star: { bg: '#fef3c7', fg: '#92400e' },
  users: { bg: '#e8edfa', fg: '#1e3a8a' },
  'user-plus': { bg: '#e8edfa', fg: '#1e3a8a' },
  'bar-chart-2': { bg: '#e8edfa', fg: '#1e3a8a' },
  'message-circle': { bg: '#fce7f3', fg: '#9d174d' },
  target: { bg: '#fce7f3', fg: '#9d174d' },
  'trending-up': { bg: '#fde8d8', fg: '#9a3412' },
  package: { bg: '#fef3c7', fg: '#92400e' },
  repeat: { bg: '#e7f6ee', fg: '#166534' },
  'plus-circle': { bg: '#e8edfa', fg: '#1e3a8a' },
  shield: { bg: '#e7f6ee', fg: '#166534' },
  'dollar-sign': { bg: '#e7f6ee', fg: '#166534' },
  award: { bg: '#fef3c7', fg: '#92400e' },
  'edit-3': { bg: '#fce7f3', fg: '#9d174d' },
  inbox: { bg: '#e8edfa', fg: '#1e3a8a' },
  'phone-call': { bg: '#fde8d8', fg: '#9a3412' },
  sliders: { bg: '#e8edfa', fg: '#1e3a8a' },
  'map-pin': { bg: '#fde8d8', fg: '#9a3412' },
}

const FALLBACK = { bg: '#e8edfa', fg: '#1e3a8a' }

export function iconFor(name: string): IconName {
  return ICONS[name] ?? 'sparkles'
}

export function tintFor(name: string) {
  return TINTS[name] ?? FALLBACK
}

export function IconTile({ name, className = 'h-11 w-11' }: { name: string; className?: string }) {
  const tint = tintFor(name)
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-2xl ${className}`}
      style={{ background: tint.bg, color: tint.fg }}
    >
      <Icon name={iconFor(name)} className="h-5 w-5" />
    </span>
  )
}

/** A small calendar, used when there is nothing booked yet. */
export function EmptyCalendar() {
  return (
    <svg viewBox="0 0 72 72" className="h-16 w-16 shrink-0" aria-hidden>
      <circle cx="36" cy="36" r="36" fill="#e8edfa" />
      <rect x="18" y="20" width="36" height="34" rx="8" fill="#ffffff" />
      <path d="M18 31h36" stroke="#1e3a8a" strokeWidth="2" />
      <rect x="26" y="16" width="4" height="8" rx="2" fill="#1e3a8a" />
      <rect x="42" y="16" width="4" height="8" rx="2" fill="#1e3a8a" />
      <rect x="26" y="37" width="10" height="8" rx="2" fill="#fde8d8" />
      <rect x="40" y="37" width="8" height="8" rx="2" fill="#e8edfa" />
      <circle cx="54" cy="52" r="9" fill="#1e3a8a" />
      <path d="M54 48v4.2l2.4 1.4" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
