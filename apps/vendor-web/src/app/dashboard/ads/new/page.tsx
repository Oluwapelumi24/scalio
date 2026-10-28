import { redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import type { AdBuilder } from '@/lib/ads'
import { AdWizard } from './AdWizard'

/** Create an ad — simple mode by default, advanced on request (ADS_MANAGER_PLAN.md §2b–2c). */
export default async function NewAdPage() {
  const token = await requireToken()
  const me = await apiFetch<{ role: string }>('/vendor-auth/me', token)
  if (me.role !== 'owner' && me.role !== 'manager') redirect('/dashboard/ads')
  const builder = await apiFetch<AdBuilder>('/vendor-admin/ads/builder', token)
  return <AdWizard builder={builder} />
}
