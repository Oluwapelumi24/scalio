'use client'

import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/Icon'

/** Lets staff copy or send the public booking page so customers can check them out and book. */
export function ShareBusinessSheet({
  open,
  onClose,
  url,
  businessName,
  live,
}: {
  open: boolean
  onClose: () => void
  url: string
  businessName: string
  /** False while the business is still in review — link exists but customers get a 404. */
  live: boolean
}) {
  const [copied, setCopied] = useState(false)
  const panel = useRef<HTMLDivElement>(null)
  const visible = url.replace(/^https?:\/\//, '')
  const message = `Check out ${businessName} on Veno and book a time: ${url}`
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    panel.current?.querySelector<HTMLElement>('button')?.focus()

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* address stays visible to copy by hand */
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title: businessName, text: message, url })
      onClose()
    } catch {
      /* user cancelled or share unavailable */
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-[#0a0a0a]/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-business-title"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-t-[24px] bg-white shadow-[0_24px_80px_rgba(15,15,20,0.28)] sm:rounded-[24px]"
      >
        <div className="px-5 pb-5 pt-5 sm:px-6">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#e4e6eb] sm:hidden" aria-hidden />
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="share-business-title" className="text-lg font-bold tracking-tight text-[#0a0a0a]">
                Share business
              </h2>
              <p className="mt-1 text-sm leading-5 text-[#4a4e57]">
                Send this link so customers can see your page and book.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="keep-height -mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#7d818b] hover:bg-[#f5f6f8]"
            >
              <Icon name="x" className="h-4 w-4" />
            </button>
          </div>

          {!live ? (
            <p className="mt-4 rounded-2xl bg-[#fff7ed] px-3.5 py-3 text-[13px] leading-5 text-[#9a3412]">
              Your page is still in review. Customers can’t open this link until you’re approved — you can copy it now and share after.
            </p>
          ) : null}

          <div className="mt-4 rounded-2xl bg-[#f5f6f8] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#7d818b]">{businessName}</p>
            <p className="mt-1 break-all text-sm font-medium text-[#0a0a0a]" title={url}>
              {visible}
            </p>
          </div>

          <div className="mt-4 grid gap-2">
            <button
              type="button"
              onClick={() => void copy()}
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#1e3a8a] text-sm font-semibold text-white"
            >
              <Icon name={copied ? 'check' : 'copy'} className="h-4 w-4" />
              {copied ? 'Link copied' : 'Copy link'}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 items-center justify-center gap-2 rounded-full border border-[#e4e6eb] text-sm font-semibold text-[#0a0a0a] hover:bg-[#f5f6f8]"
            >
              <Icon name="message-circle" className="h-4 w-4" />
              Share on WhatsApp
            </a>
            {canNativeShare ? (
              <button
                type="button"
                onClick={() => void nativeShare()}
                className="flex h-12 items-center justify-center gap-2 rounded-full border border-[#e4e6eb] text-sm font-semibold text-[#0a0a0a] hover:bg-[#f5f6f8]"
              >
                <Icon name="share" className="h-4 w-4" />
                More ways to share
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
