'use server'

import { ApiError, apiFetch } from '@/lib/api'

export type AvailabilityResult = { slots: string[] } | { error: string }

export async function getAvailability(
  vendorId: string,
  date: string,
  serviceIds: string[],
): Promise<AvailabilityResult> {
  const params = new URLSearchParams({ date })
  if (serviceIds.length > 0) params.set('serviceIds', serviceIds.join(','))
  try {
    const res = await apiFetch<{ slots: string[] }>(`/vendors/${vendorId}/availability?${params}`)
    return { slots: res.slots }
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
}
