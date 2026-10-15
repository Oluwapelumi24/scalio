'use server'

import { revalidatePath } from 'next/cache'
import { ApiError, apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import type { StaffDay } from '@/lib/staff'

export type StaffActionState = { error: string } | null

async function call(path: string, init: RequestInit, revalidate: string[]): Promise<StaffActionState> {
  const token = await requireToken()
  try {
    await apiFetch(path, token, init)
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
  for (const p of revalidate) revalidatePath(p)
  return null
}

export async function saveStaffSchedule(staffId: string, days: StaffDay[]): Promise<StaffActionState> {
  const body = days.map((d) => ({
    dayOfWeek: d.dayOfWeek,
    startsAtMinutes: d.startsAtMinutes,
    endsAtMinutes: d.endsAtMinutes,
    ...(d.breakStartsAtMinutes != null && d.breakEndsAtMinutes != null
      ? { breakStartsAtMinutes: d.breakStartsAtMinutes, breakEndsAtMinutes: d.breakEndsAtMinutes }
      : {}),
  }))
  return call(`/vendor-admin/staff/${staffId}/schedule`, { method: 'PUT', body: JSON.stringify({ days: body }) }, [
    `/dashboard/staff/${staffId}`,
  ])
}

export async function addStaffTimeOff(
  staffId: string,
  _prev: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const startDate = formData.get('startDate') as string
  const endDate = (formData.get('endDate') as string) || startDate
  const reason = (formData.get('reason') as string) || undefined
  if (!startDate) return { error: 'Choose the first day off.' }
  return call(
    `/vendor-admin/staff/${staffId}/time-off`,
    { method: 'POST', body: JSON.stringify({ startDate, endDate, reason }) },
    [`/dashboard/staff/${staffId}`],
  )
}

export async function removeStaffTimeOff(staffId: string, timeOffId: string): Promise<StaffActionState> {
  return call(`/vendor-admin/staff/${staffId}/time-off/${timeOffId}`, { method: 'DELETE' }, [`/dashboard/staff/${staffId}`])
}

/** Omit `staffId` to clock yourself; owners and managers may name someone else. */
export async function setClock(direction: 'in' | 'out', staffId?: string): Promise<StaffActionState> {
  return call(
    `/vendor-admin/attendance/clock-${direction}`,
    { method: 'POST', body: JSON.stringify(staffId ? { staffId } : {}) },
    ['/dashboard/attendance', '/dashboard'],
  )
}
