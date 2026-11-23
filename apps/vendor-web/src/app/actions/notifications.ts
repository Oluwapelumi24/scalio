'use server'

import { revalidatePath } from 'next/cache'
import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import type { VendorNotification } from '@/lib/notifications'

export async function listNotifications(): Promise<{ unread: number; items: VendorNotification[] }> {
  const token = await requireToken()
  return apiFetch<{ unread: number; items: VendorNotification[] }>('/vendor-admin/notifications', token)
}

export async function markNotificationsRead(): Promise<void> {
  const token = await requireToken()
  await apiFetch('/vendor-admin/notifications/read', token, { method: 'POST' })
  revalidatePath('/dashboard', 'layout')
}
