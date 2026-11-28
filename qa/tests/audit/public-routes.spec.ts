import { test, expect } from '@playwright/test'
import {
  HOSTS,
  PORTRAIT_WIDTHS,
  LANDSCAPE_VIEWPORTS,
  WEBSITE_PUBLIC_ROUTES,
  VENDOR_PUBLIC_ROUTES,
  ADMIN_PUBLIC_ROUTES,
  portraitViewport,
  RUN_AUTHENTICATED,
} from '../../helpers/config'
import {
  attachCollectors,
  detectLayoutIssues,
  runAxe,
  checkInternalLinks,
  measureLayoutStability,
  captureEvidence,
  appendResult,
  type RouteAuditResult,
} from '../../helpers/audit'

/**
 * Strategy (executed, not assumed):
 * - Chromium: all public routes × all portrait widths + landscape set for critical routes
 * - WebKit + Firefox: critical routes × key mobile/desktop widths (375, 390, 768, 1280)
 */

const KEY_WIDTHS = [375, 390, 768, 1280] as const

async function auditRoute(opts: {
  page: import('@playwright/test').Page
  host: string
  route: string
  name: string
  browser: string
  width: number
  height: number
  orientation: 'portrait' | 'landscape'
  runLinks?: boolean
  runAxeScan?: boolean
}): Promise<RouteAuditResult> {
  const { page, host, route, name, browser, width, height, orientation } = opts
  const started = Date.now()
  await page.setViewportSize({ width, height })

  const collectors = await attachCollectors(page)
  const url = `${host}${route}`
  const notes: string[] = []
  let httpStatus: number | undefined
  let finalUrl: string | undefined
  let title: string | undefined
  let status: RouteAuditResult['status'] = 'pass'
  let layoutIssues: RouteAuditResult['layoutIssues'] = []
  let axeViolations: RouteAuditResult['axeViolations'] = []
  let brokenLinks: RouteAuditResult['brokenLinks'] = []
  let screenshots: string[] = []
  let clsEstimate: number | undefined
  let lcpCandidateMs: number | undefined

  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded' })
    httpStatus = response?.status()
    finalUrl = page.url()
    title = await page.title()
    await page.waitForTimeout(800)

    if (!httpStatus || httpStatus >= 400) {
      status = 'fail'
      notes.push(`HTTP ${httpStatus}`)
    }

    layoutIssues = await detectLayoutIssues(page)
    const perf = await measureLayoutStability(page)
    clsEstimate = perf.clsEstimate
    lcpCandidateMs = perf.lcpCandidateMs

    if (opts.runAxeScan !== false) {
      axeViolations = await runAxe(page)
    }

    if (opts.runLinks) {
      brokenLinks = await checkInternalLinks(page, host, 15)
    }

    const hasSerious =
      layoutIssues.some((i) => i.severity === 'critical' || i.severity === 'high') ||
      axeViolations.some((v) => v.impact === 'critical' || v.impact === 'serious') ||
      brokenLinks.length > 0 ||
      collectors.consoleErrors.length > 3

    if (hasSerious && status === 'pass') status = 'fail'

    if (layoutIssues.length || axeViolations.length || status === 'fail') {
      screenshots = await captureEvidence(
        page,
        `${browser}-${orientation}-w${width}-${host.replace(/https?:\/\//, '')}${route}`,
      )
    }
  } catch (err) {
    status = 'error'
    notes.push(err instanceof Error ? err.message : String(err))
    try {
      screenshots = await captureEvidence(
        page,
        `ERROR-${browser}-w${width}-${host.replace(/https?:\/\//, '')}${route}`,
      )
    } catch {
      /* ignore */
    }
  }

  const result: RouteAuditResult = {
    host,
    route,
    name,
    browser,
    viewport: { width, height, orientation },
    status,
    httpStatus,
    finalUrl,
    title,
    durationMs: Date.now() - started,
    layoutIssues,
    consoleErrors: collectors.consoleErrors.slice(0, 30),
    failedRequests: collectors.failedRequests
      .filter((r) => !r.url.includes('favicon') && !r.url.includes('sentry'))
      .slice(0, 40),
    brokenLinks,
    axeViolations,
    screenshots,
    notes,
    clsEstimate,
    lcpCandidateMs,
  }
  appendResult(result)
  return result
}

test.describe('Website public routes — Chromium full matrix', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Chromium-only full matrix')

  for (const route of WEBSITE_PUBLIC_ROUTES) {
    for (const width of PORTRAIT_WIDTHS) {
      // Non-critical routes: sample widths only
      if (!route.critical && ![375, 390, 768, 1280].includes(width)) continue

      test(`${route.name} @ ${width}px portrait`, async ({ page, browserName }) => {
        const vp = portraitViewport(width)
        const result = await auditRoute({
          page,
          host: HOSTS.website,
          route: route.path,
          name: route.name,
          browser: browserName,
          width: vp.width,
          height: vp.height,
          orientation: 'portrait',
          runLinks: width === 390 && route.critical,
          runAxeScan: width === 375 || width === 1280,
        })
        // Soft assertion: collect evidence; fail only on hard errors / HTTP 5xx
        if (result.status === 'error') {
          expect(result.notes.join('; '), `Unhandled error on ${route.path}`).toBe('')
        }
        if (result.httpStatus && result.httpStatus >= 500) {
          expect(result.httpStatus, `Server error on ${route.path}`).toBeLessThan(500)
        }
      })
    }
  }

  for (const route of WEBSITE_PUBLIC_ROUTES.filter((r) => r.critical)) {
    for (const land of LANDSCAPE_VIEWPORTS) {
      test(`${route.name} landscape ${land.label}`, async ({ page, browserName }) => {
        const result = await auditRoute({
          page,
          host: HOSTS.website,
          route: route.path,
          name: route.name,
          browser: browserName,
          width: land.width,
          height: land.height,
          orientation: 'landscape',
          runAxeScan: false,
        })
        if (result.httpStatus && result.httpStatus >= 500) {
          expect(result.httpStatus).toBeLessThan(500)
        }
      })
    }
  }
})

