import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'

export async function loadBookingFormOptions() {
  const token = await requireToken()
  const me = await apiFetch<{ role: string; staffId: string }>('/vendor-auth/me', token)

  const [services, staff] = await Promise.all([
    apiFetch<{ id: string; name: string }[]>('/vendor-admin/services', token).catch(() => []),
    me.role === 'practitioner'
      ? Promise.resolve([])
      : apiFetch<{ id: string; name: string }[]>('/vendor-admin/staff', token).catch(() => []),
  ])

  return {
    services,
    staff,
    lockStaffId: me.role === 'practitioner' ? me.staffId : undefined,
  }
}
