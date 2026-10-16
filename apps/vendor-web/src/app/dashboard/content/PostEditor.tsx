'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { cancelPublication, deletePost, getPostAction, markPosted, planPost, publishPost, retryPublication, savePost, unplanPost, uploadMedia, writeCaption } from '@/app/actions/growth'
import { mediaUrl, type ContentPlatform, type ContentPost, type PostFields, type Publication, type StudioInfo } from '@/lib/growth'

const MAX_EDGE = 1600
const parseTags = (text: string) => text.split(/[\s,]+/).map((t) => t.replace(/^#+/, '')).filter(Boolean)
const tagsText = (tags: string[]) => tags.map((t) => `#${t}`).join(' ')
const toggle = (list: ContentPlatform[], id: ContentPlatform) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
const localInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)

/** Shrinks the photo in the browser to a JPEG no larger than MAX_EDGE, so uploads stay small. */
async function photoToJpegBase64(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.82).split(',')[1]
}

const chip = (on: boolean) =>
  `rounded-full border px-3 py-1 text-sm font-medium ${on ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`

export function PostEditor({ studio, initial }: { studio: StudioInfo; initial: ContentPost | null }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [post, setPost] = useState<ContentPost | null>(initial)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState<null | 'photo' | 'ai' | 'save' | 'plan' | 'posted'>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [aiUsed, setAiUsed] = useState(studio.ai.usedToday)

  const [mediaId, setMediaId] = useState(initial?.mediaId ?? null)
  const [brief, setBrief] = useState(initial?.brief ?? '')
  const [tone, setTone] = useState(initial?.tone ?? 'friendly')
  const [platforms, setPlatforms] = useState<ContentPlatform[]>(initial?.platforms ?? ['instagram'])
  const [caption, setCaption] = useState(initial?.caption ?? '')
  const [cta, setCta] = useState(initial?.callToAction ?? '')
  const [tags, setTags] = useState(tagsText(initial?.hashtags ?? []))
  const [aiGenerated, setAiGenerated] = useState(initial?.aiGenerated ?? false)
  // Planned posts open at their time; others suggest two hours from now.
  const [whenAt, setWhen] = useState(() => localInput(initial?.plannedFor ? new Date(initial.plannedFor) : new Date(Date.now() + 2 * 3_600_000)))
  const [postedOn, setPostedOn] = useState<ContentPlatform[]>(initial ? (initial.status === 'posted' ? initial.postedPlatforms : initial.platforms) : ['instagram'])

  const specs = new Map(studio.platforms.map((p) => [p.id, p]))
  const isPosted = post?.status === 'posted'

  function fill(p: ContentPost) {
    setPost(p); setMediaId(p.mediaId); setCaption(p.caption); setCta(p.callToAction ?? ''); setTags(tagsText(p.hashtags))
    setPlatforms(p.platforms); setAiGenerated(p.aiGenerated); setDirty(false)
  }
  const edit = <T,>(set: (v: T) => void) => (v: T) => { set(v); setDirty(true); setFlash(null) }

  const fields = (): PostFields => ({
    mediaId, brief: brief.trim() || null, tone, caption, callToAction: cta.trim() || null, hashtags: parseTags(tags), platforms, aiGenerated,
  })

  async function ensureSaved(): Promise<ContentPost> {
    if (post && !dirty) return post
    const r = await savePost(post?.id ?? null, fields())
    if (r.error || !r.data) throw new Error(r.error ?? 'Could not save.')
    fill(r.data)
    // Point the URL at the saved post without remounting mid-action (Next syncs with history.replaceState).
    if (!post) window.history.replaceState(null, '', `/dashboard/content/${r.data.id}`)
    return r.data
  }

  async function run(kind: NonNullable<typeof busy>, fn: () => Promise<void>) {
    setBusy(kind); setError(null); setFlash(null)
    try { await fn() } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.') }
    finally { setBusy(null) }
  }

  const pickPhoto = (file: File) => run('photo', async () => {
    const data = await photoToJpegBase64(file)
    const r = await uploadMedia('image/jpeg', data)
    if (r.error || !r.data) throw new Error(r.error ?? 'Could not add the photo.')
    setMediaId(r.data.id); setDirty(true)
  })

  const aiBlocked = !studio.ai.available ? "AI captions aren't switched on yet."
    : aiUsed >= studio.ai.dailyLimit ? `You've used today's ${studio.ai.dailyLimit} AI captions.`
    : !mediaId && brief.trim().length < 3 ? 'Add a photo, or say what the post is about.'
    : platforms.length === 0 ? 'Choose at least one platform.'
    : null

  const generate = () => {
    if (caption.trim() && !confirm('Replace your caption? AI will write a new caption, call to action and hashtags.')) return
    void run('ai', async () => {
      const r = await writeCaption({ brief: brief.trim() || undefined, tone, platforms, mediaId: mediaId ?? undefined })
      if (r.error || !r.data) throw new Error(r.error ?? 'Could not write a caption.')
      setCaption(r.data.caption); setCta(r.data.callToAction); setTags(tagsText(r.data.hashtags))
      setAiGenerated(true); setDirty(true); setAiUsed((n) => n + 1)
    })
  }

  const copy = (platform: ContentPlatform) => run('save', async () => {
    const check = (await ensureSaved()).checks.find((c) => c.platform === platform)
    if (!check) throw new Error('That platform is no longer on this post.')
    if (check.problems.length) throw new Error(check.problems.join(' '))
    await navigator.clipboard.writeText(check.text)
    setFlash(`Copied. Open ${specs.get(platform)!.name}, add your photo and paste the caption — then mark it as posted below.`)
  })

  const plan = () => run('plan', async () => {
    const at = new Date(whenAt)
    if (Number.isNaN(at.getTime()) || at.getTime() < Date.now()) throw new Error('Pick a time in the future.')
    const saved = await ensureSaved()
    const r = await planPost(saved.id, at.toISOString())
    if (r.error || !r.data) throw new Error(r.error ?? 'Could not plan the post.')
    fill(r.data); setFlash('On your calendar.')
  })

  const unplan = () => run('plan', async () => {
    const r = await unplanPost(post!.id)
    if (r.error || !r.data) throw new Error(r.error ?? 'Could not update the post.')
    fill(r.data)
  })

  const posted = () => run('posted', async () => {
    const saved = await ensureSaved()
    const r = await markPosted(saved.id, postedOn)
    if (r.error || !r.data) throw new Error(r.error ?? 'Could not mark as posted.')
    fill(r.data); setFlash('Marked as posted.')
  })

  /** Platforms this post goes to that Scalio can publish to itself. */
  const autoTargets = studio.platforms
    .filter((p) => p.publishing === 'automatic' && platforms.includes(p.id))
    .map((p) => p.id as 'facebook' | 'instagram')
  const targetNames = autoTargets.map((p) => specs.get(p)!.name).join(' & ')

  async function refresh(id: string) {
    const r = await getPostAction(id)
    if (r.data) fill(r.data)
  }

  const publish = (when: 'now' | 'scheduled') => run('posted', async () => {
    const saved = await ensureSaved()
    let at: string | undefined
    if (when === 'scheduled') {
      const t = new Date(whenAt)
      if (Number.isNaN(t.getTime()) || t.getTime() < Date.now()) throw new Error('Pick a time in the future.')
      at = t.toISOString()
    }
    const r = await publishPost(saved.id, autoTargets, at)
    if (r.error) throw new Error(r.error)
    await refresh(saved.id)
    setFlash(at ? `Scheduled for ${targetNames}.` : `Sending to ${targetNames}…`)
    if (!at) setTimeout(() => { void refresh(saved.id) }, 8000)
  })

  const retry = (pub: Publication) => run('posted', async () => {
    const r = await retryPublication(pub.id)
    if (r.error) throw new Error(r.error)
    await refresh(post!.id)
  })

  const cancelPub = (pub: Publication) => run('posted', async () => {
    const r = await cancelPublication(pub.id)
    if (r.error) throw new Error(r.error)
    await refresh(post!.id)
  })

  const remove = () => {
    if (!confirm('Delete this post? The caption and photo will be removed from Scalio.')) return
    void run('save', async () => {
      const r = await deletePost(post!.id)
      if (r.error) throw new Error(r.error)
      router.push('/dashboard/content')
    })
  }

  const label = 'block text-sm font-medium text-gray-700'
  const input = 'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm'

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div className="space-y-6">
        {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {flash && <p role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{flash}</p>}

        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="flex items-start gap-4">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={busy !== null}
              className="h-32 w-32 shrink-0 overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500 flex items-center justify-center">
              {busy === 'photo' ? 'Adding…' : mediaId ? (
                // eslint-disable-next-line @next/next/no-img-element -- served by our sign-in proxy
                <img src={mediaUrl(mediaId)} alt="Post photo" className="h-full w-full object-cover" />
              ) : 'Add a photo'}
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) pickPhoto(f); e.target.value = '' }} />
            <div className="flex-1 space-y-1">
              <label className={label} htmlFor="brief">Anything to add? <span className="font-normal text-gray-400">(optional)</span></label>
              <textarea id="brief" value={brief} onChange={(e) => edit(setBrief)(e.target.value)} rows={3} maxLength={1000}
                placeholder="AI writes from your photo. Add a price, offer or style name if you like, e.g. 20% off this week" className={input} />
              {mediaId && <button type="button" onClick={() => { setMediaId(null); setDirty(true) }} className="text-xs font-medium text-indigo-600">Remove photo</button>}
            </div>
          </div>

          <div>
            <p className={label}>Tone</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {studio.tones.map((t) => <button key={t.id} type="button" aria-pressed={tone === t.id} onClick={() => edit(setTone)(t.id)} className={chip(tone === t.id)}>{t.label}</button>)}
            </div>
          </div>
          <div>
            <p className={label}>Where will you post it?</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {studio.platforms.map((p) => <button key={p.id} type="button" aria-pressed={platforms.includes(p.id)} onClick={() => edit(setPlatforms)(toggle(platforms, p.id))} className={chip(platforms.includes(p.id))}>{p.name}</button>)}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={generate} disabled={!!aiBlocked || busy !== null}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {busy === 'ai' ? 'Writing…' : caption.trim() ? 'Write again with AI' : 'Write with AI'}
            </button>
            <p className="text-xs text-gray-500">
              {aiBlocked ?? `AI drafts from your photo and notes, and won’t make up prices or offers. Check it before posting. ${studio.ai.dailyLimit - aiUsed} left today.`}
            </p>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div>
            <label className={label} htmlFor="caption">Caption</label>
            <textarea id="caption" value={caption} onChange={(e) => edit(setCaption)(e.target.value)} rows={7} className={input} placeholder="Write your caption" />
          </div>
          <div>
            <label className={label} htmlFor="cta">Call to action</label>
            <input id="cta" value={cta} onChange={(e) => edit(setCta)(e.target.value)} maxLength={300} className={input} placeholder="e.g. Book through the link in our bio" />
          </div>
          <div>
            <label className={label} htmlFor="tags">Hashtags</label>
            <input id="tags" value={tags} onChange={(e) => edit(setTags)(e.target.value)} className={input} placeholder="#LagosBraids #knotless" />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{aiGenerated ? 'Written with AI, edited by you.' : ''}</p>
            <button type="button" onClick={() => run('save', async () => { await ensureSaved(); setFlash('Saved.') })} disabled={!dirty || busy !== null}
              className="rounded-lg border border-slate-900 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-40">
              {busy === 'save' ? 'Saving…' : dirty ? (post ? 'Save changes' : 'Save draft') : 'Saved'}
            </button>
          </div>
        </section>

        {post && (
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-gray-900">Preview</h2>
            {dirty && <p className="text-xs text-gray-500">Save to update the preview.</p>}
            {post.checks.length === 0 && <p className="text-sm text-gray-500">Choose a platform to see how the post will look.</p>}
            {post.checks.map((c) => {
              const spec = specs.get(c.platform)!
              return (
                <div key={c.platform} className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{spec.name}</h3>
                    <button type="button" onClick={() => copy(c.platform)} disabled={c.problems.length > 0 || busy !== null}
                      title={c.problems.length ? 'Fix the problems first' : undefined}
                      className="rounded-full border border-indigo-600 px-3 py-1 text-xs font-semibold text-indigo-600 disabled:opacity-40">
                      Copy for {spec.name}
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 font-sans text-sm text-gray-800">{c.text || ' '}</pre>
                  {c.problems.map((p) => <p key={p} className="text-sm text-red-600">• {p}</p>)}
                  {c.notes.map((n) => <p key={n} className="text-xs text-gray-500">{n}</p>)}
                  <p className="text-xs text-gray-500">{spec.manualReason}</p>
                </div>
              )
            })}
          </section>
        )}
      </div>

      <aside className="space-y-6">
        {!isPosted && (
          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h2 className="text-base font-semibold text-gray-900">Publish</h2>
            {autoTargets.length > 0 ? (
              <>
                <p className="text-sm text-gray-700">Scalio can post this to {targetNames} for you.</p>
                <button type="button" onClick={() => publish('now')} disabled={!caption.trim() || busy !== null}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
                  {busy === 'posted' ? 'Sending…' : 'Publish now'}
                </button>
                <p className="text-xs text-gray-500">Or pick a time under “Plan it” and schedule it.</p>
              </>
            ) : studio.platforms.some((p) => p.canConnect) ? (
              <p className="text-sm text-gray-700">
                <Link href="/dashboard/content/connections" className="font-medium text-indigo-600">Connect Facebook and Instagram</Link> to publish and schedule straight from Scalio.
              </p>
            ) : (
              <p className="text-sm text-gray-500">Publishing from Scalio isn’t available yet. Copy the caption from the preview and post from each app.</p>
            )}
          </section>
        )}

        {post && post.publications.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h2 className="text-base font-semibold text-gray-900">Sent from Scalio</h2>
            {post.publications.map((pub) => (
              <div key={pub.id} className="text-sm">
                <p className="font-medium text-gray-900">
                  {specs.get(pub.platform)?.name}:{' '}
                  {pub.status === 'queued' ? (new Date(pub.runAt) > new Date() ? `scheduled for ${new Date(pub.runAt).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}` : 'sending…')
                    : pub.status === 'publishing' ? 'sending…' : pub.status === 'published' ? 'published' : pub.status === 'failed' ? 'didn’t go out' : 'cancelled'}
                </p>
                {pub.status === 'failed' && pub.error && <p className="text-xs text-red-600">{pub.error}</p>}
                <div className="mt-1 flex gap-3 text-xs font-medium">
                  {pub.status === 'published' && pub.permalink && <a href={pub.permalink} target="_blank" rel="noreferrer" className="text-indigo-600">View post</a>}
                  {(pub.status === 'failed' || pub.status === 'cancelled') && <button type="button" onClick={() => retry(pub)} disabled={busy !== null} className="text-indigo-600">Try again</button>}
                  {pub.status === 'queued' && <button type="button" onClick={() => cancelPub(pub)} disabled={busy !== null} className="text-indigo-600">Cancel</button>}
                </div>
              </div>
            ))}
          </section>
        )}

        {!isPosted && (
          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h2 className="text-base font-semibold text-gray-900">Plan it</h2>
            {post?.status === 'planned' && post.plannedFor && (
              <div className="text-sm text-gray-700">
                <p>On your calendar for <strong>{new Date(post.plannedFor).toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })}</strong>.</p>
                <p className="text-xs text-gray-500 mt-1">It shows on your home screen on the day.</p>
                <button type="button" onClick={unplan} disabled={busy !== null} className="mt-2 text-xs font-medium text-indigo-600">Take off the calendar</button>
              </div>
            )}
            <input type="datetime-local" value={whenAt} onChange={(e) => setWhen(e.target.value)} className={input} aria-label="Date and time" />
            <button type="button" onClick={plan} disabled={!caption.trim() || busy !== null}
              className="w-full rounded-lg border border-slate-900 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-40">
              {busy === 'plan' ? 'Planning…' : post?.status === 'planned' ? 'Move to this time' : 'Add to calendar'}
            </button>
            {autoTargets.length > 0 && (
              <button type="button" onClick={() => publish('scheduled')} disabled={!caption.trim() || busy !== null}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
                Schedule for {targetNames}
              </button>
            )}
            <p className="text-xs text-gray-500">
              {!caption.trim() ? 'Add a caption before planning.'
                : autoTargets.length > 0 ? '“Schedule” posts automatically at that time. “Add to calendar” only reminds you on the day.'
                : 'It shows on your home screen on the day, as a reminder to post.'}
            </p>
          </section>
        )}

        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-base font-semibold text-gray-900">{isPosted ? 'Posted on' : 'Already posted it?'}</h2>
          <div className="flex flex-wrap gap-2">
            {studio.platforms.map((p) => <button key={p.id} type="button" aria-pressed={postedOn.includes(p.id)} onClick={() => setPostedOn(toggle(postedOn, p.id))} className={chip(postedOn.includes(p.id))}>{p.name}</button>)}
          </div>
          <button type="button" onClick={posted} disabled={!caption.trim() || postedOn.length === 0 || busy !== null}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
            {busy === 'posted' ? 'Saving…' : isPosted ? 'Update where it was posted' : 'Mark as posted'}
          </button>
          {isPosted && post?.postedAt && <p className="text-xs text-gray-500">Marked as posted on {new Date(post.postedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}.</p>}
        </section>

        {post && (
          <button type="button" onClick={remove} disabled={busy !== null} className="text-sm font-medium text-red-600 hover:text-red-800">Delete post</button>
        )}
      </aside>
    </div>
  )
}
