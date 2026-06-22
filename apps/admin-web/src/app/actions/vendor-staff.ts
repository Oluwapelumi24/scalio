'use server'

import { revalidatePath } from 'next/cache'
import { ApiError, apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'

type ActionState = { error: string } | null

export async function createStaffAction(vendorId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const token = await requireToken()
  try {
    await apiFetch(`/super-admin/vendors/${vendorId}/staff`, token, {
      method: 'POST',
      body: JSON.stringify({
        name: formData.get('name'),
        role: formData.get('role'),
        email: formData.get('email') || undefined,
        phone: formData.get('phone') || undefined,
      }),
    })
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
  revalidatePath(`/dashboard/vendors/${vendorId}/staff`)
  return null
}

export async function deleteStaffAction(vendorId: string, staffId: string): Promise<void> {
  const token = await requireToken()
  await apiFetch(`/super-admin/vendors/${vendorId}/staff/${staffId}`, token, { method: 'DELETE' })
  revalidatePath(`/dashboard/vendors/${vendorId}/staff`)
}
