'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { SAMPLE_TIMES, categorySlug, formatNaira, type SampleListing, type SampleService } from '@/lib/samples'

const DAYS = ['Today', 'Tomorrow', 'Saturday', 'Sunday', 'Monday'] as const

export function SampleBook({ listing }: { listing: SampleListing }) {
  const [service, setService] = useState<SampleService>(listing.services[0])
  const [day, setDay] = useState<(typeof DAYS)[number]>('Today')
  const [time, setTime] = useState<string | null>(null)
  const [pay, setPay] = useState<'visit' | 'deposit'>('visit')
  const [booked, setBooked] = useState(false)

  const dueNow = pay === 'deposit' && service.deposit ? service.deposit : 0
  const dueLater = service.price - dueNow

  if (booked && time) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 sm:p-7">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <Check className="h-5 w-5" strokeWidth={2.4} aria-hidden />
        </span>
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-navy">Sample booking</p>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-950">You’re booked.</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          {service.name} at {listing.name}, {day.toLowerCase()} at {time}. Nothing was charged. This is a sample of the
          booking, so you can see how it feels.
        </p>
        <dl className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Due now</dt>
            <dd className="font-semibold tabular-nums text-slate-950">{dueNow ? formatNaira(dueNow) : '₦0'}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">At the visit</dt>
            <dd className="font-semibold tabular-nums text-slate-950">{formatNaira(dueLater)}</dd>
          </div>
        </dl>
        <Link
          href={`/samples/${categorySlug(listing.category)}`}
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-[20px] bg-navy text-sm font-semibold text-white hover:bg-navy-deep"
        >
          Back to listings
        </Link>
      </div>
    )
  }

  return (
    <form
      className="rounded-[28px] border border-slate-200 bg-white p-6 sm:p-7"
      onSubmit={(event) => {
        event.preventDefault()
        if (time) setBooked(true)
      }}
    >
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-navy">Book a sample</p>
      <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950">Pick a time</h2>

      <fieldset className="mt-5">
        <legend className="text-sm font-semibold text-slate-950">Service</legend>
        <div className="mt-2 space-y-2">
          {listing.services.map((item) => {
            const on = item.name === service.name
            return (
              <label
                key={item.name}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
                  on ? 'border-navy bg-sky' : 'border-slate-200'
                }`}
              >
                <span>
                  <input
                    type="radio"
                    name="service"
                    className="sr-only"
                    checked={on}
                    onChange={() => {
                      setService(item)
                      if (pay === 'deposit' && !item.deposit) setPay('visit')
                    }}
                  />
                  <span className="block text-sm font-semibold text-slate-950">{item.name}</span>
                  <span className="text-[13px] text-slate-500">{item.minutes} min</span>
                </span>
                <span className="text-sm font-semibold tabular-nums text-slate-950">{formatNaira(item.price)}</span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="text-sm font-semibold text-slate-950">Day</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {DAYS.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={day === item}
              onClick={() => setDay(item)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                day === item ? 'bg-navy text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="text-sm font-semibold text-slate-950">Time</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {SAMPLE_TIMES.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={time === item}
              onClick={() => setTime(item)}
              className={`rounded-2xl border px-3 py-2.5 text-sm font-semibold ${
                time === item ? 'border-navy bg-navy text-white' : 'border-slate-200 text-slate-800'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="text-sm font-semibold text-slate-950">How you’ll pay</legend>
        <div className="mt-2 grid gap-2">
          <label className={`cursor-pointer rounded-2xl border px-4 py-3 ${pay === 'visit' ? 'border-navy bg-sky' : 'border-slate-200'}`}>
            <input type="radio" name="pay" className="sr-only" checked={pay === 'visit'} onChange={() => setPay('visit')} />
            <span className="block text-sm font-semibold text-slate-950">Pay at the visit</span>
            <span className="text-[13px] text-slate-500">{formatNaira(service.price)} when you arrive</span>
          </label>
          {service.deposit ? (
            <label className={`cursor-pointer rounded-2xl border px-4 py-3 ${pay === 'deposit' ? 'border-navy bg-sky' : 'border-slate-200'}`}>
              <input type="radio" name="pay" className="sr-only" checked={pay === 'deposit'} onChange={() => setPay('deposit')} />
              <span className="block text-sm font-semibold text-slate-950">Hold it with {formatNaira(service.deposit)}</span>
              <span className="text-[13px] text-slate-500">{formatNaira(service.price - service.deposit)} waits until you arrive</span>
            </label>
          ) : null}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={!time}
        className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-[20px] bg-navy text-sm font-semibold text-white hover:bg-navy-deep disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {time ? `Book ${time}` : 'Pick a time'}
      </button>
      <p className="mt-3 text-center text-xs text-slate-500">A sample only. Nothing is booked or charged.</p>
    </form>
  )
}
