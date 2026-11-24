'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { bookAppointment, loadOpenTimes } from '@/app/actions/customer'
import { BookedPanel } from '@/components/product/BookedPanel'
import { formatNaira, isLaundry, type ListedService } from '@/lib/product'

const SELF_SERVICE = 'Self-service wash'
const DROP_OFF = 'Drop-off'
const DUVET = 'Duvet Laundry'

function nextDays(timeZone: string, count: number) {
  const fmtDate = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' })
  const day = new Intl.DateTimeFormat('en-US', { timeZone, day: 'numeric' })
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.now() + index * 86_400_000)
    return { value: fmtDate.format(date), weekday: weekday.format(date), day: day.format(date) }
  })
}

function timeLabel(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
}

export function BookDesk({
  vendorId,
  category,
  timezone,
  services,
  signedIn,
  hasPhone = false,
  initialServiceIds = [],
  initialAt = null,
  initialDuration = null,
}: {
  vendorId: string
  category: string
  timezone: string
  services: ListedService[]
  signedIn: boolean
  hasPhone?: boolean
  initialServiceIds?: string[]
  initialAt?: string | null
  initialDuration?: number | null
}) {
  const router = useRouter()
  const zone = timezone || 'Africa/Lagos'
  const days = useMemo(() => nextDays(zone, 14), [zone])
  const laundry = isLaundry(category)
  const restoredDay = initialAt ? new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(initialAt)) : null
  const restoredKind: 'self_service' | 'drop_off' | null = !laundry
    ? 'self_service'
    : services.some((service) => initialServiceIds.includes(service.id) && service.name === DROP_OFF)
      ? 'drop_off'
      : initialServiceIds.length > 0
        ? 'self_service'
        : null
  const [kind, setKind] = useState<'self_service' | 'drop_off' | null>(restoredKind)
  const [duvets, setDuvets] = useState(0)
  const [selected, setSelected] = useState<string[]>(initialServiceIds)
  const [day, setDay] = useState(restoredDay ?? days[0]?.value ?? '')
  const [slots, setSlots] = useState<string[] | null>(initialAt ? [initialAt] : null)
  const [duration, setDuration] = useState<number | null>(initialDuration)
  const [slot, setSlot] = useState<string | null>(initialAt)
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [booked, setBooked] = useState<{ id: string; scheduledAt: string } | null>(null)
  const [pending, startTransition] = useTransition()

  const washName = kind === 'drop_off' ? DROP_OFF : SELF_SERVICE
  const laundryIds = useMemo(() => {
    if (!laundry || !kind) return []
    const wash = services.find((service) => service.name === washName)
    const duvet = duvets > 0 ? services.find((service) => service.name === DUVET) : undefined
    if (!wash) return []
    return duvet ? [wash.id, duvet.id] : [wash.id]
  }, [laundry, kind, services, washName, duvets])

  const serviceIds = laundry ? laundryIds : selected
  const chosen = services.filter((service) => serviceIds.includes(service.id))
  const total = chosen.reduce((sum, service) => sum + service.priceKobo, 0)

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
    setSlots(null)
    setSlot(null)
  }

  function checkTimes(nextDay = day, ids = serviceIds) {
    if (ids.length === 0) {
      setMessage('Choose a service first.')
      return
    }
    setMessage(null)
    setSlot(null)
    startTransition(async () => {
      const result = await loadOpenTimes(vendorId, nextDay, ids)
      if (result.error) {
        setSlots([])
        setMessage(result.error)
        return
      }
      setSlots(result.slots ?? [])
      const fallback = services.filter((service) => ids.includes(service.id)).reduce((sum, service) => sum + service.durationMinutes, 0)
      setDuration(result.durationMinutes ?? (fallback || 60))
    })
  }

  function returnPath() {
    const params = new URLSearchParams()
    if (serviceIds.length > 0) params.set('services', serviceIds.join(','))
    if (slot) params.set('at', slot)
    if (duration != null) params.set('duration', String(duration))
    const search = params.toString()
    return `/app/business/${vendorId}${search ? `?${search}` : ''}`
  }

  function confirm() {
    if (!slot || duration == null) return
    if (!signedIn) {
      router.push(`/app/sign-in?next=${encodeURIComponent(returnPath())}`)
      return
    }
    setMessage(null)
    startTransition(async () => {
      const result = await bookAppointment({ vendorId, serviceIds, scheduledAt: slot, durationMinutes: duration, phone })
      if (result.needsSignIn) {
        router.push(`/app/sign-in?next=${encodeURIComponent(returnPath())}`)
        return
      }
      if (result.error || !result.scheduledAt || !result.bookingId) {
        setMessage(result.error ?? 'Please try a different time.')
        return
      }
      setBooked({ id: result.bookingId, scheduledAt: result.scheduledAt })
    })
  }

  if (booked) {
    const when = new Date(booked.scheduledAt).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: zone,
    })
    return <BookedPanel bookingId={booked.id} when={when} services={chosen} />
  }

  return (
    <div className="rounded-[24px] border border-[#e4e6eb] bg-white p-5">
      <h2 className="text-lg font-semibold">{laundry && !kind ? 'How would you like to wash?' : 'Book'}</h2>
      {laundry && !kind ? (
        <div className="mt-4 space-y-3">
          <LaundryChoice
            title="Self-service"
            body="Use our machines at the laundromat. Pick your own time."
            onClick={() => setKind('self_service')}
          />
          <LaundryChoice
            title="Drop-off and collect"
            body="Leave it with us. We’ll wash it and have it ready for you."
            onClick={() => setKind('drop_off')}
          />
        </div>
      ) : (
        <>
          {laundry ? (
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{kind === 'drop_off' ? 'Drop-off and collect' : 'Self-service'}</p>
                <button type="button" onClick={() => { setKind(null); setSlots(null); setSlot(null) }} className="text-sm font-semibold text-[#1e3a8a]">
                  Change
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-2xl border border-[#e4e6eb] px-4 py-3">
                <span className="text-sm">Duvets</span>
                <span className="flex items-center gap-3">
                  <button type="button" className="h-8 w-8 rounded-full border border-[#c9ced8]" onClick={() => { setDuvets((count) => Math.max(0, count - 1)); setSlots(null); setSlot(null) }} aria-label="Fewer duvets">−</button>
                  <span className="w-4 text-center text-sm font-semibold tabular-nums">{duvets}</span>
                  <button type="button" className="h-8 w-8 rounded-full border border-[#c9ced8]" onClick={() => { setDuvets((count) => count + 1); setSlots(null); setSlot(null) }} aria-label="More duvets">+</button>
                </span>
              </div>
              {laundryIds.length === 0 ? (
                <p className="mt-3 text-sm text-[#4a4e57]">This laundromat hasn’t listed that wash yet.</p>
              ) : null}
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-[#4a4e57]">Choose services. You can pick more than one.</p>
              <ul className="mt-3 divide-y divide-[#e4e6eb] overflow-hidden rounded-2xl border border-[#e4e6eb]">
                {services.map((service) => {
                  const on = selected.includes(service.id)
                  return (
                    <li key={service.id}>
                      <button
                        type="button"
                        onClick={() => toggle(service.id)}
                        aria-pressed={on}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left ${on ? 'bg-[#e8edfa]' : 'hover:bg-[#f5f6f8]'}`}
                      >
                        <span className={`h-5 w-5 rounded-full border ${on ? 'border-[#1e3a8a] bg-[#1e3a8a]' : 'border-[#c9ced8]'}`} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold">{service.name}</span>
                          <span className="text-[13px] text-[#4a4e57]">{service.durationMinutes} min</span>
                        </span>
                        <span className="text-sm font-semibold tabular-nums">{formatNaira(service.priceKobo)}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          <p className="mt-5 text-sm font-semibold">Pick a date and time</p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {days.map((item) => {
              const on = item.value === day
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setDay(item.value)
                    if (serviceIds.length > 0) checkTimes(item.value, serviceIds)
                  }}
                  className={`flex h-[72px] w-[60px] shrink-0 flex-col items-center justify-center rounded-2xl border text-sm ${
                    on ? 'border-[#1e3a8a] bg-[#1e3a8a] text-white' : 'border-[#e4e6eb]'
                  }`}
                >
                  <span className={on ? 'text-white/80' : 'text-[#4a4e57]'}>{item.weekday}</span>
                  <span className="font-bold tabular-nums">{item.day}</span>
                </button>
              )
            })}
          </div>

          {slots ? (
            slots.length === 0 ? (
              <p className="mt-4 text-sm text-[#4a4e57]">No free times this day. Try another date.</p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {slots.map((item) => {
                  const on = item === slot
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setSlot(item)}
                      className={`h-11 rounded-full border px-4 text-sm font-semibold tabular-nums ${
                        on ? 'border-[#1e3a8a] bg-[#1e3a8a] text-white' : 'border-[#c9ced8]'
                      }`}
                    >
                      {timeLabel(item, timezone || 'Africa/Lagos')}
                    </button>
                  )
                })}
              </div>
            )
          ) : (
            <button
              type="button"
              onClick={() => checkTimes()}
              disabled={pending || serviceIds.length === 0}
              className="mt-4 h-11 rounded-full border border-[#c9ced8] px-4 text-sm font-semibold disabled:opacity-40"
            >
              {pending ? 'Checking times…' : 'See open times'}
            </button>
          )}

          {chosen.length > 0 ? (
            <p className="mt-4 text-sm text-[#4a4e57]">
              {chosen.map((service) => service.name).join(', ')} · <span className="font-semibold text-[#0a0a0a]">{formatNaira(total)}</span>
            </p>
          ) : null}
          {signedIn && !hasPhone ? (
            <label className="mt-4 block">
              <span className="text-sm font-semibold">Mobile number</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                inputMode="tel"
                autoComplete="tel"
                placeholder="0803 000 0000"
                className="mt-1.5 h-12 w-full rounded-2xl border border-[#e4e6eb] bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#1e3a8a]"
              />
              <span className="mt-1 block text-xs text-[#7d818b]">So the business can reach you about this visit.</span>
            </label>
          ) : null}
          {message ? <p className="mt-3 text-sm text-[#dc2626]">{message}</p> : null}
          <button
            type="button"
            onClick={confirm}
            disabled={!slot || pending}
            className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-[#1e3a8a] text-sm font-semibold text-white disabled:opacity-40"
          >
            {pending ? 'Booking…' : signedIn ? (slot ? 'Book appointment' : 'Pick a time') : 'Sign in to book'}
          </button>
          {!signedIn ? <p className="mt-3 text-center text-[13px] text-[#4a4e57]">Create an account before booking an appointment.</p> : null}
        </>
      )}
    </div>
  )
}

function LaundryChoice({ title, body, onClick }: { title: string; body: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="keep-height w-full rounded-[20px] border border-[#e4e6eb] p-4 text-left hover:bg-[#f5f6f8]">
      <span className="block text-sm font-semibold">{title}</span>
      <span className="mt-1 block text-[13px] text-[#4a4e57]">{body}</span>
    </button>
  )
}
