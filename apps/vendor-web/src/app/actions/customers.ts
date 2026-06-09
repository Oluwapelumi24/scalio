'use server'

import { revalidatePath } from 'next/cache'
import { ApiError, apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'

export type CustomerActionState = { error: string; success?: never } | { success: true; error?: never } | null

export async function updateCustomerNotes(
  customerId: string,
  _prev: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const token = await requireToken()
  const notes = formData.get('notes') as string

  try {
    await apiFetch(`/vendor-admin/customers/${customerId}/notes`, token, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    })
    revalidatePath(`/dashboard/customers/${customerId}`)
    return { success: true }
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
}
