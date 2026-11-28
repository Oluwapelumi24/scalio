# Veno QA — mobile responsiveness & E2E audit

Audit-only Playwright suite for production Veno hosts. **Does not modify application code.**

See [INDEX.md](INDEX.md) for artifact map. Primary deliverable: [reports/QA_REPORT.md](reports/QA_REPORT.md).

## Hosts

| Host | URL |
|---|---|
| Website | `https://www.venohq.com` |
| Vendor | `https://vendor-web-production-a59cdbc0.up.railway.app` |
| Admin | `https://admin.venohq.com` |

`app.venohq.com` / `api.venohq.com` currently do not resolve (documented as blocked).

## Setup

```bash
cd qa
cp .env.example .env   # add sandbox credentials if available
npm install
npx playwright install chromium firefox webkit
```

## Run

```bash
# Full audit (all projects)
npm test

# Chromium only (fastest signal)
npm run test:chromium

# Journeys
npm run test:journeys

# Rebuild markdown report from artifacts/results.ndjson
npm run generate-report
```

Set `KEEP_RESULTS=1` to append to `artifacts/results.ndjson` instead of wiping on global setup.

## Authenticated tests

Set in `.env`:

```
RUN_AUTHENTICATED=1
CUSTOMER_EMAIL=...
CUSTOMER_PASSWORD=...
VENDOR_EMAIL=...
VENDOR_PASSWORD=...
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
```

Without credentials, auth suites are **blocked** and recorded as such in the report.

## Policy

- No real appointments
- No live notifications
- No real payments (sandbox only)
