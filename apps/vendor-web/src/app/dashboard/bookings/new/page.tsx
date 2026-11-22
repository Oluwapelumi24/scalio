import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { NewBookingForm } from './NewBookingForm'

export default async function NewBookingPage() {
  const token = await requireToken()
  const me = await apiFetch<{ role: string; staffId: string }>('/vendor-auth/me', token)

  const [services, staff] = await Promise.all([
    apiFetch<{ id: string; name: string }[]>('/vendor-admin/services', token).catch(() => []),
    me.role === 'practitioner'
      ? Promise.resolve([])
      : apiFetch<{ id: string; name: string }[]>('/vendor-admin/staff', token).catch(() => []),
  ])

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <Link href="/dashboard/bookings" className="text-sm font-semibold text-[#1e3a8a]">
          ← Bookings
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#0a0a0a]">New booking</h1>
        <p className="mt-1 text-sm leading-6 text-[#4a4e57]">
          Book a walk-in, phone call or DM — same as customers booking themselves online.
        </p>
      </div>
      <NewBookingForm
        services={services}
        staff={staff}
        lockStaffId={me.role === 'practitioner' ? me.staffId : undefined}
      />
    </div>
  )
}
