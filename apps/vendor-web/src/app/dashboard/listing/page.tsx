import { redirect } from 'next/navigation'

export default function ListingPage() {
  redirect('/dashboard/storefront?tab=page')
}
