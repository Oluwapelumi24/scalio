import { redirect } from 'next/navigation'

/** Old pre-launch URL — the waitlist site now lives at `/`. */
export default function PrelaunchHomeRedirect() {
  redirect('/')
}
