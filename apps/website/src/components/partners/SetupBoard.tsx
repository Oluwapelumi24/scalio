'use client'

import { useActionState } from 'react'
import {
  addServiceAction,
  openDashboardAction,
  setWeekdayHoursAction,
  type VendorAuthState,
} from '@/app/actions/vendor'

const EMPTY: VendorAuthState = {}

export interface SetupService {
  id: string
  name: string
  durationMinutes: number
  priceKobo: number
}

export interface SetupHour {
  dayOfWeek: number
  opensAtMinutes: number
  closesAtMinutes: number
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function SetupBoard({
  firstName,
  businessName,
  category,
  area,
  approvalStatus,
  reviewNote,
  services,
  hours,
}: {
  firstName: string
  businessName: string
  category: string
  area: string | null
  approvalStatus: string
  reviewNote: string | null
  services: SetupService[]
  hours: SetupHour[]
}) {
  const hasService = services.length > 0
  const hasHours = hours.length > 0
  const done = 1 + Number(hasService) + Number(hasHours)
  const approval = approvalCopy(approvalStatus, reviewNote)
  const [dashState, dashAction, dashPending] = useActionState(openDashboardAction, EMPTY)

  return (
    <div>
      <p className="text-sm font-semibold text-navy">You’re in</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-slate-950">
        {firstName ? `Welcome, ${firstName}` : 'Welcome'}
      </h1>
      <p className="mt-3 max-w-xl text-[15px] leading-6 text-slate-600">
        {done === 3
          ? `${businessName} is set up. We’ll review the listing, and customers can book you once it’s approved.`
          : `${businessName} is registered. Add a service and your hours. Customers can book you once we approve the listing.`}
      </p>

      <form action={dashAction} className="mt-6">
        <button
          type="submit"
          disabled={dashPending}
          className="h-12 rounded-2xl bg-navy px-5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {dashPending ? 'Opening…' : 'Open dashboard'}
        </button>
        {dashState.error ? <p className="mt-2 text-sm text-red-700">{dashState.error}</p> : null}
      </form>

      <div className="mt-6 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-navy" style={{ width: `${(done / 3) * 100}%` }} />
        </div>
        <p className="text-xs font-semibold text-slate-500">{done} of 3</p>
      </div>

      <ol className="mt-6 space-y-3">
        <li className="rounded-3xl border border-slate-200 bg-white px-5 py-4">
          <div className="flex items-start gap-3">
            <Mark done />
            <div>
              <p className="text-sm font-semibold text-slate-400 line-through">Create the business</p>
              <p className="text-sm text-slate-500">
                {category}
                {area ? ` · ${area}` : ''}
              </p>
            </div>
          </div>
        </li>

        <li className="rounded-3xl border border-slate-200 bg-white px-5 py-4">
          {hasService ? (
            <div className="flex items-start gap-3">
              <Mark done />
              <div>
                <p className="text-sm font-semibold text-slate-400 line-through">Add a service</p>
                <ul className="mt-1 space-y-1">
                  {services.map((service) => (
                    <li key={service.id} className="text-sm text-slate-600">
                      {service.name}
                      <span className="text-slate-400"> · {service.durationMinutes} min · {naira(service.priceKobo)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <ServiceForm />
          )}
        </li>

        <li className="rounded-3xl border border-slate-200 bg-white px-5 py-4">
          {hasHours ? (
            <div className="flex items-start gap-3">
              <Mark done />
              <div>
                <p className="text-sm font-semibold text-slate-400 line-through">Set opening hours</p>
                <p className="text-sm text-slate-600">{hoursLabel(hours)}</p>
              </div>
            </div>
          ) : (
            <HoursForm locked={!hasService} />
          )}
        </li>
      </ol>

      <p className="mt-6 rounded-3xl bg-[#e8edfa] px-5 py-4 text-sm leading-6 text-slate-700">{approval}</p>
    </div>
  )
}

function ServiceForm() {
  const [state, action, pending] = useActionState(addServiceAction, EMPTY)
  return (
    <form action={action}>
      <div className="flex items-start gap-3">
        <Mark />
        <div>
          <p className="text-sm font-semibold text-slate-950">Add a service</p>
          <p className="text-sm text-slate-500">The thing customers pick when they book.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="block sm:col-span-3">
          <span className="text-xs font-semibold text-slate-700">Name</span>
          <input name="name" required placeholder="Deep tissue massage" className="mt-1 h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-navy" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-700">Minutes</span>
          <input name="duration" type="number" min={15} step={15} defaultValue={60} required className="mt-1 h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-navy" />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold text-slate-700">Price (₦)</span>
          <input name="price" inputMode="numeric" required placeholder="15000" className="mt-1 h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-navy" />
        </label>
      </div>
      {state.error ? <p className="mt-3 text-sm text-red-700">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="mt-4 h-11 rounded-2xl bg-navy px-4 text-sm font-semibold text-white disabled:opacity-60">
        {pending ? 'Saving…' : 'Save service'}
      </button>
    </form>
  )
}

function HoursForm({ locked }: { locked: boolean }) {
  const [state, action, pending] = useActionState(setWeekdayHoursAction, EMPTY)
  return (
    <form action={action}>
      <div className="flex items-start gap-3">
        <Mark />
        <div>
          <p className="text-sm font-semibold text-slate-950">Set opening hours</p>
          <p className="text-sm text-slate-500">Monday to Saturday, 9am to 6pm. Sunday stays closed. You can change this later.</p>
        </div>
      </div>
      {state.error ? <p className="mt-3 text-sm text-red-700">{state.error}</p> : null}
      <button type="submit" disabled={pending || locked} className="mt-4 h-11 rounded-2xl bg-navy px-4 text-sm font-semibold text-white disabled:opacity-60">
        {locked ? 'Add a service first' : pending ? 'Saving…' : 'Use these hours'}
      </button>
    </form>
  )
}

function Mark({ done = false }: { done?: boolean }) {
  return (
    <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done ? 'bg-[#e7f6ee] text-[#166534]' : 'bg-[#e8edfa] text-navy'}`}>
      {done ? '✓' : ''}
    </span>
  )
}

function naira(kobo: number) {
  return `₦${Math.round(kobo / 100).toLocaleString('en-NG')}`
}

function hoursLabel(hours: SetupHour[]) {
  const weekday = hours.filter((day) => day.dayOfWeek >= 1 && day.dayOfWeek <= 6)
  const standard = weekday.length === 6 && weekday.every((day) => day.opensAtMinutes === 9 * 60 && day.closesAtMinutes === 18 * 60)
  if (standard && !hours.some((day) => day.dayOfWeek === 0)) return 'Monday to Saturday, 9am–6pm'
  return hours
    .slice()
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    .map((day) => `${DAYS[day.dayOfWeek].slice(0, 3)} ${clock(day.opensAtMinutes)}–${clock(day.closesAtMinutes)}`)
    .join(', ')
}

function clock(minutes: number) {
  const hour = Math.floor(minutes / 60)
  const mins = minutes % 60
  const suffix = hour >= 12 ? 'pm' : 'am'
  const twelve = hour % 12 || 12
  return mins === 0 ? `${twelve}${suffix}` : `${twelve}:${String(mins).padStart(2, '0')}${suffix}`
}

function approvalCopy(status: string, note: string | null) {
  if (status === 'approved') return 'The listing is approved. Customers can find you and book the services you added.'
  if (status === 'rejected') return note || 'This listing wasn’t approved. Update the details and we’ll look again.'
  return 'We’ll review the listing shortly. You can keep setting up while you wait — customers book you after it’s approved.'
}
