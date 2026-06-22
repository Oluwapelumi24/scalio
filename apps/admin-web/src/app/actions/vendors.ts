'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ApiError, apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'

type ActionState = { error: string } | null

export async function createVendorAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const token = await requireToken()
  try {
    await apiFetch('/super-admin/vendors', token, {
      method: 'POST',
      body: JSON.stringify({
        slug: formData.get('slug'),
        businessName: formData.get('businessName'),
        category: formData.get('category'),
        address: formData.get('address') || undefined,
        logoUrl: formData.get('logoUrl') || undefined,
        themeColor: formData.get('themeColor') || undefined,
        featured: formData.get('featured') === 'true',
      }),
    })
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
  revalidatePath('/dashboard/vendors')
  return null
}

export async function updateVendorAction(vendorId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const token = await requireToken()
  try {
    await apiFetch(`/super-admin/vendors/${vendorId}`, token, {
      method: 'PATCH',
      body: JSON.stringify({
        slug: formData.get('slug') || undefined,
        businessName: formData.get('businessName') || undefined,
        category: formData.get('category') || undefined,
        address: formData.get('address') || undefined,
        logoUrl: formData.get('logoUrl') || undefined,
        themeColor: formData.get('themeColor') || undefined,
        featured: formData.has('featured') ? formData.get('featured') === 'true' : undefined,
      }),
    })
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
  revalidatePath(`/dashboard/vendors/${vendorId}`)
  revalidatePath('/dashboard/vendors')
  return null
}

export async function deleteVendorAction(vendorId: string): Promise<void> {
  const token = await requireToken()
  await apiFetch(`/super-admin/vendors/${vendorId}`, token, { method: 'DELETE' })
  revalidatePath('/dashboard/vendors')
  redirect('/dashboard/vendors')
}
