import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'

interface Vendor {
  id: string
  slug: string
  businessName: string
  category: string
  featured: boolean
  approvalStatus: 'pending_review' | 'approved' | 'rejected'
  createdAt: string
}

const STATUS_BADGE: Record<Vendor['approvalStatus'], { label: string; className: string }> = {
  pending_review: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
  approved:       { label: 'Approved', className: 'bg-emerald-100 text-emerald-700' },
  rejected:       { label: 'Rejected', className: 'bg-red-100 text-red-700' },
}

export default async function VendorsPage() {
  const token = await requireToken()
  const vendors = await apiFetch<Vendor[]>('/super-admin/vendors', token)

  const pendingCount = vendors.filter((v) => v.approvalStatus === 'pending_review').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-sm text-gray-500 mt-1">{vendors.length} service providers</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <Link
              href="/dashboard/vendors/reviews"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-100"
            >
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">{pendingCount}</span>
              Review pending
            </Link>
          )}
          <Link
            href="/dashboard/vendors/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
            Onboard vendor
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Business</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Slug</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Featured</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Added</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vendors.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No vendors yet.</td></tr>
            )}
            {vendors.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{v.businessName}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{v.slug}</td>
                <td className="px-4 py-3 text-gray-600">{v.category}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[v.approvalStatus ?? 'approved'].className}`}>
                    {STATUS_BADGE[v.approvalStatus ?? 'approved'].label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {v.featured && <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Featured</span>}
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(v.createdAt).toLocaleDateString('en-NG')}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/dashboard/vendors/${v.id}`} className="text-indigo-600 hover:text-indigo-800 font-medium">
                    Manage →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}
