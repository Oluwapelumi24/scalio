'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { StepProgress } from '@/components/StepProgress'
import { Icon, type IconName } from '@/components/Icon'
import { uploadMedia } from '@/app/actions/growth'
import {
  checkoutAdCampaign, createAdCampaign, draftAdCopy, estimateAdReach, quoteAd, searchAdInterests, searchAdLocations, suggestAdInterests,
} from '@/app/actions/ads'
import { mediaUrl } from '@/lib/growth'
import {
  compact, naira, type AdBuilder, type AdCopyDraft, type AdDestination, type AdExtras, type AdObjective, type AdPaymentRoute, type AdQuote, type AdTargeting,
  type InterestOption, type LocationOption,
} from '@/lib/ads'

type StepKey = 'goal' | 'audience' | 'placements' | 'ad' | 'budget' | 'review'
const STEP_LABELS: Record<StepKey, string> = { goal: 'Goal', audience: 'Audience', placements: 'Placements', ad: 'Your ad', budget: 'Budget', review: 'Review' }
const DEST_LABELS: Record<AdDestination, string> = { whatsapp: 'WhatsApp', instagram_direct: 'Instagram DM', messenger: 'Messenger', website: 'Website', app: 'App store' }
const OBJECTIVE_ICON: Record<AdObjective, IconName> = { engagement: 'message-circle', awareness: 'eye', traffic: 'mouse-pointer', leads: 'user-plus', app_promotion: 'download', sales: 'shopping-bag' }
const iconTile = (on: boolean) => `flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${on ? 'bg-indigo-700 text-white' : 'bg-indigo-50 text-indigo-700'}`
const PLACEMENTS = [
  { platform: 'facebook', id: 'feed', label: 'Facebook Feed' },
  { platform: 'facebook', id: 'story', label: 'Facebook Stories' },
  { platform: 'facebook', id: 'facebook_reels', label: 'Facebook Reels' },
  { platform: 'instagram', id: 'stream', label: 'Instagram Feed' },
  { platform: 'instagram', id: 'story', label: 'Instagram Stories' },
  { platform: 'instagram', id: 'reels', label: 'Instagram Reels' },
  { platform: 'messenger', id: 'messenger_home', label: 'Messenger inbox' },
] as const
const BUDGET_PRESETS = [200_000, 500_000, 1_000_000, 2_000_000]
const CHAT: AdDestination[] = ['whatsapp', 'instagram_direct', 'messenger']
const DAY_MS = 86_400_000
const MAX_EDGE = 1440

const endLabel = (start: Date, days: number) => new Date(start.getTime() + days * DAY_MS).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
const chip = (on: boolean) => `inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition ${on ? 'border-indigo-700 bg-indigo-700 text-white' : 'border-gray-300 bg-white text-indigo-700 hover:border-indigo-400'}`
const card = (on: boolean) => `flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition ${on ? 'border-indigo-700 bg-indigo-50/60' : 'border-gray-200 bg-white hover:border-gray-300'}`
const input = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100'

async function photoToJpegBase64(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.85).split(',')[1]
}

