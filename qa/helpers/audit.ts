import fs from 'node:fs'
import path from 'node:path'
import type { Page, ConsoleMessage, Request, Response } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { ARTIFACTS_DIR, SCREENSHOTS_DIR } from './config'

export type Severity = 'critical' | 'high' | 'medium' | 'low'

export interface LayoutIssue {
  type:
    | 'horizontal-overflow'
    | 'clipped-content'
    | 'overlapping'
    | 'tiny-tap-target'
    | 'low-contrast-flag'
    | 'sticky-overlap'
  severity: Severity
  message: string
  detail?: Record<string, unknown>
}

export interface RouteAuditResult {
  host: string
  route: string
  name: string
  browser: string
  viewport: { width: number; height: number; orientation: string }
  status: 'pass' | 'fail' | 'blocked' | 'error'
  httpStatus?: number
  finalUrl?: string
  title?: string
  durationMs: number
  layoutIssues: LayoutIssue[]
  consoleErrors: string[]
  failedRequests: { url: string; status?: number; failure?: string }[]
  brokenLinks: { href: string; status: number }[]
  axeViolations: {
    id: string
    impact?: string
    description: string
    nodes: number
    helpUrl?: string
  }[]
  screenshots: string[]
  notes: string[]
  clsEstimate?: number
  lcpCandidateMs?: number
}

function ensureDirs() {
  for (const dir of [ARTIFACTS_DIR, SCREENSHOTS_DIR, path.join(ARTIFACTS_DIR, 'json')]) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/https?:\/\//g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120)
}

export async function attachCollectors(page: Page) {
  const consoleErrors: string[] = []
  const failedRequests: RouteAuditResult['failedRequests'] = []

  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })

  page.on('pageerror', (err) => {
    consoleErrors.push(`pageerror: ${err.message}`)
  })

  page.on('requestfailed', (req: Request) => {
    failedRequests.push({
      url: req.url(),
      failure: req.failure()?.errorText,
    })
  })

  page.on('response', (res: Response) => {
    const status = res.status()
    if (status >= 400) {
      failedRequests.push({ url: res.url(), status })
    }
  })

  return { consoleErrors, failedRequests }
}

/** Detect document/body overflow and common layout failures via page JS. */
export async function detectLayoutIssues(page: Page): Promise<LayoutIssue[]> {
  return page.evaluate(() => {
    const issues: Array<{
      type: string
      severity: string
      message: string
      detail?: Record<string, unknown>
    }> = []

    const doc = document.documentElement
    const body = document.body
    const scrollWidth = Math.max(doc.scrollWidth, body?.scrollWidth ?? 0)
    const clientWidth = doc.clientWidth

    if (scrollWidth > clientWidth + 1) {
      issues.push({
        type: 'horizontal-overflow',
        severity: clientWidth < 768 ? 'high' : 'medium',
        message: `Horizontal overflow: scrollWidth=${scrollWidth} clientWidth=${clientWidth}`,
        detail: { scrollWidth, clientWidth, delta: scrollWidth - clientWidth },
      })
    }

    // Elements extending past the viewport right edge
    const offenders: Array<{ tag: string; className: string; right: number; width: number }> = []
    const all = Array.from(document.querySelectorAll('body *')) as HTMLElement[]
    for (const el of all) {
      const style = window.getComputedStyle(el)
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue
      const rect = el.getBoundingClientRect()
      if (rect.width < 2 || rect.height < 2) continue
      if (rect.right > clientWidth + 2 && rect.left < clientWidth) {
        offenders.push({
          tag: el.tagName.toLowerCase(),
          className: (el.className || '').toString().slice(0, 80),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        })
        if (offenders.length >= 12) break
      }
    }
    if (offenders.length) {
      issues.push({
        type: 'clipped-content',
        severity: 'medium',
        message: `${offenders.length}+ elements extend past viewport right edge`,
        detail: { offenders },
      })
    }

    // Overlapping interactive controls (simple AABB on buttons/links)
    const interactives = Array.from(
      document.querySelectorAll('a, button, input, select, textarea, [role="button"]'),
    ) as HTMLElement[]
    const boxes = interactives
      .map((el) => {
        const r = el.getBoundingClientRect()
        return { el, r }
      })
      .filter(({ r }) => r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight)

    let overlaps = 0
    const overlapSamples: string[] = []
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < Math.min(boxes.length, i + 25); j++) {
        const a = boxes[i].r
        const b = boxes[j].r
        const overlapX = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
        const overlapY = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
        const area = overlapX * overlapY
        if (area > 40 && overlapX > 8 && overlapY > 8) {
          // Skip nested (parent/child)
          if (boxes[i].el.contains(boxes[j].el) || boxes[j].el.contains(boxes[i].el)) continue
          overlaps++
          if (overlapSamples.length < 5) {
            overlapSamples.push(
              `${boxes[i].el.tagName}:${(boxes[i].el.getAttribute('aria-label') || boxes[i].el.textContent || '').trim().slice(0, 40)} ∩ ${boxes[j].el.tagName}:${(boxes[j].el.getAttribute('aria-label') || boxes[j].el.textContent || '').trim().slice(0, 40)}`,
            )
          }
        }
      }
    }
    if (overlaps > 0) {
      issues.push({
        type: 'overlapping',
        severity: overlaps > 3 ? 'high' : 'medium',
        message: `${overlaps} overlapping interactive pairs detected`,
        detail: { samples: overlapSamples },
      })
    }

    // Tiny tap targets on mobile
    if (clientWidth <= 440) {
      const tiny: Array<{ label: string; w: number; h: number }> = []
      for (const el of interactives) {
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) continue
        if (r.width < 40 || r.height < 40) {
          const label = (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 50)
          tiny.push({ label, w: Math.round(r.width), h: Math.round(r.height) })
          if (tiny.length >= 10) break
        }
      }
      if (tiny.length) {
        issues.push({
          type: 'tiny-tap-target',
          severity: 'medium',
          message: `${tiny.length}+ interactive elements below 40×40px`,
          detail: { samples: tiny },
        })
      }
    }

    return issues as Array<{
      type: LayoutIssue['type']
      severity: Severity
      message: string
      detail?: Record<string, unknown>
    }>
  })
}

