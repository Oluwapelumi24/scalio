import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ApiError, apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { NotesEditor } from './NotesEditor'

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
  lastVisitAt: string | null
  createdAt: string
}

const DELETED_CUSTOMER_NAME = 'Deleted customer'

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const token = await requireToken()

  let customer: Customer
  try {
    customer = await apiFetch<Customer>(`/vendor-admin/customers/${id}`, token)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound()
    throw err
  }

  const deleted = customer.name === DELETED_CUSTOMER_NAME

  function formatDate(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/dashboard/customers" className="text-sm text-indigo-600 hover:text-indigo-700">
          ← Customers
        </Link>
      </div>

      <h1
        className={`text-2xl font-bold mb-2 ${deleted ? 'text-gray-400' : 'text-gray-900'}`}
        title={deleted ? 'This customer deleted their Veno account.' : undefined}
      >
        {customer.name}
      </h1>
      {deleted ? (
        <p className="mb-6 text-sm text-gray-500">This customer deleted their Veno account.</p>
      ) : (
        <div className="mb-6" />
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Details</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Email</dt>
            <dd className="text-gray-900 mt-0.5">
              {deleted || !customer.email ? (
                '—'
              ) : (
                <a href={`mailto:${customer.email}`} className="text-[#1e3a8a] hover:underline">
                  {customer.email}
                </a>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Phone</dt>
            <dd className="text-gray-900 mt-0.5">
              {deleted || !customer.phone ? (
                '—'
              ) : (
                <a href={`tel:${customer.phone}`} className="text-[#1e3a8a] hover:underline">
                  {customer.phone}
                </a>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Last visit</dt>
            <dd className="text-gray-900 mt-0.5">{formatDate(customer.lastVisitAt)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Customer since</dt>
            <dd className="text-gray-900 mt-0.5">{formatDate(customer.createdAt)}</dd>
          </div>
        </dl>
      </div>

      {!deleted && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Notes</h2>
          <NotesEditor customerId={customer.id} initialNotes={customer.notes} />
        </div>
      )}
    </div>
  )
}
