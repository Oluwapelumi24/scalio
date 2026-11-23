export interface VendorNotification {
  id: string
  type: 'booking_new' | 'booking_cancelled' | 'payment_received' | 'review' | 'inbox_handoff'
  title: string
  body: string
  bookingId: string | null
  conversationId: string | null
  createdAt: string
  unread: boolean
}

export function notificationAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  if (hours < 48) return 'Yesterday'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function notificationHref(item: VendorNotification): string | null {
  if (item.conversationId) return `/dashboard/inbox?c=${item.conversationId}`
  if (item.type === 'review') return '/dashboard/feedback'
  if (item.bookingId) return '/dashboard/bookings'
  return null
}
