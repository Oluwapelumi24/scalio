import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { ApproveRejectButtons } from './ApproveRejectButtons'

interface PendingVendor {
  id: string
  slug: string
  businessName: string
  category: string
  description: string | null
  ownerName: string | null
  ownerEmail: string | null
  address: string | null
  themeColor: string | null
  createdAt: string
}

export default async function VendorReviewsPage() {
  const token = await requireToken()
  const pending = await apiFetch<PendingVendor[]>('/super-admin/vendors/pending', token)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Reviews</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pending.length === 0
              ? 'All caught up — no vendors awaiting review'
              : `${pending.length} vendor${pending.length === 1 ? '' : 's'} pending approval`}
          </p>
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" className="text-emerald-600">
              <path d="M5 13l5 5 11-11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="font-medium text-gray-700">Queue is clear</p>
          <p className="text-gray-400 text-sm mt-1">No pending vendor applications</p>
        </div>
      ) : (
        <div className="space-y-5">
          {pending.map((vendor) => (
            <div key={vendor.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Header bar */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  {/* Colour swatch / avatar */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0"
                    style={{ backgroundColor: vendor.themeColor ?? '#6366f1' }}
                  >
                    {vendor.businessName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{vendor.businessName}</span>
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        Pending review
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {vendor.category}
                      {vendor.address ? ` · ${vendor.address}` : ''}
                      <span className="font-mono ml-2 text-xs text-gray-400">{vendor.slug}</span>
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 shrink-0">
                  Submitted {new Date(vendor.createdAt).toLocaleDateString('en-NG', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </p>
              </div>

              {/* Body: description + owner */}
              <div className="px-5 py-4 grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">About</p>
                  {vendor.description ? (
                    <p className="text-sm text-gray-700 leading-relaxed">{vendor.description}</p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No description provided</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Owner contact</p>
                  {vendor.ownerName || vendor.ownerEmail ? (
                    <div className="space-y-1">
                      {vendor.ownerName && <p className="text-sm font-medium text-gray-800">{vendor.ownerName}</p>}
                      {vendor.ownerEmail && (
                        <a href={`mailto:${vendor.ownerEmail}`} className="text-sm text-indigo-600 hover:underline">
                          {vendor.ownerEmail}
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No contact info</p>
                  )}
                </div>
              </div>

              {/* Footer: actions */}
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Approving will make this business visible to customers on the platform.
                </p>
                <ApproveRejectButtons
                  vendorId={vendor.id}
                  vendorName={vendor.businessName}
                  manageHref={`/dashboard/vendors/${vendor.id}`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
