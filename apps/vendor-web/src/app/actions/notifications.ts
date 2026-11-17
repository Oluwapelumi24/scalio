'use server'

import { revalidatePath } from 'next/cache'
import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'

export async function markNotificationsRead(): Promise<void> {
  const token = await requireToken()
  await apiFetch('/vendor-admin/notifications/read', token, { method: 'POST' })
  revalidatePath('/dashboard', 'layout')
}
