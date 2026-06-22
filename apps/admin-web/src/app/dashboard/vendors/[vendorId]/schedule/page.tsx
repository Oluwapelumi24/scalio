import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { VendorTabs } from '../VendorTabs'

interface BusinessHours { dayOfWeek: number; opensAtMinutes: number; closesAtMinutes: number }
interface BlackoutDate { id: string; date: string; reason: string | null }

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function minsToTime(m: number) {
  const h = Math.floor(m / 60).toString().padStart(2, '0')
  const min = (m % 60).toString().padStart(2, '0')
  return `${h}:${min}`
}

export default async function VendorSchedulePage({ params }: { params: Promise<{ vendorId: string }> }) {
  const { vendorId } = await params
  const token = await requireToken()
  const [hours, blackouts] = await Promise.all([
    apiFetch<BusinessHours[]>(`/super-admin/vendors/${vendorId}/schedule/hours`, token),
    apiFetch<BlackoutDate[]>(`/super-admin/vendors/${vendorId}/schedule/blackout-dates`, token),
  ])

  const hoursByDay = Object.fromEntries(hours.map((h) => [h.dayOfWeek, h]))

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Schedule</h1>
      <VendorTabs vendorId={vendorId} />

      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Business hours</h2>
          <div className="space-y-2">
            {DAYS.map((day, i) => {
              const h = hoursByDay[i]
              return (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 w-24">{day}</span>
                  <span className="text-gray-500">
                    {h ? `${minsToTime(h.opensAtMinutes)} – ${minsToTime(h.closesAtMinutes)}` : <span className="text-gray-300">Closed</span>}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Blackout dates</h2>
          {blackouts.length === 0
            ? <p className="text-sm text-gray-400">No blackout dates.</p>
            : (
              <ul className="space-y-2">
                {blackouts.map((b) => (
                  <li key={b.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{b.date}</span>
                    {b.reason && <span className="text-gray-400 text-xs">{b.reason}</span>}
                  </li>
                ))}
              </ul>
            )
          }
        </div>
      </div>
    </div>
  )
}
