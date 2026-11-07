import { redirect } from 'next/navigation'

/** Old pre-launch partners URL — the waitlist partners page now lives at `/partners`. */
export default function PrelaunchPartnersRedirect() {
  redirect('/partners')
}
