# Go-live environment contract

One seller product, one API. Marketing (`www.venohq.com`) acquires; the dashboard owns register → setup → day-to-day. Admin approves listings.

## Required hosts (target)

| Host | Service |
|---|---|
| `www.venohq.com` | Vercel → `apps/website` |
| `app.venohq.com` | Railway → `apps/vendor-web` (custom domain) |
| `api.venohq.com` | Railway → `apps/backend` (custom domain) |
| `admin.venohq.com` | Railway → `apps/admin-web` (custom domain) |

Until custom domains exist, use the Railway `*.up.railway.app` URLs in env vars.

## Website (Vercel)

**Project settings:** Root Directory = `apps/website`. `apps/website/vercel.json` installs from the monorepo root and builds `@veno/shared-types` before Next.

| Variable | Purpose |
|---|---|
| `API_URL` | Backend origin (no trailing slash) |
| `VENDOR_WEB_URL` | Seller dashboard origin — **required** or login lands on `/business` forever |
| `NEXT_PUBLIC_VENDOR_WEB_URL` | Same URL for navbar / partners CTAs |

## Backend (Railway)

Uses root `railway.json`. Refuses to boot in production if required vars are missing (see `production-config.ts`).

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres |
| `REDIS_URL` | Redis |
| `USER_JWT_SECRET` / `VENDOR_JWT_SECRET` / `ADMIN_JWT_SECRET` | ≥32 chars, not `dev-*` |
| `PII_ENCRYPTION_KEY` | Bank account encryption |
| `MEDIA_URL_SECRET` | Signed media URLs |
| `RESEND_API_KEY` | Signup / reset email |
| `MAIL_FROM` | Verified sender (recommended) |
| `PUBLIC_API_URL` | `https://…` API origin (logos, Meta) |
| `PUBLIC_BOOKING_URL` | `https://www.venohq.com/book` |
| `VENDOR_WEB_URL` | `https://…` dashboard origin (invite links) |

## Vendor-web (Railway)

Config: `apps/vendor-web/railway.json`. Set service root / config-as-code to that file.

| Variable | Purpose |
|---|---|
| `API_URL` | Backend origin |

## Admin-web (Railway) — P1

Config: `apps/admin-web/railway.json`.

1. New Railway service from this repo  
2. Config-as-code path: `apps/admin-web/railway.json`  
3. Set `API_URL` to the backend origin  
4. Attach custom domain `admin.venohq.com` when ready  
5. Create the first admin: `DATABASE_URL=… npm run create-admin --workspace=apps/backend -- you@venohq.com "Your Name"`

| Variable | Purpose |
|---|---|
| `API_URL` | Backend origin |

## Vendor-mobile (EAS) — P1

Scaffold: `apps/vendor-mobile/eas.json`. API URL comes from `EXPO_PUBLIC_API_URL`.

```bash
cd apps/vendor-mobile
npx eas-cli login
npx eas init          # writes extra.eas.projectId into app.json
# edit eas.json preview/production EXPO_PUBLIC_API_URL to your real API
npx eas build --platform all --profile preview
```

## Smoke test after each deploy

1. `GET {API_URL}/` returns 200  
2. `GET {API_URL}/vendors` returns JSON (not Railway timeout HTML)  
3. Open `{VENDOR_WEB_URL}/login` and sign in  
4. From `www.venohq.com/login` you redirect to the dashboard origin when `VENDOR_WEB_URL` is set  
5. Open `{ADMIN_URL}/login` and approve a pending vendor  
