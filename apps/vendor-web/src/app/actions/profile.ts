'use server'

import { redirect } from 'next/navigation'
import { ApiError, apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'

export type ListingState = { error: string } | null

export async function saveListingAction(_prev: ListingState, formData: FormData): Promise<ListingState> {
  const token = await requireToken()
  const category = String(formData.get('category') ?? '')
  const address = String(formData.get('address') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const logoMediaId = String(formData.get('logoMediaId') ?? '').trim()
  const clearLogo = String(formData.get('clearLogo') ?? '') === '1'
  if (address.length < 3) return { error: 'Choose your state and local government.' }

  try {
    await apiFetch('/vendor-admin/profile', token, {
      method: 'PATCH',
      body: JSON.stringify({
        category,
        address,
        description,
        ...(logoMediaId ? { logoMediaId } : {}),
        ...(clearLogo ? { clearLogo: true } : {}),
      }),
    })
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }

  redirect('/dashboard')
}
