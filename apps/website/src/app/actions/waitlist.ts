'use server'

import { ApiError, apiFetch } from '@/lib/api'

export type WaitlistState = { error: string } | { success: true } | null

export async function joinWaitlistAction(
  _prev: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  const email = formData.get('email') as string
  const audience = formData.get('audience') as string

  try {
    await apiFetch('/waitlist', {
      method: 'POST',
      body: JSON.stringify({ email, audience }),
    })
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }

  return { success: true }
}
