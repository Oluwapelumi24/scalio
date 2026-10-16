'use client'

import { Star } from 'lucide-react'
import { useState, useTransition } from 'react'
import { submitFeedback } from '@/app/actions/feedback'

const WORDS = ['', 'Very poor', 'Poor', 'Okay', 'Good', 'Excellent']

export function FeedbackForm({ token, businessName, brand }: { token: string; businessName: string; brand: string }) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, start] = useTransition()
  const shown = hover || rating

  if (done) {
    return (
      <p role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Thank you! {businessName} has your feedback.
      </p>
    )
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!rating) return setError('Tap a star to rate your visit.')
        setError(null)
        start(async () => {
          const r = await submitFeedback(token, rating, comment)
          if ('error' in r) setError(r.error)
          else setDone(true)
        })
      }}
    >
      <fieldset>
        <legend className="sr-only">Rating</legend>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} star${n > 1 ? 's' : ''}: ${WORDS[n]}`}
              aria-pressed={rating === n}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              className="p-1"
            >
              <Star className="h-9 w-9" strokeWidth={1.5} style={{ color: n <= shown ? brand : '#cbd5e1', fill: n <= shown ? brand : 'none' }} />
            </button>
          ))}
        </div>
        <p className="mt-1 h-5 text-sm text-slate-500">{WORDS[shown]}</p>
      </fieldset>

      <label className="block text-sm text-slate-700">
        {rating > 0 && rating <= 2 ? 'What went wrong?' : 'Anything you’d like to add?'} <span className="text-slate-400">(optional)</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          rows={3}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </label>

      <button type="submit" disabled={isPending} style={{ backgroundColor: brand }} className="w-full rounded-full px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
        {isPending ? 'Sending…' : 'Send feedback'}
      </button>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </form>
  )
}