export async function runAxe(page: Page) {
  try {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze()
    return results.violations.map((v) => ({
      id: v.id,
      impact: v.impact ?? undefined,
      description: v.description,
      nodes: v.nodes.length,
      helpUrl: v.helpUrl,
    }))
  } catch (err) {
    return [
      {
        id: 'axe-error',
        impact: 'serious',
        description: err instanceof Error ? err.message : String(err),
        nodes: 0,
      },
    ]
  }
}

export async function checkInternalLinks(
  page: Page,
  origin: string,
  limit = 20,
): Promise<{ href: string; status: number }[]> {
  const hrefs = await page.evaluate((originUrl) => {
    const links = Array.from(document.querySelectorAll('a[href]')) as HTMLAnchorElement[]
    const out: string[] = []
    for (const a of links) {
      const href = a.getAttribute('href') || ''
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue
      try {
        const url = new URL(href, originUrl)
        if (url.origin === new URL(originUrl).origin) out.push(url.href)
      } catch {
        /* ignore */
      }
    }
    return Array.from(new Set(out)).slice(0, 40)
  }, origin)

  const broken: { href: string; status: number }[] = []
  for (const href of hrefs.slice(0, limit)) {
    try {
      const res = await page.request.get(href, { maxRedirects: 5, timeout: 15000 })
      if (res.status() >= 400) broken.push({ href, status: res.status() })
    } catch {
      broken.push({ href, status: 0 })
    }
  }
  return broken
}

export async function measureLayoutStability(page: Page): Promise<{ clsEstimate: number; lcpCandidateMs?: number }> {
  return page.evaluate(() => {
    return new Promise<{ clsEstimate: number; lcpCandidateMs?: number }>((resolve) => {
      let cls = 0
      let lcp: number | undefined
      try {
        const clsObs = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as PerformanceEntry[]) {
            const e = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number }
            if (!e.hadRecentInput && typeof e.value === 'number') cls += e.value
          }
        })
        clsObs.observe({ type: 'layout-shift', buffered: true } as PerformanceObserverInit)

        const lcpObs = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const last = entries[entries.length - 1]
          if (last) lcp = last.startTime
        })
        lcpObs.observe({ type: 'largest-contentful-paint', buffered: true } as PerformanceObserverInit)

        setTimeout(() => {
          clsObs.disconnect()
          lcpObs.disconnect()
          resolve({ clsEstimate: Number(cls.toFixed(4)), lcpCandidateMs: lcp })
        }, 1200)
      } catch {
        resolve({ clsEstimate: -1 })
      }
    })
  })
}

export async function captureEvidence(
  page: Page,
  label: string,
): Promise<string[]> {
  ensureDirs()
  const base = slugify(label)
  const fullPath = path.join(SCREENSHOTS_DIR, `${base}-full.png`)
  const foldPath = path.join(SCREENSHOTS_DIR, `${base}-fold.png`)
  try {
    await page.screenshot({ path: foldPath, fullPage: false, timeout: 30_000 })
    await page.screenshot({ path: fullPath, fullPage: true, timeout: 60_000 })
    return [foldPath, fullPath].map((p) => path.relative(path.join(__dirname, '..'), p))
  } catch {
    try {
      await page.screenshot({ path: foldPath, fullPage: false, timeout: 15_000 })
      return [path.relative(path.join(__dirname, '..'), foldPath)]
    } catch {
      return []
    }
  }
}

export function writeJsonArtifact(name: string, data: unknown) {
  ensureDirs()
  const file = path.join(ARTIFACTS_DIR, 'json', `${slugify(name)}.json`)
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
  return file
}

export function appendResult(result: RouteAuditResult) {
  ensureDirs()
  const file = path.join(ARTIFACTS_DIR, 'results.ndjson')
  fs.appendFileSync(file, JSON.stringify(result) + '\n')
}

export function resetResultsFile() {
  ensureDirs()
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'results.ndjson'), '')
}