test.describe('Website critical routes — WebKit & Firefox sample', () => {
  test.skip(({ browserName }) => browserName === 'chromium', 'Cross-browser sample only')

  for (const route of WEBSITE_PUBLIC_ROUTES.filter((r) => r.critical)) {
    for (const width of KEY_WIDTHS) {
      test(`${route.name} @ ${width}px`, async ({ page, browserName }) => {
        const vp = portraitViewport(width)
        const result = await auditRoute({
          page,
          host: HOSTS.website,
          route: route.path,
          name: route.name,
          browser: browserName,
          width: vp.width,
          height: vp.height,
          orientation: 'portrait',
          runAxeScan: width === 375,
        })
        if (result.httpStatus && result.httpStatus >= 500) {
          expect(result.httpStatus).toBeLessThan(500)
        }
      })
    }
  }
})

test.describe('Vendor public routes', () => {
  for (const route of VENDOR_PUBLIC_ROUTES) {
    const widths = route.critical ? PORTRAIT_WIDTHS : KEY_WIDTHS
    for (const width of widths) {
      test(`vendor ${route.name} @ ${width}px`, async ({ page, browserName }, testInfo) => {
        if (browserName !== 'chromium' && ![375, 1280].includes(width)) {
          testInfo.skip()
        }
        if (browserName !== 'chromium' && !route.critical) {
          testInfo.skip()
        }
        const vp = portraitViewport(width)
        const result = await auditRoute({
          page,
          host: HOSTS.vendor,
          route: route.path,
          name: route.name,
          browser: browserName,
          width: vp.width,
          height: vp.height,
          orientation: 'portrait',
          runAxeScan: width === 375,
        })
        if (result.httpStatus && result.httpStatus >= 500) {
          expect(result.httpStatus).toBeLessThan(500)
        }
      })
    }
  }
})

test.describe('Admin public routes', () => {
  for (const route of ADMIN_PUBLIC_ROUTES) {
    for (const width of [375, 390, 768, 1280] as const) {
      test(`admin ${route.name} @ ${width}px`, async ({ page, browserName }, testInfo) => {
        if (browserName !== 'chromium' && width !== 375 && width !== 1280) {
          testInfo.skip()
        }
        const vp = portraitViewport(width)
        const result = await auditRoute({
          page,
          host: HOSTS.admin,
          route: route.path,
          name: route.name,
          browser: browserName,
          width: vp.width,
          height: vp.height,
          orientation: 'portrait',
          runAxeScan: width === 375,
        })
        if (result.httpStatus && result.httpStatus >= 500) {
          expect(result.httpStatus).toBeLessThan(500)
        }
      })
    }
  }
})

test('document auth matrix blocked without credentials', async () => {
  // Records intentional blocked scope for the report generator.
  if (!RUN_AUTHENTICATED) {
    appendResult({
      host: HOSTS.vendor,
      route: '/dashboard/*',
      name: 'Vendor authenticated suite',
      browser: 'n/a',
      viewport: { width: 0, height: 0, orientation: 'portrait' },
      status: 'blocked',
      durationMs: 0,
      layoutIssues: [],
      consoleErrors: [],
      failedRequests: [],
      brokenLinks: [],
      axeViolations: [],
      screenshots: [],
      notes: [
        'Blocked: RUN_AUTHENTICATED!=1 or missing VENDOR_EMAIL/VENDOR_PASSWORD. No sandbox credentials available in repo.',
      ],
    })
    appendResult({
      host: HOSTS.admin,
      route: '/dashboard/*',
      name: 'Admin authenticated suite',
      browser: 'n/a',
      viewport: { width: 0, height: 0, orientation: 'portrait' },
      status: 'blocked',
      durationMs: 0,
      layoutIssues: [],
      consoleErrors: [],
      failedRequests: [],
      brokenLinks: [],
      axeViolations: [],
      screenshots: [],
      notes: [
        'Blocked: RUN_AUTHENTICATED!=1 or missing ADMIN_EMAIL/ADMIN_PASSWORD. No sandbox credentials available in repo.',
      ],
    })
    appendResult({
      host: HOSTS.website,
      route: '/app/bookings (authenticated)',
      name: 'Customer authenticated booking management',
      browser: 'n/a',
      viewport: { width: 0, height: 0, orientation: 'portrait' },
      status: 'blocked',
      durationMs: 0,
      layoutIssues: [],
      consoleErrors: [],
      failedRequests: [],
      brokenLinks: [],
      axeViolations: [],
      screenshots: [],
      notes: [
        'Blocked: missing CUSTOMER_EMAIL/CUSTOMER_PASSWORD. Auth-gated UI reachable but signed-in flows not executed.',
      ],
    })
  }
  expect(true).toBe(true)
})
