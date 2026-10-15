import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ApiError, apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { MANAGER_ROLES } from '@/lib/personalisation'
import type { StaffSchedule } from '@/lib/staff'
import { ScheduleEditor } from './ScheduleEditor'
import { TimeOff } from './TimeOff'

export default async function StaffSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = await requireToken()
  const me = await apiFetch<{ role: string }>('/vendor-auth/me', token)
  const canEdit = MANAGER_ROLES.includes(me.role)

  let schedule: StaffSchedule
  try {
    schedule = await apiFetch<StaffSchedule>(`/vendor-admin/staff/${id}/schedule`, token)
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) notFound()
    throw err
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        {canEdit && <Link href="/dashboard/staff" className="text-sm text-indigo-600">← Staff</Link>}
        <h1 className="mt-1 text-2xl font-bold text-gray-900">{schedule.name}</h1>
        <p className="text-sm text-gray-500 mt-1">Working hours and time off. The mobile app shows the same schedule.</p>
      </div>
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Weekly hours</h2>
        <ScheduleEditor staffId={id} initial={schedule.days} canEdit={canEdit} />
      </section>
      <section>
        <h2 className="text-base font-semibold text-gray-900">Time off</h2>
        <p className="text-sm text-gray-500 mb-3">Nobody can book this person on these days.</p>
        <TimeOff staffId={id} items={schedule.timeOff} canEdit={canEdit} />
      </section>
    </div>
  )
}
