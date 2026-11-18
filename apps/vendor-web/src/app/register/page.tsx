'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { NIGERIA_STATES, serviceArea } from '@veno/shared-types'
import { registerAction, sendVendorSignupCode, verifyVendorSignupCode } from '@/app/actions/auth'
import { BrandLink } from '@/components/BrandLink'
import { SelectMenu } from '@/components/SelectMenu'
import { BUSINESS_CATEGORIES } from '@/lib/categories'

const INPUT = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
const MENU = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900'

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [email, setEmail] = useState('')
  const [proof, setProof] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [wait, setWait] = useState(0)

  async function sendCode(nextEmail = email) {
    setError(null)
    setPending(true)
    const result = await sendVendorSignupCode(nextEmail.trim())
    setPending(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setEmail(nextEmail.trim())
    setStep(2)
    setWait(30)
    const timer = window.setInterval(() => {
      setWait((value) => {
        if (value <= 1) {
          window.clearInterval(timer)
          return 0
        }
        return value - 1
      })
    }, 1000)
  }

  async function checkCode() {
    setError(null)
    setPending(true)
    const result = await verifyVendorSignupCode(email, code.trim())
    setPending(false)
    if (result.error || !result.proof) {
      setError(result.error ?? 'That code is wrong or has expired.')
      return
    }
    setProof(result.proof)
    setStep(3)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1>
            <BrandLink className="mx-auto h-10 w-auto" />
          </h1>
          <p className="text-sm text-gray-500 mt-3">Step {step} of 3</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {step === 1 ? (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                const next = new FormData(event.currentTarget).get('email')
                void sendCode(String(next ?? ''))
              }}
            >
              <h2 className="text-lg font-semibold text-gray-900">Start with your email</h2>
              <p className="text-sm text-gray-500">
                We’ll send a 6-digit code. After you confirm it, you’ll create the business and land in the dashboard.
              </p>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input id="email" name="email" type="email" required autoComplete="email" defaultValue={email} placeholder="you@example.com" className={INPUT} />
              </div>
              {error ? <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p> : null}
              <button type="submit" disabled={pending} className="w-full rounded-lg bg-[#1e3a8a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0b1638] disabled:opacity-60">
                {pending ? 'Sending code…' : 'Send code'}
              </button>
            </form>
          ) : null}

          {step === 2 ? (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                void checkCode()
              }}
            >
              <h2 className="text-lg font-semibold text-gray-900">Enter the code</h2>
              <p className="text-sm text-gray-500">Sent to {email}. It expires in 15 minutes.</p>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                minLength={6}
                maxLength={6}
                aria-label="6-digit code"
                className="w-full rounded-lg border border-gray-300 px-3 py-3 text-center text-2xl font-semibold tracking-[0.4em] text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {error ? <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p> : null}
              <button type="submit" disabled={pending || code.length < 6} className="w-full rounded-lg bg-[#1e3a8a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0b1638] disabled:opacity-60">
                {pending ? 'Checking…' : 'Continue'}
              </button>
              <div className="flex items-center justify-between text-sm">
                <button type="button" className="text-gray-500" onClick={() => { setStep(1); setError(null); setCode('') }}>Different email</button>
                <button type="button" disabled={pending || wait > 0} className="font-semibold text-[#1e3a8a] disabled:text-gray-400" onClick={() => void sendCode(email)}>
                  {wait > 0 ? `Resend in ${wait}s` : 'Resend code'}
                </button>
              </div>
            </form>
          ) : null}

          {step === 3 ? <BusinessStep email={email} proof={proof} onBack={() => setStep(2)} /> : null}
        </div>

        {step === 1 ? (
          <p className="text-center text-sm text-gray-400 mt-4">
            Already have an account?{' '}
            <Link href="/login" className="hover:text-gray-600 transition-colors">Sign in</Link>
          </p>
        ) : null}
      </div>
    </div>
  )
}

function BusinessStep({ email, proof, onBack }: { email: string; proof: string; onBack: () => void }) {
  const [state, formAction, pending] = useActionState(registerAction, null)
  const [password, setPassword] = useState('')
  const [shown, setShown] = useState(false)
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="proof" value={proof} />
      <input type="hidden" name="confirm" value={password} />
      <h2 className="text-lg font-semibold text-gray-900">Create the business</h2>
      <p className="text-sm text-gray-500">You’ll go straight into the dashboard when this is saved.</p>
      <div>
        <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">Business name</label>
        <input id="businessName" name="businessName" type="text" required autoComplete="organization" placeholder="Glow Beauty Studio" className={INPUT} />
      </div>
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">What do you do?</label>
        <SelectMenu
          id="category"
          name="category"
          required
          placeholder="Choose a category"
          className={MENU}
          options={BUSINESS_CATEGORIES.map((category) => ({ value: category, label: category }))}
        />
      </div>
      <AreaFields />
      <div>
        <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
        <input id="ownerName" name="ownerName" type="text" required autoComplete="name" placeholder="Amaka Okafor" className={INPUT} />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
        <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="0803 000 0000" className={INPUT} />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <div className="relative">
          <input
            id="password"
            name="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type={shown ? 'text' : 'password'}
            className={`${INPUT} pr-16`}
          />
          <button type="button" onClick={() => setShown((value) => !value)} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">
            {shown ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
      {state !== null && 'error' in state ? <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="w-full rounded-lg bg-[#1e3a8a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0b1638] disabled:opacity-60">
        {pending ? 'Opening your dashboard…' : 'Create business'}
      </button>
      <button type="button" onClick={onBack} className="w-full text-sm text-gray-500">Back</button>
    </form>
  )
}

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
