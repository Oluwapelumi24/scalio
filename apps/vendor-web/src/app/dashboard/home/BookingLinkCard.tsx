'use client'

import { useState } from 'react'
import { recordModuleUsage } from '@/app/actions/personalisation'

export function BookingLinkCard({ url, total }: { url: string; total: number }) {
  const [copied, setCopied] = useState(false)
  const visible = url.replace(/^https?:\/\//, '')
  const message = `Book an appointment with us on Veno: ${url}`

  async function copy() {
    void recordModuleUsage('share_booking_link')
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* the address stays on screen to copy by hand */
    }
  }

  return (
    <section id="booking-link" className="rounded-[24px] bg-[#1e3a8a] p-6 text-white">
      <p className="text-lg font-semibold">{total === 0 ? 'Get your first booking' : 'Get more bookings'}</p>
      <p className="mt-2 max-w-md text-sm leading-6 text-white/80">
        Customers book and pay through your link. Share it on WhatsApp, Instagram or in your bio.
      </p>
      <button
        type="button"
        onClick={() => void copy()}
        className="mt-5 flex w-full items-center justify-between gap-3 rounded-full bg-white/15 px-4 py-3 text-left text-sm"
      >
        <span className="truncate">{visible}</span>
        <span className="shrink-0 font-semibold">{copied ? 'Copied' : 'Copy'}</span>
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(message)}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => void recordModuleUsage('share_booking_link')}
        className="mt-3 inline-flex items-center rounded-[20px] bg-white px-5 text-sm font-semibold text-[#1e3a8a] h-12"
      >
        Share booking link
      </a>
    </section>
  )
}
