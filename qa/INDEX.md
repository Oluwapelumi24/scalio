# Veno QA package

Audit-only Playwright suite and evidence for https://www.venohq.com and associated hosts.

## Start here

| Artifact | Path |
|---|---|
| **QA report** | [reports/QA_REPORT.md](reports/QA_REPORT.md) |
| **Remediation backlog** | [reports/REMEDIATION_BACKLOG.md](reports/REMEDIATION_BACKLOG.md) |
| **Playwright HTML report** | `reports/html/` (open via `npm run report`) |
| **Raw result rows** | `artifacts/results.ndjson` |
| **Aggregated defects JSON** | `artifacts/defects-aggregated.json` |
| **Screenshots** | `screenshots/` (+ `confirmed-*.png` key captures) |
| **Failure traces** | `traces/` |

## Quick commands

```bash
cd qa
npm install
npx playwright install chromium firefox webkit
npm test                  # full matrix
npm run test:chromium     # fastest signal
npm run generate-report   # rebuild markdown from results.ndjson
```

## Auth

Copy `.env.example` → `.env` and set sandbox credentials + `RUN_AUTHENTICATED=1` to unlock dashboard suites.
