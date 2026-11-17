'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { NIGERIA_STATES, serviceArea } from '@veno/shared-types'
import { registerAction } from '@/app/actions/auth'
import { BrandLink } from '@/components/BrandLink'
import { SelectMenu } from '@/components/SelectMenu'
import { BUSINESS_CATEGORIES } from '@/lib/categories'

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1>
            <BrandLink className="mx-auto h-10 w-auto" />
          </h1>
          <p className="text-sm text-gray-500 mt-3">Register your business</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Create your vendor account</h2>
          <p className="text-sm text-gray-500 mb-6">
            You can add services and hours straight away. Customers find and book you after we approve the listing.
          </p>

          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                Business name
              </label>
              <input
                id="businessName" name="businessName" type="text" required autoComplete="organization"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Glow Beauty Studio"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                What do you do?
              </label>
              <SelectMenu
                id="category"
                name="category"
                required
                placeholder="Choose a category"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                options={BUSINESS_CATEGORIES.map((category) => ({ value: category, label: category }))}
              />
            </div>

            <AreaFields />

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="phone" name="phone" type="tel" autoComplete="tel"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="0803 000 0000"
              />
            </div>

            <div>
              <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700 mb-1">
                Your name
              </label>
              <input
                id="ownerName" name="ownerName" type="text" required autoComplete="name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Amaka Okafor"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email" name="email" type="email" required autoComplete="email"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700 mb-1">
                CAC registration number <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="registrationNumber" name="registrationNumber" type="text" autoComplete="off"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="RC1234567"
              />
            </div>

            <PasswordField id="password" name="password" label="Password" autoComplete="new-password" placeholder="At least 8 characters" />
            <PasswordField id="confirm" name="confirm" label="Confirm password" autoComplete="new-password" placeholder="Repeat your password" />

            {state !== null && 'error' in state && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-[#1e3a8a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0b1638] disabled:opacity-60 transition-colors"
            >
              {pending ? 'Creating account…' : 'Register your business'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-400 mt-4">
          Already have an account?{' '}
          <Link href="/login" className="hover:text-gray-600 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

const MENU = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900'

function AreaFields() {
  const [stateName, setStateName] = useState('')
  const [lga, setLga] = useState('')
  const lgas = NIGERIA_STATES.find((item) => item.state === stateName)?.lgas ?? []
  return (
    <>
      <div>
        <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State</label>
        <SelectMenu
          id="state"
          name="state"
          required
          value={stateName}
          onChange={(next) => {
            setStateName(next)
            setLga('')
          }}
          placeholder="Choose a state"
          className={MENU}
          options={NIGERIA_STATES.map((item) => ({
            value: item.state,
            label: item.state === 'FCT' ? 'FCT (Abuja)' : item.state,
          }))}
        />
      </div>
      <div>
        <label htmlFor="lga" className="block text-sm font-medium text-gray-700 mb-1">Local government</label>
        <SelectMenu
          id="lga"
          name="lga"
          required
          value={lga}
          onChange={setLga}
          disabled={!stateName}
          placeholder={stateName ? 'Choose an LGA' : 'Choose a state first'}
          className={MENU}
          options={lgas.map((name) => ({ value: name, label: name }))}
        />
      </div>
      <input type="hidden" name="address" value={stateName && lga ? serviceArea(lga, stateName) : ''} />
    </>
  )
}

function PasswordField({
  id,
  label,
  ...props
}: { id: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const [shown, setShown] = useState(false)
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          id={id}
          required
          {...props}
          type={shown ? 'text' : 'password'}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="button"
          onClick={() => setShown((value) => !value)}
          aria-label={shown ? 'Hide password' : 'Show password'}
          aria-pressed={shown}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500"
        >
          {shown ? <EyeOff /> : <Eye />}
        </button>
      </div>
    </div>
  )
}

function Eye() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function EyeOff() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4">
      <path d="M3 3l18 18M10.5 10.7A2.5 2.5 0 0 0 12 14.5M9.9 5.2A10 10 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3.2 3.8M6.1 6.3C3.8 8 2 12 2 12a18 18 0 0 0 6.2 5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
