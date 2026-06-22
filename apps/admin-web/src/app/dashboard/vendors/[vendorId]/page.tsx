import { notFound } from 'next/navigation'
import { apiFetch, ApiError } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { VendorTabs } from './VendorTabs'
import { EditVendorForm } from './EditVendorForm'

interface Vendor {
  id: string; slug: string; businessName: string; category: string
  logoUrl: string | null; themeColor: string | null; address: string | null
  featured: boolean; rating: number | null; reviewCount: number | null; createdAt: string
}

export default async function VendorDetailPage({ params }: { params: Promise<{ vendorId: string }> }) {
  const { vendorId } = await params
  const token = await requireToken()

  let vendor: Vendor
  try {
    vendor = await apiFetch<Vendor>(`/super-admin/vendors/${vendorId}`, token)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound()
    throw err
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{vendor.businessName}</h1>
        <p className="text-sm text-gray-500 mt-1">{vendor.category} · <span className="font-mono">{vendor.slug}</span></p>
      </div>

      <VendorTabs vendorId={vendorId} />

      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Edit profile</h2>
        <EditVendorForm vendor={vendor} />
      </div>
    </div>
  )
}
