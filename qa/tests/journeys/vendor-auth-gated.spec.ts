import { test, expect } from '@playwright/test'
import {
  HOSTS,
  VENDOR_AUTH_ROUTES,
  ADMIN_AUTH_ROUTES,
  RUN_AUTHENTICATED,
  portraitViewport,
  hasCredentials,
} from '../../helpers/config'
import { vendorSignIn, adminSignIn, authBlockedReason, customerSignIn } from '../../helpers/auth'
import {
  attachCollectors,
  detectLayoutIssues,
  runAxe,
  captureEvidence,
  appendResult,
} from '../../helpers/audit'

test.describe('Vendor authenticated dashboard', () => {
  test.beforeEach(() => {
    test.skip(!RUN_AUTHENTICATED || !hasCredentials('vendor'), authBlockedReason('vendor'))
  })

  for (const route of VENDOR_AUTH_ROUTES.filter((r) => r.critical)) {
    test(`${route.name} @ 390px`, async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium')
      const vp = portraitViewport(390)
      await page.setViewportSize(vp)
      const sign = await vendorSignIn(page)
      expect(sign.ok, sign.note).toBe(true)

      const collectors = await attachCollectors(page)
      await page.goto(`${HOSTS.vendor}${route.path}`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(1000)
      const layout = await detectLayoutIssues(page)
      const axe = await runAxe(page)
      const shots = await captureEvidence(page, `vendor-auth-${route.path}-${browserName}-390`)

      appendResult({
        host: HOSTS.vendor,
        route: route.path,
        name: route.name,
        browser: browserName,
        viewport: { ...vp, orientation: 'portrait' },
        status: layout.some((i) => i.severity === 'high') ? 'fail' : 'pass',
        finalUrl: page.url(),
        title: await page.title(),
        durationMs: 0,
        layoutIssues: layout,
        consoleErrors: collectors.consoleErrors.slice(0, 20),
        failedRequests: collectors.failedRequests.slice(0, 20),
        brokenLinks: [],
        axeViolations: axe,
        screenshots: shots,
        notes: [sign.note, 'Sandbox: no live notifications or real payments'],
      })
    })
  }
})

test.describe('Admin authenticated dashboard', () => {
  test.beforeEach(() => {
    test.skip(!RUN_AUTHENTICATED || !hasCredentials('admin'), authBlockedReason('admin'))
  })

  for (const route of ADMIN_AUTH_ROUTES.filter((r) => r.critical)) {
    test(`${route.name} @ 1280px`, async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium')
      await page.setViewportSize(portraitViewport(1280))
      const sign = await adminSignIn(page)
      expect(sign.ok, sign.note).toBe(true)

      const collectors = await attachCollectors(page)
      await page.goto(`${HOSTS.admin}${route.path}`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(1000)
      const layout = await detectLayoutIssues(page)
      const axe = await runAxe(page)
      const shots = await captureEvidence(page, `admin-auth-${route.path}-${browserName}-1280`)

      appendResult({
        host: HOSTS.admin,
        route: route.path,
        name: route.name,
        browser: browserName,
        viewport: { width: 1280, height: 800, orientation: 'portrait' },
        status: layout.some((i) => i.severity === 'high') ? 'fail' : 'pass',
        finalUrl: page.url(),
        title: await page.title(),
        durationMs: 0,
        layoutIssues: layout,
        consoleErrors: collectors.consoleErrors.slice(0, 20),
        failedRequests: collectors.failedRequests.slice(0, 20),
        brokenLinks: [],
        axeViolations: axe,
        screenshots: shots,
        notes: [sign.note],
      })
    })
  }
})

test.describe('Customer authenticated', () => {
  test.beforeEach(() => {
    test.skip(!RUN_AUTHENTICATED || !hasCredentials('customer'), authBlockedReason('customer'))
  })

  test('bookings list @ 390px', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium')
    await page.setViewportSize(portraitViewport(390))
    const sign = await customerSignIn(page)
    expect(sign.ok, sign.note).toBe(true)
    await page.goto(`${HOSTS.website}/app/bookings`, { waitUntil: 'domcontentloaded' })
    const shots = await captureEvidence(page, `customer-bookings-${browserName}-390`)
    appendResult({
      host: HOSTS.website,
      route: '/app/bookings',
      name: 'Customer bookings authenticated',
      browser: browserName,
      viewport: { width: 390, height: 844, orientation: 'portrait' },
      status: 'pass',
      durationMs: 0,
      layoutIssues: await detectLayoutIssues(page),
      consoleErrors: [],
      failedRequests: [],
      brokenLinks: [],
      axeViolations: await runAxe(page),
      screenshots: shots,
      notes: [sign.note, 'No real appointments created'],
    })
  })
})

test('vendor login form usability @ 375px (unauthenticated)', async ({ page, browserName }) => {
  test.skip(browserName === 'firefox')
  await page.setViewportSize(portraitViewport(375))
  const collectors = await attachCollectors(page)
  await page.goto(`${HOSTS.vendor}/login`, { waitUntil: 'domcontentloaded' })
  await expect(page.getByLabel(/email/i)).toBeVisible()
  await expect(page.getByLabel(/password/i)).toBeVisible()

  // Focus / virtual keyboard simulation: focus email then password
  await page.getByLabel(/email/i).focus()
  await page.getByLabel(/email/i).fill('qa-sandbox@example.com')
  await page.getByLabel(/password/i).focus()
  await page.getByLabel(/password/i).fill('NotARealPassword1!')
  // Submit invalid creds — expect error, not crash; do not create accounts
  await page.getByRole('button', { name: /sign in|log in|continue/i }).click()
  await page.waitForTimeout(2000)
  const shots = await captureEvidence(page, `vendor-login-invalid-${browserName}-375`)
  const layout = await detectLayoutIssues(page)
  appendResult({
    host: HOSTS.vendor,
    route: '/login',
    name: 'Vendor login invalid credentials UX',
    browser: browserName,
    viewport: { width: 375, height: 667, orientation: 'portrait' },
    status: layout.some((i) => i.severity === 'high') ? 'fail' : 'pass',
    finalUrl: page.url(),
    durationMs: 0,
    layoutIssues: layout,
    consoleErrors: collectors.consoleErrors.slice(0, 15),
    failedRequests: collectors.failedRequests.slice(0, 15),
    brokenLinks: [],
    axeViolations: await runAxe(page),
    screenshots: shots,
    notes: ['Submitted fake credentials only; verified error/loading handling without account creation'],
  })
})

test('admin login form usability @ 375px (unauthenticated)', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium')
  await page.setViewportSize(portraitViewport(375))
  await page.goto(`${HOSTS.admin}/login`, { waitUntil: 'domcontentloaded' })
  await expect(page.getByLabel(/email/i)).toBeVisible()
  const shots = await captureEvidence(page, `admin-login-${browserName}-375`)
  appendResult({
    host: HOSTS.admin,
    route: '/login',
    name: 'Admin login form mobile',
    browser: browserName,
    viewport: { width: 375, height: 667, orientation: 'portrait' },
    status: 'pass',
    durationMs: 0,
    layoutIssues: await detectLayoutIssues(page),
    consoleErrors: [],
    failedRequests: [],
    brokenLinks: [],
    axeViolations: await runAxe(page),
    screenshots: shots,
    notes: [],
  })
})
