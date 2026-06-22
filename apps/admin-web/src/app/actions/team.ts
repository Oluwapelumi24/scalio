'use server'

import { revalidatePath } from 'next/cache'
import { ApiError, apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'

type ActionState = { error: string } | null

export async function inviteAdminAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  if (!name?.trim() || !email?.trim()) return { error: 'Name and email are required.' }

  const token = await requireToken()
  try {
    await apiFetch('/super-admin/team', token, {
      method: 'POST',
      body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase() }),
    })
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
  revalidatePath('/dashboard/team')
  return null
}

export async function removeAdminAction(adminId: string): Promise<void> {
  const token = await requireToken()
  await apiFetch(`/super-admin/team/${adminId}`, token, { method: 'DELETE' })
  revalidatePath('/dashboard/team')
}
