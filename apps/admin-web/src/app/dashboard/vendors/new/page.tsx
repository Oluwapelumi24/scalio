import Link from 'next/link'
import { OnboardingForm } from './OnboardingForm'

export default function NewVendorPage() {
  return (
    <div>
      <Link
        href="/dashboard/vendors"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-5"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
          <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        All vendors
      </Link>

      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Onboard new vendor</h1>
        <p className="text-sm text-gray-500 mt-1">Fill in the business details. The listing enters a review queue before going live.</p>
      </div>

      <OnboardingForm />
    </div>
  )
}
