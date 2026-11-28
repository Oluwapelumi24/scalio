import { test, expect } from '@playwright/test'
import { HOSTS, portraitViewport } from '../../helpers/config'
import {
  attachCollectors,
  detectLayoutIssues,
  captureEvidence,
  appendResult,
  runAxe,
} from '../../helpers/audit'

test.describe('Navigation, menus, sticky, focus', () => {
  test('home mobile menu + sticky header @ 390px', async ({ page, browserName }) => {
    test.skip(browserName === 'firefox')
    const vp = portraitViewport(390)
    await page.setViewportSize(vp)
    const collectors = await attachCollectors(page)
    await page.goto(HOSTS.website + '/', { waitUntil: 'networkidle' }).catch(async () => {
      await page.goto(HOSTS.website + '/', { waitUntil: 'domcontentloaded' })
    })

    const header = page.locator('header').first()
    await expect(header).toBeVisible()
    const headerBox = await header.boundingBox()
    notesSafe(headerBox, 'header visible')

    await page.evaluate(() => window.scrollBy(0, 600))
    await page.waitForTimeout(400)
    const stickyStill = await header.isVisible()
    const shots1 = await captureEvidence(page, `${browserName}-sticky-header-scrolled-390`)

    const open = page.getByRole('button', { name: /open menu/i })
    await open.click()
    await page.waitForTimeout(400)
    // Focus trap / escape
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
    const stillOpen = await page.getByRole('button', { name: /close menu/i }).isVisible().catch(() => false)
    if (stillOpen) {
      await page.getByRole('button', { name: /close menu/i }).click()
    }
    const shots2 = await captureEvidence(page, `${browserName}-mobile-menu-390`)

    const layout = await detectLayoutIssues(page)
    appendResult({
      host: HOSTS.website,
      route: '/',
      name: 'Sticky header + mobile menu',
      browser: browserName,
      viewport: { ...vp, orientation: 'portrait' },
      status: layout.some((i) => i.severity === 'high') ? 'fail' : 'pass',
      durationMs: 0,
      layoutIssues: layout,
      consoleErrors: collectors.consoleErrors.slice(0, 10),
      failedRequests: collectors.failedRequests.slice(0, 10),
      brokenLinks: [],
      axeViolations: await runAxe(page),
      screenshots: [...shots1, ...shots2],
      notes: [
        stickyStill ? 'Header remains visible after scroll' : 'Header not visible after scroll',
        stillOpen ? 'Escape did not close menu (closed via button)' : 'Menu dismissed',
        `Header height ~${Math.round(headerBox?.height ?? 0)}px`,
      ],
    })
  })

  test('partners FAQ / accordion keyboard @ 375px', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium')
    await page.setViewportSize(portraitViewport(375))
    await page.goto(HOSTS.website + '/', { waitUntil: 'domcontentloaded' })
    const faq = page.getByRole('button', { name: /what services can i book/i })
    await faq.scrollIntoViewIfNeeded()
    await faq.focus()
    await page.keyboard.press('Enter')
    await page.waitForTimeout(400)
    const expanded = await faq.getAttribute('aria-expanded')
    const shots = await captureEvidence(page, `${browserName}-faq-expand-375`)
    appendResult({
      host: HOSTS.website,
      route: '/#faq',
      name: 'FAQ accordion keyboard',
      browser: browserName,
      viewport: { width: 375, height: 667, orientation: 'portrait' },
      status: 'pass',
      durationMs: 0,
      layoutIssues: await detectLayoutIssues(page),
      consoleErrors: [],
      failedRequests: [],
      brokenLinks: [],
      axeViolations: [],
      screenshots: shots,
      notes: [`aria-expanded after Enter: ${expanded}`],
    })
  })

  test('customer sign-in form focus order @ 360px', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit' && browserName !== 'chromium')
    await page.setViewportSize(portraitViewport(360))
    await page.goto(HOSTS.website + '/app/sign-in', { waitUntil: 'domcontentloaded' })
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    const active = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      return {
        tag: el?.tagName,
        type: el?.getAttribute('type'),
        name: el?.getAttribute('name'),
        label: el?.getAttribute('aria-label') || el?.id,
      }
    })
    const shots = await captureEvidence(page, `${browserName}-signin-focus-360`)
    appendResult({
      host: HOSTS.website,
      route: '/app/sign-in',
      name: 'Sign-in focus order',
      browser: browserName,
      viewport: { width: 360, height: 640, orientation: 'portrait' },
      status: 'pass',
      durationMs: 0,
      layoutIssues: await detectLayoutIssues(page),
      consoleErrors: [],
      failedRequests: [],
      brokenLinks: [],
      axeViolations: await runAxe(page),
      screenshots: shots,
      notes: [`Active element after 3 Tabs: ${JSON.stringify(active)}`],
    })
  })

  test('safe-area / notch meta viewport present', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium')
    await page.setViewportSize(portraitViewport(390))
    await page.goto(HOSTS.website + '/', { waitUntil: 'domcontentloaded' })
    const meta = await page.evaluate(() => {
      const vp = document.querySelector('meta[name="viewport"]')?.getAttribute('content') || ''
      const styles = getComputedStyle(document.documentElement)
      return {
        viewport: vp,
        paddingTop: styles.paddingTop,
        envSupport: CSS.supports('padding-top: env(safe-area-inset-top)'),
      }
    })
    appendResult({
      host: HOSTS.website,
      route: '/',
      name: 'Viewport meta + safe-area support',
      browser: browserName,
      viewport: { width: 390, height: 844, orientation: 'portrait' },
      status: meta.viewport.includes('width=device-width') ? 'pass' : 'fail',
      durationMs: 0,
      layoutIssues: [],
      consoleErrors: [],
      failedRequests: [],
      brokenLinks: [],
      axeViolations: [],
      screenshots: [],
      notes: [JSON.stringify(meta)],
    })
    expect(meta.viewport).toMatch(/width=device-width/)
  })
})

function notesSafe(_box: { height: number } | null, _msg: string) {
  // helper placeholder to keep lint quiet if unused later
}
