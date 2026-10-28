import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ApiError, apiFetch } from '@/lib/api'
import { FeedbackForm } from './FeedbackForm'

interface FeedbackView {
  businessName: string
  logoUrl: string | null
  themeColor: string | null
  customerFirstName: string
  staffFirstName: string | null
  services: string[]
  visitedAt: string
  submitted: { rating: number; comment: string | null } | null
  expired: boolean
}

// A private link from the business's "How was your visit?" message. Not for search engines.
export const metadata: Metadata = { title: 'How was your visit? — Scalio', robots: { index: false, follow: false } }

export default async function FeedbackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  let view: FeedbackView
  try {
    view = await apiFetch<FeedbackView>(`/feedback/${encodeURIComponent(token)}`)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound()
    throw err
  }

  const brand = view.themeColor ?? '#4f46e5'
  const visited = new Date(view.visitedAt).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <main className="mx-auto max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div style={{ backgroundColor: brand }} className="flex items-center gap-3 px-6 py-5 text-white">
          {view.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={view.logoUrl} alt="" className="h-12 w-12 rounded-xl bg-white object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-xl font-bold">{view.businessName.charAt(0)}</div>
          )}
          <p className="text-lg font-semibold">{view.businessName}</p>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Hi {view.customerFirstName}, how was your visit?</h1>
            <p className="mt-1 text-sm text-slate-500">
              {visited}
              {view.services.length > 0 && ` · ${view.services.join(', ')}`}
              {view.staffFirstName && ` · with ${view.staffFirstName}`}
            </p>
          </div>

          {view.submitted ? (
            <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Thanks — you rated this visit {view.submitted.rating} out of 5. {view.businessName} has your feedback.
            </p>
          ) : view.expired ? (
            <p className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-600">This feedback link has expired.</p>
          ) : (
            <FeedbackForm token={token} businessName={view.businessName} brand={brand} />
          )}
        </div>
      </main>
      <p className="mt-6 text-center text-xs text-slate-400">Your feedback goes to {view.businessName}. Powered by Scalio.</p>
    </div>
  )
}
