import { redirect } from 'next/navigation'

export default function SchedulePage() {
  redirect('/dashboard/storefront?tab=hours')
}
