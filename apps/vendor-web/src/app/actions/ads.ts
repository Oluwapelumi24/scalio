'use server'

import { revalidatePath } from 'next/cache'
import { ApiError, apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import type {
  AdCampaign, AdCheckout, AdCopyDraft, AdDestination, AdObjective, AdPaymentRoute, AdQuote, AdTargeting, InterestOption, LocationOption, NewAdCampaign,
} from '@/lib/ads'

async function call<T = unknown>(path: string, init: RequestInit = { method: 'GET' }, paths: string[] = []): Promise<{ data?: T; error?: string }> {
  const token = await requireToken()
  try {
    const data = await apiFetch<T>(path, token, init)
    for (const p of paths) revalidatePath(p)
    return { data }
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
}

const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) })
const ADS = ['/dashboard/ads']

export async function searchAdInterests(q: string) {
  return call<InterestOption[]>(`/vendor-admin/ads/targeting/interests?q=${encodeURIComponent(q)}`)
}

export async function suggestAdInterests(names: string[]) {
  return call<InterestOption[]>(`/vendor-admin/ads/targeting/interest-suggestions?names=${encodeURIComponent(names.join('|'))}`)
}

export async function searchAdLocations(q: string) {
  return call<LocationOption[]>(`/vendor-admin/ads/targeting/locations?q=${encodeURIComponent(q)}`)
}

export async function estimateAdReach(body: { objective: AdObjective; destination: AdDestination; targeting: AdTargeting }) {
  return call<{ estimate: { lower: number; upper: number } | null }>('/vendor-admin/ads/targeting/reach', post(body))
}

export async function quoteAd(body: { dailyBudgetKobo: number; days: number; route: AdPaymentRoute }) {
  return call<AdQuote>('/vendor-admin/ads/quote', post(body))
}

export async function draftAdCopy(body: { objective: AdObjective; destination: AdDestination; brief: string | null }) {
  return call<AdCopyDraft>('/vendor-admin/ads/copy', post(body))
}

export async function createAdCampaign(body: NewAdCampaign) {
  return call<AdCampaign>('/vendor-admin/ads/campaigns', post(body), ADS)
}

export async function checkoutAdCampaign(id: string) {
  return call<AdCheckout>(`/vendor-admin/ads/campaigns/${id}/checkout`, post({ from: 'web' }), ADS)
}

export async function extendAdCampaign(id: string, days: number) {
  return call<AdCheckout>(`/vendor-admin/ads/campaigns/${id}/extend`, post({ days, from: 'web' }), [...ADS, `/dashboard/ads/campaigns/${id}`])
}

export async function retryAdCampaign(id: string) {
  return call<AdCampaign>(`/vendor-admin/ads/campaigns/${id}/retry`, post({}), [...ADS, `/dashboard/ads/campaigns/${id}`])
}

export async function cancelAdCampaign(id: string) {
  return call<AdCampaign>(`/vendor-admin/ads/campaigns/${id}/cancel`, post({}), [...ADS, `/dashboard/ads/campaigns/${id}`])
}
