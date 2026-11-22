'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { createBooking } from '@/app/actions/bookings'
import { SelectMenu } from '@/components/SelectMenu'

interface Option {
  id: string
  name: string
}

function defaultDateTimeLocal() {
  const d = new Date()
  d.setMinutes(0, 0, 0)
  d.setHours(d.getHours() + 1)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Walk-in / phone / DM booking — same API as the mobile New booking screen. */
export function NewBookingForm({
  services,
  staff,
  lockStaffId,
}: {
  services: Option[]
  staff: Option[]
  /** Practitioners can only book themselves. */
  lockStaffId?: string
}) {
  const [state, formAction, pending] = useActionState(createBooking, null)

  if (services.length === 0) {
    return (
      <div className="rounded-[20px] border border-[#e4e6eb] bg-white p-6">
        <p className="text-sm leading-6 text-[#4a4e57]">Add a service before you book someone in.</p>
        <Link href="/dashboard/services" className="mt-3 inline-block text-sm font-semibold text-[#1e3a8a]">
          Add a service
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5 rounded-[20px] border border-[#e4e6eb] bg-white p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-semibold text-[#4a4e57]">Client name</label>
          <input
            name="customerName"
            required
            autoComplete="name"
            placeholder="e.g. Chioma"
            className="h-11 w-full rounded-xl border border-[#e4e6eb] px-3 text-sm outline-none focus:border-[#1e3a8a]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#4a4e57]">Phone</label>
          <input
            name="customerPhone"
            type="tel"
            autoComplete="tel"
            placeholder="+234…"
            className="h-11 w-full rounded-xl border border-[#e4e6eb] px-3 text-sm outline-none focus:border-[#1e3a8a]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#4a4e57]">Email</label>
          <input
            name="customerEmail"
            type="email"
            autoComplete="email"
            placeholder="Optional"
            className="h-11 w-full rounded-xl border border-[#e4e6eb] px-3 text-sm outline-none focus:border-[#1e3a8a]"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-semibold text-[#4a4e57]">Service</label>
          <SelectMenu
            name="serviceId"
            required
            placeholder="Pick a service…"
            className="h-11 w-full rounded-xl border border-[#e4e6eb] bg-white px-3 text-sm"
            options={services.map((s) => ({ value: s.id, label: s.name }))}
          />
        </div>
        {!lockStaffId && staff.length > 0 ? (
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#4a4e57]">Staff</label>
            <SelectMenu
              name="staffId"
              placeholder="Anyone"
              className="h-11 w-full rounded-xl border border-[#e4e6eb] bg-white px-3 text-sm"
              options={[{ value: '', label: 'Anyone' }, ...staff.map((s) => ({ value: s.id, label: s.name }))]}
            />
          </div>
        ) : lockStaffId ? (
          <input type="hidden" name="staffId" value={lockStaffId} />
        ) : null}
        <div className={!lockStaffId && staff.length > 0 ? '' : 'sm:col-span-2'}>
          <label className="mb-1.5 block text-xs font-semibold text-[#4a4e57]">Date &amp; time</label>
          <input
            name="scheduledAt"
            type="datetime-local"
            required
            defaultValue={defaultDateTimeLocal()}
            className="h-11 w-full rounded-xl border border-[#e4e6eb] px-3 text-sm outline-none focus:border-[#1e3a8a]"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-full bg-[#1e3a8a] px-5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? 'Booking…' : 'Book client'}
        </button>
        <Link href="/dashboard/bookings" className="text-sm font-semibold text-[#4a4e57]">
          Cancel
        </Link>
        {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      </div>
    </form>
  )
}
