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
| `INTERNAL_PROXY_SECRET` | Same ≥32-char secret as the backend (server actions forward client IP) |
| `VENDOR_WEB_URL` | Seller dashboard origin — **required** or login lands on `/business` forever |
| `NEXT_PUBLIC_VENDOR_WEB_URL` | Same URL for navbar / partners CTAs |

## Railway monorepo rule (read this)

One GitHub repo → many Railway services. **Each service must have its own build/start** (Config-as-code path, Dockerfile via `RAILWAY_DOCKERFILE_PATH`, or manual Build/Start). If a service has no override, Railway falls back to root `railway.json` (the **backend**) — that is why admin-web was starting Nest and dying.

- **backend** → root `railway.json` (or `apps/backend/railway.json`)
- **vendor-web** → `apps/vendor-web/railway.json`
- **admin-web** → `RAILWAY_DOCKERFILE_PATH=apps/admin-web/Dockerfile` (Config-as-code will not stick on new services)

Never move root `railway.json` without updating the backend service path first — production API will crash (`@veno/shared-types/dist` missing).

## Backend (Railway)

Config: root `railway.json` (mirrored at `apps/backend/railway.json`). Refuses to boot in production if required vars are missing (see `production-config.ts`). The build **must** compile `@veno/shared-types` before Nest.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres |
| `REDIS_URL` | Redis |
| `USER_JWT_SECRET` / `VENDOR_JWT_SECRET` / `ADMIN_JWT_SECRET` | ≥32 chars, not `dev-*` |
| `INTERNAL_PROXY_SECRET` | ≥32 chars; same value on backend + all three Next apps so server actions can forward the real client IP for rate limits |
| `PII_ENCRYPTION_KEY` | Bank account encryption |
| `MEDIA_URL_SECRET` | Signed media URLs |
| `RESEND_API_KEY` | Signup / reset email |
| `MAIL_FROM` | Verified sender (recommended) |
| `PUBLIC_API_URL` | `https://…` API origin (logos, Meta) |
| `PUBLIC_BOOKING_URL` | `https://www.venohq.com/book` |
| `VENDOR_WEB_URL` | `https://…` dashboard origin (invite links) |
| `ADMIN_WEB_URL` | `https://admin.venohq.com` (admin invite /accept-invite links) |
| `CORS_ORIGINS` | Comma-separated browser origins (e.g. `https://app.venohq.com,https://admin.venohq.com,https://www.venohq.com`) |

**Redis is required for API availability.** Rate-limit counters and password-reset issue caps live in Redis. If Redis is down, every throttled API route fails — treat Redis outage as an API outage in the runbook.

## Vendor-web (Railway)

Config: `apps/vendor-web/railway.json`. Set service root / config-as-code to that file.

| Variable | Purpose |
|---|---|
| `API_URL` | Backend origin |
| `INTERNAL_PROXY_SECRET` | Same ≥32-char secret as the backend |

## Admin-web (Railway) — P0 (required to approve listings)

New services cannot opt into Config-as-code. Use the Dockerfile instead. Without this service, registered businesses stay `pending_review` and never appear on `/vendors`.

1. Railway → **New service** → same GitHub repo as backend  
2. **Do not** rely on Config-as-code (path will not stick)  
3. Variables:
   - `API_URL` = backend public HTTPS origin (no trailing slash)
   - `RAILWAY_DOCKERFILE_PATH` = `apps/admin-web/Dockerfile`
4. Deploy until Build logs show `Using detected Dockerfile` and `/login` returns 200  
5. Create the first admin (uses production `DATABASE_URL` from the backend service):  
   `DATABASE_URL=… npm run create-admin --workspace=apps/backend -- you@email "Your Name"`  
6. Sign in → **Reviews** → Approve  
7. Optional: attach custom domain `admin.venohq.com`

| Variable | Purpose |
|---|---|
| `API_URL` | Backend origin |
| `INTERNAL_PROXY_SECRET` | Same ≥32-char secret as the backend |
| `RAILWAY_DOCKERFILE_PATH` | `apps/admin-web/Dockerfile` |

Approve/reject emails the business `ownerEmail` when `RESEND_API_KEY` is set on the backend. Rejected owners re-enter the queue when they update their business profile.

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
6. **Per-IP login throttle (proxy IP must not collapse all users):** from one machine, forge a leftmost `X-Forwarded-For` and hit vendor login through the Next app (server action / login form posts to the API via `apiFetch`, which prefers `x-real-ip` / rightmost XFF). Eleven requests from the same machine must hit the per-IP login bucket — the **11th must return 429**. A forged leftmost XFF alone must **not** get you a fresh bucket.

```bash
# Against the public vendor-web origin (or website /login handoff). Adjust path/body to match the live login action.
# Expect: first 10 succeed or return auth errors (401/400); 11th is 429 from the API throttle.
for i in $(seq 1 11); do
  code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$VENDOR_WEB_URL/login" \
    -H 'content-type: application/x-www-form-urlencoded' \
    -H 'X-Forwarded-For: 203.0.113.99' \
    --data 'email=throttle-smoke@example.com&password=wrong')
  echo "$i $code"
done
# Confirm the 11th line is 429 (or the upstream API 429 surfaced by the action).
```