/** Re-runs an async lookup 400 ms after its inputs settle. */
function useDebounced<T>(fn: () => Promise<{ data?: T }>, deps: unknown[], enabled = true) {
  const [value, setValue] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (!enabled) return
    let live = true
    const t = setTimeout(() => {
      setLoading(true)
      fn().then((r) => { if (live && r.data !== undefined) setValue(r.data) }).finally(() => { if (live) setLoading(false) })
    }, 400)
    return () => { live = false; clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return { value, loading }
}

export function AdWizard({ builder }: { builder: AdBuilder }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple')
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState<null | 'photo' | 'copy' | 'pay'>(null)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(builder.name)
  const [objective, setObjective] = useState<AdObjective>(builder.objective)
  const [destination, setDestination] = useState<AdDestination>(builder.destination)
  const [extras, setExtras] = useState<AdExtras>({})
  const [targeting, setTargeting] = useState<AdTargeting>(builder.targeting)
  const [mediaId, setMediaId] = useState<string | null>(null)
  const [primaryText, setPrimaryText] = useState('')
  const [headline, setHeadline] = useState('')
  const [description, setDescription] = useState('')
  const [link, setLink] = useState(builder.bookingLink)
  const [welcome, setWelcome] = useState('')
  const [iceBreakers, setIceBreakers] = useState(['', '', ''])
  const [brief, setBrief] = useState('')
  const [copy, setCopy] = useState<AdCopyDraft | null>(null)
  const [picked, setPicked] = useState<number | null>(null)
  const [dailyBudgetKobo, setDailyBudgetKobo] = useState(builder.dailyBudgetKobo)
  const [days, setDays] = useState(builder.days)
  const [route, setRoute] = useState<AdPaymentRoute>(builder.routes.scalio.available || !builder.routes.own_meta.available ? 'scalio' : 'own_meta')

  const steps: StepKey[] = mode === 'simple' ? ['goal', 'audience', 'ad', 'budget', 'review'] : ['goal', 'audience', 'placements', 'ad', 'budget', 'review']
  const key = steps[Math.min(step, steps.length - 1)]
  const isChat = CHAT.includes(destination)
  const objectiveInfo = builder.objectives.find((o) => o.id === objective)!
  const startAt = useMemo(() => new Date(), [])

  const quote = useDebounced<AdQuote>(() => quoteAd({ dailyBudgetKobo, days, route }), [dailyBudgetKobo, days, route])
  const reach = useDebounced(() => estimateAdReach({ objective, destination, targeting }), [JSON.stringify(targeting), objective, destination], targeting.locations.length > 0)

  const go = (i: number) => { setError(null); setStep(i); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  function switchMode(next: 'simple' | 'advanced') {
    setMode(next)
    if (next === 'simple') {
      setObjective('engagement')
      if (!CHAT.includes(destination)) setDestination('whatsapp')
      setTargeting((t) => ({ ...t, placements: 'automatic' }))
      setStep((s) => Math.min(s, 4))
    }
  }

  function chooseObjective(o: AdObjective) {
    setObjective(o)
    const dests = builder.objectives.find((x) => x.id === o)!.destinations
    if (!dests.includes(destination)) setDestination(dests[0])
  }

  async function run(kind: NonNullable<typeof busy>, fn: () => Promise<void>) {
    setBusy(kind); setError(null)
    try { await fn() } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.') }
    finally { setBusy(null) }
  }

  const pickPhoto = (file: File) => run('photo', async () => {
    const r = await uploadMedia('image/jpeg', await photoToJpegBase64(file))
    if (r.error || !r.data) throw new Error(r.error ?? 'Could not add the photo.')
    setMediaId(r.data.id)
  })

  const applyVariant = (d: AdCopyDraft, i: number) => {
    const v = d.variants[i]
    if (!v) return
    setPicked(i); setPrimaryText(v.primaryText); setHeadline(v.headline); setDescription(v.description)
  }

  const writeForMe = () => run('copy', async () => {
    const r = await draftAdCopy({ objective, destination, brief: brief.trim() || null })
    if (r.error || !r.data) throw new Error(r.error ?? 'The AI couldn’t write your ad.')
    setCopy(r.data); applyVariant(r.data, 0)
    if (r.data.welcomeMessage) setWelcome(r.data.welcomeMessage)
    if (r.data.iceBreakers.length) setIceBreakers([...r.data.iceBreakers, '', '', ''].slice(0, 3))
  })

  const pay = () => run('pay', async () => {
    const created = await createAdCampaign({
      name: name.trim() || builder.name, mode, objective, destination, route, dailyBudgetKobo,
      startAt: startAt.toISOString(), endAt: new Date(startAt.getTime() + days * DAY_MS).toISOString(), targeting,
      creative: {
        mediaId: mediaId!, primaryText: primaryText.trim(), headline: headline.trim(), description: description.trim() || null,
        link: destination === 'website' ? link.trim() : null,
        welcomeMessage: isChat ? welcome.trim() || null : null,
        iceBreakers: isChat ? iceBreakers.map((q) => q.trim()).filter(Boolean) : [],
      },
      extras,
    })
    if (created.error || !created.data) throw new Error(created.error ?? 'Could not create the ad.')
    const checkout = await checkoutAdCampaign(created.data.id)
    if (checkout.error || !checkout.data) {
      // The ad is saved; finish paying from its page, which shows what's needed.
      const msg = checkout.error ?? 'Could not start payment.'
      router.push(`/dashboard/ads/campaigns/${created.data.id}?payError=${encodeURIComponent(msg)}`)
      return
    }
    if (!checkout.data.paid && checkout.data.authorizationUrl) window.location.href = checkout.data.authorizationUrl
    else router.push(`/dashboard/ads/campaigns/${created.data.id}`)
  })

  const blocker: string | null = (() => {
    switch (key) {
      case 'goal':
        if (destination === 'website' && !/^https:\/\//.test(link)) return 'Add the https:// link people should visit.'
        if (destination === 'app' && (!extras.appId || !/^https:\/\//.test(extras.appStoreUrl ?? ''))) return 'Add your app id and store link.'
        if (objective === 'sales' && destination === 'website' && !extras.pixelId) return 'Add your Meta pixel id.'
        return null
      case 'audience': return targeting.locations.length === 0 ? 'Choose at least one place.' : null
      case 'placements': return targeting.placements !== 'automatic' && Object.values(targeting.placements).every((p) => p.length === 0) ? 'Pick at least one placement.' : null
      case 'ad': return !mediaId ? 'Add a photo for your ad.' : !primaryText.trim() || !headline.trim() ? 'Add your ad text and headline — or use “Write it for me”.' : null
      case 'budget': return builder.routes[route].available ? null : builder.routes[route].reason
      default: return null
    }
  })()

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-28 text-gray-900">
      <div className="flex items-center justify-between">
        <div><Link href="/dashboard/ads" className="text-sm text-indigo-600">← Ads</Link><h1 className="mt-1 text-2xl font-semibold text-gray-900">Create an ad</h1></div>
        <button type="button" onClick={() => switchMode(mode === 'simple' ? 'advanced' : 'simple')} className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100" aria-pressed={mode === 'advanced'}>
          <Icon name={mode === 'simple' ? 'sliders' : 'zap'} className="h-3.5 w-3.5" />{mode === 'simple' ? 'Advanced mode' : 'Simple mode'}
        </button>
      </div>

      <div className="sticky top-0 z-10 -mx-2 rounded-xl border border-gray-200 bg-white/95 p-4 shadow-sm backdrop-blur">
        <StepProgress steps={steps.map((k) => STEP_LABELS[k])} current={step} onStepClick={go} />
      </div>

      <div key={key} className="step-in grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {key === 'goal' && (
            <>
              <h2 className="text-xl font-semibold text-gray-900">What do you want from this ad?</h2>
              {(mode === 'simple' ? builder.objectives.filter((o) => o.simple) : builder.objectives).map((o) => (
                <button key={o.id} type="button" onClick={() => chooseObjective(o.id)} className={card(objective === o.id)} role="radio" aria-checked={objective === o.id}>
                  <span className={iconTile(objective === o.id)}><Icon name={OBJECTIVE_ICON[o.id]} className="h-5 w-5" /></span>
                  <span className="space-y-0.5">
                    <span className="flex items-center gap-2 font-medium text-gray-900">
                      {o.label}
                      {o.id === 'engagement' && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">Recommended</span>}
                    </span>
                    <span className="block text-sm text-gray-600">{o.blurb}</span>
                    {mode === 'advanced' && <span className="block text-xs text-gray-400">Best for: {o.bestFor}</span>}
                  </span>
                </button>
              ))}
              {objectiveInfo.destinations.length > 1 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900">Where should people go?</p>
                  <div className="flex flex-wrap gap-2">
                    {objectiveInfo.destinations.map((d) => <button key={d} type="button" className={chip(destination === d)} onClick={() => setDestination(d)}>{DEST_LABELS[d]}</button>)}
                  </div>
                  {destination === 'whatsapp' && <p className="text-xs text-gray-500">Your WhatsApp Business number must be linked to your Facebook Page.</p>}
                </div>
              )}
              {destination === 'website' && <Labeled label="Link people visit"><input className={input} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" /></Labeled>}
              {destination === 'app' && (
                <>
                  <Labeled label="Meta app id"><input className={input} inputMode="numeric" value={extras.appId ?? ''} onChange={(e) => setExtras({ ...extras, appId: e.target.value.replace(/\D/g, '') })} /></Labeled>
                  <Labeled label="App Store or Google Play link"><input className={input} value={extras.appStoreUrl ?? ''} onChange={(e) => setExtras({ ...extras, appStoreUrl: e.target.value })} placeholder="https://" /></Labeled>
                </>
              )}
              {objective === 'sales' && destination === 'website' && (
                <Labeled label="Meta pixel id"><input className={input} inputMode="numeric" value={extras.pixelId ?? ''} onChange={(e) => setExtras({ ...extras, pixelId: e.target.value.replace(/\D/g, '') })} /></Labeled>
              )}
              {mode === 'simple' && <button type="button" onClick={() => switchMode('advanced')} className="text-sm font-medium text-indigo-600">Other goals (awareness, website visits, sales…) →</button>}
            </>
          )}

          {key === 'audience' && <AudienceStep targeting={targeting} onChange={setTargeting} reach={reach.value?.estimate ?? null} reachLoading={reach.loading} />}

          {key === 'placements' && (
            <>
              <h2 className="text-xl font-semibold text-gray-900">Where should your ad appear?</h2>
              <button type="button" className={card(targeting.placements === 'automatic')} onClick={() => setTargeting({ ...targeting, placements: 'automatic' })}>
                <span className={iconTile(targeting.placements === 'automatic')}><Icon name="zap" className="h-5 w-5" /></span>
                <span><span className="flex items-center gap-2 font-medium text-gray-900">Automatic <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">Recommended</span></span>
                  <span className="block text-sm text-gray-600">Meta shows your ad where it gets the best results for your budget.</span></span>
              </button>
              <button type="button" className={card(targeting.placements !== 'automatic')} onClick={() => targeting.placements === 'automatic' && setTargeting({ ...targeting, placements: { facebook: ['feed'], instagram: ['stream', 'story'], messenger: [] } })}>
                <span className={iconTile(targeting.placements !== 'automatic')}><Icon name="target" className="h-5 w-5" /></span>
                <span><span className="font-medium text-gray-900">Choose myself</span><span className="block text-sm text-gray-600">Pick exactly where it shows.</span></span>
              </button>
              {targeting.placements !== 'automatic' && (
                <div className="grid gap-2 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2">
                  {PLACEMENTS.map((p) => {
                    const pl = targeting.placements as Exclude<AdTargeting['placements'], 'automatic'>
                    const on = pl[p.platform].includes(p.id)
                    return (
                      <label key={`${p.platform}-${p.id}`} className="flex items-center gap-2 text-sm text-gray-800">
                        <input type="checkbox" checked={on} className="h-4 w-4 accent-indigo-700" onChange={() => setTargeting({
                          ...targeting, placements: { ...pl, [p.platform]: on ? pl[p.platform].filter((x) => x !== p.id) : [...pl[p.platform], p.id] },
                        })} />
                        {p.label}
                      </label>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {key === 'ad' && (
            <>
              <h2 className="text-xl font-semibold text-gray-900">Your ad</h2>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void pickPhoto(f); e.target.value = '' }} />
              <button type="button" onClick={() => fileRef.current?.click()} className="flex h-52 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-white hover:border-indigo-400">
                {busy === 'photo' ? <span className="text-sm text-gray-500">Uploading…</span>
                  // eslint-disable-next-line @next/next/no-img-element
                  : mediaId ? <img src={mediaUrl(mediaId)} alt="Ad photo" className="h-full w-full object-cover" />
                  : <span className="flex flex-col items-center gap-2 text-sm font-medium text-indigo-600"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50"><Icon name="image" className="h-5 w-5" /></span>Add a photo of your work<span className="text-xs font-normal text-gray-400">Square photos work best · JPG or PNG</span></span>}
              </button>

              {builder.aiAvailable && (
                <div className="space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                  <p className="flex items-center gap-2 font-medium text-gray-900"><Icon name="star" className="h-4 w-4 text-indigo-600" />Write it for me</p>
                  <input className={input} value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="Optional: what to promote (e.g. weekend braids)" />
                  <button type="button" onClick={() => void writeForMe()} disabled={busy === 'copy'} className="rounded-full border-2 border-indigo-700 px-4 py-1.5 text-sm font-semibold text-indigo-700 disabled:opacity-50">
                    {busy === 'copy' ? 'Writing…' : copy ? 'Write 3 new versions' : 'Write 3 versions'}
                  </button>
                  {copy && (
                    <div className="grid gap-2 sm:grid-cols-3">
                      {copy.variants.map((v, i) => (
                        <button key={i} type="button" onClick={() => applyVariant(copy, i)} className={`rounded-lg border-2 bg-white p-3 text-left ${picked === i ? 'border-indigo-700' : 'border-gray-200'}`}>
                          <span className="text-[11px] font-medium uppercase tracking-wide text-indigo-700">{v.angle}</span>
                          <span className="mt-1 line-clamp-4 text-xs text-gray-600">{v.primaryText}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Labeled label="Ad text" counter={[primaryText.length, 280]}><textarea className={`${input} min-h-24`} value={primaryText} onChange={(e) => setPrimaryText(e.target.value)} /></Labeled>
              <Labeled label="Headline" counter={[headline.length, 40]}><input className={input} value={headline} onChange={(e) => setHeadline(e.target.value)} /></Labeled>
              {mode === 'advanced' && <Labeled label="Description (optional)" counter={[description.length, 30]}><input className={input} value={description} onChange={(e) => setDescription(e.target.value)} /></Labeled>}
              {isChat && (
                <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
                  <div><p className="font-medium text-gray-900">When the chat opens</p><p className="text-xs text-gray-500">Your first message, plus up to 3 questions people can tap.</p></div>
                  <Labeled label="Welcome message" counter={[welcome.length, 300]}>
                    <textarea className={`${input} min-h-20`} value={welcome} onChange={(e) => setWelcome(e.target.value)} placeholder={`Hi! Thanks for reaching ${builder.pageName ?? 'us'} 👋 How can we help?`} />
                  </Labeled>
                  {iceBreakers.map((q, i) => (
                    <Labeled key={i} label={`Quick question ${i + 1}`} counter={[q.length, 80]}>
                      <input className={input} value={q} onChange={(e) => setIceBreakers(iceBreakers.map((x, j) => (j === i ? e.target.value : x)))} placeholder={['How much is it?', 'Can I book for Saturday?', 'Where are you located?'][i]} />
                    </Labeled>
                  ))}
                </div>
              )}
            </>
          )}

          {key === 'budget' && (
            <>
              <h2 className="text-xl font-semibold text-gray-900">Budget and schedule</h2>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">How much per day?</p>
                <div className="flex flex-wrap gap-2">{BUDGET_PRESETS.map((b) => <button key={b} type="button" className={chip(dailyBudgetKobo === b)} onClick={() => setDailyBudgetKobo(b)}>{naira(b)}</button>)}</div>
                <input type="range" min={200_000} max={5_000_000} step={50_000} value={Math.min(dailyBudgetKobo, 5_000_000)} onChange={(e) => setDailyBudgetKobo(Number(e.target.value))} className="w-full accent-indigo-700" aria-label="Daily budget" />
                <p className="text-sm text-gray-700"><span className="text-lg font-medium text-gray-900">{naira(dailyBudgetKobo)}</span> a day{reach.value?.estimate && <> · audience about {compact(reach.value.estimate.lower)}–{compact(reach.value.estimate.upper)} people</>}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">How long should it run?</p>
                <div className="flex flex-wrap items-center gap-2">
                  {[7, 14, 30].map((d) => <button key={d} type="button" className={chip(days === d)} onClick={() => setDays(d)}>{d === 7 ? '7 days · default' : `${d} days`}</button>)}
                  <span className="inline-flex items-center rounded-full border border-gray-300 bg-white">
                    <button type="button" className="px-3 py-1 text-indigo-700" onClick={() => setDays(Math.max(1, days - 1))} aria-label="One day less">−</button>
                    <span className="min-w-16 text-center text-sm font-medium tabular-nums">{days} days</span>
                    <button type="button" className="px-3 py-1 text-indigo-700" onClick={() => setDays(Math.min(90, days + 1))} aria-label="One day more">+</button>
                  </span>
                </div>
                <p className="text-xs text-gray-500">Ends {endLabel(startAt, days)}. You can extend it any time while it’s running.</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">How do you want to pay?</p>
                <RouteCard on={route === 'scalio'} onClick={() => setRoute('scalio')} reason={builder.routes.scalio.reason} title="Pay with Scalio" badge="Easiest" subtitle="Card, bank transfer or USSD in naira. No dollar card needed." />
                <RouteCard on={route === 'own_meta'} onClick={() => setRoute('own_meta')} reason={builder.routes.own_meta.reason} title="My own Meta ad account"
                  subtitle={`Meta charges ${builder.routes.own_meta.paymentMethodLabel ?? 'your card'}; you pay Scalio’s fee only.`} />
              </div>
            </>
          )}

          {key === 'review' && (
            <>
              <h2 className="text-xl font-semibold text-gray-900">Check and launch</h2>
              <Labeled label="Ad name (only you see this)"><input className={input} value={name} onChange={(e) => setName(e.target.value)} /></Labeled>
              <dl className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
                <Review label="Goal" value={`${objectiveInfo.label} · ${DEST_LABELS[destination]}`} onEdit={() => go(steps.indexOf('goal'))} />
                <Review label="Who sees it" onEdit={() => go(steps.indexOf('audience'))}
                  value={`${targeting.locations.map((l) => (l.radiusKm ? `${l.name} +${l.radiusKm} km` : l.name)).join(', ')} · ${targeting.ageMin}–${targeting.ageMax === 65 ? '65+' : targeting.ageMax} · ${targeting.genders === 'all' ? 'everyone' : targeting.genders === 'male' ? 'men' : 'women'}${targeting.interests.length ? ` · ${targeting.interests.map((i) => i.name).join(', ')}` : ''}`} />
                {mode === 'advanced' && <Review label="Placements" value={targeting.placements === 'automatic' ? 'Automatic' : 'Chosen by you'} onEdit={() => go(steps.indexOf('placements'))} />}
                <Review label="Ad" value={headline || '—'} onEdit={() => go(steps.indexOf('ad'))} />
                <Review label="Runs" value={`${naira(dailyBudgetKobo)}/day · ${days} days · ends ${endLabel(startAt, days)}`} onEdit={() => go(steps.indexOf('budget'))} />
                <Review label="Payment" value={route === 'scalio' ? 'Pay with Scalio' : 'My own Meta ad account'} onEdit={() => go(steps.indexOf('budget'))} />
              </dl>
              <p className="text-xs text-gray-500">Meta reviews every ad before it runs — usually within 24 hours. If Meta doesn’t approve it, unspent money paid to Scalio comes back as ad credit.</p>
            </>
          )}
        </div>

        {/* Side panel: live preview and cost, so people always see what they're buying. */}
        <aside className="space-y-4">
          <AdPreview pageName={builder.pageName ?? 'Your business'} mediaId={mediaId} text={primaryText} headline={headline} cta={isChat ? `Send ${DEST_LABELS[destination]} message` : destination === 'app' ? 'Install now' : 'Book now'} />
          <CostCard quote={quote.value} loading={quote.loading} />
        </aside>
      </div>

      <div className="fixed bottom-0 left-56 right-0 z-20 border-t border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <button type="button" onClick={() => (step > 0 ? go(step - 1) : router.push('/dashboard/ads'))} className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">Back</button>
          <p className="line-clamp-2 flex-1 text-sm leading-snug text-gray-500" role="status">{error ? <span className="text-red-600">{error}</span> : blocker}</p>
          {key === 'review' ? (
            <button type="button" onClick={() => void pay()} disabled={busy === 'pay' || !quote.value} className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {busy === 'pay' ? 'Setting up…' : quote.value && quote.value.dueNowKobo > 0 ? `Pay ${naira(quote.value.dueNowKobo)} and launch` : 'Launch ad'}
            </button>
          ) : (
            <button type="button" onClick={() => go(step + 1)} disabled={!!blocker} className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Continue</button>
          )}
        </div>
      </div>
    </div>
  )
}

function AudienceStep({ targeting, onChange, reach, reachLoading }: { targeting: AdTargeting; onChange: (t: AdTargeting) => void; reach: { lower: number; upper: number } | null; reachLoading: boolean }) {
  const [placeQ, setPlaceQ] = useState('')
  const [interestQ, setInterestQ] = useState('')
  const places = useDebounced<LocationOption[]>(() => searchAdLocations(placeQ), [placeQ], placeQ.trim().length >= 2)
  const found = useDebounced<InterestOption[]>(() => searchAdInterests(interestQ), [interestQ], interestQ.trim().length >= 2)
  const names = targeting.interests.map((i) => i.name)
  const suggested = useDebounced<InterestOption[]>(() => suggestAdInterests(names), [names.join('|')], names.length > 0)
  const chosen = new Set(targeting.interests.map((i) => i.id))
  const add = (i: { id: string; name: string }) => !chosen.has(i.id) && onChange({ ...targeting, interests: [...targeting.interests, { id: i.id, name: i.name }].slice(0, 25) })
  const breadth = reach ? Math.min(100, Math.max(5, (Math.log10(Math.max(reach.upper, 1000)) / 7) * 100)) : 0

  return (
    <>
      <h2 className="text-xl font-semibold text-gray-900">Who should see it?</h2>
      <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900">Audience size</p>
          <p className={`text-sm font-medium text-indigo-700 ${reachLoading ? 'animate-pulse' : ''}`}>{reach ? `${compact(reach.lower)}–${compact(reach.upper)} people` : '—'}</p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-indigo-50"><div className="h-full rounded-full bg-teal-500 transition-[width] duration-700" style={{ width: `${breadth}%` }} /></div>
        <div className="flex justify-between text-[11px] text-gray-400"><span>Specific</span><span>Broad</span></div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-900">Where</p>
        {targeting.locations.map((l) => (
          <div key={l.key} className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
            <span className="flex flex-1 items-center gap-2 text-sm text-gray-900"><Icon name="map-pin" className="h-4 w-4 text-indigo-600" />{l.name}</span>
            {l.type === 'city' && [5, 10, 25].map((km) => (
              <button key={km} type="button" className={`${chip(l.radiusKm === km)} !px-2 !py-0.5 !text-xs`} onClick={() => onChange({ ...targeting, locations: targeting.locations.map((x) => (x.key === l.key ? { ...x, radiusKm: km } : x)) })}>+{km} km</button>
            ))}
            <button type="button" aria-label={`Remove ${l.name}`} className="px-1 text-gray-400 hover:text-gray-700" onClick={() => onChange({ ...targeting, locations: targeting.locations.filter((x) => x.key !== l.key) })}><Icon name="x" className="h-4 w-4" /></button>
          </div>
        ))}
        <input className={input} value={placeQ} onChange={(e) => setPlaceQ(e.target.value)} placeholder="Add a city or state" />
        {placeQ.trim().length >= 2 && (places.value ?? []).map((p) => (
          <button key={p.key} type="button" className="flex w-full items-center gap-2 rounded-lg bg-white px-3 py-2 text-left text-sm hover:bg-indigo-50" onClick={() => {
            if (!targeting.locations.some((l) => l.key === p.key)) onChange({ ...targeting, locations: [...targeting.locations, { key: p.key, type: p.type, name: p.label, ...(p.type === 'city' ? { radiusKm: 10 } : {}) }] })
            setPlaceQ('')
          }}>
            <Icon name="plus" className="h-4 w-4 text-indigo-600" /><span className="flex-1">{p.label}</span><span className="text-xs text-gray-400">{p.type}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-900">Age</p>
          <div className="flex items-center gap-2">
            <select className={input} value={targeting.ageMin} onChange={(e) => onChange({ ...targeting, ageMin: Math.min(Number(e.target.value), targeting.ageMax) })} aria-label="Youngest age">
              {Array.from({ length: 48 }, (_, i) => 18 + i).map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <span className="text-sm text-gray-500">to</span>
            <select className={input} value={targeting.ageMax} onChange={(e) => onChange({ ...targeting, ageMax: Math.max(Number(e.target.value), targeting.ageMin) })} aria-label="Oldest age">
              {Array.from({ length: 48 }, (_, i) => 18 + i).map((a) => <option key={a} value={a}>{a === 65 ? '65+' : a}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-900">Gender</p>
          <div className="flex rounded-full bg-indigo-50 p-1">
            {(['all', 'female', 'male'] as const).map((g) => (
              <button key={g} type="button" onClick={() => onChange({ ...targeting, genders: g })} className={`flex-1 rounded-full py-1.5 text-sm font-medium transition ${targeting.genders === g ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600'}`}>
                {g === 'all' ? 'Everyone' : g === 'female' ? 'Women' : 'Men'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-900">Interests</p>
        <p className="text-xs text-gray-500">Type what your customers are into — like hairstyling or skincare.</p>
        <div className="flex flex-wrap gap-2">
          {targeting.interests.map((i) => <button key={i.id} type="button" className={chip(true)} onClick={() => onChange({ ...targeting, interests: targeting.interests.filter((x) => x.id !== i.id) })}>{i.name}<Icon name="x" className="h-3.5 w-3.5" /></button>)}
        </div>
        <input className={input} value={interestQ} onChange={(e) => setInterestQ(e.target.value)} placeholder="Search interests, e.g. skincare" />
        {interestQ.trim().length >= 2 && (found.value ?? []).slice(0, 8).map((i) => (
          <button key={i.id} type="button" className="flex w-full items-center gap-2 rounded-lg bg-white px-3 py-2 text-left text-sm hover:bg-indigo-50" onClick={() => { add(i); setInterestQ('') }}>
            <Icon name="plus" className="h-4 w-4 text-indigo-600" /><span className="flex-1">{i.name}</span>{i.audienceSize ? <span className="text-xs text-gray-400">{compact(i.audienceSize)}</span> : null}
          </button>
        ))}
        {interestQ.trim().length < 2 && (suggested.value ?? []).filter((x) => !chosen.has(x.id)).length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Suggested for you</p>
            <div className="flex flex-wrap gap-2">{(suggested.value ?? []).filter((x) => !chosen.has(x.id)).slice(0, 8).map((i) => <button key={i.id} type="button" className={chip(false)} onClick={() => add(i)}><Icon name="plus" className="h-3.5 w-3.5" />{i.name}</button>)}</div>
          </div>
        )}
      </div>
    </>
  )
}

function Labeled({ label, counter, children }: { label: string; counter?: [number, number]; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="flex justify-between text-sm font-medium text-gray-900">{label}{counter && <span className={`text-xs font-normal ${counter[0] > counter[1] ? 'text-amber-600' : 'text-gray-400'}`}>{counter[0]}/{counter[1]}</span>}</span>
      {children}
    </label>
  )
}

function RouteCard({ on, onClick, title, subtitle, badge, reason }: { on: boolean; onClick: () => void; title: string; subtitle: string; badge?: string; reason: string | null }) {
  return (
    <button type="button" onClick={onClick} disabled={!!reason} className={`${card(on && !reason)} disabled:cursor-not-allowed disabled:opacity-60`} role="radio" aria-checked={on}>
      <span className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${on && !reason ? 'border-indigo-700 bg-indigo-700 shadow-[inset_0_0_0_3px_white]' : 'border-gray-300'}`} />
      <span><span className="flex items-center gap-2 font-medium text-gray-900">{title}{badge && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">{badge}</span>}</span>
        <span className="block text-sm text-gray-600">{reason ?? subtitle}</span></span>
    </button>
  )
}

function CostCard({ quote, loading }: { quote: AdQuote | null; loading: boolean }) {
  if (!quote) return <div className="h-40 animate-pulse rounded-xl border border-gray-200 bg-white" />
  const own = quote.route === 'own_meta'
  const row = (label: string, value: string) => <div className="flex justify-between text-sm"><span className="text-gray-500">{label}</span><span className="text-gray-900">{value}</span></div>
  return (
    <div className={`space-y-2 rounded-xl border border-gray-200 bg-white p-4 transition-opacity ${loading ? 'opacity-60' : ''}`}>
      <p className="text-sm font-medium text-gray-900">Cost</p>
      {row(`Ad spend (${quote.days} × ${naira(quote.dailyBudgetKobo)})`, naira(quote.spendKobo))}
      {row('VAT 7.5%', naira(quote.vatKobo))}
      {row('Scalio fee', naira(quote.feeKobo))}
      {quote.creditUsedKobo > 0 && row('Ad credit used', `−${naira(quote.creditUsedKobo)}`)}
      <div className="flex items-baseline justify-between border-t border-gray-100 pt-2">
        <span className="text-sm font-medium text-gray-900">{own ? 'You pay Scalio now' : 'Total now'}</span>
        <span className="text-xl font-semibold tabular-nums text-gray-900">{naira(quote.dueNowKobo)}</span>
      </div>
      {own && <p className="text-xs text-gray-500">Meta charges your card {naira(quote.metaChargesKobo)} (spend + VAT) as the ad runs.</p>}
    </div>
  )
}

function Review({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex-1"><dt className="text-xs text-gray-500">{label}</dt><dd className="text-sm text-gray-900">{value}</dd></div>
      <button type="button" onClick={onEdit} className="text-sm font-medium text-indigo-600">Edit</button>
    </div>
  )
}

function AdPreview({ pageName, mediaId, text, headline, cta }: { pageName: string; mediaId: string | null; text: string; headline: string; cta: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Preview</p>
      <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-800 text-sm font-medium text-white">{pageName.slice(0, 1)}</span>
          <span><span className="block text-sm font-medium text-gray-900">{pageName}</span><span className="block text-[11px] text-gray-400">Sponsored</span></span>
        </div>
        <p className="line-clamp-3 text-sm text-gray-800">{text || 'Your ad text appears here.'}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {mediaId ? <img src={mediaUrl(mediaId)} alt="" className="aspect-square w-full rounded-lg object-cover" /> : <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-indigo-50 text-indigo-300"><Icon name="image" className="h-10 w-10" /></div>}
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2">
          <span className="flex-1 truncate text-sm font-medium text-gray-900">{headline || 'Your headline'}</span>
          <span className="rounded-md bg-slate-200 px-2 py-1 text-[11px] font-medium text-gray-800">{cta}</span>
        </div>
      </div>
    </div>
  )
}
