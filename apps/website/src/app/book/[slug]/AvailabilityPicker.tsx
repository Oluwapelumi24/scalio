'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
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
  accent = '#1e3a8a',
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
  accent?: string
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
  const booted = useRef(false)

  const timeFmt = new Intl.DateTimeFormat('en-NG', { timeZone: timezone, hour: 'numeric', minute: '2-digit' })
  const chosen = services.filter((s) => selected.includes(s.id))
  const total = chosen.reduce((sum, s) => sum + s.priceKobo, 0)
  const duration = chosen.reduce((sum, s) => sum + s.durationMinutes, 0)
  const hasServices = selected.length > 0
  const step = hasServices ? 2 : 1

  function check(nextDate = date, nextSelected = selected) {
    if (nextSelected.length === 0) {
      setSlots(null)
      setError(null)
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await getAvailability(vendorId, nextDate, nextSelected)
      if ('error' in res) {
        setError(res.error)
        setSlots(null)
      } else setSlots(res.slots)
    })
  }

  useEffect(() => {
    if (booted.current) return
    booted.current = true
    if (initialServiceIds.length > 0 && !initialAt) check(date, initialServiceIds)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time restore of deep-linked services
  }, [])

  function toggle(id: string) {
    const next = selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id]
    setSelected(next)
    setSlot(null)
    check(date, next)
  }

  function pickDate(value: string) {
    setDate(value)
    setSlot(null)
    check(value, selected)
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
    <div className="space-y-7" style={{ ['--book-accent' as string]: accent }}>
      <section>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold tracking-tight text-[#0a0a0a] sm:text-xl">
            <span className="mr-2 text-[12px] font-bold tabular-nums text-[color:var(--book-accent)]">1</span>
            Choose services
          </h2>
          {chosen.length > 0 ? (
            <p className="text-[13px] font-medium text-[#7d818b]">
              {chosen.length} selected · {formatDuration(duration)}
            </p>
          ) : null}
        </div>

        {services.length === 0 ? (
          <p className="mt-4 rounded-[20px] bg-white px-5 py-6 text-sm leading-6 text-[#7d818b]">
            {businessName} hasn’t listed any services yet.
          </p>
        ) : (
          <ul className="mt-4 overflow-hidden rounded-[20px] bg-white">
            {services.map((s, index) => {
              const on = selected.includes(s.id)
              return (
                <li key={s.id} className={index > 0 ? 'border-t border-[#f0f1f4]' : ''}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => toggle(s.id)}
                    className={`flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-[background-color,transform] duration-150 ease-out active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100 sm:gap-4 sm:px-5 sm:py-4 ${
                      on ? 'bg-[color-mix(in_srgb,var(--book-accent)_8%,white)]' : 'hover:bg-[#fafbfc]'
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 text-[10px] font-bold transition-colors duration-150 ${
                        on
                          ? 'border-[color:var(--book-accent)] bg-[color:var(--book-accent)] text-white'
                          : 'border-[#c9ced8] bg-white'
                      }`}
                    >
                      {on ? '✓' : ''}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-[#0a0a0a]">{s.name}</span>
                      <span className="mt-0.5 block text-[13px] text-[#7d818b]">
                        {formatDuration(s.durationMinutes)}
                      </span>
                    </span>
                    <span className="shrink-0 text-[15px] font-semibold tabular-nums text-[#0a0a0a]">
                      {formatNaira(s.priceKobo)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section aria-disabled={!hasServices}>
        <h2 className="text-lg font-bold tracking-tight text-[#0a0a0a] sm:text-xl">
          <span className="mr-2 text-[12px] font-bold tabular-nums text-[color:var(--book-accent)]">2</span>
          Pick a time
        </h2>
        <p className="mt-1 text-sm leading-5 text-[#7d818b]">
          {!hasServices
            ? 'Select a service above to unlock open times.'
            : 'Times match the services you chose.'}
        </p>

        <div
          className={`-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            !hasServices ? 'pointer-events-none opacity-40' : ''
          }`}
        >
          {days.map((d) => {
            const on = date === d.value
            return (
              <button
                key={d.value}
                type="button"
                disabled={!hasServices}
                onClick={() => pickDate(d.value)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-150 disabled:cursor-not-allowed ${
                  on
                    ? 'text-white'
                    : 'bg-white text-[#4a4e57] hover:bg-[#eef0f4] disabled:hover:bg-white'
                }`}
                style={on ? { backgroundColor: accent } : undefined}
              >
                {d.label}
              </button>
            )
          })}
        </div>

        {!hasServices ? null : (
          <div className="mt-3 rounded-[20px] bg-white px-4 py-4 sm:px-5 sm:py-5">
            {isPending ? (
              <p className="text-sm text-[#7d818b]">Checking open times…</p>
            ) : error ? (
              <p className="text-sm text-[#b91c1c]">{error}</p>
            ) : slots === null ? (
              <p className="text-sm leading-6 text-[#7d818b]">Pick a day above to see open times.</p>
            ) : slots.length === 0 ? (
              <p className="text-sm leading-6 text-[#7d818b]">No open times on this day. Try another day.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((iso) => {
                  const on = iso === slot
                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => setSlot(iso)}
                      className={`rounded-xl px-3.5 py-2 text-sm font-semibold tabular-nums transition-colors duration-150 active:scale-[0.96] motion-reduce:active:scale-100 ${
                        on
                          ? 'text-white'
                          : 'bg-[#f5f6f8] text-[#0a0a0a] hover:bg-[#eef0f4]'
                      }`}
                      style={on ? { backgroundColor: accent } : undefined}
                    >
                      {timeFmt.format(new Date(iso))}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {chosen.length > 0 ? (
        <div
          className="sticky bottom-3 z-10 overflow-hidden rounded-[20px] p-4 text-white sm:static sm:bottom-auto sm:p-5"
          style={{
            background: `linear-gradient(160deg, color-mix(in srgb, ${accent} 88%, #0b1638), ${accent})`,
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-medium text-white/70">Your visit</p>
              <p className="mt-1 text-lg font-semibold tracking-tight">
                {formatNaira(total)}
                <span className="font-medium text-white/75"> · {formatDuration(duration)}</span>
              </p>
              {slot ? (
                <p className="mt-1 text-[13px] text-white/75">
                  {new Date(slot).toLocaleString('en-NG', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZone: timezone,
                  })}
                </p>
              ) : (
                <p className="mt-1 text-[13px] text-white/65">Pick a time to continue</p>
              )}
            </div>
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/85">
              Step {step} of 2
            </span>
          </div>

          {signedIn && !hasPhone && !preview ? (
            <label className="mt-4 block text-left">
              <span className="text-sm font-semibold">Mobile number</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                inputMode="tel"
                autoComplete="tel"
                placeholder="0803 000 0000"
                className="mt-1.5 h-12 w-full rounded-xl border border-white/25 bg-white px-4 text-sm text-[#0a0a0a] outline-none focus:border-white"
              />
              <span className="mt-1 block text-xs text-white/70">
                So {businessName} can reach you about this visit.
              </span>
            </label>
          ) : null}

          {preview ? (
            <p className="mt-4 rounded-2xl bg-white/12 px-4 py-3 text-sm leading-5 text-white/85">
              Booking stays off in preview. Customers can book here after approval.
            </p>
          ) : (
            <>
              <button
                type="button"
                onClick={confirm}
                disabled={!slot || isPending}
                className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-white text-sm font-semibold text-[#0a0a0a] transition-transform duration-150 ease-out active:scale-[0.96] disabled:opacity-50 motion-reduce:active:scale-100"
              >
                {isPending ? 'Booking…' : signedIn ? 'Book this time' : 'Sign in to book'}
              </button>
              {!signedIn ? (
                <p className="mt-3 text-sm text-white/70">
                  Create a free account to hold this time. Your selection stays.
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
