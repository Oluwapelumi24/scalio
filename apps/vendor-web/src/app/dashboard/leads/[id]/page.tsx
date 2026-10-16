import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ApiError, apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { LEAD_STATUS_LABELS, waNumber, type Lead } from '@/lib/growth'
import { LeadActions, LeadEditForm } from '../LeadControls'

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = await requireToken()

  let lead: Lead
  try {
    lead = await apiFetch<Lead>(`/vendor-admin/leads/${id}`, token)
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) notFound()
    throw err
  }
  const me = await apiFetch<{ role: string }>('/vendor-auth/me', token)
  const canAssign = me.role !== 'practitioner'
  const staff = canAssign ? await apiFetch<{ id: string; name: string }[]>('/vendor-admin/staff', token).catch(() => []) : []
  const open = lead.status === 'new' || lead.status === 'contacted'

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/dashboard/leads" className="text-sm text-indigo-600">← Leads</Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{lead.name}</h1>
        <p className="text-sm text-gray-500">
          {LEAD_STATUS_LABELS[lead.status]}
          {lead.followUpAt && open ? ` · follow up ${new Date(lead.followUpAt).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}` : ''}
          {lead.due && <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">Follow up now</span>}
        </p>
      </div>

      {(lead.phone || lead.email) && (
        <div className="flex flex-wrap gap-2">
          {lead.phone && <a href={`tel:${lead.phone}`} className="rounded-full border border-indigo-600 px-3 py-1 text-sm font-medium text-indigo-600">Call {lead.phone}</a>}
          {lead.phone && <a href={`https://wa.me/${waNumber(lead.phone)}`} target="_blank" rel="noreferrer" className="rounded-full border border-indigo-600 px-3 py-1 text-sm font-medium text-indigo-600">WhatsApp</a>}
          {lead.email && <a href={`mailto:${lead.email}`} className="rounded-full border border-indigo-600 px-3 py-1 text-sm font-medium text-indigo-600">Email</a>}
        </div>
      )}

      <LeadActions lead={lead} canDelete={me.role === 'owner' || me.role === 'manager'} />

      {lead.status === 'won' && lead.customer ? (
        <p className="text-sm text-gray-700">
          Now a customer. <Link href={`/dashboard/customers/${lead.customer.id}`} className="font-medium text-indigo-600">View {lead.customer.name}</Link>
        </p>
      ) : (
        <section className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Details</h2>
          <LeadEditForm lead={lead} staff={staff} canAssign={canAssign} />
        </section>
      )}
    </div>
  )
}
