'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ApiError, apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'

export type PersonalisationState = { error: string } | null

async function putPreferences(body: Record<string, unknown>): Promise<PersonalisationState> {
  const token = await requireToken()
  try {
    await apiFetch('/vendor-admin/preferences', token, { method: 'PUT', body: JSON.stringify(body) })
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
  revalidatePath('/dashboard', 'layout')
  return null
}

/** Saving (or skipping) marks the interest screen as done so it isn't shown again. */
export async function saveInterests(interests: string[]): Promise<PersonalisationState> {
  const result = await putPreferences({ interests, completeInterests: true })
  if (result) return result
  redirect('/dashboard')
}

export async function setPinnedModules(pinnedModules: string[]): Promise<PersonalisationState> {
  return putPreferences({ pinnedModules })
}

export async function setHiddenModules(hiddenModules: string[]): Promise<PersonalisationState> {
  return putPreferences({ hiddenModules })
}

export async function resetHomeLayout(): Promise<PersonalisationState> {
  const token = await requireToken()
  try {
    await apiFetch('/vendor-admin/preferences/reset-home', token, { method: 'POST' })
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
  revalidatePath('/dashboard', 'layout')
  return null
}

/** Best-effort usage signal for ranking; failures are ignored. */
export async function recordModuleUsage(moduleId: string): Promise<void> {
  const token = await requireToken()
  await apiFetch('/vendor-admin/home/usage', token, {
    method: 'POST',
    body: JSON.stringify({ moduleId }),
  }).catch(() => {})
}
