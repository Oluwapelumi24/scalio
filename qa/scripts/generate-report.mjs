#!/usr/bin/env node
/**
 * Builds QA_REPORT.md from artifacts/results.ndjson + maps issues to source files.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const RESULTS = path.join(ROOT, 'artifacts', 'results.ndjson')
const OUT = path.join(ROOT, 'reports', 'QA_REPORT.md')
const BACKLOG = path.join(ROOT, 'reports', 'REMEDIATION_BACKLOG.md')

const SOURCE_MAP = [
  { match: /^\/$/, host: 'website', files: ['apps/website/src/app/page.tsx', 'apps/website/src/components/Navbar.tsx', 'apps/website/src/components/home/SearchHero.tsx'] },
  { match: /^\/partners/, host: 'website', files: ['apps/website/src/app/partners/page.tsx', 'apps/website/src/components/partners/'] },
  { match: /^\/app\/explore/, host: 'website', files: ['apps/website/src/app/app/explore/page.tsx'] },
  { match: /^\/app\/sign-in/, host: 'website', files: ['apps/website/src/app/app/sign-in/page.tsx'] },
  { match: /^\/app\/sign-up/, host: 'website', files: ['apps/website/src/app/app/sign-up/page.tsx'] },
  { match: /^\/app\/bookings/, host: 'website', files: ['apps/website/src/app/app/bookings/'] },
  { match: /^\/app/, host: 'website', files: ['apps/website/src/app/app/page.tsx', 'apps/website/src/app/app/layout.tsx'] },
  { match: /^\/book\//, host: 'website', files: ['apps/website/src/app/book/[slug]/page.tsx', 'apps/website/src/app/book/[slug]/AvailabilityPicker.tsx'] },
  { match: /^\/samples\//, host: 'website', files: ['apps/website/src/app/samples/', 'apps/website/src/lib/samples.ts'] },
  { match: /^\/login/, host: 'vendor', files: ['apps/vendor-web/src/app/login/page.tsx'] },
  { match: /^\/register/, host: 'vendor', files: ['apps/vendor-web/src/app/register/page.tsx'] },
  { match: /^\/dashboard/, host: 'vendor', files: ['apps/vendor-web/src/app/dashboard/'] },
  { match: /^\/login/, host: 'admin', files: ['apps/admin-web/src/app/login/page.tsx'] },
  { match: /^\/dashboard/, host: 'admin', files: ['apps/admin-web/src/app/dashboard/'] },
]

function mapSource(host, route) {
  const h = host.includes('admin') ? 'admin' : host.includes('railway') || host.includes('vendor') ? 'vendor' : 'website'
  for (const m of SOURCE_MAP) {
    if (m.host === h && m.match.test(route)) return m.files
  }
  return ['(unmapped — inspect route tree under apps/)']
}

function severityRank(s) {
  return { critical: 0, high: 1, medium: 2, low: 3 }[s] ?? 9
}

function loadResults() {
  if (!fs.existsSync(RESULTS)) return []
  return fs
    .readFileSync(RESULTS, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line)
      } catch {
        return null
      }
    })
    .filter(Boolean)
}

function collectDefects(results) {
  const defects = []
  let id = 1
  for (const r of results) {
    if (r.status === 'blocked') continue
    for (const issue of r.layoutIssues || []) {
      defects.push({
        id: `DEF-${String(id++).padStart(3, '0')}`,
        kind: 'confirmed',
        category: 'layout',
        severity: issue.severity,
        title: issue.message,
        route: r.route,
        name: r.name,
        host: r.host,
        browser: r.browser,
        viewport: r.viewport,
        expected: 'No horizontal overflow, clipping, or overlapping interactive controls',
        actual: issue.message,
        detail: issue.detail,
        screenshots: r.screenshots,
        source: mapSource(r.host, r.route),
        repro: [
          `Open ${r.host}${r.route} in ${r.browser}`,
          `Set viewport to ${r.viewport?.width}×${r.viewport?.height} (${r.viewport?.orientation})`,
          'Observe layout defect described in Actual',
        ],
      })
    }
    for (const v of r.axeViolations || []) {
      const sev =
        v.impact === 'critical' ? 'critical' : v.impact === 'serious' ? 'high' : v.impact === 'moderate' ? 'medium' : 'low'
      defects.push({
        id: `DEF-${String(id++).padStart(3, '0')}`,
        kind: 'confirmed',
        category: 'accessibility',
        severity: sev,
        title: `axe: ${v.id} — ${v.description}`,
        route: r.route,
        name: r.name,
        host: r.host,
        browser: r.browser,
        viewport: r.viewport,
        expected: 'WCAG 2.1 AA compliance for automated axe rules',
        actual: `${v.nodes} node(s); impact=${v.impact}; ${v.helpUrl || ''}`,
        screenshots: r.screenshots,
        source: mapSource(r.host, r.route),
        repro: [
          `Open ${r.host}${r.route} at ${r.viewport?.width}px in ${r.browser}`,
          `Run axe-core with tags wcag2a/aa + wcag21a/aa`,
          `Violation ${v.id} reported on ${v.nodes} node(s)`,
        ],
      })
    }
    for (const link of r.brokenLinks || []) {
      defects.push({
        id: `DEF-${String(id++).padStart(3, '0')}`,
        kind: 'confirmed',
        category: 'functional',
        severity: 'high',
        title: `Broken link ${link.href} → ${link.status}`,
        route: r.route,
        name: r.name,
        host: r.host,
        browser: r.browser,
        viewport: r.viewport,
        expected: 'Internal links return <400',
        actual: `GET ${link.href} → ${link.status}`,
        screenshots: r.screenshots,
        source: mapSource(r.host, r.route),
        repro: [`From ${r.host}${r.route}, follow or request ${link.href}`],
      })
    }
    if ((r.httpStatus && r.httpStatus >= 500) || r.status === 'error') {
      defects.push({
        id: `DEF-${String(id++).padStart(3, '0')}`,
        kind: 'confirmed',
        category: 'functional',
        severity: 'critical',
        title: r.status === 'error' ? `Navigation error: ${(r.notes || []).join('; ')}` : `HTTP ${r.httpStatus}`,
        route: r.route,
        name: r.name,
        host: r.host,
        browser: r.browser,
        viewport: r.viewport,
        expected: 'Page loads successfully',
        actual: r.status === 'error' ? (r.notes || []).join('; ') : `HTTP ${r.httpStatus}`,
        screenshots: r.screenshots,
        source: mapSource(r.host, r.route),
        repro: [`Navigate to ${r.host}${r.route}`],
      })
    }
  }
  // Dedupe similar titles on same route+viewport width
  const seen = new Set()
  return defects.filter((d) => {
    const key = `${d.category}|${d.title}|${d.route}|${d.viewport?.width}|${d.browser}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function main() {
  const results = loadResults()
  const defects = collectDefects(results).sort(
    (a, b) => severityRank(a.severity) - severityRank(b.severity) || a.route.localeCompare(b.route),
  )
  const blocked = results.filter((r) => r.status === 'blocked')
  const passed = results.filter((r) => r.status === 'pass')
  const failed = results.filter((r) => r.status === 'fail' || r.status === 'error')
  const browsers = [...new Set(results.map((r) => r.browser).filter((b) => b && b !== 'n/a'))]
  const hosts = [...new Set(results.map((r) => r.host))]

  const byRoute = {}
  for (const r of results) {
    const key = `${r.host}${r.route}`
    if (!byRoute[key]) byRoute[key] = []
    byRoute[key].push(r)
  }

  const now = new Date().toISOString()
  const lines = []
  lines.push(`# Veno QA Audit Report`)
  lines.push('')
  lines.push(`**Generated:** ${now}`)
  lines.push(`**Scope:** Production audit of https://venohq.com / www.venohq.com and associated hosts`)
  lines.push(`**Mode:** Audit-only — no production code changes`)
  lines.push('')
  lines.push(`## 1. Executive summary`)
  lines.push('')
  lines.push(
    `Executed Playwright audits across **${results.length}** recorded result rows on browsers: ${browsers.join(', ') || '(none)'}.`,
  )
  lines.push('')
  lines.push(`| Metric | Count |`)
  lines.push(`|---|---|`)
  lines.push(`| Result rows | ${results.length} |`)
  lines.push(`| Pass | ${passed.length} |`)
  lines.push(`| Fail / error | ${failed.length} |`)
  lines.push(`| Blocked (auth / missing creds) | ${blocked.length} |`)
  lines.push(`| Unique confirmed defect records | ${defects.length} |`)
  lines.push(`| Critical | ${defects.filter((d) => d.severity === 'critical').length} |`)
  lines.push(`| High | ${defects.filter((d) => d.severity === 'high').length} |`)
  lines.push(`| Medium | ${defects.filter((d) => d.severity === 'medium').length} |`)
  lines.push(`| Low | ${defects.filter((d) => d.severity === 'low').length} |`)
  lines.push('')
  lines.push(`### Host discovery (executed)`)
  lines.push('')
  lines.push(`| Host | Role | Status |`)
  lines.push(`|---|---|---|`)
  lines.push(`| https://www.venohq.com | Marketing + customer web | Live (Vercel) |`)
  lines.push(`| https://venohq.com | Apex | Forwards / serves site (bot-protected to non-browser clients) |`)
  lines.push(`| https://vendor-web-production-a59cdbc0.up.railway.app | Vendor dashboard | Live (Railway); www /login and /register 307 here |`)
  lines.push(`| https://app.venohq.com | Intended vendor custom domain | **DNS does not resolve** |`)
  lines.push(`| https://admin.venohq.com | Admin | Live (Railway) |`)
  lines.push(`| https://api.venohq.com | API | **DNS does not resolve** |`)
  lines.push('')
  lines.push(`### Classification legend`)
  lines.push('')
  lines.push(`- **Confirmed defect** — reproduced by automated check with evidence`)
  lines.push(`- **Usability recommendation** — judgment call, not a hard failure`)
  lines.push(`- **Blocked** — could not execute (credentials / DNS / payment policy)`)
  lines.push(`- **Untested** — out of executed matrix this run`)
  lines.push('')

  lines.push(`## 2. Device and browser test matrix`)
  lines.push('')
  lines.push(`| Browser | Portrait widths | Landscape | Notes |`)
  lines.push(`|---|---|---|---|`)
  lines.push(`| Chromium | 320, 360, 375, 390, 412, 430, 440, 768, 1024, 1280, 1440, 1920 | Phone + tablet landscape set | Full public critical matrix |`)
  lines.push(`| WebKit | 375, 390, 768, 1280 (critical routes) | Sample via journeys | Safari engine |`)
  lines.push(`| Firefox | 375, 390, 768, 1280 (critical routes) | — | Gecko |`)
  lines.push('')
  lines.push(`Artifacts: \`qa/screenshots/\`, \`qa/traces/\`, \`qa/artifacts/results.ndjson\`, HTML report \`qa/reports/html/\`.`)
  lines.push('')

  lines.push(`## 3. Route-by-route test results`)
  lines.push('')
  for (const [key, rows] of Object.entries(byRoute).sort()) {
    const statuses = [...new Set(rows.map((r) => r.status))]
    const widths = [...new Set(rows.map((r) => r.viewport?.width).filter(Boolean))].sort((a, b) => a - b)
    const browsersR = [...new Set(rows.map((r) => r.browser))]
    const issueCount = rows.reduce(
      (n, r) => n + (r.layoutIssues?.length || 0) + (r.axeViolations?.length || 0) + (r.brokenLinks?.length || 0),
      0,
    )
    lines.push(`### \`${key}\``)
    lines.push(`- Name: ${rows[0].name}`)
    lines.push(`- Statuses: ${statuses.join(', ')}`)
    lines.push(`- Browsers: ${browsersR.join(', ')}`)
    lines.push(`- Viewports tested: ${widths.join(', ') || 'n/a'}`)
    lines.push(`- Issue signals in rows: ${issueCount}`)
    if (rows[0].notes?.length) lines.push(`- Notes: ${rows[0].notes.join(' | ')}`)
    lines.push('')
  }

  lines.push(`## 4–10. Defect catalog`)
  lines.push('')
  if (!defects.length) {
    lines.push(`_No confirmed defects extracted from results.ndjson. Re-run audits if empty._`)
    lines.push('')
  }
  for (const d of defects) {
    lines.push(`### ${d.id} — ${d.title}`)
    lines.push('')
    lines.push(`| Field | Value |`)
    lines.push(`|---|---|`)
    lines.push(`| Kind | Confirmed defect (${d.category}) |`)
    lines.push(`| Severity | **${d.severity}** |`)
    lines.push(`| Host / route | ${d.host}${d.route} (${d.name}) |`)
    lines.push(`| Browser | ${d.browser} |`)
    lines.push(`| Viewport | ${d.viewport?.width}×${d.viewport?.height} ${d.viewport?.orientation || ''} |`)
    lines.push(`| Source files | ${d.source.join(', ')} |`)
    lines.push(`| Screenshots | ${(d.screenshots || []).join(', ') || '—'} |`)
    lines.push('')
    lines.push(`**Reproduction**`)
    for (const step of d.repro) lines.push(`1. ${step}`)
    lines.push('')
    lines.push(`**Expected:** ${d.expected}`)
    lines.push('')
    lines.push(`**Actual:** ${d.actual}`)
    lines.push('')
    lines.push(`**Root cause (hypothesised):** Inspect listed source files for responsive CSS (\`overflow-x\`, fixed widths, missing \`min-w-0\`, absolute positioning) or missing a11y attributes.`)
    lines.push('')
    lines.push(`**Recommended fix:** Address the specific rule/layout failure; add a Playwright regression in \`qa/tests/\` asserting no overflow at the failing width.`)
    lines.push('')
    lines.push(`**Regression test:** \`npx playwright test -g "${d.route}" --project=chromium\` after fix; assert \`detectLayoutIssues\` empty / axe clean for rule \`${d.title.slice(0, 40)}\`.`)
    lines.push('')
  }

  lines.push(`## 11. Regression test recommendations`)
  lines.push('')
  lines.push(`1. Keep \`qa/\` as a workspace package; run Chromium critical matrix on every PR.`)
  lines.push(`2. Run WebKit mobile (375/390) nightly for Safari-specific flex/overflow bugs.`)
  lines.push(`3. Gate merges on zero **critical/high** axe + overflow on \`/\`, \`/partners\`, \`/app\`, \`/book/*\`, vendor \`/login\`, \`/register\`.`)
  lines.push(`4. Add authenticated smoke once sandbox credentials exist (\`RUN_AUTHENTICATED=1\`).`)
  lines.push(`5. Visual snapshots for hero + booking funnel at 390 and 1280.`)
  lines.push('')

  lines.push(`## 12. Prioritised remediation backlog`)
  lines.push('')
  lines.push(`See also \`REMEDIATION_BACKLOG.md\`.`)
  lines.push('')
  const order = ['critical', 'high', 'medium', 'low']
  for (const sev of order) {
    const items = defects.filter((d) => d.severity === sev)
    lines.push(`### ${sev.toUpperCase()} (${items.length})`)
    if (!items.length) lines.push(`_None_`)
    for (const d of items) {
      lines.push(`- ${d.id}: ${d.title} — \`${d.route}\` @ ${d.viewport?.width}px (${d.browser})`)
    }
    lines.push('')
  }

  lines.push(`## Blocked tests`)
  lines.push('')
  if (!blocked.length) lines.push(`_None recorded_`)
  for (const b of blocked) {
    lines.push(`- **${b.name}** (\`${b.host}${b.route}\`): ${(b.notes || []).join(' ')}`)
  }
  lines.push('')

  lines.push(`## Untested / partial scenarios`)
  lines.push('')
  lines.push(`- Real appointment creation / cancellation (policy: sandbox only, no live bookings)`)
  lines.push(`- Live Paystack charges (policy: sandbox payments only; no credentials for test keys in this environment)`)
  lines.push(`- Push / SMS / email notifications`)
  lines.push(`- \`app.venohq.com\` and \`api.venohq.com\` custom domains (DNS missing)`)
  lines.push(`- Full vendor/admin dashboard matrices without credentials`)
  lines.push(`- Native iOS/Android apps (\`apps/mobile\`, \`apps/vendor-mobile\`) — out of Playwright web scope`)
  lines.push(`- Physical device safe-area notches (emulated via viewport meta check only)`)
  lines.push('')

  lines.push(`## Usability recommendations`)
  lines.push('')
  lines.push(`- Confirm hero headline line-breaks at 320–360px (partners “themselves,” wrap) — may be intentional but review optical balance.`)
  lines.push(`- Ensure vendor CTAs on marketing site clearly distinguish Railway staging host until \`app.venohq.com\` DNS is live.`)
  lines.push(`- Add explicit offline empty-state copy in the customer app shell if not present.`)
  lines.push(`- Document sandbox test accounts in a private secrets store for CI.`)
  lines.push('')

  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, lines.join('\n'))

  const backlog = ['# Remediation backlog', '', '| Priority | ID | Severity | Item | Route | Viewport |', '|---|---|---|---|---|---|']
  defects.forEach((d, i) => {
    backlog.push(`| P${severityRank(d.severity) + 1} | ${d.id} | ${d.severity} | ${d.title.replace(/\|/g, '/')} | ${d.route} | ${d.viewport?.width}px |`)
  })
  fs.writeFileSync(BACKLOG, backlog.join('\n') + '\n')

  fs.writeFileSync(path.join(ROOT, 'artifacts', 'defects.json'), JSON.stringify(defects, null, 2))
  console.log(`Wrote ${OUT}`)
  console.log(`Wrote ${BACKLOG}`)
  console.log(`Defects: ${defects.length}; results: ${results.length}`)
}

main()
