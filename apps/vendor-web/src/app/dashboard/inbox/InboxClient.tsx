'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { sendInboxReply, setConversationAiPaused, suggestInboxReply } from '@/app/actions/inbox'
import {
  AI_MODE_LABELS, CHANNEL_LABELS, shortTime, windowStatus,
  type InboxChannel, type InboxConversation, type InboxConversationDetail, type InboxMessage,
} from '@/lib/inbox'

/** Re-renders the page every few seconds so new messages (from Meta's webhooks) appear. */
export function LiveRefresh({ seconds }: { seconds: number }) {
  const router = useRouter()
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === 'visible') router.refresh() }, seconds * 1000)
    return () => clearInterval(t)
  }, [router, seconds])
  return null
}

export function ChannelIcon({ channel, size = 16 }: { channel: InboxChannel; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', 'aria-label': CHANNEL_LABELS[channel], role: 'img' as const }
  if (channel === 'instagram') {
    return (
      <svg {...common}>
        <rect x="2" y="2" width="20" height="20" rx="6" fill="#c13584" />
        <circle cx="12" cy="12" r="4.5" fill="none" stroke="#fff" strokeWidth="2" />
        <circle cx="17.3" cy="6.7" r="1.3" fill="#fff" />
      </svg>
    )
  }
  if (channel === 'messenger') {
    return (
      <svg {...common}>
        <path d="M12 2C6.5 2 2 6.1 2 11.3c0 2.9 1.4 5.5 3.7 7.2V22l3.4-1.9c.9.3 1.9.4 2.9.4 5.5 0 10-4.1 10-9.2S17.5 2 12 2z" fill="#0084ff" />
        <path d="M6.5 14.2l3.1-3.3 2.4 2 3.2-3.3-3 3.3-2.4-2-3.3 3.3z" fill="#fff" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z" fill="#25d366" />
      <path d="M8.6 7.5c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.1-.2.3 0 .5.5.9 1.9 2.3 3 2.7.2.1.4.1.5-.1l.7-.9c.2-.2.3-.2.5-.1l1.8.9c.2.1.4.2.4.3 0 .2 0 1-.5 1.6-.4.5-1.4.9-2.2.8-1.4-.1-3.6-1-5.2-3-1.4-1.6-1.6-3-1.4-3.8.1-.6.4-.9.6-1.2z" fill="#fff" />
    </svg>
  )
}

const TONE: Record<'ok' | 'warn' | 'closed', string> = {
  ok: 'bg-emerald-50 text-emerald-800',
  warn: 'bg-amber-50 text-amber-800',
  closed: 'bg-slate-100 text-gray-600',
}

export function ChatList({ chats, selectedId, filter }: { chats: InboxConversation[]; selectedId: string | null; filter: string }) {
  if (chats.length === 0) return <div className="hidden lg:block" />
  return (
    <ul className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 bg-white self-start">
      {chats.map((c) => {
        const w = windowStatus(c.window)
        return (
          <li key={c.id}>
            <Link href={`/dashboard/inbox?filter=${filter}&c=${c.id}`}
              className={`flex gap-3 px-3 py-3 hover:bg-slate-50 ${c.id === selectedId ? 'bg-indigo-50' : ''}`}>
              <div className="relative h-10 w-10 shrink-0 rounded-full bg-indigo-100 text-indigo-900 flex items-center justify-center font-bold">
                {c.customerName.slice(0, 1).toUpperCase()}
                <span className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5"><ChannelIcon channel={c.channel} size={14} /></span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={`flex-1 truncate text-sm ${c.unreadCount ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>{c.customerName}</p>
                  <span className="text-xs text-gray-400">{shortTime(c.lastMessageAt)}</span>
                </div>
                <p className={`truncate text-sm ${c.unreadCount ? 'text-gray-900' : 'text-gray-500'}`}>{c.preview}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {c.handoff && <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700">Needs you</span>}
                  {c.adTitle && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-gray-600">From ad</span>}
                  {w.short && <span className={`rounded-full px-2 py-0.5 text-xs ${TONE[w.tone]}`}>{w.short}</span>}
                </div>
              </div>
              {c.unreadCount > 0 && (
                <span className="self-center rounded-full bg-indigo-900 px-1.5 text-xs font-bold text-white">{c.unreadCount}</span>
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

const SENDER_LABEL: Record<InboxMessage['sentBy'], string> = { customer: '', vendor: 'You', ai: 'AI' }

export function ChatView({ chat }: { chat: InboxConversationDetail }) {
  const router = useRouter()
  const [draft, setDraft] = useState(chat.aiSuggestion ?? '')
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [isPending, start] = useTransition()
  const [busy, setBusy] = useState<'send' | 'suggest' | 'ai' | null>(null)
  const [, setTick] = useState(0)
  const bottom = useRef<HTMLDivElement>(null)

  // A suggestion that arrives while the page is open drops into an empty composer.
  const lastSuggestion = useRef(chat.aiSuggestion)
  useEffect(() => {
    if (chat.aiSuggestion && chat.aiSuggestion !== lastSuggestion.current && !draft.trim()) setDraft(chat.aiSuggestion)
    lastSuggestion.current = chat.aiSuggestion
  }, [chat.aiSuggestion]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }) }, [chat.messages.length])
  // Keep the timer text current between refreshes.
  useEffect(() => { const t = setInterval(() => setTick((n) => n + 1), 30_000); return () => clearInterval(t) }, [])

  const w = windowStatus(chat.window)
  const canReply = chat.window.state === 'open' || chat.window.state === 'human_agent'

  function act(kind: 'send' | 'suggest' | 'ai', fn: () => Promise<void>) {
    setError(null)
    setNote(null)
    setBusy(kind)
    start(async () => { await fn(); setBusy(null) })
  }

  const send = () => act('send', async () => {
    const r = await sendInboxReply(chat.id, draft.trim())
    if (r.error) setError(r.error)
    else { setDraft(''); router.refresh() }
  })
  const suggest = () => act('suggest', async () => {
    const r = await suggestInboxReply(chat.id)
    if (r.error) setError(r.error)
    else if (r.data?.suggestion) setDraft(r.data.suggestion)
    else if (r.data?.handoff) setNote(`${r.data.handoff.label}, so the AI won’t suggest a reply — best answered by you.`)
  })
  const setPaused = (paused: boolean) => act('ai', async () => {
    const r = await setConversationAiPaused(chat.id, paused)
    if (r.error) setError(r.error)
    else router.refresh()
  })

  return (
    <section className="flex min-h-[480px] flex-col rounded-lg border border-gray-200 bg-white lg:h-[calc(100vh-220px)]">
      <header className="space-y-2 border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <ChannelIcon channel={chat.channel} size={18} />
          <h2 className="flex-1 truncate font-semibold text-gray-900">{chat.customerName}</h2>
          {chat.leadId && <Link href={`/dashboard/leads/${chat.leadId}`} className="text-sm font-medium text-indigo-900 hover:underline">Lead →</Link>}
        </div>
        <p className="text-xs text-gray-500">{CHANNEL_LABELS[chat.channel]}{chat.adTitle ? ` · From ad: ${chat.adTitle}` : ''}</p>
        <p className={`rounded-md px-3 py-1.5 text-sm ${TONE[w.tone]}`}>⏱ {w.long}</p>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="flex-1">
            {chat.aiMode === 'off' ? `AI is off for ${CHANNEL_LABELS[chat.channel]}` : chat.aiPaused ? 'AI is paused for this chat' : `AI: ${AI_MODE_LABELS[chat.aiMode]}`}
          </span>
          {chat.aiMode !== 'off' && (
            <button type="button" onClick={() => setPaused(!chat.aiPaused)} disabled={isPending} className="font-medium text-indigo-900 hover:underline disabled:opacity-50">
              {chat.aiPaused ? 'Turn on for this chat' : 'Pause for this chat'}
            </button>
          )}
        </div>
      </header>

      {chat.handoff && (
        <p className="bg-red-50 px-4 py-2 text-sm text-red-800">{chat.handoff.label}. The AI has stopped — please reply yourself.</p>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50 px-4 py-3">
        {chat.messages.map((m) => {
          const mine = m.direction === 'out'
          return (
            <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                m.sentBy === 'ai' ? 'bg-indigo-100 text-gray-900' : mine ? 'bg-indigo-900 text-white' : 'border border-gray-200 bg-white text-gray-900'}`}>
                {m.text}
                {m.attachments.map((a, i) => (
                  <span key={i} className="block opacity-75">{a.type === 'image' ? '📷 Photo' : a.type === 'audio' ? '🎤 Voice note' : '📎 Attachment'}</span>
                ))}
              </div>
              <span className="mt-0.5 px-1 text-xs text-gray-400">
                {[SENDER_LABEL[m.sentBy], shortTime(m.sentAt), m.humanAgentTag ? 'human reply' : null, m.status === 'failed' ? 'not sent' : null].filter(Boolean).join(' · ')}
              </span>
            </div>
          )
        })}
        <div ref={bottom} />
      </div>

      <footer className="space-y-2 border-t border-gray-100 px-4 py-3">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {note && <p className="text-sm text-amber-700">{note}</p>}
        {canReply ? (
          <>
            {chat.window.state === 'human_agent' && (
              <p className="text-xs text-gray-500">Human reply (up to 7 days) — sent with Meta’s “human agent” tag.</p>
            )}
            <form onSubmit={(e) => { e.preventDefault(); if (draft.trim()) send() }} className="flex items-end gap-2">
              <button type="button" onClick={suggest} disabled={isPending} title="Suggest a reply with AI"
                className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-900 disabled:opacity-50">
                {busy === 'suggest' ? '…' : '✨ Suggest'}
              </button>
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} maxLength={1000} placeholder="Write a reply…"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (draft.trim() && !isPending) send() } }}
                className="flex-1 resize-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900" />
              <button type="submit" disabled={isPending || !draft.trim()}
                className="rounded-md bg-indigo-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
                {busy === 'send' ? 'Sending…' : 'Send'}
              </button>
            </form>
          </>
        ) : (
          <p className="text-center text-sm text-gray-500">{chat.window.state === 'template' ? 'Send template (paid) — coming soon.' : w.long}</p>
        )}
      </footer>
    </section>
  )
}
