'use server'

import { revalidatePath } from 'next/cache'
import { ApiError, apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'

export type ServiceActionState = { error: string } | null

export async function createService(_prev: ServiceActionState, formData: FormData): Promise<ServiceActionState> {
  const token = await requireToken()
  const name = formData.get('name') as string
  const durationRaw = formData.get('durationMinutes') as string
  const priceRaw = formData.get('priceNaira') as string
  const paymentMode = formData.get('paymentMode') as string
  const depositPct = formData.get('depositPercent') as string
  const serviceType = (formData.get('serviceType') as string) || 'service'

  if (!name) return { error: 'Name is required.' }

  const body: Record<string, unknown> = {
    serviceType,
    name,
    paymentMode: paymentMode || 'pay_on_arrival',
  }
  if (durationRaw) body.durationMinutes = parseInt(durationRaw, 10)
  if (priceRaw) body.priceKobo = Math.round(parseFloat(priceRaw) * 100)
  if (paymentMode === 'deposit' && depositPct) {
    body.depositPercent = parseInt(depositPct, 10)
  }

  try {
    await apiFetch('/vendor-admin/services', token, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    revalidatePath('/dashboard/services')
    return null
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
}

export async function deleteService(serviceId: string): Promise<ServiceActionState> {
  const token = await requireToken()
  try {
    await apiFetch(`/vendor-admin/services/${serviceId}`, token, { method: 'DELETE' })
    revalidatePath('/dashboard/services')
    return null
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
}
