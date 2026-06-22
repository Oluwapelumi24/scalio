import Link from 'next/link'

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Link
        href="/dashboard/vendors"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-5"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
          <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        All vendors
      </Link>
      {children}
    </div>
  )
}
