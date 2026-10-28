'use client'

import { useState, useTransition } from 'react'
import { draftInboxFaq, updateInboxSettings } from '@/app/actions/inbox'
import { AI_MODE_LABELS, CHANNEL_LABELS, hasPlaceholder, type AiReplyMode, type FaqEntry, type InboxChannel, type InboxSettings } from '@/lib/inbox'
import { ChannelIcon } from '../InboxClient'

const MODES: AiReplyMode[] = ['off', 'suggest', 'reply']
const input = 'block w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900'

export function InboxSettingsForm({ settings: initial }: { settings: InboxSettings }) {
  const [settings, setSettings] = useState(initial)
  const [faq, setFaq] = useState<FaqEntry[]>(initial.faq)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isPending, start] = useTransition()

  function setMode(channel: InboxChannel, mode: AiReplyMode) {
    setError(null)
    start(async () => {
      const r = await updateInboxSettings({ aiModes: { [channel]: mode } })
      if (r.error || !r.data) setError(r.error ?? 'Could not change the AI.')
      else setSettings((s) => ({ ...s, channels: r.data!.channels }))
    })
  }

  function edit(i: number, patch: Partial<FaqEntry>) {
    setFaq((f) => f.map((e, j) => (j === i ? { ...e, ...patch } : e)))
    setDirty(true)
    setSaved(false)
  }

  function save() {
    setError(null)
    start(async () => {
      const r = await updateInboxSettings({ faq })
      if (r.error || !r.data) setError(r.error ?? 'Could not save the FAQ.')
      else { setFaq(r.data.faq); setDirty(false); setSaved(true) }
    })
  }

  function draft() {
    if (faq.length && !window.confirm('Replace your FAQ with a fresh AI draft? Nothing is saved until you click Save.')) return
    setError(null)
    start(async () => {
      const r = await draftInboxFaq()
      if (r.error || !r.data) setError(r.error ?? 'Could not draft an FAQ.')
      else { setFaq(r.data.faq); setDirty(true); setSaved(false) }
    })
  }

  const placeholders = faq.filter((f) => hasPlaceholder(f.answer)).length

  return (
    <div className="space-y-6">
      {!settings.aiAvailable && (
        <p className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-gray-600">AI replies aren’t switched on in Scalio yet. You can still set up your FAQ.</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="space-y-2">
        <h2 className="font-semibold text-gray-900">Per channel</h2>
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          {settings.channels.map((c) => {
            const disabled = !c.connected || c.comingSoon || !settings.aiAvailable || isPending
            return (
              <div key={c.channel} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <ChannelIcon channel={c.channel} size={18} />
                <div className="min-w-32 flex-1">
                  <p className="text-sm font-medium text-gray-900">{CHANNEL_LABELS[c.channel]}</p>
                  <p className="text-xs text-gray-500">{c.comingSoon ? 'Coming soon' : c.connected ? c.accountName : 'Not connected'}</p>
                </div>
                <div className={`inline-flex rounded-md bg-slate-100 p-0.5 ${disabled ? 'opacity-50' : ''}`} role="radiogroup" aria-label={`AI on ${CHANNEL_LABELS[c.channel]}`}>
                  {MODES.map((m) => (
                    <button key={m} type="button" role="radio" aria-checked={c.mode === m} disabled={disabled} onClick={() => setMode(c.channel, m)}
                      className={`rounded px-3 py-1 text-xs font-medium ${c.mode === m ? 'bg-white text-indigo-900 shadow-sm' : 'text-gray-600'}`}>
                      {AI_MODE_LABELS[m]}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-sm text-gray-500">
          “Reply for me” sends answers straight away. “Suggest, I send” puts a draft in the chat for you to edit. Complaints, refunds and questions the AI can’t answer always come to you.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Your FAQ</h2>
          <button type="button" onClick={draft} disabled={isPending || !settings.aiAvailable}
            className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-900 disabled:opacity-50">✨ Draft with AI</button>
        </div>
        {placeholders > 0 && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Fill in the {placeholders === 1 ? 'answer' : `${placeholders} answers`} in [brackets]. The AI won’t use an answer until it’s filled in.
          </p>
        )}
        {faq.map((f, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
            <div className="flex gap-2">
              <input className={input} value={f.question} maxLength={300} placeholder="Question, e.g. Do you do home service?" onChange={(e) => edit(i, { question: e.target.value })} />
              <button type="button" onClick={() => { setFaq((x) => x.filter((_, j) => j !== i)); setDirty(true) }} className="text-sm text-gray-500 hover:text-red-600">Remove</button>
            </div>
            <textarea className={`${input} ${hasPlaceholder(f.answer) ? 'border-amber-400' : ''}`} rows={2} maxLength={1000} value={f.answer} placeholder="Answer"
              onChange={(e) => edit(i, { answer: e.target.value })} />
          </div>
        ))}
        <button type="button" disabled={faq.length >= 40} onClick={() => { setFaq((x) => [...x, { question: '', answer: '' }]); setDirty(true) }}
          className="text-sm font-medium text-indigo-900 hover:underline">+ Add a question</button>
        <div className="flex items-center gap-3">
          <button type="button" onClick={save} disabled={!dirty || isPending}
            className="rounded-md bg-indigo-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Save FAQ</button>
          {saved && !dirty && <span className="text-sm text-emerald-700">Saved</span>}
        </div>
      </section>
    </div>
  )
}
