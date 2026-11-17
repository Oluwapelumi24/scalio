import Link from 'next/link'
import { getCustomer } from '@/lib/customer-session'
import { signOutAction } from '@/app/actions/customer'

export default async function ProfilePage() {
  const user = await getCustomer()

  return (
    <div className="mx-auto max-w-xl px-6 py-8 lg:py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Profile</h1>
      <p className="mt-2 text-sm text-[#4a4e57]">
        {user ? 'Your account and bookings.' : 'Sign in to see your bookings and saved places.'}
      </p>

      {!user ? (
        <div className="mt-8 rounded-[20px] border border-[#e4e6eb] px-6 py-10">
          <p className="font-semibold">Sign in to your account</p>
          <p className="mt-1 text-sm text-[#4a4e57]">Manage bookings, track appointments and more.</p>
          <Link href="/app/sign-in?next=/app/profile" className="mt-5 inline-flex items-center rounded-[20px] bg-[#1e3a8a] px-5 text-sm font-semibold text-white h-12">
            Sign in
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 flex items-center gap-4 rounded-[20px] border border-[#e4e6eb] p-5">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1e3a8a] text-lg font-bold text-white">
              {user.name.slice(0, 2).toUpperCase()}
            </span>
            <span>
              <span className="block text-base font-bold">{user.name}</span>
              <span className="block text-sm text-[#4a4e57]">{user.email}</span>
              {user.phone ? <span className="block text-sm text-[#4a4e57]">{user.phone}</span> : null}
            </span>
          </div>
          <ul className="mt-6 divide-y divide-[#e4e6eb] overflow-hidden rounded-[20px] border border-[#e4e6eb]">
            <li>
              <Link href="/app/bookings" className="block px-4 py-3.5 text-sm font-medium hover:bg-[#f5f6f8]">
                My bookings
              </Link>
            </li>
            <li>
              <Link href="/app" className="block px-4 py-3.5 text-sm font-medium hover:bg-[#f5f6f8]">
                Find a business
              </Link>
            </li>
          </ul>
          <p className="mt-4 text-sm leading-6 text-[#4a4e57]">
            Need to change a visit? Open Bookings and cancel it, then book a new time. The business sees the cancellation straight away.
          </p>
          <form action={signOutAction} className="mt-6">
            <button type="submit" className="text-sm font-semibold text-[#dc2626]">
              Sign out
            </button>
          </form>
        </>
      )}
    </div>
  )
}
