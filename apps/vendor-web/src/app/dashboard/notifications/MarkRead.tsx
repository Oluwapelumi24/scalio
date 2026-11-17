'use client'

import { useEffect } from 'react'
import { markNotificationsRead } from '@/app/actions/notifications'

/** Opening the list counts as seeing it. The dots stay until the next visit. */
export function MarkRead({ unread }: { unread: number }) {
  useEffect(() => {
    if (unread > 0) void markNotificationsRead()
  }, [unread])
  return null
}
