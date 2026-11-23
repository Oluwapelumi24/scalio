# Go-live environment contract

One seller product, one API. Marketing (`www.venohq.com`) acquires; the dashboard owns register → setup → day-to-day.

## Required hosts (target)

| Host | Service |
|---|---|
| `www.venohq.com` | Vercel → `apps/website` |
| `app.venohq.com` | Railway → `apps/vendor-web` (custom domain) |
| `api.venohq.com` | Railway → `apps/backend` (custom domain) |
| `admin.venohq.com` | Host `apps/admin-web` (approval queue) |

Until custom domains exist, use the Railway `*.up.railway.app` URLs in env vars.

## Website (Vercel)

**Project settings:** Root Directory = `apps/website`. `apps/website/vercel.json` installs from the monorepo root and builds `@veno/shared-types` before Next.

| Variable | Purpose |
|---|---|
| `API_URL` | Backend origin (no trailing slash) |
| `VENDOR_WEB_URL` | Seller dashboard origin — **required** or login lands on `/business` forever |
| `NEXT_PUBLIC_VENDOR_WEB_URL` | Same URL for navbar / partners CTAs |

## Backend (Railway)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres |
| `REDIS_URL` | Redis |
| `USER_JWT_SECRET` / `VENDOR_JWT_SECRET` / `ADMIN_JWT_SECRET` | ≥32 chars, not `dev-*` |
| `PII_ENCRYPTION_KEY` | Bank account encryption |
| `MEDIA_URL_SECRET` | Signed media URLs |
| `RESEND_API_KEY` | Signup / reset email |
| `MAIL_FROM` | Verified sender |
| `PUBLIC_API_URL` | Public API origin (logos, Meta) |
| `PUBLIC_BOOKING_URL` | e.g. `https://www.venohq.com/book` |
| `VENDOR_WEB_URL` | Dashboard origin (invite links) |

## Vendor-web (Railway)

| Variable | Purpose |
|---|---|
| `API_URL` | Backend origin |

## Smoke test after each deploy

1. `GET {API_URL}/` returns 200  
2. `GET {API_URL}/vendors` returns JSON (not Railway timeout HTML)  
3. Open `{VENDOR_WEB_URL}/login` and sign in  
4. From `www.venohq.com/login` you should redirect to the dashboard origin when `VENDOR_WEB_URL` is set  
