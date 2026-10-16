import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ApiError, apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import type { ContentPost, StudioInfo } from '@/lib/growth'
import { PostEditor } from '../PostEditor'

const TITLES = { draft: 'Draft', planned: 'Planned post', posted: 'Posted' } as const

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = await requireToken()
  const me = await apiFetch<{ role: string }>('/vendor-auth/me', token)
  if (me.role === 'practitioner') redirect('/dashboard')

  let post: ContentPost
  try {
    post = await apiFetch<ContentPost>(`/vendor-admin/content/posts/${id}`, token)
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) notFound()
    throw err
  }
  const studio = await apiFetch<StudioInfo>('/vendor-admin/content/studio', token)

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <Link href="/dashboard/content" className="text-sm text-indigo-600">← Content studio</Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{TITLES[post.status]}</h1>
      </div>
      <PostEditor key={post.id} studio={studio} initial={post} />
    </div>
  )
}
