'use client'

import Link from 'next/link'
import { useActionState, useRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { NIGERIA_STATES, serviceArea } from '@veno/shared-types'
import { registerVendorAction, sendSignupCode, verifySignupCode, type VendorAuthState } from '@/app/actions/vendor'
import { SelectMenu } from '@/components/SelectMenu'
import { CATEGORIES } from '@/lib/constants'

const EMPTY: VendorAuthState = {}
const INPUT = 'mt-1.5 h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900 outline-none focus:border-navy focus:bg-white'
const MENU = 'mt-1.5 h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900'

const STEPS = ['Email', 'Code', 'Business'] as const

export function BusinessOnboarding() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [email, setEmail] = useState('')
  const [proof, setProof] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [wait, setWait] = useState(0)
  const timer = useRef<number | null>(null)

  async function sendCode(nextEmail = email) {
    setError(null)
    setPending(true)
    const result = await sendSignupCode(nextEmail.trim())
    setPending(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setEmail(nextEmail.trim())
    setStep(2)
    setWait(30)
    if (timer.current) window.clearInterval(timer.current)
    timer.current = window.setInterval(() => {
      setWait((value) => {
        if (value <= 1) {
          if (timer.current) window.clearInterval(timer.current)
          return 0
        }
        return value - 1
      })
    }, 1000)
  }

  async function checkCode() {
    setError(null)
    setPending(true)
    const result = await verifySignupCode(email, code.trim())
    setPending(false)
    if (result.error || !result.proof) {
      setError(result.error ?? 'That code is wrong or has expired.')
      return
    }
    setProof(result.proof)
    setStep(3)
  }

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-2" aria-label={`Step ${step} of 3`}>
        {STEPS.map((label, index) => {
          const number = index + 1
          const current = number === step
          const done = number < step
          return (
            <div key={label} className="flex min-w-0 flex-1 items-center gap-2">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${done || current ? 'bg-navy text-white' : 'bg-slate-100 text-slate-500'}`}>
                {done ? '✓' : number}
              </span>
              <span className={`truncate text-xs font-semibold ${current ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
              {index < STEPS.length - 1 ? <span className="h-px flex-1 bg-slate-200" /> : null}
            </div>
          )
        })}
      </div>

      {step === 1 ? (
        <form
          className="mt-8"
          onSubmit={(event) => {
            event.preventDefault()
            const next = new FormData(event.currentTarget).get('email')
            void sendCode(String(next ?? ''))
          }}
        >
          <h1 className="font-display text-3xl font-semibold tracking-tight">Start with your email</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            We’ll send a 6-digit code to confirm it’s yours. After that, you’ll create the business and go straight to the dashboard.
          </p>
          <label className="mt-6 block">
            <span className="text-sm font-semibold text-slate-900">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              defaultValue={email}
              placeholder="you@example.com"
              className={INPUT}
            />
          </label>
          {error ? <p className="mt-4 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-[20px] bg-navy text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? 'Sending code…' : 'Send code'}
          </button>
        </form>
      ) : null}

      {step === 2 ? (
        <form
          className="mt-8"
          onSubmit={(event) => {
            event.preventDefault()
            void checkCode()
          }}
        >
          <h1 className="font-display text-3xl font-semibold tracking-tight">Enter the code</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Sent to <span className="font-semibold text-slate-900">{email}</span>. It expires in 15 minutes.
          </p>
          <label className="mt-6 block">
            <span className="text-sm font-semibold text-slate-900">6-digit code</span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              required
              minLength={6}
              maxLength={6}
              pattern="\d{6}"
              className="mt-1.5 h-16 w-full rounded-2xl border border-slate-200 bg-slate-50 text-center text-3xl font-semibold tracking-[0.4em] text-slate-900 outline-none focus:border-navy focus:bg-white"
            />
          </label>
          {error ? <p className="mt-4 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <button
            type="submit"
            disabled={pending || code.length < 6}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-[20px] bg-navy text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? 'Checking…' : 'Continue'}
          </button>
          <div className="mt-4 flex items-center justify-between text-sm">
            <button type="button" className="font-semibold text-slate-500" onClick={() => { setStep(1); setError(null); setCode('') }}>
              Use a different email
            </button>
            <button
              type="button"
              disabled={pending || wait > 0}
              className="font-semibold text-navy disabled:text-slate-400"
              onClick={() => void sendCode(email)}
            >
              {wait > 0 ? `Resend in ${wait}s` : 'Resend code'}
            </button>
          </div>
        </form>
      ) : null}

      {step === 3 ? <BusinessStep email={email} proof={proof} onBack={() => { setStep(2); setError(null) }} /> : null}

      {step === 1 ? (
        <p className="mt-6 text-center text-sm text-slate-600">
          Already have a business?{' '}
          <Link href="/login" className="font-semibold text-navy">Sign in</Link>
        </p>
      ) : null}
    </div>
  )
}

function BusinessStep({ email, proof, onBack }: { email: string; proof: string; onBack: () => void }) {
  const [state, formAction, pending] = useActionState(registerVendorAction, EMPTY)
  return (
    <form action={formAction} className="mt-8 space-y-4">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="proof" value={proof} />
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Create the business</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This is what customers will see. When you finish, you’ll be in the dashboard — no second sign-in.
        </p>
      </div>
      <Field label="Business name" name="businessName" autoComplete="organization" placeholder="Glow Beauty Studio" />
      <label className="block">
        <span className="text-sm font-semibold text-slate-900">What do you do?</span>
        <SelectMenu
          name="category"
          required
          placeholder="Choose a category"
          className={MENU}
          options={CATEGORIES.map((category) => ({ value: category.name, label: category.name }))}
        />
      </label>
      <AreaFields />
      <Field label="Your name" name="ownerName" autoComplete="name" placeholder="Amaka Okafor" />
      <Field label="Phone" name="phone" type="tel" autoComplete="tel" required={false} placeholder="0803 000 0000" hint="Optional" />
      <PasswordField />
      {state.error ? <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center rounded-[20px] bg-navy text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? 'Opening your dashboard…' : 'Create business'}
      </button>
      <button type="button" onClick={onBack} className="w-full text-sm font-semibold text-slate-500">
        Back
      </button>
    </form>
  )
}

function AreaFields() {
  const [stateName, setStateName] = useState('')
  const [lga, setLga] = useState('')
  const lgas = NIGERIA_STATES.find((item) => item.state === stateName)?.lgas ?? []
  return (
    <>
      <label className="block">
        <span className="text-sm font-semibold text-slate-900">State</span>
        <SelectMenu
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
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-slate-900">Local government</span>
        <SelectMenu
          name="lga"
          required
          value={lga}
          onChange={setLga}
          disabled={!stateName}
          placeholder={stateName ? 'Choose an LGA' : 'Choose a state first'}
          className={MENU}
          options={lgas.map((name) => ({ value: name, label: name }))}
        />
      </label>
      <input type="hidden" name="address" value={stateName && lga ? serviceArea(lga, stateName) : ''} />
    </>
  )
}

function PasswordField() {
  const [shown, setShown] = useState(false)
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-900">Password</span>
      <span className="relative mt-1.5 block">
        <input
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          type={shown ? 'text' : 'password'}
          placeholder="At least 8 characters"
          className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-12 text-base text-slate-900 outline-none focus:border-navy focus:bg-white"
        />
        <button
          type="button"
          onClick={() => setShown((value) => !value)}
          aria-label={shown ? 'Hide password' : 'Show password'}
          aria-pressed={shown}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
        >
          {shown ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </span>
    </label>
  )
}

function Field({
  label,
  hint,
  required = true,
  ...props
}: { label: string; hint?: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-900">
        {label}
        {hint ? <span className="ml-1 font-normal text-slate-400">{hint}</span> : null}
      </span>
      <input required={required} {...props} className={INPUT} />
    </label>
  )
}
