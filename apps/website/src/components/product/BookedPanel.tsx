'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { startPayment } from '@/app/actions/customer'
import { formatNaira } from '@/lib/product'
import { amountForMode, minimumPaymentMode, PAYMENT_MODE_PRIORITY, type PayableService, type PaymentMode } from '@/lib/payments'

const MODES = Object.keys(PAYMENT_MODE_PRIORITY) as PaymentMode[]

export function BookedPanel({
  bookingId,
  when,
  services,
}: {
  bookingId: string
  when: string
  services: PayableService[]
}) {
  const floor = minimumPaymentMode(services)
  const [mode, setMode] = useState<PaymentMode>(floor)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const reference = bookingId.slice(0, 8).toUpperCase()

  function pay() {
    if (mode === 'pay_on_arrival') return
    const amount = amountForMode(services, mode)
    setMessage(null)
    startTransition(async () => {
      const result = await startPayment(bookingId, mode, amount)
      if (result.error || !result.authorizationUrl) {
        setMessage(result.error ?? 'Pay at the appointment instead.')
        return
      }
      window.location.href = result.authorizationUrl
    })
  }

  return (
    <div className="rounded-[24px] border border-[#e4e6eb] bg-white p-6">
      <p className="text-sm font-semibold text-[#15803d]">Booked</p>
      <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">You’re on the book</h2>
      <p className="mt-2 text-sm text-[#4a4e57]">{when}</p>
      <p className="mt-1 text-sm text-[#4a4e57]">Reference {reference}</p>

      <p className="mt-6 text-sm font-semibold">How would you like to pay?</p>
      <ul className="mt-3 space-y-2">
        {MODES.filter((item) => PAYMENT_MODE_PRIORITY[item] >= PAYMENT_MODE_PRIORITY[floor]).map((item) => {
          const on = item === mode
          const amount = amountForMode(services, item)
          const title = item === 'pay_on_arrival' ? 'Pay at the appointment' : item === 'deposit' ? 'Pay a deposit now' : 'Pay in full now'
          const detail =
            item === 'pay_on_arrival'
              ? 'Your time is already held.'
              : item === 'deposit'
                ? `Pay ${formatNaira(amount)} now. The rest is due at the appointment.`
                : 'Pay with Paystack. The business receives it directly.'
          return (
            <li key={item}>
              <button
                type="button"
                onClick={() => setMode(item)}
                aria-pressed={on}
                className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left ${on ? 'border-[#1e3a8a] bg-[#e8edfa]' : 'border-[#e4e6eb]'}`}
              >
                <span className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border ${on ? 'border-[#1e3a8a] bg-[#1e3a8a]' : 'border-[#c9ced8]'}`} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="mt-0.5 block text-[13px] text-[#4a4e57]">{detail}</span>
                </span>
                <span className="text-sm font-semibold tabular-nums">{item === 'pay_on_arrival' ? formatNaira(services.reduce((sum, service) => sum + service.priceKobo, 0)) : formatNaira(amount)}</span>
              </button>
            </li>
          )
        })}
      </ul>
      {message ? <p className="mt-3 text-sm text-[#dc2626]">{message}</p> : null}
      {mode === 'pay_on_arrival' ? (
        <Link href="/app/bookings" className="mt-5 flex h-12 items-center justify-center rounded-full bg-[#1e3a8a] text-sm font-semibold text-white">
          See your bookings
        </Link>
      ) : (
        <div className="mt-5 space-y-2">
          <button
            type="button"
            onClick={pay}
            disabled={pending}
            className="flex h-12 w-full items-center justify-center rounded-full bg-[#1e3a8a] text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? 'Opening checkout…' : `Pay ${formatNaira(amountForMode(services, mode))}`}
          </button>
          {floor === 'pay_on_arrival' ? (
            <Link href="/app/bookings" className="flex h-12 items-center justify-center rounded-full border border-[#c9ced8] text-sm font-semibold">
              I’ll pay at the appointment
            </Link>
          ) : null}
        </div>
      )}
    </div>
  )
}
