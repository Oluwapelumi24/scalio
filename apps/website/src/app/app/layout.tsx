import type { Metadata } from 'next'
import { ProductShell } from '@/components/product/ProductShell'
import { getCustomer } from '@/lib/customer-session'

export const metadata: Metadata = {
  title: 'Veno',
  description: 'Find a salon, spa, laundry or tailor in Lagos and book a time that is actually free.',
}

export default async function ProductLayout({ children }: { children: React.ReactNode }) {
  const user = await getCustomer()
  return <ProductShell user={user}>{children}</ProductShell>
}
