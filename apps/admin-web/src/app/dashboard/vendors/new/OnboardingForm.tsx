'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createVendorAction } from '@/app/actions/vendors'

const CATEGORIES = [
  'Nails', 'Salon', 'Barbing', 'Spa', 'Lashes', 'Makeup', 'Brows', 'Massage', 'Fitness', 'Laundry', 'Other',
]

const STEPS = ['Business details', 'Owner contact', 'Review & submit']

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              i < current ? 'bg-indigo-600 text-white' :
              i === current ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' :
              'bg-gray-100 text-gray-400'
            }`}>
              {i < current ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 7l3 3 6-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : i + 1}
            </div>
            <span className={`text-xs mt-1.5 font-medium whitespace-nowrap ${i === current ? 'text-indigo-600' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 w-16 mx-2 mb-5 transition-colors ${i < current ? 'bg-indigo-600' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

interface FieldValues {
  businessName: string
  slug: string
  category: string
  description: string
  address: string
  ownerName: string
  ownerEmail: string
  themeColor: string
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function OnboardingForm() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [fields, setFields] = useState<FieldValues>({
    businessName: '', slug: '', category: '', description: '',
    address: '', ownerName: '', ownerEmail: '', themeColor: '',
  })
  const [state, formAction, pending] = useActionState(createVendorAction, null)

  function set(key: keyof FieldValues, value: string) {
    setFields((f) => {
      const next = { ...f, [key]: value }
      if (key === 'businessName') next.slug = slugify(value)
      return next
    })
  }

  function validateStep0() {
    return fields.businessName.trim() && fields.slug.trim() && fields.category
  }

  function validateStep1() {
    return fields.ownerName.trim() && fields.ownerEmail.trim()
  }

  return (
    <div className="max-w-2xl">
      <StepIndicator current={step} />

      {/* Step 0: Business details */}
      {step === 0 && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Business name <span className="text-red-500">*</span></label>
              <input
                value={fields.businessName}
                onChange={(e) => set('businessName', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. Glam Nails Studio"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL slug <span className="text-red-500">*</span></label>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500">
                <span className="px-3 py-2 bg-gray-50 text-gray-400 text-sm border-r border-gray-300">scalio.app/</span>
                <input
                  value={fields.slug}
                  onChange={(e) => set('slug', e.target.value)}
                  className="flex-1 px-3 py-2 text-sm font-mono focus:outline-none"
                  placeholder="glam-nails"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
              <select
                value={fields.category}
                onChange={(e) => set('category', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              >
                <option value="">Select category…</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Business address</label>
              <input
                value={fields.address}
                onChange={(e) => set('address', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. 15 Bode Thomas St, Surulere, Lagos"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Short description</label>
              <textarea
                value={fields.description}
                onChange={(e) => set('description', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                placeholder="What makes this business special? What services do they specialise in?"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setStep(1)}
              disabled={!validateStep0()}
              className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Owner contact */}
      {step === 1 && (
        <div className="space-y-5">
          <p className="text-sm text-gray-500">This contact will receive the staff invite after the listing is approved.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner name <span className="text-red-500">*</span></label>
              <input
                value={fields.ownerName}
                onChange={(e) => set('ownerName', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. Amaka Okafor"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner email <span className="text-red-500">*</span></label>
              <input
                type="email"
                value={fields.ownerEmail}
                onChange={(e) => set('ownerEmail', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="amaka@glamnails.ng"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand colour</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={fields.themeColor || '#6366f1'}
                  onChange={(e) => set('themeColor', e.target.value)}
                  className="h-9 w-14 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                />
                <input
                  value={fields.themeColor}
                  onChange={(e) => set('themeColor', e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="#6366f1"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(0)} className="px-5 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50">
              ← Back
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={!validateStep1()}
              className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Review →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Review & submit */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-200">
            <div className="px-5 py-3 flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Business</p>
                <p className="font-semibold text-gray-900 mt-0.5">{fields.businessName}</p>
                <p className="text-sm text-gray-500">{fields.category}{fields.address ? ` · ${fields.address}` : ''}</p>
                {fields.description && <p className="text-sm text-gray-600 mt-1">{fields.description}</p>}
              </div>
              <button onClick={() => setStep(0)} className="text-xs text-indigo-600 hover:underline shrink-0 ml-4">Edit</button>
            </div>
            <div className="px-5 py-3 flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Owner</p>
                <p className="font-medium text-gray-900 mt-0.5">{fields.ownerName}</p>
                <p className="text-sm text-gray-500">{fields.ownerEmail}</p>
              </div>
              <button onClick={() => setStep(1)} className="text-xs text-indigo-600 hover:underline shrink-0 ml-4">Edit</button>
            </div>
            <div className="px-5 py-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">URL slug</p>
              <p className="font-mono text-sm text-gray-700 mt-0.5">scalio.app/{fields.slug}</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 flex gap-3">
            <svg className="shrink-0 mt-0.5 text-amber-500" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M8 5v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <circle cx="8" cy="11" r="0.75" fill="currentColor"/>
            </svg>
            <p className="text-sm text-amber-700">
              This listing will be submitted for review. It won't appear to customers until an approver signs off.
            </p>
          </div>

          {state?.error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>}

          <form
            action={async () => {
              const fd = new FormData()
              fd.set('businessName', fields.businessName)
              fd.set('slug', fields.slug)
              fd.set('category', fields.category)
              fd.set('description', fields.description)
              fd.set('ownerName', fields.ownerName)
              fd.set('ownerEmail', fields.ownerEmail)
              fd.set('address', fields.address)
              if (fields.themeColor) fd.set('themeColor', fields.themeColor)
              await formAction(fd)
              // on success, action redirects — but if we're still here, go to reviews
              router.push('/dashboard/vendors/reviews')
            }}
          >
            <div className="flex justify-between pt-1">
              <button type="button" onClick={() => setStep(1)} className="px-5 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50">
                ← Back
              </button>
              <button
                type="submit"
                disabled={pending}
                className="px-6 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-60"
              >
                {pending ? 'Submitting…' : 'Submit for review'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
