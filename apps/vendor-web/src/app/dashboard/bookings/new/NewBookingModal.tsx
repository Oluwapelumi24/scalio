'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { NewBookingForm } from './NewBookingForm'

interface Option {
  id: string
  name: string
}

/** Soft-nav overlay for walk-ins — dismiss with Escape, backdrop, or Cancel. */
export function NewBookingModal({
  services,
  staff,
  lockStaffId,
}: {
  services: Option[]
  staff: Option[]
  lockStaffId?: string
}) {
  const router = useRouter()
  const panel = useRef<HTMLDivElement>(null)

  function close() {
    router.back()
  }

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const root = panel.current
    const focusable = root?.querySelector<HTMLElement>(
      'input:not([type="hidden"]), select, textarea, button, [href], [tabindex]:not([tabindex="-1"])',
    )
    focusable?.focus()

    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      event.preventDefault()
      close()
    }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only dialog chrome
  }, [])

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-[#0a0a0a]/40 backdrop-blur-[2px] transition-opacity"
        onClick={close}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-booking-title"
        className="relative z-10 flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-[24px] bg-white shadow-[0_24px_80px_rgba(15,15,20,0.28)] sm:rounded-[24px]"
      >
        <div className="shrink-0 border-b border-[#e4e6eb] px-5 pb-4 pt-5 sm:px-6">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#e4e6eb] sm:hidden" aria-hidden />
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="new-booking-title" className="text-lg font-bold tracking-tight text-[#0a0a0a]">
                New booking
              </h2>
              <p className="mt-1 text-sm leading-5 text-[#4a4e57]">
                Walk-in, phone, or DM — same as booking online.
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="keep-height -mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#7d818b] hover:bg-[#f5f6f8] hover:text-[#0a0a0a]"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <NewBookingForm
            services={services}
            staff={staff}
            lockStaffId={lockStaffId}
            variant="modal"
            onCancel={close}
          />
        </div>
      </div>
    </div>
  )
}
