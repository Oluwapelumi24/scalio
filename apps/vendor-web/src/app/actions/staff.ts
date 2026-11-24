'use server'

import { revalidatePath } from 'next/cache'
import { ApiError, apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'

export type StaffActionState = { error: string } | { warning: string } | null

export async function createStaff(_prev: StaffActionState, formData: FormData): Promise<StaffActionState> {
  const token = await requireToken()
  const name = formData.get('name') as string
  const role = formData.get('role') as string
  const email = (formData.get('email') as string) || undefined
  const phone = (formData.get('phone') as string) || undefined

  if (!name || !role) return { error: 'Name and role are required.' }

  try {
    const created = await apiFetch<{ inviteSent?: boolean }>('/vendor-admin/staff', token, {
      method: 'POST',
      body: JSON.stringify({ name, role, email, phone }),
    })
    revalidatePath('/dashboard/storefront')
    if (email && created?.inviteSent === false) {
      return { warning: 'Added to the team, but the invite email didn’t send. They show as invite pending.' }
    }
    return null
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
}

export async function deleteStaff(staffId: string): Promise<StaffActionState> {
  const token = await requireToken()
  try {
    await apiFetch(`/vendor-admin/staff/${staffId}`, token, { method: 'DELETE' })
    revalidatePath('/dashboard/storefront')
    return null
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
}
