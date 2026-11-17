'use client'

import { useState } from 'react'
import { recordModuleUsage } from '@/app/actions/personalisation'
import { Icon } from '@/components/Icon'

export function ShareLink({
  moduleId,
  url,
  title = 'Share booking link',
  body,
}: {
  moduleId: string
  url: string
  title?: string
  body?: string
}) {
  const [copied, setCopied] = useState(false)
  const message = `Book an appointment with us on Veno: ${url}`
  const visible = url.replace(/^https?:\/\//, '')

  async function copy() {
    void recordModuleUsage(moduleId)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* the address stays on screen to copy by hand */
    }
  }

  return (
    <div className="min-w-0 rounded-2xl border border-[#e4e6eb] bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e7f6ee] text-[#166534]">
          <Icon name="share" className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#0a0a0a]">{title}</p>
          {body ? <p className="mt-0.5 text-[13px] leading-5 text-[#4a4e57]">{body}</p> : null}
          <p className="mt-1 truncate text-xs text-[#7d818b]" title={url}>{visible}</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => void copy()}
          className="keep-height flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-[#1e3a8a] px-3 text-sm font-semibold text-white"
        >
          <Icon name={copied ? 'check' : 'copy'} className="h-4 w-4" />
          {copied ? 'Copied' : 'Copy link'}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => void recordModuleUsage(moduleId)}
          className="inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full border border-[#e4e6eb] px-3 text-sm font-semibold text-[#0a0a0a]"
        >
          <Icon name="message-circle" className="h-4 w-4" />
          WhatsApp
        </a>
      </div>
    </div>
  )
}
