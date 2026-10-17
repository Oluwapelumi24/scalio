import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ApiError, apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import type { InboxConversation, InboxConversationDetail } from '@/lib/inbox'
import { ChatList, ChatView, LiveRefresh } from './InboxClient'

/** Inbox — Instagram, Messenger and WhatsApp chats in one place, with AI replies (ADS_MANAGER_PLAN.md §2d). */
export default async function InboxPage({ searchParams }: { searchParams: Promise<{ filter?: string; c?: string }> }) {
  const token = await requireToken()
  const me = await apiFetch<{ role: string }>('/vendor-auth/me', token)
  if (me.role === 'practitioner') redirect('/dashboard')
  const sp = await searchParams
  const filter = sp.filter === 'needs_you' ? 'needs_you' : 'all'
  const canManage = me.role === 'owner' || me.role === 'manager'

  // The open chat is read first, so it's already marked read in the list.
  let chats: InboxConversation[]
  let selected: InboxConversationDetail | null = null
  try {
    if (sp.c) selected = await apiFetch<InboxConversationDetail>(`/vendor-admin/inbox/conversations/${sp.c}`, token).catch(() => null)
    chats = await apiFetch<InboxConversation[]>(`/vendor-admin/inbox/conversations?filter=${filter}`, token)
    if (!selected && chats[0]) selected = await apiFetch<InboxConversationDetail>(`/vendor-admin/inbox/conversations/${chats[0].id}`, token).catch(() => null)
  } catch (err) {
    if (!(err instanceof ApiError)) throw err
    return (
      <div className="max-w-xl space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
        <p className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-gray-600">{err.message}</p>
      </div>
    )
  }
  if (selected) chats = chats.map((c) => (c.id === selected!.id ? { ...c, unreadCount: 0 } : c))

  return (
    <div className="space-y-4">
      <LiveRefresh seconds={10} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
          <p className="text-sm text-gray-500 mt-1">Messages from Instagram, Messenger and WhatsApp in one place.</p>
        </div>
        {canManage && (
          <Link href="/dashboard/inbox/settings" className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            AI replies &amp; FAQ
          </Link>
        )}
      </div>

      <div className="flex gap-2">
        {(['all', 'needs_you'] as const).map((f) => (
          <Link key={f} href={`/dashboard/inbox?filter=${f}`}
            className={`rounded-full border px-3 py-1 text-sm ${filter === f ? 'border-indigo-900 bg-indigo-900 text-white' : 'border-gray-300 bg-white text-gray-700'}`}>
            {f === 'all' ? 'All chats' : 'Needs you'}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(260px,340px)_1fr]">
        <ChatList chats={chats} selectedId={selected?.id ?? null} filter={filter} />
        {selected ? <ChatView key={selected.id} chat={selected} /> : (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">
            {chats.length ? 'Choose a chat.' : filter === 'needs_you'
              ? 'Nothing needs you right now. Chats the AI hands to you — complaints, refunds, questions it can’t answer — show here.'
              : 'No chats yet. When customers message your Instagram or Facebook Page, they’ll show here.'}
          </div>
        )}
      </div>
    </div>
  )
}
