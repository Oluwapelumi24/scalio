import Link from 'next/link'
import { redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import type { StudioInfo } from '@/lib/growth'
import { PostEditor } from '../PostEditor'

export default async function NewPostPage() {
  const token = await requireToken()
  const me = await apiFetch<{ role: string }>('/vendor-auth/me', token)
  if (me.role === 'practitioner') redirect('/dashboard')
  const studio = await apiFetch<StudioInfo>('/vendor-admin/content/studio', token)

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <Link href="/dashboard/content" className="text-sm text-indigo-600">← Content studio</Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">New post</h1>
      </div>
      <PostEditor studio={studio} initial={null} />
    </div>
  )
}
