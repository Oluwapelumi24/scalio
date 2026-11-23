import type { ReactNode } from 'react'
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

/** Shared frame for home empty-state illustrations. */
function EmptyBadge({
  fill,
  children,
  className = 'h-16 w-16',
}: {
  fill: string
  children: ReactNode
  className?: string
}) {
  return (
    <svg viewBox="0 0 72 72" className={`shrink-0 ${className}`} aria-hidden>
      <circle cx="36" cy="36" r="36" fill={fill} />
      {children}
    </svg>
  )
}

/** A small calendar, used when there is nothing booked yet. */
export function EmptyCalendar({ className }: { className?: string } = {}) {
  return (
    <EmptyBadge fill="#e8edfa" className={className}>
      <rect x="18" y="20" width="36" height="34" rx="8" fill="#ffffff" />
      <path d="M18 31h36" stroke="#1e3a8a" strokeWidth="2" />
      <rect x="26" y="16" width="4" height="8" rx="2" fill="#1e3a8a" />
      <rect x="42" y="16" width="4" height="8" rx="2" fill="#1e3a8a" />
      <rect x="26" y="37" width="10" height="8" rx="2" fill="#fde8d8" />
      <rect x="40" y="37" width="8" height="8" rx="2" fill="#e8edfa" />
      <circle cx="54" cy="52" r="9" fill="#1e3a8a" />
      <path d="M54 48v4.2l2.4 1.4" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </EmptyBadge>
  )
}

/** Chat bubble stack for an empty inbox. */
export function EmptyInbox({ className }: { className?: string } = {}) {
  return (
    <EmptyBadge fill="#fce7f3" className={className}>
      <rect x="16" y="22" width="32" height="22" rx="8" fill="#ffffff" />
      <path d="M24 44l-4 8 10-6" fill="#ffffff" />
      <rect x="22" y="28" width="16" height="3" rx="1.5" fill="#f9a8d4" />
      <rect x="22" y="35" width="11" height="3" rx="1.5" fill="#fbcfe8" />
      <circle cx="52" cy="24" r="10" fill="#9d174d" />
      <path
        d="M48.5 24h7M52 20.5v7"
        stroke="#ffffff"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </EmptyBadge>
  )
}

/** People + star for empty clients / favorites. */
export function EmptyClients({ className }: { className?: string } = {}) {
  return (
    <EmptyBadge fill="#e7f6ee" className={className}>
      <circle cx="28" cy="28" r="8" fill="#ffffff" />
      <path d="M16 48c0-6.6 5.4-12 12-12h0c6.6 0 12 5.4 12 12" fill="#ffffff" />
      <circle cx="46" cy="30" r="6" fill="#bbf7d0" />
      <path d="M38 48c0-4.4 3.6-8 8-8h2c4.4 0 8 3.6 8 8" fill="#bbf7d0" />
      <circle cx="54" cy="20" r="9" fill="#166534" />
      <path
        d="M54 15.8l1.2 2.5 2.7.4-2 1.9.5 2.7-2.4-1.3-2.4 1.3.5-2.7-2-1.9 2.7-.4z"
        fill="#ffffff"
      />
    </EmptyBadge>
  )
}
