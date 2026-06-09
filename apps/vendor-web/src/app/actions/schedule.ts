'use server'

import { revalidatePath } from 'next/cache'
import { ApiError, apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'

export type ScheduleActionState = { error: string } | null

interface HoursEntry {
  dayOfWeek: number
  opensAtMinutes: number
  closesAtMinutes: number
}

export async function setBusinessHours(days: HoursEntry[]): Promise<ScheduleActionState> {
  const token = await requireToken()
  try {
    await apiFetch('/vendor-admin/schedule/hours', token, {
      method: 'PUT',
      body: JSON.stringify({ days }),
    })
    revalidatePath('/dashboard/schedule')
    return null
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
}

export async function addBlackoutDate(
  _prev: ScheduleActionState,
  formData: FormData,
): Promise<ScheduleActionState> {
  const token = await requireToken()
  const date = formData.get('date') as string
  const reason = (formData.get('reason') as string) || undefined

  if (!date) return { error: 'Please select a date.' }

  try {
    await apiFetch('/vendor-admin/schedule/blackout-dates', token, {
      method: 'POST',
      body: JSON.stringify({ date, reason }),
    })
    revalidatePath('/dashboard/schedule')
    return null
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
}

export async function removeBlackoutDate(blackoutId: string): Promise<ScheduleActionState> {
  const token = await requireToken()
  try {
    await apiFetch(`/vendor-admin/schedule/blackout-dates/${blackoutId}`, token, {
      method: 'DELETE',
    })
    revalidatePath('/dashboard/schedule')
    return null
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
}
