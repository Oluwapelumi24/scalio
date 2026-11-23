import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ApiError, apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import type { InboxConversation, InboxConversationDetail } from '@/lib/inbox'
import { EmptyInbox } from '../home/visuals'
import { EmptyState } from '../EmptyState'
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
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
        <EmptyState
          art={<EmptyInbox className="h-20 w-20" />}
          title="Inbox isn’t ready yet"
          body={err.message}
        />
      </div>
    )
  }
  if (selected) chats = chats.map((c) => (c.id === selected!.id ? { ...c, unreadCount: 0 } : c))

  return (
    <div className="space-y-4">
      <LiveRefresh seconds={10} />
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
          <p className="mt-1 text-sm text-gray-500">Messages from Instagram, Messenger and WhatsApp in one place.</p>
        </div>
        {canManage && (
          <Link href="/dashboard/inbox/settings" className="inline-flex h-12 shrink-0 items-center rounded-[20px] border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
            AI replies &amp; FAQ
          </Link>
        )}
      </div>

      <div className="flex gap-2">
        {(['all', 'needs_you'] as const).map((f) => (
          <Link key={f} href={`/dashboard/inbox?filter=${f}`}
            className={`rounded-[20px] border px-3 text-sm ${filter === f ? 'border-indigo-900 bg-indigo-900 text-white' : 'border-gray-300 bg-white text-gray-700'} h-12 inline-flex items-center`}>
            {f === 'all' ? 'All chats' : 'Needs you'}
          </Link>
        ))}
      </div>

      {chats.length === 0 ? (
        <EmptyState
          art={<EmptyInbox className="h-20 w-20" />}
          title={filter === 'needs_you' ? 'Nothing needs you right now' : 'No chats yet'}
          body={
            filter === 'needs_you'
              ? 'Chats the AI hands to you — complaints, refunds, questions it can’t answer — show here.'
              : 'When customers message your Instagram or Facebook Page, they show up here.'
          }
          action={
            canManage ? (
              <Link
                href="/dashboard/inbox/settings"
                className="inline-flex h-10 items-center rounded-full border border-[#e4e6eb] bg-white px-4 text-sm font-semibold text-[#0a0a0a]"
              >
                AI replies &amp; FAQ
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(260px,340px)_1fr]">
          <div className={sp.c ? 'hidden lg:block' : undefined}>
            <ChatList chats={chats} selectedId={selected?.id ?? null} filter={filter} />
          </div>
          <div className={sp.c ? undefined : 'hidden lg:block'}>
            {sp.c ? (
              <Link href={`/dashboard/inbox?filter=${filter}`} className="mb-3 inline-flex text-sm font-semibold text-[#1e3a8a] lg:hidden">
                ← Chats
              </Link>
            ) : null}
            {selected ? (
              <ChatView key={selected.id} chat={selected} />
            ) : (
              <EmptyState art={<EmptyInbox className="h-16 w-16" />} title="Choose a chat" body="Pick a conversation on the left to reply." />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
