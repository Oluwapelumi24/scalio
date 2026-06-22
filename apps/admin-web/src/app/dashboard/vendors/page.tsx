import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { CreateVendorForm } from './CreateVendorForm'

interface Vendor {
  id: string
  slug: string
  businessName: string
  category: string
  featured: boolean
  createdAt: string
}

export default async function VendorsPage() {
  const token = await requireToken()
  const vendors = await apiFetch<Vendor[]>('/super-admin/vendors', token)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-sm text-gray-500 mt-1">{vendors.length} service providers</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Business</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Slug</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
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

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Add new vendor</h2>
        <CreateVendorForm />
      </div>
    </div>
  )
}
