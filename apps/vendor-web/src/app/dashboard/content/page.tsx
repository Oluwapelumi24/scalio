import Link from 'next/link'
import { redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { mediaUrl, type ContentPost, type PostStatus, type StudioInfo } from '@/lib/growth'

const TABS: { id: PostStatus; label: string; empty: string }[] = [
  { id: 'planned', label: 'Planned', empty: 'Nothing planned. Open a draft and pick a day to put it on your calendar.' },
  { id: 'draft', label: 'Drafts', empty: 'No drafts yet. Start a new post — with AI or on your own.' },
  { id: 'posted', label: 'Posted', empty: "Posts you've marked as posted show up here." },
]

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const monthParam = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

export default async function ContentStudioPage({ searchParams }: { searchParams: Promise<{ tab?: string; month?: string }> }) {
  const token = await requireToken()
  const me = await apiFetch<{ role: string }>('/vendor-auth/me', token)
  if (me.role === 'practitioner') redirect('/dashboard')

  const sp = await searchParams
  const tab = (TABS.find((t) => t.id === sp.tab)?.id ?? 'planned') as PostStatus
  const now = new Date()
  const [y, m] = /^\d{4}-\d{2}$/.test(sp.month ?? '') ? sp.month!.split('-').map(Number) : [now.getFullYear(), now.getMonth() + 1]
  const monthStart = new Date(y, m - 1, 1)
  const monthEnd = new Date(y, m, 0, 23, 59, 59)

  const [studio, posts, monthPosts] = await Promise.all([
    apiFetch<StudioInfo>('/vendor-admin/content/studio', token),
    apiFetch<ContentPost[]>(`/vendor-admin/content/posts?status=${tab}`, token),
    apiFetch<ContentPost[]>(`/vendor-admin/content/posts?from=${monthStart.toISOString()}&to=${monthEnd.toISOString()}`, token),
  ])
  const names = new Map(studio.platforms.map((p) => [p.id, p.name]))

  // Calendar cells: Monday-first weeks covering the month.
  const byDay = new Map<string, ContentPost[]>()
  for (const p of monthPosts) {
    const when = p.status === 'posted' ? p.postedAt : p.plannedFor
    if (!when) continue
    const key = ymd(new Date(when))
    byDay.set(key, [...(byDay.get(key) ?? []), p])
  }
  const lead = (monthStart.getDay() + 6) % 7
  const cells: (Date | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: monthEnd.getDate() }, (_, i) => new Date(y, m - 1, i + 1)),
  ]
  while (cells.length % 7) cells.push(null)
  const todayKey = ymd(now)
  const tabHref = (t: PostStatus) => `/dashboard/content?tab=${t}${sp.month ? `&month=${sp.month}` : ''}`
  const monthHref = (offset: number) => `/dashboard/content?tab=${tab}&month=${monthParam(new Date(y, m - 1 + offset, 1))}`

  return (
    <div className="max-w-5xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content studio</h1>
          <p className="text-sm text-gray-500 mt-1">Write posts with AI, plan them on your calendar, and keep track of what went out.</p>
        </div>
        <Link href="/dashboard/content/new" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">New post</Link>
      </div>

      {studio.platforms.some((p) => p.canConnect && p.publishing === 'manual') && (
        <Link href="/dashboard/content/connections" className="block rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
          {studio.platforms.some((p) => p.connection?.status === 'needs_reconnect')
            ? 'Your Facebook/Instagram connection needs renewing. Reconnect →'
            : 'Connect Facebook and Instagram to publish and schedule straight from Scalio →'}
        </Link>
      )}
      {studio.platforms.some((p) => p.publishing === 'automatic') && (
        <p className="text-sm text-gray-500"><Link href="/dashboard/content/connections" className="text-indigo-600">Social accounts</Link></p>
      )}

      {!studio.ai.available && (
        <p className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-gray-600">
          AI captions aren&apos;t switched on yet. You can still write, plan and track posts.
        </p>
      )}

      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">{monthStart.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</h2>
          <div className="flex gap-2 text-sm">
            <Link href={monthHref(-1)} className="rounded-md border border-gray-300 px-2 py-1 text-gray-700" aria-label="Previous month">←</Link>
            <Link href={`/dashboard/content?tab=${tab}`} className="rounded-md border border-gray-300 px-2 py-1 text-gray-700">Today</Link>
            <Link href={monthHref(1)} className="rounded-md border border-gray-300 px-2 py-1 text-gray-700" aria-label="Next month">→</Link>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-px rounded-lg bg-gray-200 overflow-hidden text-xs">
          {WEEKDAYS.map((d) => <div key={d} className="bg-gray-50 px-2 py-1.5 font-medium text-gray-500">{d}</div>)}
          {cells.map((d, i) => {
            const key = d ? ymd(d) : `empty-${i}`
            const items = d ? byDay.get(key) ?? [] : []
            return (
              <div key={key} className={`min-h-24 bg-white p-1.5 ${d ? '' : 'bg-gray-50'}`}>
                {d && <p className={`mb-1 text-right ${key === todayKey ? 'font-bold text-indigo-600' : 'text-gray-400'}`}>{d.getDate()}</p>}
                <div className="space-y-1">
                  {items.map((p) => (
                    <Link key={p.id} href={`/dashboard/content/${p.id}`}
                      className={`block truncate rounded px-1.5 py-0.5 ${p.status === 'posted' ? 'bg-emerald-50 text-emerald-800' : 'bg-indigo-50 text-indigo-800'}`}
                      title={p.caption}>
                      {p.status === 'planned' && p.plannedFor ? `${new Date(p.plannedFor).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} ` : '✓ '}
                      {p.caption || 'No caption'}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <p className="mt-3 text-xs text-gray-500">
          <span className="inline-block rounded bg-indigo-50 px-1.5 text-indigo-800">Planned</span>{' '}
          <span className="inline-block rounded bg-emerald-50 px-1.5 text-emerald-800">Posted</span>
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex gap-2">
          {TABS.map((t) => (
            <Link key={t.id} href={tabHref(t.id)} className={`rounded-full border px-3 py-1 text-sm font-medium ${tab === t.id ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 text-gray-700'}`}>
              {t.label}
            </Link>
          ))}
        </div>
        {posts.length === 0 ? (
          <p className="bg-white rounded-xl border border-gray-200 px-5 py-4 text-sm text-gray-500">{TABS.find((t) => t.id === tab)!.empty}</p>
        ) : (
          <ul className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {posts.map((p) => (
              <li key={p.id}>
                <Link href={`/dashboard/content/${p.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
                  {p.mediaId ? (
                    // eslint-disable-next-line @next/next/no-img-element -- served by our sign-in proxy, not optimisable
                    <img src={mediaUrl(p.mediaId)} alt="" className="h-14 w-14 rounded-md object-cover bg-gray-100" />
                  ) : <div className="h-14 w-14 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 text-xs">Text</div>}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{p.caption || 'No caption yet'}</p>
                    <p className="text-xs text-gray-500">
                      {p.status === 'planned' && p.plannedFor ? `${new Date(p.plannedFor).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} · ` : ''}
                      {p.status === 'posted' && p.postedAt ? `Posted ${new Date(p.postedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · ` : ''}
                      {(p.status === 'posted' ? p.postedPlatforms : p.platforms).map((x) => names.get(x) ?? x).join(', ') || 'No platform chosen'}
                    </p>
                    {p.status !== 'posted' && p.checks.some((c) => c.problems.length > 0) && (
                      <p className="text-xs font-medium text-amber-700">Needs changes before posting</p>
                    )}
                  </div>
                  <span className="text-gray-400">›</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
