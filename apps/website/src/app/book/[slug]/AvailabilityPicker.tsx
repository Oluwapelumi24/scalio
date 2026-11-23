'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getAvailability } from '@/app/actions/availability'
import { bookAppointment } from '@/app/actions/customer'
import { BookedPanel } from '@/components/product/BookedPanel'
import { formatDuration, formatNaira, type PublicService } from '@/lib/booking-page'

function nextDays(timeZone: string, count: number) {
  const fmtDate = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
  const fmtLabel = new Intl.DateTimeFormat('en-NG', { timeZone, weekday: 'short', day: 'numeric', month: 'short' })
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.now() + i * 86_400_000)
    return { value: fmtDate.format(d), label: i === 0 ? 'Today' : fmtLabel.format(d) }
  })
}

export function AvailabilityPicker({
  vendorId,
  slug,
  businessName,
  timezone,
  services,
  signedIn,
  hasPhone = false,
  initialServiceIds = [],
  initialAt = null,
  preview = false,
  previewToken,
}: {
  vendorId: string
  slug: string
  businessName: string
  timezone: string
  services: PublicService[]
  signedIn: boolean
  hasPhone?: boolean
  initialServiceIds?: string[]
  initialAt?: string | null
  preview?: boolean
  previewToken?: string
}) {
  const router = useRouter()
  const days = nextDays(timezone, 14)
  const restoredDay = initialAt
    ? new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(initialAt))
    : null
  const [selected, setSelected] = useState<string[]>(initialServiceIds)
  const [date, setDate] = useState(restoredDay ?? days[0].value)
  const [slots, setSlots] = useState<string[] | null>(initialAt ? [initialAt] : null)
  const [slot, setSlot] = useState<string | null>(initialAt)
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [booked, setBooked] = useState<{ id: string; scheduledAt: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const timeFmt = new Intl.DateTimeFormat('en-NG', { timeZone: timezone, hour: 'numeric', minute: '2-digit' })
  const chosen = services.filter((s) => selected.includes(s.id))
  const total = chosen.reduce((sum, s) => sum + s.priceKobo, 0)
  const duration = chosen.reduce((sum, s) => sum + s.durationMinutes, 0)

  function check(nextDate = date, nextSelected = selected) {
    setError(null)
    startTransition(async () => {
      const res = await getAvailability(vendorId, nextDate, nextSelected)
      if ('error' in res) {
        setError(res.error)
        setSlots(null)
      } else setSlots(res.slots)
    })
  }

  function toggle(id: string) {
    const next = selected.includes(id) ? selected.filter((v) => v !== id) : [...selected, id]
    setSelected(next)
    setSlot(null)
    if (slots) check(date, next)
  }

  function pickDate(value: string) {
    setDate(value)
    setSlot(null)
    check(value)
  }

  function returnPath(nextSlot = slot) {
    const params = new URLSearchParams()
    if (selected.length > 0) params.set('services', selected.join(','))
    if (nextSlot) params.set('at', nextSlot)
    if (previewToken) params.set('preview', previewToken)
    const search = params.toString()
    return `/book/${slug}${search ? `?${search}` : ''}`
  }

  function confirm() {
    if (!slot || preview) return
    if (!signedIn) {
      router.push(`/app/sign-in?next=${encodeURIComponent(returnPath())}`)
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await bookAppointment({
        vendorId,
        serviceIds: selected,
        scheduledAt: slot,
        durationMinutes: duration || 60,
        phone,
      })
      if (result.needsSignIn) {
        router.push(`/app/sign-in?next=${encodeURIComponent(returnPath())}`)
        return
      }
      if (result.error || !result.bookingId || !result.scheduledAt) {
        setError(result.error ?? 'Please try a different time.')
        return
      }
      setBooked({ id: result.bookingId, scheduledAt: result.scheduledAt })
    })
  }

  if (booked) {
    const when = new Date(booked.scheduledAt).toLocaleString('en-NG', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone,
    })
    return <BookedPanel bookingId={booked.id} when={when} services={chosen} />
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-bold text-slate-900">Services</h2>
        {services.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">{businessName} hasn&apos;t listed any services yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
            {services.map((s) => {
              const on = selected.includes(s.id)
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => toggle(s.id)}
                    className={`flex w-full items-center gap-4 px-5 py-4 text-left transition-colors ${on ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                  >
                    <span
                      aria-hidden
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-[10px] ${on ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'}`}
                    >
                      {on ? '✓' : ''}
                    </span>
                    <span className="flex-1">
                      <span className="block font-medium text-slate-900">{s.name}</span>
                      <span className="block text-sm text-slate-500">{formatDuration(s.durationMinutes)}</span>
                    </span>
                    <span className="font-semibold text-slate-900">{formatNaira(s.priceKobo)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold text-slate-900">Available times</h2>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {days.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => pickDate(d.value)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${
                slots !== null && date === d.value
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
          {isPending ? (
            <p className="text-sm text-slate-500">Checking times…</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : slots === null ? (
            <p className="text-sm text-slate-500">Pick a day to see open times{selected.length === 0 ? ' (choose services first for an exact fit)' : ''}.</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-slate-500">No open times on this day. Try another day.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((iso) => {
                const on = iso === slot
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setSlot(iso)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${on ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 text-slate-700'}`}
                  >
                    {timeFmt.format(new Date(iso))}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {chosen.length > 0 && (
        <div className="rounded-2xl bg-slate-900 p-5 text-white">
          <p className="text-sm text-white/60">Your selection</p>
          <p className="mt-1 text-lg font-semibold">
            {formatNaira(total)} · {formatDuration(duration)}
          </p>
          {signedIn && !hasPhone ? (
            <label className="mt-4 block text-left">
              <span className="text-sm font-semibold">Mobile number</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                inputMode="tel"
                autoComplete="tel"
                placeholder="0803 000 0000"
                className="mt-1.5 h-12 w-full rounded-xl border border-white/30 bg-white px-4 text-sm text-slate-900 outline-none"
              />
              <span className="mt-1 block text-xs text-white/70">So {businessName} can reach you about this visit.</span>
            </label>
          ) : null}
          {preview ? (
            <p className="mt-4 rounded-xl bg-white/10 px-4 py-3 text-sm text-white/80">
              Booking stays off in preview. Customers can book here after approval.
            </p>
          ) : (
            <>
              <button
                type="button"
                onClick={confirm}
                disabled={!slot || isPending}
                className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-900 disabled:opacity-50"
              >
                {isPending ? 'Booking…' : signedIn ? 'Book this time' : 'Sign in to book'}
              </button>
              {!signedIn ? <p className="mt-3 text-sm text-white/70">Create a free account to hold this time. Your selection stays.</p> : null}
            </>
          )}
        </div>
      )}
    </div>
  )
}
