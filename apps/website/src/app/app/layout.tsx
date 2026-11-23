import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ProductShell } from '@/components/product/ProductShell'
import { getCustomer } from '@/lib/customer-session'
import { designMode } from '@/lib/design-preview'

export const metadata: Metadata = {
  title: { absolute: 'Book on Veno' },
  description: 'Find a salon, spa, laundry or tailor in Lagos and book a time that is actually free.',
}

export default async function ProductLayout({ children }: { children: React.ReactNode }) {
  if ((await designMode()) === 'prelaunch') {
    redirect('/#waitlist')
  }
  const user = await getCustomer()
  return <ProductShell user={user}>{children}</ProductShell>
}
