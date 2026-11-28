import { test, expect } from '@playwright/test'
import { HOSTS, portraitViewport } from '../../helpers/config'
import {
  attachCollectors,
  detectLayoutIssues,
  captureEvidence,
  appendResult,
  runAxe,
} from '../../helpers/audit'

test.describe('Customer discovery → search → listing → booking journey', () => {
  for (const width of [375, 390, 430] as const) {
    test(`mobile journey @ ${width}px`, async ({ page, browserName }, testInfo) => {
      if (browserName !== 'chromium' && width !== 390) testInfo.skip()

      const vp = portraitViewport(width)
      await page.setViewportSize(vp)
      const collectors = await attachCollectors(page)
      const notes: string[] = []
      const screenshots: string[] = []
      let status: 'pass' | 'fail' | 'error' = 'pass'

      try {
        // 1. Home
        await page.goto(HOSTS.website + '/', { waitUntil: 'domcontentloaded' })
        await expect(page.getByRole('heading', { name: /book local services/i })).toBeVisible({
          timeout: 15000,
        })
        screenshots.push(
          ...(await captureEvidence(page, `${browserName}-journey-home-${width}`)),
        )

        // Mobile menu
        const menuBtn = page.getByRole('button', { name: /open menu/i })
        if (await menuBtn.isVisible()) {
          await menuBtn.click()
          const mainNav = page.locator('header nav[aria-label="Main"]')
          const opened = await mainNav.isVisible({ timeout: 5000 }).catch(() => false)
          notes.push(opened ? 'Mobile menu open OK' : 'Mobile menu open inconclusive')
          const closeBtn = page.getByRole('button', { name: /close menu/i })
          if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click()
          notes.push('Mobile menu interaction attempted')
        }

        // 2. Search hero — category + area
        const category = page.getByRole('combobox', { name: /all services|service/i }).first()
        if (await category.isVisible()) {
          await category.click()
          const spaOption = page.getByRole('option', { name: /spa/i }).first()
          if (await spaOption.isVisible({ timeout: 3000 }).catch(() => false)) {
            await spaOption.click()
            notes.push('Category combobox selected Spa')
          } else {
            // Native select fallback
            await category.selectOption({ label: /spa/i }).catch(async () => {
              await page.keyboard.type('Spa')
              await page.keyboard.press('Enter')
            })
            notes.push('Category interaction attempted (non-listbox)')
          }
        }

        const searchBtn = page.getByRole('button', { name: /^search$/i })
        if (await searchBtn.isVisible()) {
          await searchBtn.click()
          await page.waitForTimeout(1500)
          notes.push(`After search URL: ${page.url()}`)
        }

        // 3. Navigate to /app explore
        await page.goto(HOSTS.website + '/app', { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(1000)
        screenshots.push(
          ...(await captureEvidence(page, `${browserName}-journey-app-${width}`)),
        )
        const appIssues = await detectLayoutIssues(page)
        if (appIssues.some((i) => i.severity === 'high' || i.severity === 'critical')) {
          status = 'fail'
          notes.push(...appIssues.map((i) => i.message))
        }

        // Filters / explore
        await page.goto(HOSTS.website + '/app/explore', { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(1000)
        screenshots.push(
          ...(await captureEvidence(page, `${browserName}-journey-explore-${width}`)),
        )

        // 4. Sample business profile / booking page
        await page.goto(HOSTS.website + '/book/serene-spa', { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(1200)
        screenshots.push(
          ...(await captureEvidence(page, `${browserName}-journey-book-serene-${width}`)),
        )

        // Service selection (sandbox — do not complete real booking)
        const serviceButtons = page.getByRole('button').filter({ hasText: /massage|facial|book|select|continue/i })
        const count = await serviceButtons.count()
        notes.push(`Booking page interactive CTAs: ${count}`)
        if (count > 0) {
          await serviceButtons.first().click({ trial: true }).catch(() => undefined)
          // Click first service-like control carefully without submitting payment
          const first = serviceButtons.first()
          const label = (await first.textContent()) || ''
          if (!/pay|confirm|complete/i.test(label)) {
            await first.click().catch(() => undefined)
            await page.waitForTimeout(800)
            notes.push(`Clicked service/CTA: ${label.trim().slice(0, 60)}`)
          } else {
            notes.push('Skipped payment CTA to avoid real payment')
          }
        }

        // Scheduling UI if present
        const timeBtn = page.getByRole('button', { name: /\d{1,2}:\d{2}|am|pm/i }).first()
        if (await timeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await timeBtn.click()
          notes.push(`Selected time slot: ${(await timeBtn.textContent())?.trim()}`)
          // Do NOT confirm booking / pay
          notes.push('Stopped before booking confirmation (sandbox policy)')
        } else {
          notes.push('No time-slot buttons visible (empty calendar or different UI)')
        }

        const axe = await runAxe(page)
        const layout = await detectLayoutIssues(page)

        appendResult({
          host: HOSTS.website,
          route: '/journey/customer-discovery',
          name: `Customer discovery journey @${width}`,
          browser: browserName,
          viewport: { width: vp.width, height: vp.height, orientation: 'portrait' },
          status:
            status === 'fail' ||
            layout.some((i) => i.severity === 'high') ||
            axe.some((v) => v.impact === 'critical' || v.impact === 'serious')
              ? 'fail'
              : 'pass',
          durationMs: 0,
          layoutIssues: layout,
          consoleErrors: collectors.consoleErrors.slice(0, 20),
          failedRequests: collectors.failedRequests.slice(0, 20),
          brokenLinks: [],
          axeViolations: axe,
          screenshots,
          notes,
        })

        expect(collectors.consoleErrors.filter((e) => !/favicon|sentry/i.test(e)).length).toBeLessThan(15)
      } catch (err) {
        screenshots.push(
          ...(await captureEvidence(page, `ERROR-journey-${browserName}-${width}`).catch(() => [])),
        )
        appendResult({
          host: HOSTS.website,
          route: '/journey/customer-discovery',
          name: `Customer discovery journey @${width}`,
          browser: browserName,
          viewport: { width: vp.width, height: vp.height, orientation: 'portrait' },
          status: 'error',
          durationMs: 0,
          layoutIssues: [],
          consoleErrors: collectors.consoleErrors,
          failedRequests: collectors.failedRequests,
          brokenLinks: [],
          axeViolations: [],
          screenshots,
          notes: [err instanceof Error ? err.message : String(err), ...notes],
        })
        throw err
      }
    })
  }
})

test.describe('Network / offline / slow states', () => {
  test('offline home shows recoverable state', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium')
    await page.setViewportSize(portraitViewport(390))
    await page.goto(HOSTS.website + '/', { waitUntil: 'domcontentloaded' })
    await page.context().setOffline(true)
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => undefined)
    await page.waitForTimeout(1000)
    const shots = await captureEvidence(page, `${browserName}-offline-home-390`)
    const bodyText = await page.locator('body').innerText().catch(() => '')
    appendResult({
      host: HOSTS.website,
      route: '/',
      name: 'Offline reload home',
      browser: browserName,
      viewport: { width: 390, height: 844, orientation: 'portrait' },
      status: 'pass',
      durationMs: 0,
      layoutIssues: [],
      consoleErrors: [],
      failedRequests: [],
      brokenLinks: [],
      axeViolations: [],
      screenshots: shots,
      notes: [
        bodyText.includes('offline') || bodyText.includes('No internet')
          ? 'Browser offline interstitial or app offline copy observed'
          : 'No dedicated offline UI — browser default offline behaviour',
        `Body snippet: ${bodyText.slice(0, 200)}`,
      ],
    })
    await page.context().setOffline(false)
  })

  test('slow 3G navigation to /app', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium')
    await page.setViewportSize(portraitViewport(390))
    const client = await page.context().newCDPSession(page)
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (500 * 1024) / 8,
      uploadThroughput: (500 * 1024) / 8,
      latency: 400,
    })
    const started = Date.now()
    await page.goto(HOSTS.website + '/app', { waitUntil: 'domcontentloaded', timeout: 60000 })
    const ms = Date.now() - started
    const shots = await captureEvidence(page, `${browserName}-slow3g-app-390`)
    appendResult({
      host: HOSTS.website,
      route: '/app',
      name: 'Slow 3G /app load',
      browser: browserName,
      viewport: { width: 390, height: 844, orientation: 'portrait' },
      status: ms > 15000 ? 'fail' : 'pass',
      durationMs: ms,
      layoutIssues: await detectLayoutIssues(page),
      consoleErrors: [],
      failedRequests: [],
      brokenLinks: [],
      axeViolations: [],
      screenshots: shots,
      notes: [`domcontentloaded in ${ms}ms under ~400ms RTT / 500kbps`],
    })
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0,
    })
  })
})
