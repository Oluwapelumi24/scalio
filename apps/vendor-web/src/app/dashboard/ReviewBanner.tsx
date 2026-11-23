'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/Icon'

type Tone = 'pending' | 'rejected'

/**
 * Review status for the whole dashboard. Dismissible after the owner has read it;
 * comes back if the approval status changes (e.g. rejected → pending again).
 */
export function ReviewBanner({
  tone,
  storageKey,
  children,
}: {
  tone: Tone
  storageKey: string
  children: React.ReactNode
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(storageKey) === '1') {
        setVisible(false)
        return
      }
    } catch {
      /* private mode */
    }
    setVisible(true)
  }, [storageKey])

  if (!visible) return null

  function dismiss() {
    try {
      sessionStorage.setItem(storageKey, '1')
    } catch {
      /* private mode */
    }
    setVisible(false)
  }

  const pending = tone === 'pending'

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-2.5 border-b px-4 py-3.5 text-sm leading-5 md:px-8 ${
        pending
          ? 'border-[#fde8d8] bg-[#fff7ed] text-[#9a3412]'
          : 'border-red-200 bg-red-50 text-red-900'
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          pending ? 'bg-[#ffedd5] text-[#c2410c]' : 'bg-red-100 text-red-700'
        }`}
        aria-hidden
      >
        <Icon name={pending ? 'clock' : 'edit'} className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">{children}</div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss review notice"
        className={`keep-height -mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          pending ? 'text-[#c2410c] hover:bg-[#ffedd5]' : 'text-red-700 hover:bg-red-100'
        }`}
      >
        <Icon name="x" className="h-4 w-4" />
      </button>
    </div>
  )
}

export function PendingReviewCopy({ businessName }: { businessName: string }) {
  return (
    <span>
      We’re reviewing {businessName}. Customers can find and book you after approval — usually within one business day.
    </span>
  )
}

export function RejectedReviewCopy({ note, businessName }: { note: string | null; businessName: string }) {
  return (
    <span>
      {note || `${businessName} wasn’t approved.`}{' '}
      <Link href="/dashboard/storefront?tab=page" className="font-semibold underline underline-offset-2">
        Update the business page
      </Link>{' '}
      and we’ll look again.
    </span>
  )
}
