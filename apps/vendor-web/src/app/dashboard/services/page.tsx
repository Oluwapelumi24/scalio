import { redirect } from 'next/navigation'

export default function ServicesPage() {
  redirect('/dashboard/storefront?tab=services')
}
