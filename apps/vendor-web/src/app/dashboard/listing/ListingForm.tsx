'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { useActionState } from 'react'
import { NIGERIA_STATES, parseServiceArea, serviceArea } from '@veno/shared-types'
import { uploadMedia } from '@/app/actions/growth'
import { saveListingAction, type ListingState } from '@/app/actions/profile'
import { SelectMenu } from '@/components/SelectMenu'
import { BUSINESS_CATEGORIES } from '@/lib/categories'

const MAX_EDGE = 1600

async function photoToJpegBase64(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.82).split(',')[1]
}

export function ListingForm({
  category,
  address,
  description,
  logoUrl,
}: {
  category: string
  address: string
  description: string
  logoUrl: string | null
}) {
  const [state, action, pending] = useActionState(saveListingAction, null as ListingState)
  const known = BUSINESS_CATEGORIES.includes(category as (typeof BUSINESS_CATEGORIES)[number])
  const parsed = parseServiceArea(address)
  const [stateName, setStateName] = useState(parsed?.state ?? '')
  const [lga, setLga] = useState(parsed?.lga ?? '')
  const [photoUrl, setPhotoUrl] = useState(logoUrl)
  const [logoMediaId, setLogoMediaId] = useState('')
  const [clearLogo, setClearLogo] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [uploading, startUpload] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const lgas = useMemo(
    () => NIGERIA_STATES.find((item) => item.state === stateName)?.lgas ?? [],
    [stateName],
  )
  const areaValue = stateName && lga ? serviceArea(lga, stateName) : ''

  function onPickPhoto(file: File | undefined) {
    if (!file) return
    setPhotoError('')
    startUpload(async () => {
      try {
        const result = await uploadMedia('image/jpeg', await photoToJpegBase64(file))
        if (result.error || !result.data) throw new Error(result.error ?? 'Could not upload that photo.')
        setLogoMediaId(result.data.id)
        setClearLogo(false)
        setPhotoUrl(URL.createObjectURL(file))
      } catch (err) {
        setPhotoError(err instanceof Error ? err.message : 'Could not upload that photo.')
      }
    })
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="address" value={areaValue} />
      <input type="hidden" name="logoMediaId" value={logoMediaId} />
      <input type="hidden" name="clearLogo" value={clearLogo ? '1' : ''} />

      <div>
        <span className="text-sm font-semibold">Business photo</span>
        <p className="mt-1 text-xs text-[#7d818b]">Shown on search and your booking page. Square crops work best.</p>
        <div className="mt-2 flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-[#e4e6eb] bg-[#f5f6f8]">
            {photoUrl && !clearLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-[#7d818b]">No photo</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={uploading || pending}
              onClick={() => fileRef.current?.click()}
              className="h-10 rounded-full border border-[#e4e6eb] px-4 text-sm font-semibold text-[#1e3a8a] disabled:opacity-60"
            >
              {uploading ? 'Uploading…' : photoUrl && !clearLogo ? 'Change photo' : 'Add photo'}
            </button>
            {photoUrl && !clearLogo ? (
              <button
                type="button"
                onClick={() => {
                  setClearLogo(true)
                  setLogoMediaId('')
                  setPhotoUrl(null)
                }}
                className="text-left text-xs font-medium text-[#7d818b] hover:text-[#dc2626]"
              >
                Remove photo
              </button>
            ) : null}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => onPickPhoto(e.target.files?.[0])}
          />
        </div>
        {photoError ? <p className="mt-2 text-sm text-[#dc2626]">{photoError}</p> : null}
      </div>

      <label className="block">
        <span className="text-sm font-semibold">What do you offer?</span>
        <SelectMenu
          name="category"
          required
          defaultValue={known ? category : ''}
          placeholder="Choose a category"
          className="mt-1.5 h-12 w-full rounded-2xl border border-[#e4e6eb] bg-white px-4 text-sm"
          options={BUSINESS_CATEGORIES.map((item) => ({ value: item, label: item }))}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold">State</span>
          <SelectMenu
            required
            value={stateName}
            onChange={(next) => {
              setStateName(next)
              setLga('')
            }}
            placeholder="Choose a state"
            className="mt-1.5 h-12 w-full rounded-2xl border border-[#e4e6eb] bg-white px-4 text-sm"
            options={NIGERIA_STATES.map((item) => ({
              value: item.state,
              label: item.state === 'FCT' ? 'FCT (Abuja)' : item.state,
            }))}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Local government</span>
          <SelectMenu
            required
            value={lga}
            onChange={setLga}
            disabled={!stateName}
            placeholder={stateName ? 'Choose an LGA' : 'Choose a state first'}
            className="mt-1.5 h-12 w-full rounded-2xl border border-[#e4e6eb] bg-white px-4 text-sm"
            options={lgas.map((name) => ({ value: name, label: name }))}
          />
        </label>
      </div>
      <p className="text-xs text-[#7d818b]">Customers search by neighbourhood. Pick the LGA you work in.</p>

      <label className="block">
        <span className="text-sm font-semibold">A short description</span>
        <textarea
          name="description"
          defaultValue={description}
          maxLength={600}
          rows={4}
          placeholder="What should a customer know before they book?"
          className="mt-1.5 w-full rounded-2xl border border-[#e4e6eb] px-4 py-3 text-sm"
        />
      </label>
      {state?.error ? <p className="text-sm text-[#dc2626]">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending || uploading || !areaValue}
        className="flex h-12 w-full items-center justify-center rounded-full bg-[#1e3a8a] text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Save business page'}
      </button>
    </form>
  )
}
