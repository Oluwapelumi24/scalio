'use server'

import { revalidatePath } from 'next/cache'
import { ApiError, apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'

type ActionState = { error: string } | null

export async function createServiceAction(vendorId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const token = await requireToken()
  const priceNaira = parseFloat(formData.get('priceNaira') as string)
  try {
    await apiFetch(`/super-admin/vendors/${vendorId}/services`, token, {
      method: 'POST',
      body: JSON.stringify({
        serviceType: formData.get('serviceType') || 'service',
        name: formData.get('name'),
        durationMinutes: parseInt(formData.get('durationMinutes') as string),
        priceKobo: Math.round(priceNaira * 100),
        paymentMode: formData.get('paymentMode') || 'pay_on_arrival',
        depositPercent: formData.get('depositPercent') ? parseInt(formData.get('depositPercent') as string) : undefined,
      }),
    })
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
  revalidatePath(`/dashboard/vendors/${vendorId}/services`)
  return null
}

export async function deleteServiceAction(vendorId: string, serviceId: string): Promise<void> {
  const token = await requireToken()
  await apiFetch(`/super-admin/vendors/${vendorId}/services/${serviceId}`, token, { method: 'DELETE' })
  revalidatePath(`/dashboard/vendors/${vendorId}/services`)
}
