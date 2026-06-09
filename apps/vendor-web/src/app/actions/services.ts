'use server'

import { revalidatePath } from 'next/cache'
import { ApiError, apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'

export type ServiceActionState = { error: string } | null

export async function createService(_prev: ServiceActionState, formData: FormData): Promise<ServiceActionState> {
  const token = await requireToken()
  const name = formData.get('name') as string
  const durationMinutes = parseInt(formData.get('durationMinutes') as string, 10)
  const priceNaira = parseFloat(formData.get('priceNaira') as string)
  const paymentMode = formData.get('paymentMode') as string
  const depositPct = formData.get('depositPercent') as string

  if (!name || isNaN(durationMinutes) || isNaN(priceNaira)) {
    return { error: 'Please fill in all required fields.' }
  }

  const body: Record<string, unknown> = {
    name,
    durationMinutes,
    priceKobo: Math.round(priceNaira * 100),
    paymentMode: paymentMode || 'pay_on_arrival',
  }
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

export async function updateService(
  serviceId: string,
  _prev: ServiceActionState,
  formData: FormData,
): Promise<ServiceActionState> {
  const token = await requireToken()
  const name = formData.get('name') as string
  const durationMinutes = parseInt(formData.get('durationMinutes') as string, 10)
  const priceNaira = parseFloat(formData.get('priceNaira') as string)
  const paymentMode = formData.get('paymentMode') as string
  const depositPct = formData.get('depositPercent') as string

  const body: Record<string, unknown> = {
    name,
    durationMinutes,
    priceKobo: Math.round(priceNaira * 100),
    paymentMode,
  }
  if (paymentMode === 'deposit' && depositPct) {
    body.depositPercent = parseInt(depositPct, 10)
  }

  try {
    await apiFetch(`/vendor-admin/services/${serviceId}`, token, {
      method: 'PATCH',
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
