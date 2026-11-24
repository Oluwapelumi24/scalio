'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type AskOptions = {
  title?: string
  body?: string
  confirmLabel?: string
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

/** In-app confirmation. Portaled so ancestors cannot skew layout or clip it. */
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
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
              onClick={() => close(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={detail ? bodyId : undefined}
              className="relative z-10 w-full max-w-[22rem] rounded-2xl bg-white p-5 text-left shadow-xl sm:p-6"
            >
              <h2 id={titleId} className="text-base font-semibold text-gray-900">
                {heading}
              </h2>
              {detail ? (
                <p id={bodyId} className="mt-2 text-sm leading-6 text-gray-600">
                  {detail}
                </p>
              ) : null}
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="rounded-full px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  onClick={() => close(false)}
                >
                  Cancel
                </button>
                <button
                  ref={confirmRef}
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm font-semibold text-white ${
                    ask.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-slate-800'
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
