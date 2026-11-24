'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type AskOptions = {
  /** Primary question. Keep it short. */
  title?: string
  /** Supporting consequence — what happens if they confirm. */
  body?: string
  confirmLabel?: string
  /** Destructive confirms use a danger button (Remove, Delete). */
  danger?: boolean
}

type Ask = {
  message: string
  title?: string
  body?: string
  confirmLabel: string
  danger: boolean
  resolve: (ok: boolean) => void
}

/**
 * In-app confirmation. Always portaled to `document.body` so table/flex
 * ancestors (e.g. `text-right`) cannot skew layout or clip the overlay.
 */
export function useAskConfirm() {
  const [ask, setAsk] = useState<Ask | null>(null)
  const [mounted, setMounted] = useState(false)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const bodyId = useId()

  useEffect(() => setMounted(true), [])

  function askConfirm(message: string, confirmLabelOrOptions: string | AskOptions = 'Continue') {
    const options =
      typeof confirmLabelOrOptions === 'string'
        ? { confirmLabel: confirmLabelOrOptions }
        : confirmLabelOrOptions
    const confirmLabel = options.confirmLabel ?? 'Continue'
    const danger =
      options.danger ??
      /^(remove|delete|disconnect|cancel)/i.test(confirmLabel)
    return new Promise<boolean>((resolve) => {
      setAsk({
        message,
        title: options.title,
        body: options.body,
        confirmLabel,
        danger,
        resolve,
      })
    })
  }

  function close(ok: boolean) {
    ask?.resolve(ok)
    setAsk(null)
  }

  useEffect(() => {
    if (!ask) return
    const previous = document.activeElement as HTMLElement | null
    confirmRef.current?.focus()
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        close(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      previous?.focus?.()
    }
  }, [ask])

  const heading = ask?.title ?? ask?.message ?? ''
  const detail = ask?.body ?? (ask?.title ? ask.message : undefined)

  const dialog =
    ask && mounted
      ? createPortal(
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="presentation">
            <button
              type="button"
              aria-label="Dismiss"
              className="absolute inset-0 bg-[#0a0a0a]/40 backdrop-blur-[2px]"
              onClick={() => close(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={detail ? bodyId : undefined}
              className="relative z-10 w-full max-w-[22rem] rounded-[20px] bg-white p-5 text-left shadow-[0_24px_80px_rgba(15,15,20,0.28)] sm:p-6"
            >
              <h2 id={titleId} className="text-base font-semibold tracking-tight text-[#0a0a0a]">
                {heading}
              </h2>
              {detail ? (
                <p id={bodyId} className="mt-2 text-sm leading-6 text-[#4a4e57]">
                  {detail}
                </p>
              ) : null}
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="rounded-full px-4 py-2 text-sm font-medium text-[#4a4e57] transition-colors hover:bg-[#f5f6f8] hover:text-[#0a0a0a]"
                  onClick={() => close(false)}
                >
                  Cancel
                </button>
                <button
                  ref={confirmRef}
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm font-semibold text-white transition-[transform,background-color] duration-150 ease-out active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100 ${
                    ask.danger
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-[#0a0a0a] hover:bg-[#1a1a1a]'
                  }`}
                  onClick={() => close(true)}
                >
                  {ask.confirmLabel}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null

  return { askConfirm, dialog }
}
