import { VENDOR_LOGIN_URL, VENDOR_REGISTER_URL } from '@/lib/constants'

export function Footer() {
  return (
    <footer className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-xs font-bold text-white">
                S
              </div>
              <span className="text-base font-bold text-slate-900">Scalio</span>
            </div>
            <p className="mt-3 max-w-[220px] text-sm text-slate-500">
              The booking platform for local service businesses — and the people who use them.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900">Customers</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li><a href="#customers" className="hover:text-slate-900">How it works</a></li>
              <li><a href="#faq" className="hover:text-slate-900">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900">Businesses</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li><a href={VENDOR_REGISTER_URL} className="hover:text-slate-900">Register your business</a></li>
              <li><a href={VENDOR_LOGIN_URL} className="hover:text-slate-900">Vendor sign in</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900">Company</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li><a href="#" className="hover:text-slate-900">Privacy</a></li>
              <li><a href="#" className="hover:text-slate-900">Terms</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-100 pt-6 text-sm text-slate-400">
          © {new Date().getFullYear()} Scalio. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
