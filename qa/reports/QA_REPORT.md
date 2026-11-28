# Veno QA Audit Report

**Generated:** 2026-11-28 14:51 UTC  
**Mode:** Audit-only (no production code changes)  
**Primary URL:** https://www.venohq.com  
**Associated hosts:** vendor Railway app, admin.venohq.com  
**Tooling:** Playwright Chromium / Firefox / WebKit + axe-core

## 1. Executive summary

Executed **363** instrumented result rows across browsers `chromium, firefox, webkit`. Latest full matrix: **354 passed**, **3 failed** (flaky journey screenshot/menu), **552 skipped** (intentional width/browser sampling + auth without credentials).

### Verdict

- Public marketing and customer shells load on phone→desktop widths; recurring **a11y** and **tap-target** findings.
- **High:** Marketing advertises `venohq.com/book/serene-spa`, but `/book/serene-spa` is **HTTP 404** on Chromium, Firefox, and WebKit (sample slug ≠ live vendor).
- **DNS:** `app.venohq.com` and `api.venohq.com` do not resolve. Vendor portal is `https://vendor-web-production-a59cdbc0.up.railway.app` (www `/login` & `/register` 307).
- **Blocked:** Authenticated vendor/admin/customer dashboards (no sandbox credentials). No real appointments, live notifications, or real payments.

| Metric | Count |
|---|---|
| Result rows | 363 |
| Pass rows | 261 |
| Fail/error rows | 93 |
| Blocked suites (deduped) | 3 |
| Aggregated unique defects | 101 |
| Critical | 2 |
| High | 25 |
| Medium | 74 |
| Low | 0 |

### Classification legend

| Class | Meaning |
|---|---|
| **Confirmed defect** | Reproduced by Playwright/axe with evidence |
| **Usability recommendation** | Judgment / polish |
| **Blocked** | Credentials, DNS, or policy |
| **Untested** | Outside this run’s matrix |

## 2. Device and browser test matrix

| Browser | Portrait widths | Landscape | Coverage |
|---|---|---|---|
| Chromium | 320, 360, 375, 390, 412, 430, 440, 768, 1024, 1280, 1440, 1920 | Phone + iPad landscape on critical routes | Full public critical matrix |
| Firefox | 375, 390, 768, 1280 (critical) | — | Cross-engine sample |
| WebKit | 375, 390, 768, 1280 (critical) | — | Safari engine sample |

Evidence: `qa/screenshots/`, `qa/traces/` (on failure), `qa/artifacts/results.ndjson`, HTML report `qa/reports/html/`.

## 3. Route-by-route test results

### `https://admin.venohq.com/accept-invite`
- **Name:** Admin accept invite
- **Statuses:** pass
- **Browsers:** chromium, firefox, webkit
- **Viewports:** 375, 390, 768, 1280
- **Issue signals:** 10

### `https://admin.venohq.com/dashboard/*`
- **Name:** Admin authenticated suite
- **Statuses:** blocked
- **Browsers:** n/a
- **Viewports:** n/a
- **Issue signals:** 0
- **Notes:** Blocked: RUN_AUTHENTICATED!=1 or missing ADMIN_EMAIL/ADMIN_PASSWORD. No sandbox credentials available in repo.

### `https://admin.venohq.com/forgot-password`
- **Name:** Admin forgot password
- **Statuses:** fail, pass
- **Browsers:** chromium, firefox, webkit
- **Viewports:** 375, 390, 768, 1280
- **Issue signals:** 13

### `https://admin.venohq.com/login`
- **Name:** Admin login
- **Statuses:** fail, pass
- **Browsers:** chromium, firefox, webkit
- **Viewports:** 375, 390, 768, 1280
- **Issue signals:** 17

### `https://admin.venohq.com/reset-password`
- **Name:** Admin reset password
- **Statuses:** fail, pass
- **Browsers:** chromium, firefox, webkit
- **Viewports:** 375, 390, 768, 1280
- **Issue signals:** 13

### `https://vendor-web-production-a59cdbc0.up.railway.app/accept-invite`
- **Name:** Vendor accept invite
- **Statuses:** fail, pass
- **Browsers:** chromium
- **Viewports:** 375, 390, 768, 1280
- **Issue signals:** 3

### `https://vendor-web-production-a59cdbc0.up.railway.app/dashboard/*`
- **Name:** Vendor authenticated suite
- **Statuses:** blocked
- **Browsers:** n/a
- **Viewports:** n/a
- **Issue signals:** 0
- **Notes:** Blocked: RUN_AUTHENTICATED!=1 or missing VENDOR_EMAIL/VENDOR_PASSWORD. No sandbox credentials available in repo.

### `https://vendor-web-production-a59cdbc0.up.railway.app/forgot-password`
- **Name:** Vendor forgot password
- **Statuses:** fail, pass
- **Browsers:** chromium
- **Viewports:** 375, 390, 768, 1280
- **Issue signals:** 5

### `https://vendor-web-production-a59cdbc0.up.railway.app/login`
- **Name:** Vendor login
- **Statuses:** fail, pass
- **Browsers:** chromium, firefox, webkit
- **Viewports:** 320, 360, 375, 390, 412, 430, 440, 768, 1024, 1280, 1440, 1920
- **Issue signals:** 26
- **Notes:** Submitted fake credentials only; verified error/loading handling without account creation

### `https://vendor-web-production-a59cdbc0.up.railway.app/register`
- **Name:** Vendor register
- **Statuses:** fail, pass
- **Browsers:** chromium, firefox, webkit
- **Viewports:** 320, 360, 375, 390, 412, 430, 440, 768, 1024, 1280, 1440, 1920
- **Issue signals:** 18

### `https://vendor-web-production-a59cdbc0.up.railway.app/reset-password`
- **Name:** Vendor reset password
- **Statuses:** fail, pass
- **Browsers:** chromium
- **Viewports:** 375, 390, 768, 1280
- **Issue signals:** 5

### `https://www.venohq.com/`
- **Name:** Viewport meta + safe-area support
- **Statuses:** error, fail, pass
- **Browsers:** chromium, firefox, webkit
- **Viewports:** 320, 360, 375, 390, 412, 430, 440, 568, 667, 768, 844, 915, 926, 1024, 1280, 1440, 1920
- **Issue signals:** 61
- **Notes:** {"viewport":"width=device-width, initial-scale=1","paddingTop":"0px","envSupport":true}

### `https://www.venohq.com/#faq`
- **Name:** FAQ accordion keyboard
- **Statuses:** pass
- **Browsers:** chromium
- **Viewports:** 375
- **Issue signals:** 2
- **Notes:** aria-expanded after Enter: null

### `https://www.venohq.com/app`
- **Name:** Customer home
- **Statuses:** fail, pass
- **Browsers:** chromium, firefox, webkit
- **Viewports:** 320, 360, 375, 390, 412, 430, 440, 568, 667, 768, 844, 915, 926, 1024, 1280, 1440, 1920
- **Issue signals:** 23
- **Notes:** domcontentloaded in 2624ms under ~400ms RTT / 500kbps

### `https://www.venohq.com/app/bookings`
- **Name:** Bookings (auth gate)
- **Statuses:** fail, pass
- **Browsers:** chromium, firefox, webkit
- **Viewports:** 320, 360, 375, 390, 412, 430, 440, 568, 667, 768, 844, 915, 926, 1024, 1280, 1440, 1920
- **Issue signals:** 24

### `https://www.venohq.com/app/bookings (authenticated)`
- **Name:** Customer authenticated booking management
- **Statuses:** blocked
- **Browsers:** n/a
- **Viewports:** n/a
- **Issue signals:** 0
- **Notes:** Blocked: missing CUSTOMER_EMAIL/CUSTOMER_PASSWORD. Auth-gated UI reachable but signed-in flows not executed.

### `https://www.venohq.com/app/bookings/return`
- **Name:** Booking return
- **Statuses:** fail, pass
- **Browsers:** chromium
- **Viewports:** 375, 390, 768, 1280
- **Issue signals:** 7

### `https://www.venohq.com/app/explore`
- **Name:** Explore
- **Statuses:** fail, pass
- **Browsers:** chromium, firefox, webkit
- **Viewports:** 320, 360, 375, 390, 412, 430, 440, 568, 667, 768, 844, 915, 926, 1024, 1280, 1440, 1920
- **Issue signals:** 35

### `https://www.venohq.com/app/profile`
- **Name:** Profile (auth gate)
- **Statuses:** fail, pass
- **Browsers:** chromium
- **Viewports:** 375, 390, 768, 1280
- **Issue signals:** 7

### `https://www.venohq.com/app/sign-in`
- **Name:** Sign-in focus order
- **Statuses:** fail, pass
- **Browsers:** chromium, firefox, webkit
- **Viewports:** 320, 360, 375, 390, 412, 430, 440, 568, 667, 768, 844, 915, 926, 1024, 1280, 1440, 1920
- **Issue signals:** 35
- **Notes:** Active element after 3 Tabs: {"tag":"INPUT","type":"password","name":"password","label":""}

### `https://www.venohq.com/app/sign-up`
- **Name:** Customer sign-up
- **Statuses:** fail, pass
- **Browsers:** chromium, firefox, webkit
- **Viewports:** 320, 360, 375, 390, 412, 430, 440, 568, 667, 768, 844, 915, 926, 1024, 1280, 1440, 1920
- **Issue signals:** 33

### `https://www.venohq.com/book/serene-spa`
- **Name:** Booking page Serene Spa
- **Statuses:** fail — **HTTP 404 confirmed**
- **Browsers:** chromium, firefox, webkit
- **Viewports:** 320, 360, 375, 390, 412, 430, 440, 568, 667, 768, 844, 915, 926, 1024, 1280, 1440, 1920
- **Issue signals:** 6
- **Notes:** HTTP 404

### `https://www.venohq.com/cookies`
- **Name:** Cookies
- **Statuses:** pass
- **Browsers:** chromium
- **Viewports:** 375, 390, 768, 1280
- **Issue signals:** 4

### `https://www.venohq.com/forgot-password`
- **Name:** Forgot password (legacy)
- **Statuses:** pass
- **Browsers:** chromium
- **Viewports:** 375, 390, 768, 1280
- **Issue signals:** 2

### `https://www.venohq.com/journey/customer-discovery`
- **Name:** Customer discovery journey @375
- **Statuses:** error, pass
- **Browsers:** chromium, firefox, webkit
- **Viewports:** 375, 390, 430
- **Issue signals:** 0
- **Notes:** [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByRole('navigation', { name: 'Main' })
Expected: visible
Timeout

### `https://www.venohq.com/partners`
- **Name:** Partners
- **Statuses:** error, fail, pass
- **Browsers:** chromium, firefox, webkit
- **Viewports:** 320, 360, 375, 390, 412, 430, 440, 568, 667, 768, 844, 915, 926, 1024, 1280, 1440, 1920
- **Issue signals:** 61
- **Notes:** page.screenshot: Timeout 15000ms exceeded.
Call log:
[2m  - taking page screenshot[22m
[2m  - waiting for fonts to load...[22m


### `https://www.venohq.com/privacy`
- **Name:** Privacy
- **Statuses:** pass
- **Browsers:** chromium
- **Viewports:** 375, 390, 768, 1280
- **Issue signals:** 4

### `https://www.venohq.com/samples/spa`
- **Name:** Sample category Spa
- **Statuses:** pass
- **Browsers:** chromium
- **Viewports:** 375, 390, 768, 1280
- **Issue signals:** 4

### `https://www.venohq.com/samples/spa/serene-spa`
- **Name:** Sample listing Serene Spa
- **Statuses:** fail, pass
- **Browsers:** chromium, firefox, webkit
- **Viewports:** 320, 360, 375, 390, 412, 430, 440, 568, 667, 768, 844, 915, 926, 1024, 1280, 1440, 1920
- **Issue signals:** 19

### `https://www.venohq.com/terms`
- **Name:** Terms
- **Statuses:** pass
- **Browsers:** chromium
- **Viewports:** 375, 390, 768, 1280
- **Issue signals:** 4

## 4–10. Defect catalog

Fields covered per defect: screenshots, reproduction, expected vs actual, severity, viewport/browser, source, root cause, fix, regression.

### DEF-001 — axe `aria-required-children` — Ensure elements with an ARIA role that require child roles contain them

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **critical** |
| Host / route | `https://www.venohq.com/partners` (Partners) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375, 1280 |
| Matching rows | 4 |
| Source | `apps/website/src/app/partners/page.tsx`, `apps/website/src/components/partners/SetupSteps.tsx`, `apps/website/src/components/partners/FeatureTour.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-www-venohq-com-partners-fold.png`, `screenshots/chromium-portrait-w375-www-venohq-com-partners-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/partners` in chromium.
2. Set width to **375px** (also: 375, 1280).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=critical; nodes=1; https://dequeuniversity.com/rules/axe/4.14/aria-required-children?application=playwright

<details><summary>Detail</summary>

```json
{"id": "aria-required-children", "impact": "critical", "description": "Ensure elements with an ARIA role that require child roles contain them", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/aria-required-children?application=playwright"}
```

</details>

**Root cause:** Partners `SetupSteps.tsx` / `FeatureTour.tsx` use `role="tablist"` with `<ol><li>` wrapping `role="tab"` buttons. ARIA tabs must be direct children of tablist; listitem+tab composition fails axe.

**Recommended fix:** Use a `div` tablist with tab buttons as direct children + linked tabpanels (`aria-controls` / `id`), or drop tab roles and use plain buttons.

**Regression:** `cd qa && npx playwright test -g "/partners" --project=chromium` and assert clean `aria-required-children` / layout probes at the failing width.

### DEF-002 — axe `aria-required-parent` — Ensure elements with an ARIA role that require parent roles are contained by them

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **critical** |
| Host / route | `https://www.venohq.com/partners` (Partners) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375, 1280 |
| Matching rows | 4 |
| Source | `apps/website/src/app/partners/page.tsx`, `apps/website/src/components/partners/SetupSteps.tsx`, `apps/website/src/components/partners/FeatureTour.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-www-venohq-com-partners-fold.png`, `screenshots/chromium-portrait-w375-www-venohq-com-partners-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/partners` in chromium.
2. Set width to **375px** (also: 375, 1280).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=critical; nodes=4; https://dequeuniversity.com/rules/axe/4.14/aria-required-parent?application=playwright

<details><summary>Detail</summary>

```json
{"id": "aria-required-parent", "impact": "critical", "description": "Ensure elements with an ARIA role that require parent roles are contained by them", "nodes": 4, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/aria-required-parent?application=playwright"}
```

</details>

**Root cause:** Partners `SetupSteps.tsx` / `FeatureTour.tsx` use `role="tablist"` with `<ol><li>` wrapping `role="tab"` buttons. ARIA tabs must be direct children of tablist; listitem+tab composition fails axe.

**Recommended fix:** Use a `div` tablist with tab buttons as direct children + linked tabpanels (`aria-controls` / `id`), or drop tab roles and use plain buttons.

**Regression:** `cd qa && npx playwright test -g "/partners" --project=chromium` and assert clean `aria-required-parent` / layout probes at the failing width.

### DEF-003 — axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **high** |
| Host / route | `https://www.venohq.com/` (Sticky header + mobile menu) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375, 390, 1280 |
| Matching rows | 6 |
| Source | `apps/website/src/app/page.tsx`, `apps/website/src/components/Navbar.tsx`, `apps/website/src/components/home/SearchHero.tsx`, `apps/website/src/components/home/Sections.tsx` |
| Screenshots | `screenshots/chromium-sticky-header-scrolled-390-fold.png`, `screenshots/chromium-sticky-header-scrolled-390-full.png`, `screenshots/chromium-mobile-menu-390-fold.png`, `screenshots/chromium-mobile-menu-390-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/` in chromium.
2. Set width to **375px** (also: 375, 390, 1280).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=serious; nodes=10; https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright

<details><summary>Detail</summary>

```json
{"id": "color-contrast", "impact": "serious", "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds", "nodes": 10, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright"}
```

</details>

**Root cause:** Text/icon colours fail WCAG contrast (muted slate/gray on white or washed fills).

**Recommended fix:** Raise contrast to ≥4.5:1 for normal text / ≥3:1 for large text; re-run axe.

**Regression:** `cd qa && npx playwright test -g "/" --project=chromium` and assert clean `color-contrast` / layout probes at the failing width.

### DEF-004 — axe `scrollable-region-focusable` — Ensure elements that have scrollable content are accessible by keyboard in Safari

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **high** |
| Host / route | `https://www.venohq.com/` (Sticky header + mobile menu) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375, 390, 1280 |
| Matching rows | 6 |
| Source | `apps/website/src/app/page.tsx`, `apps/website/src/components/Navbar.tsx`, `apps/website/src/components/home/SearchHero.tsx`, `apps/website/src/components/home/Sections.tsx` |
| Screenshots | `screenshots/chromium-sticky-header-scrolled-390-fold.png`, `screenshots/chromium-sticky-header-scrolled-390-full.png`, `screenshots/chromium-mobile-menu-390-fold.png`, `screenshots/chromium-mobile-menu-390-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/` in chromium.
2. Set width to **375px** (also: 375, 390, 1280).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=serious; nodes=1; https://dequeuniversity.com/rules/axe/4.14/scrollable-region-focusable?application=playwright

<details><summary>Detail</summary>

```json
{"id": "scrollable-region-focusable", "impact": "serious", "description": "Ensure elements that have scrollable content are accessible by keyboard in Safari", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/scrollable-region-focusable?application=playwright"}
```

</details>

**Root cause:** A scrollable region is not keyboard-focusable.

**Recommended fix:** Add `tabindex="0"` and an accessible name, or remove scrollable overflow.

**Regression:** `cd qa && npx playwright test -g "/" --project=chromium` and assert clean `scrollable-region-focusable` / layout probes at the failing width.

### DEF-005 — axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **high** |
| Host / route | `https://vendor-web-production-a59cdbc0.up.railway.app/accept-invite` (Vendor accept invite) |
| Browsers | chromium |
| Viewports (px) | 375 |
| Matching rows | 1 |
| Source | `apps/vendor-web/src/app/accept-invite/page.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-vendor-web-production-a59cdbc0-up-railway-app-accept-invite-fold.png`, `screenshots/chromium-portrait-w375-vendor-web-production-a59cdbc0-up-railway-app-accept-invite-full.png` |

**Reproduction**
1. Open `https://vendor-web-production-a59cdbc0.up.railway.app/accept-invite` in chromium.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=serious; nodes=1; https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright

<details><summary>Detail</summary>

```json
{"id": "color-contrast", "impact": "serious", "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright"}
```

</details>

**Root cause:** Text/icon colours fail WCAG contrast (muted slate/gray on white or washed fills).

**Recommended fix:** Raise contrast to ≥4.5:1 for normal text / ≥3:1 for large text; re-run axe.

**Regression:** `cd qa && npx playwright test -g "/accept-invite" --project=chromium` and assert clean `color-contrast` / layout probes at the failing width.

### DEF-006 — axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **high** |
| Host / route | `https://www.venohq.com/app` (Customer home) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375 |
| Matching rows | 3 |
| Source | `apps/website/src/app/app/page.tsx`, `apps/website/src/components/product/DiscoverHome.tsx`, `apps/website/src/components/product/ProductShell.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-www-venohq-com-app-fold.png`, `screenshots/chromium-portrait-w375-www-venohq-com-app-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app` in chromium.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=serious; nodes=3; https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright

<details><summary>Detail</summary>

```json
{"id": "color-contrast", "impact": "serious", "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds", "nodes": 3, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright"}
```

</details>

**Root cause:** Text/icon colours fail WCAG contrast (muted slate/gray on white or washed fills).

**Recommended fix:** Raise contrast to ≥4.5:1 for normal text / ≥3:1 for large text; re-run axe.

**Regression:** `cd qa && npx playwright test -g "/app" --project=chromium` and assert clean `color-contrast` / layout probes at the failing width.

### DEF-007 — axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **high** |
| Host / route | `https://www.venohq.com/app/bookings` (Bookings (auth gate)) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375 |
| Matching rows | 3 |
| Source | `apps/website/src/app/app/bookings/`, `apps/website/src/components/product/ProductShell.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-www-venohq-com-app-bookings-fold.png`, `screenshots/chromium-portrait-w375-www-venohq-com-app-bookings-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app/bookings` in chromium.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=serious; nodes=3; https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright

<details><summary>Detail</summary>

```json
{"id": "color-contrast", "impact": "serious", "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds", "nodes": 3, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright"}
```

</details>

**Root cause:** Text/icon colours fail WCAG contrast (muted slate/gray on white or washed fills).

**Recommended fix:** Raise contrast to ≥4.5:1 for normal text / ≥3:1 for large text; re-run axe.

**Regression:** `cd qa && npx playwright test -g "/app/bookings" --project=chromium` and assert clean `color-contrast` / layout probes at the failing width.

### DEF-008 — axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **high** |
| Host / route | `https://www.venohq.com/app/bookings/return` (Booking return) |
| Browsers | chromium |
| Viewports (px) | 375 |
| Matching rows | 1 |
| Source | `apps/website/src/app/app/bookings/`, `apps/website/src/components/product/ProductShell.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-www-venohq-com-app-bookings-return-fold.png`, `screenshots/chromium-portrait-w375-www-venohq-com-app-bookings-return-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app/bookings/return` in chromium.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=serious; nodes=3; https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright

<details><summary>Detail</summary>

```json
{"id": "color-contrast", "impact": "serious", "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds", "nodes": 3, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright"}
```

</details>

**Root cause:** Text/icon colours fail WCAG contrast (muted slate/gray on white or washed fills).

**Recommended fix:** Raise contrast to ≥4.5:1 for normal text / ≥3:1 for large text; re-run axe.

**Regression:** `cd qa && npx playwright test -g "/app/bookings/return" --project=chromium` and assert clean `color-contrast` / layout probes at the failing width.

### DEF-009 — axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **high** |
| Host / route | `https://www.venohq.com/app/explore` (Explore) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375 |
| Matching rows | 3 |
| Source | `apps/website/src/app/app/explore/page.tsx`, `apps/website/src/components/product/` |
| Screenshots | `screenshots/chromium-portrait-w375-www-venohq-com-app-explore-fold.png`, `screenshots/chromium-portrait-w375-www-venohq-com-app-explore-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app/explore` in chromium.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=serious; nodes=3; https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright

<details><summary>Detail</summary>

```json
{"id": "color-contrast", "impact": "serious", "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds", "nodes": 3, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright"}
```

</details>

**Root cause:** Text/icon colours fail WCAG contrast (muted slate/gray on white or washed fills).

**Recommended fix:** Raise contrast to ≥4.5:1 for normal text / ≥3:1 for large text; re-run axe.

**Regression:** `cd qa && npx playwright test -g "/app/explore" --project=chromium` and assert clean `color-contrast` / layout probes at the failing width.

### DEF-010 — axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **high** |
| Host / route | `https://www.venohq.com/app/profile` (Profile (auth gate)) |
| Browsers | chromium |
| Viewports (px) | 375 |
| Matching rows | 1 |
| Source | `apps/website/src/app/app/profile/page.tsx`, `apps/website/src/components/product/ProductShell.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-www-venohq-com-app-profile-fold.png`, `screenshots/chromium-portrait-w375-www-venohq-com-app-profile-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app/profile` in chromium.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=serious; nodes=3; https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright

<details><summary>Detail</summary>

```json
{"id": "color-contrast", "impact": "serious", "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds", "nodes": 3, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright"}
```

</details>

**Root cause:** Text/icon colours fail WCAG contrast (muted slate/gray on white or washed fills).

**Recommended fix:** Raise contrast to ≥4.5:1 for normal text / ≥3:1 for large text; re-run axe.

**Regression:** `cd qa && npx playwright test -g "/app/profile" --project=chromium` and assert clean `color-contrast` / layout probes at the failing width.

### DEF-011 — 4 overlapping interactive pairs detected

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **high** |
| Host / route | `https://www.venohq.com/app/sign-in` (Customer sign-in) |
| Browsers | chromium |
| Viewports (px) | 568, 667, 926 |
| Matching rows | 3 |
| Source | `apps/website/src/app/app/sign-in/page.tsx`, `apps/website/src/components/product/AuthForm.tsx` |
| Screenshots | `screenshots/chromium-landscape-w568-www-venohq-com-app-sign-in-fold.png`, `screenshots/chromium-landscape-w568-www-venohq-com-app-sign-in-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app/sign-in` in chromium.
2. Set width to **568px** (also: 568, 667, 926).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 4 overlapping interactive pairs detected

<details><summary>Detail</summary>

```json
{"samples": ["INPUT: \u2229 A:Home", "INPUT: \u2229 A:Explore", "INPUT: \u2229 A:Bookings", "INPUT: \u2229 A:Profile"]}
```

</details>

**Root cause:** Interactive hitboxes overlap (tight headers/forms at narrow widths).

**Recommended fix:** Increase gap, allow wrap, or collapse secondary actions into a menu under ~400px.

**Regression:** `cd qa && npx playwright test -g "/app/sign-in" --project=chromium` and assert clean `overlapping` / layout probes at the failing width.

### DEF-012 — axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **high** |
| Host / route | `https://www.venohq.com/app/sign-in` (Sign-in focus order) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 360, 375 |
| Matching rows | 5 |
| Source | `apps/website/src/app/app/sign-in/page.tsx`, `apps/website/src/components/product/AuthForm.tsx` |
| Screenshots | `screenshots/chromium-signin-focus-360-fold.png`, `screenshots/chromium-signin-focus-360-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app/sign-in` in chromium.
2. Set width to **360px** (also: 360, 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=serious; nodes=4; https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright

<details><summary>Detail</summary>

```json
{"id": "color-contrast", "impact": "serious", "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds", "nodes": 4, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright"}
```

</details>

**Root cause:** Text/icon colours fail WCAG contrast (muted slate/gray on white or washed fills).

**Recommended fix:** Raise contrast to ≥4.5:1 for normal text / ≥3:1 for large text; re-run axe.

**Regression:** `cd qa && npx playwright test -g "/app/sign-in" --project=chromium` and assert clean `color-contrast` / layout probes at the failing width.

### DEF-013 — 4 overlapping interactive pairs detected

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **high** |
| Host / route | `https://www.venohq.com/app/sign-up` (Customer sign-up) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 320, 360, 375, 568, 667 |
| Matching rows | 7 |
| Source | `apps/website/src/app/app/sign-up/page.tsx`, `apps/website/src/components/product/AuthForm.tsx` |
| Screenshots | `screenshots/chromium-portrait-w360-www-venohq-com-app-sign-up-fold.png`, `screenshots/chromium-portrait-w360-www-venohq-com-app-sign-up-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app/sign-up` in chromium.
2. Set width to **320px** (also: 320, 360, 375, 568, 667).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 4 overlapping interactive pairs detected

<details><summary>Detail</summary>

```json
{"samples": ["INPUT: \u2229 A:Home", "INPUT: \u2229 A:Explore", "INPUT: \u2229 A:Bookings", "INPUT: \u2229 A:Profile"]}
```

</details>

**Root cause:** Interactive hitboxes overlap (tight headers/forms at narrow widths).

**Recommended fix:** Increase gap, allow wrap, or collapse secondary actions into a menu under ~400px.

**Regression:** `cd qa && npx playwright test -g "/app/sign-up" --project=chromium` and assert clean `overlapping` / layout probes at the failing width.

### DEF-014 — axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **high** |
| Host / route | `https://www.venohq.com/app/sign-up` (Customer sign-up) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375, 1280 |
| Matching rows | 4 |
| Source | `apps/website/src/app/app/sign-up/page.tsx`, `apps/website/src/components/product/AuthForm.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-www-venohq-com-app-sign-up-fold.png`, `screenshots/chromium-portrait-w375-www-venohq-com-app-sign-up-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app/sign-up` in chromium.
2. Set width to **375px** (also: 375, 1280).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=serious; nodes=6; https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright

<details><summary>Detail</summary>

```json
{"id": "color-contrast", "impact": "serious", "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds", "nodes": 6, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright"}
```

</details>

**Root cause:** Text/icon colours fail WCAG contrast (muted slate/gray on white or washed fills).

**Recommended fix:** Raise contrast to ≥4.5:1 for normal text / ≥3:1 for large text; re-run axe.

**Regression:** `cd qa && npx playwright test -g "/app/sign-up" --project=chromium` and assert clean `color-contrast` / layout probes at the failing width.

### DEF-015 — HTTP 404 loading /book/serene-spa

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (functional) |
| Severity | **high** |
| Host / route | `https://www.venohq.com/book/serene-spa` (Booking page Serene Spa) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 320, 360, 375, 390, 412, 430, 440, 568, 667, 768, 844, 915, 926, 1024, 1280, 1440, 1920 |
| Matching rows | 26 |
| Source | `apps/website/src/app/book/[slug]/page.tsx`, `apps/website/src/lib/booking-page.ts`, `apps/website/src/components/home/Sections.tsx` |
| Screenshots | `screenshots/chromium-portrait-w320-www-venohq-com-book-serene-spa-fold.png`, `screenshots/chromium-portrait-w320-www-venohq-com-book-serene-spa-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/book/serene-spa` in chromium.
2. Set width to **320px** (also: 320, 360, 375, 390, 412, 430, 440, 568).
3. Observe status / not-found UI.

**Expected:** HTTP 200 with usable content

**Actual:** HTTP 404; finalUrl=https://www.venohq.com/book/serene-spa

**Root cause:** `/book/[slug]` resolves live vendors via API `GET /vendors/by-slug/:slug`. Marketing demos advertise `venohq.com/book/serene-spa`, but that slug is a sample, not an approved vendor — `notFound()` returns 404.

**Recommended fix:** Stop advertising dead booking URLs: point demos at `/samples/...`, seed a demo vendor, or serve an explicit demo page. Keep `/book/*` for real vendors only.

**Regression:** `cd qa && npx playwright test -g "/book/serene-spa" --project=chromium` and assert clean `http` / layout probes at the failing width.

### DEF-016 — axe `html-has-lang` — Ensure every HTML document has a lang attribute

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **high** |
| Host / route | `https://www.venohq.com/book/serene-spa` (Booking page Serene Spa) |
| Browsers | firefox, webkit |
| Viewports (px) | 375 |
| Matching rows | 2 |
| Source | `apps/website/src/app/book/[slug]/page.tsx`, `apps/website/src/lib/booking-page.ts`, `apps/website/src/components/home/Sections.tsx` |
| Screenshots | `screenshots/firefox-portrait-w375-www-venohq-com-book-serene-spa-fold.png`, `screenshots/firefox-portrait-w375-www-venohq-com-book-serene-spa-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/book/serene-spa` in firefox.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=serious; nodes=1; https://dequeuniversity.com/rules/axe/4.14/html-has-lang?application=playwright

<details><summary>Detail</summary>

```json
{"id": "html-has-lang", "impact": "serious", "description": "Ensure every HTML document has a lang attribute", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/html-has-lang?application=playwright"}
```

</details>

**Root cause:** Inspect listed source files for responsive CSS / a11y attributes.

**Recommended fix:** Fix the failing rule and add a Playwright regression for the route×width.

**Regression:** `cd qa && npx playwright test -g "/book/serene-spa" --project=chromium` and assert clean `html-has-lang` / layout probes at the failing width.

### DEF-017 — axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **high** |
| Host / route | `https://vendor-web-production-a59cdbc0.up.railway.app/forgot-password` (Vendor forgot password) |
| Browsers | chromium |
| Viewports (px) | 375 |
| Matching rows | 1 |
| Source | `apps/vendor-web/src/app/forgot-password/page.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-vendor-web-production-a59cdbc0-up-railway-app-forgot-password-fold.png`, `screenshots/chromium-portrait-w375-vendor-web-production-a59cdbc0-up-railway-app-forgot-password-full.png` |

**Reproduction**
1. Open `https://vendor-web-production-a59cdbc0.up.railway.app/forgot-password` in chromium.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=serious; nodes=1; https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright

<details><summary>Detail</summary>

```json
{"id": "color-contrast", "impact": "serious", "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright"}
```

</details>

**Root cause:** Text/icon colours fail WCAG contrast (muted slate/gray on white or washed fills).

**Recommended fix:** Raise contrast to ≥4.5:1 for normal text / ≥3:1 for large text; re-run axe.

**Regression:** `cd qa && npx playwright test -g "/forgot-password" --project=chromium` and assert clean `color-contrast` / layout probes at the failing width.

### DEF-018 — axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **high** |
| Host / route | `https://admin.venohq.com/forgot-password` (Admin forgot password) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375 |
| Matching rows | 3 |
| Source | `apps/admin-web/src/app/forgot-password/page.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-admin-venohq-com-forgot-password-fold.png`, `screenshots/chromium-portrait-w375-admin-venohq-com-forgot-password-full.png` |

**Reproduction**
1. Open `https://admin.venohq.com/forgot-password` in chromium.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=serious; nodes=1; https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright

<details><summary>Detail</summary>

```json
{"id": "color-contrast", "impact": "serious", "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright"}
```

</details>

**Root cause:** Text/icon colours fail WCAG contrast (muted slate/gray on white or washed fills).

**Recommended fix:** Raise contrast to ≥4.5:1 for normal text / ≥3:1 for large text; re-run axe.

**Regression:** `cd qa && npx playwright test -g "/forgot-password" --project=chromium` and assert clean `color-contrast` / layout probes at the failing width.

### DEF-019 — axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **high** |
| Host / route | `https://vendor-web-production-a59cdbc0.up.railway.app/login` (Vendor login) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375 |
| Matching rows | 5 |
| Source | `apps/vendor-web/src/app/login/page.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-vendor-web-production-a59cdbc0-up-railway-app-login-fold.png`, `screenshots/chromium-portrait-w375-vendor-web-production-a59cdbc0-up-railway-app-login-full.png` |

**Reproduction**
1. Open `https://vendor-web-production-a59cdbc0.up.railway.app/login` in chromium.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=serious; nodes=2; https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright

<details><summary>Detail</summary>

```json
{"id": "color-contrast", "impact": "serious", "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds", "nodes": 2, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright"}
```

</details>

**Root cause:** Text/icon colours fail WCAG contrast (muted slate/gray on white or washed fills).

**Recommended fix:** Raise contrast to ≥4.5:1 for normal text / ≥3:1 for large text; re-run axe.

**Regression:** `cd qa && npx playwright test -g "/login" --project=chromium` and assert clean `color-contrast` / layout probes at the failing width.

### DEF-020 — axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **high** |
| Host / route | `https://admin.venohq.com/login` (Admin login) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375 |
| Matching rows | 4 |
| Source | `apps/admin-web/src/app/login/page.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-admin-venohq-com-login-fold.png`, `screenshots/chromium-portrait-w375-admin-venohq-com-login-full.png` |

**Reproduction**
1. Open `https://admin.venohq.com/login` in chromium.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=serious; nodes=1; https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright

<details><summary>Detail</summary>

```json
{"id": "color-contrast", "impact": "serious", "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright"}
```

</details>

**Root cause:** Text/icon colours fail WCAG contrast (muted slate/gray on white or washed fills).

**Recommended fix:** Raise contrast to ≥4.5:1 for normal text / ≥3:1 for large text; re-run axe.

**Regression:** `cd qa && npx playwright test -g "/login" --project=chromium` and assert clean `color-contrast` / layout probes at the failing width.

### DEF-021 — axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **high** |
| Host / route | `https://www.venohq.com/partners` (Partners) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375, 1280 |
| Matching rows | 4 |
| Source | `apps/website/src/app/partners/page.tsx`, `apps/website/src/components/partners/SetupSteps.tsx`, `apps/website/src/components/partners/FeatureTour.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-www-venohq-com-partners-fold.png`, `screenshots/chromium-portrait-w375-www-venohq-com-partners-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/partners` in chromium.
2. Set width to **375px** (also: 375, 1280).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=serious; nodes=36; https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright

<details><summary>Detail</summary>

```json
{"id": "color-contrast", "impact": "serious", "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds", "nodes": 36, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright"}
```

</details>

**Root cause:** Text/icon colours fail WCAG contrast (muted slate/gray on white or washed fills).

**Recommended fix:** Raise contrast to ≥4.5:1 for normal text / ≥3:1 for large text; re-run axe.

**Regression:** `cd qa && npx playwright test -g "/partners" --project=chromium` and assert clean `color-contrast` / layout probes at the failing width.

### DEF-022 — axe `listitem` — Ensure <li> elements are used semantically

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **high** |
| Host / route | `https://www.venohq.com/partners` (Partners) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375, 1280 |
| Matching rows | 4 |
| Source | `apps/website/src/app/partners/page.tsx`, `apps/website/src/components/partners/SetupSteps.tsx`, `apps/website/src/components/partners/FeatureTour.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-www-venohq-com-partners-fold.png`, `screenshots/chromium-portrait-w375-www-venohq-com-partners-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/partners` in chromium.
2. Set width to **375px** (also: 375, 1280).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=serious; nodes=4; https://dequeuniversity.com/rules/axe/4.14/listitem?application=playwright

<details><summary>Detail</summary>

```json
{"id": "listitem", "impact": "serious", "description": "Ensure <li> elements are used semantically", "nodes": 4, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/listitem?application=playwright"}
```

</details>

**Root cause:** Partners `SetupSteps.tsx` / `FeatureTour.tsx` use `role="tablist"` with `<ol><li>` wrapping `role="tab"` buttons. ARIA tabs must be direct children of tablist; listitem+tab composition fails axe.

**Recommended fix:** Use a `div` tablist with tab buttons as direct children + linked tabpanels (`aria-controls` / `id`), or drop tab roles and use plain buttons.

**Regression:** `cd qa && npx playwright test -g "/partners" --project=chromium` and assert clean `listitem` / layout probes at the failing width.

### DEF-023 — axe `scrollable-region-focusable` — Ensure elements that have scrollable content are accessible by keyboard in Safari

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **high** |
| Host / route | `https://www.venohq.com/partners` (Partners) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375, 1280 |
| Matching rows | 4 |
| Source | `apps/website/src/app/partners/page.tsx`, `apps/website/src/components/partners/SetupSteps.tsx`, `apps/website/src/components/partners/FeatureTour.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-www-venohq-com-partners-fold.png`, `screenshots/chromium-portrait-w375-www-venohq-com-partners-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/partners` in chromium.
2. Set width to **375px** (also: 375, 1280).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=serious; nodes=2; https://dequeuniversity.com/rules/axe/4.14/scrollable-region-focusable?application=playwright

<details><summary>Detail</summary>

```json
{"id": "scrollable-region-focusable", "impact": "serious", "description": "Ensure elements that have scrollable content are accessible by keyboard in Safari", "nodes": 2, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/scrollable-region-focusable?application=playwright"}
```

</details>

**Root cause:** A scrollable region is not keyboard-focusable.

**Recommended fix:** Add `tabindex="0"` and an accessible name, or remove scrollable overflow.

**Regression:** `cd qa && npx playwright test -g "/partners" --project=chromium` and assert clean `scrollable-region-focusable` / layout probes at the failing width.

### DEF-024 — axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **high** |
| Host / route | `https://vendor-web-production-a59cdbc0.up.railway.app/register` (Vendor register) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375 |
| Matching rows | 3 |
| Source | `apps/vendor-web/src/app/register/page.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-vendor-web-production-a59cdbc0-up-railway-app-register-fold.png`, `screenshots/chromium-portrait-w375-vendor-web-production-a59cdbc0-up-railway-app-register-full.png` |

**Reproduction**
1. Open `https://vendor-web-production-a59cdbc0.up.railway.app/register` in chromium.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=serious; nodes=2; https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright

<details><summary>Detail</summary>

```json
{"id": "color-contrast", "impact": "serious", "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds", "nodes": 2, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright"}
```

</details>

**Root cause:** Text/icon colours fail WCAG contrast (muted slate/gray on white or washed fills).

**Recommended fix:** Raise contrast to ≥4.5:1 for normal text / ≥3:1 for large text; re-run axe.

**Regression:** `cd qa && npx playwright test -g "/register" --project=chromium` and assert clean `color-contrast` / layout probes at the failing width.

### DEF-025 — axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **high** |
| Host / route | `https://vendor-web-production-a59cdbc0.up.railway.app/reset-password` (Vendor reset password) |
| Browsers | chromium |
| Viewports (px) | 375 |
| Matching rows | 1 |
| Source | `apps/vendor-web/src/app/reset-password/page.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-vendor-web-production-a59cdbc0-up-railway-app-reset-password-fold.png`, `screenshots/chromium-portrait-w375-vendor-web-production-a59cdbc0-up-railway-app-reset-password-full.png` |

**Reproduction**
1. Open `https://vendor-web-production-a59cdbc0.up.railway.app/reset-password` in chromium.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=serious; nodes=1; https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright

<details><summary>Detail</summary>

```json
{"id": "color-contrast", "impact": "serious", "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright"}
```

</details>

**Root cause:** Text/icon colours fail WCAG contrast (muted slate/gray on white or washed fills).

**Recommended fix:** Raise contrast to ≥4.5:1 for normal text / ≥3:1 for large text; re-run axe.

**Regression:** `cd qa && npx playwright test -g "/reset-password" --project=chromium` and assert clean `color-contrast` / layout probes at the failing width.

### DEF-026 — axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **high** |
| Host / route | `https://admin.venohq.com/reset-password` (Admin reset password) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375 |
| Matching rows | 3 |
| Source | `apps/admin-web/src/app/reset-password/page.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-admin-venohq-com-reset-password-fold.png`, `screenshots/chromium-portrait-w375-admin-venohq-com-reset-password-full.png` |

**Reproduction**
1. Open `https://admin.venohq.com/reset-password` in chromium.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=serious; nodes=1; https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright

<details><summary>Detail</summary>

```json
{"id": "color-contrast", "impact": "serious", "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright"}
```

</details>

**Root cause:** Text/icon colours fail WCAG contrast (muted slate/gray on white or washed fills).

**Recommended fix:** Raise contrast to ≥4.5:1 for normal text / ≥3:1 for large text; re-run axe.

**Regression:** `cd qa && npx playwright test -g "/reset-password" --project=chromium` and assert clean `color-contrast` / layout probes at the failing width.

### DEF-027 — axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **high** |
| Host / route | `https://www.venohq.com/samples/spa/serene-spa` (Sample listing Serene Spa) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375, 1280 |
| Matching rows | 4 |
| Source | `apps/website/src/app/samples/`, `apps/website/src/lib/samples.ts` |
| Screenshots | `screenshots/chromium-portrait-w375-www-venohq-com-samples-spa-serene-spa-fold.png`, `screenshots/chromium-portrait-w375-www-venohq-com-samples-spa-serene-spa-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/samples/spa/serene-spa` in chromium.
2. Set width to **375px** (also: 375, 1280).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=serious; nodes=2; https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright

<details><summary>Detail</summary>

```json
{"id": "color-contrast", "impact": "serious", "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds", "nodes": 2, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright"}
```

</details>

**Root cause:** Text/icon colours fail WCAG contrast (muted slate/gray on white or washed fills).

**Recommended fix:** Raise contrast to ≥4.5:1 for normal text / ≥3:1 for large text; re-run axe.

**Regression:** `cd qa && npx playwright test -g "/samples/spa/serene-spa" --project=chromium` and assert clean `color-contrast` / layout probes at the failing width.

### DEF-028 — 10+ interactive elements below 40×40px

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/` (Home) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 320, 360, 375, 390, 412, 430, 440 |
| Matching rows | 13 |
| Source | `apps/website/src/app/page.tsx`, `apps/website/src/components/Navbar.tsx`, `apps/website/src/components/home/SearchHero.tsx`, `apps/website/src/components/home/Sections.tsx` |
| Screenshots | `screenshots/chromium-sticky-header-scrolled-390-fold.png`, `screenshots/chromium-sticky-header-scrolled-390-full.png`, `screenshots/chromium-mobile-menu-390-fold.png`, `screenshots/chromium-mobile-menu-390-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/` in chromium.
2. Set width to **320px** (also: 320, 360, 375, 390, 412, 430, 440).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 10+ interactive elements below 40×40px

<details><summary>Detail</summary>

```json
{"samples": [{"label": "Veno home", "w": 105, "h": 32}, {"label": "INPUT", "w": 192, "h": 23}, {"label": "INPUT", "w": 192, "h": 23}, {"label": "How it works", "w": 89, "h": 19}, {"label": "Categories", "w": 74, "h": 19}, {"label": "Questions", "w": 69, "h": 19}, {"label": "Get set up", "w": 71, "h": 19}, {"label": "Inside the app", "w": 97, "h": 19}, {"label": "Sign in", "w": 47, "h": 19}, {"label": "Privacy policy", "w": 94, "h": 19}]}
```

</details>

**Root cause:** Interactive controls render below ~40×40px on narrow phones.

**Recommended fix:** Increase hit area (min 44×44 CSS px) via padding or invisible expanded targets.

**Regression:** `cd qa && npx playwright test -g "/" --project=chromium` and assert clean `tiny-tap-target` / layout probes at the failing width.

### DEF-029 — 2 overlapping interactive pairs detected

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/` (Sticky header + mobile menu) |
| Browsers | chromium, webkit |
| Viewports (px) | 390 |
| Matching rows | 2 |
| Source | `apps/website/src/app/page.tsx`, `apps/website/src/components/Navbar.tsx`, `apps/website/src/components/home/SearchHero.tsx`, `apps/website/src/components/home/Sections.tsx` |
| Screenshots | `screenshots/chromium-sticky-header-scrolled-390-fold.png`, `screenshots/chromium-sticky-header-scrolled-390-full.png`, `screenshots/chromium-mobile-menu-390-fold.png`, `screenshots/chromium-mobile-menu-390-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/` in chromium.
2. Set width to **390px** (also: 390).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 2 overlapping interactive pairs detected

<details><summary>Detail</summary>

```json
{"samples": ["A:Veno home \u2229 BUTTON:Search", "BUTTON:Open menu \u2229 BUTTON:Search"]}
```

</details>

**Root cause:** Interactive hitboxes overlap (tight headers/forms at narrow widths).

**Recommended fix:** Increase gap, allow wrap, or collapse secondary actions into a menu under ~400px.

**Regression:** `cd qa && npx playwright test -g "/" --project=chromium` and assert clean `overlapping` / layout probes at the failing width.

### DEF-030 — 6+ elements extend past viewport right edge

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/` (Home) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 320, 360, 375, 390, 412, 430, 440, 568, 667, 768, 844, 915, 926, 1024, 1280, 1440, 1920 |
| Matching rows | 28 |
| Source | `apps/website/src/app/page.tsx`, `apps/website/src/components/Navbar.tsx`, `apps/website/src/components/home/SearchHero.tsx`, `apps/website/src/components/home/Sections.tsx` |
| Screenshots | `screenshots/chromium-sticky-header-scrolled-390-fold.png`, `screenshots/chromium-sticky-header-scrolled-390-full.png`, `screenshots/chromium-mobile-menu-390-fold.png`, `screenshots/chromium-mobile-menu-390-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/` in chromium.
2. Set width to **320px** (also: 320, 360, 375, 390, 412, 430, 440, 568).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 6+ elements extend past viewport right edge

<details><summary>Detail</summary>

```json
{"offenders": [{"tag": "figure", "className": "relative aspect-[3/2] w-[min(78vw,340px)] shrink-0 overflow-hidden rounded-[1.35", "right": 515, "width": 250}, {"tag": "img", "className": "absolute inset-0 h-full w-full object-cover object-[center_35%]", "right": 515, "width": 250}, {"tag": "figcaption", "className": "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-trans", "right": 515, "width": 250}, {"tag": "div", "className": "absolute right-[-8rem] top-24 h-[28rem] w-[28rem] rounded-full bg-[#a5b4fc] opac", "right": 448, "width": 448}, {"tag": "div", "className": "absolute -bottom-16 -right-20 h-80 w-80 rounded-full bg-[#86efac] opacity-35 blu", "right": 400, "width": 320}, {"tag": "div", "className": "pointer-events-none absolute -right-6 -top-6 h-28 w-28 rotate-12 rounded-full bo", "right": 329, "width": 133}]}
```

</details>

**Root cause:** Elements extend past the viewport right edge (fixed widths / missing `min-w-0` / uncontained horizontal media).

**Recommended fix:** Contain overflow, add `min-w-0` on flex children, use responsive widths.

**Regression:** `cd qa && npx playwright test -g "/" --project=chromium` and assert clean `clipped-content` / layout probes at the failing width.

### DEF-031 — axe `heading-order` — Ensure the order of headings is semantically correct

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/` (Sticky header + mobile menu) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375, 390, 1280 |
| Matching rows | 6 |
| Source | `apps/website/src/app/page.tsx`, `apps/website/src/components/Navbar.tsx`, `apps/website/src/components/home/SearchHero.tsx`, `apps/website/src/components/home/Sections.tsx` |
| Screenshots | `screenshots/chromium-sticky-header-scrolled-390-fold.png`, `screenshots/chromium-sticky-header-scrolled-390-full.png`, `screenshots/chromium-mobile-menu-390-fold.png`, `screenshots/chromium-mobile-menu-390-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/` in chromium.
2. Set width to **375px** (also: 375, 390, 1280).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=1; https://dequeuniversity.com/rules/axe/4.14/heading-order?application=playwright

<details><summary>Detail</summary>

```json
{"id": "heading-order", "impact": "moderate", "description": "Ensure the order of headings is semantically correct", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/heading-order?application=playwright"}
```

</details>

**Root cause:** Heading levels skip in the outline.

**Recommended fix:** Restore sequential heading hierarchy (h1→h2→h3).

**Regression:** `cd qa && npx playwright test -g "/" --project=chromium` and assert clean `heading-order` / layout probes at the failing width.

### DEF-032 — 10+ interactive elements below 40×40px

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/#faq` (FAQ accordion keyboard) |
| Browsers | chromium |
| Viewports (px) | 375 |
| Matching rows | 1 |
| Source | `apps/website/src/app/page.tsx` |
| Screenshots | `screenshots/chromium-faq-expand-375-fold.png`, `screenshots/chromium-faq-expand-375-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/#faq` in chromium.
2. Set width to **375px** (also: 375).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 10+ interactive elements below 40×40px

<details><summary>Detail</summary>

```json
{"samples": [{"label": "Veno home", "w": 105, "h": 32}, {"label": "INPUT", "w": 247, "h": 23}, {"label": "INPUT", "w": 247, "h": 23}, {"label": "How it works", "w": 89, "h": 19}, {"label": "Categories", "w": 74, "h": 19}, {"label": "Questions", "w": 69, "h": 19}, {"label": "Veno for partners", "w": 119, "h": 19}, {"label": "Get set up", "w": 71, "h": 19}, {"label": "Inside the app", "w": 97, "h": 19}, {"label": "Sign in", "w": 47, "h": 19}]}
```

</details>

**Root cause:** Interactive controls render below ~40×40px on narrow phones.

**Recommended fix:** Increase hit area (min 44×44 CSS px) via padding or invisible expanded targets.

**Regression:** `cd qa && npx playwright test -g "/#faq" --project=chromium` and assert clean `tiny-tap-target` / layout probes at the failing width.

### DEF-033 — 6+ elements extend past viewport right edge

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/#faq` (FAQ accordion keyboard) |
| Browsers | chromium |
| Viewports (px) | 375 |
| Matching rows | 1 |
| Source | `apps/website/src/app/page.tsx` |
| Screenshots | `screenshots/chromium-faq-expand-375-fold.png`, `screenshots/chromium-faq-expand-375-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/#faq` in chromium.
2. Set width to **375px** (also: 375).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 6+ elements extend past viewport right edge

<details><summary>Detail</summary>

```json
{"offenders": [{"tag": "figure", "className": "relative aspect-[3/2] w-[min(78vw,340px)] shrink-0 overflow-hidden rounded-[1.35", "right": 601, "width": 293}, {"tag": "img", "className": "absolute inset-0 h-full w-full object-cover object-[center_35%]", "right": 601, "width": 293}, {"tag": "figcaption", "className": "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-trans", "right": 601, "width": 293}, {"tag": "div", "className": "absolute right-[-8rem] top-24 h-[28rem] w-[28rem] rounded-full bg-[#a5b4fc] opac", "right": 503, "width": 448}, {"tag": "div", "className": "absolute -bottom-16 -right-20 h-80 w-80 rounded-full bg-[#86efac] opacity-35 blu", "right": 455, "width": 320}, {"tag": "div", "className": "pointer-events-none absolute -right-6 -top-6 h-28 w-28 rotate-12 rounded-full bo", "right": 384, "width": 133}]}
```

</details>

**Root cause:** Elements extend past the viewport right edge (fixed widths / missing `min-w-0` / uncontained horizontal media).

**Recommended fix:** Contain overflow, add `min-w-0` on flex children, use responsive widths.

**Regression:** `cd qa && npx playwright test -g "/#faq" --project=chromium` and assert clean `clipped-content` / layout probes at the failing width.

### DEF-034 — 2+ interactive elements below 40×40px

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **medium** |
| Host / route | `https://admin.venohq.com/accept-invite` (Admin accept invite) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375, 390 |
| Matching rows | 4 |
| Source | `(unmapped — inspect apps/*/src/app)` |
| Screenshots | `screenshots/chromium-portrait-w390-admin-venohq-com-accept-invite-fold.png`, `screenshots/chromium-portrait-w390-admin-venohq-com-accept-invite-full.png` |

**Reproduction**
1. Open `https://admin.venohq.com/accept-invite` in chromium.
2. Set width to **375px** (also: 375, 390).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 2+ interactive elements below 40×40px

<details><summary>Detail</summary>

```json
{"samples": [{"label": "INPUT", "w": 318, "h": 38}, {"label": "INPUT", "w": 318, "h": 38}]}
```

</details>

**Root cause:** Interactive controls render below ~40×40px on narrow phones.

**Recommended fix:** Increase hit area (min 44×44 CSS px) via padding or invisible expanded targets.

**Regression:** `cd qa && npx playwright test -g "/accept-invite" --project=chromium` and assert clean `tiny-tap-target` / layout probes at the failing width.

### DEF-035 — axe `landmark-one-main` — Ensure the document has a main landmark

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://vendor-web-production-a59cdbc0.up.railway.app/accept-invite` (Vendor accept invite) |
| Browsers | chromium |
| Viewports (px) | 375 |
| Matching rows | 1 |
| Source | `apps/vendor-web/src/app/accept-invite/page.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-vendor-web-production-a59cdbc0-up-railway-app-accept-invite-fold.png`, `screenshots/chromium-portrait-w375-vendor-web-production-a59cdbc0-up-railway-app-accept-invite-full.png` |

**Reproduction**
1. Open `https://vendor-web-production-a59cdbc0.up.railway.app/accept-invite` in chromium.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=1; https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright

<details><summary>Detail</summary>

```json
{"id": "landmark-one-main", "impact": "moderate", "description": "Ensure the document has a main landmark", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright"}
```

</details>

**Root cause:** Missing/extra landmarks — often no single `<main>`.

**Recommended fix:** Wrap primary content in one `<main>`; label complementary regions.

**Regression:** `cd qa && npx playwright test -g "/accept-invite" --project=chromium` and assert clean `landmark-one-main` / layout probes at the failing width.

### DEF-036 — axe `landmark-one-main` — Ensure the document has a main landmark

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://admin.venohq.com/accept-invite` (Admin accept invite) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375 |
| Matching rows | 3 |
| Source | `(unmapped — inspect apps/*/src/app)` |
| Screenshots | `screenshots/chromium-portrait-w375-admin-venohq-com-accept-invite-fold.png`, `screenshots/chromium-portrait-w375-admin-venohq-com-accept-invite-full.png` |

**Reproduction**
1. Open `https://admin.venohq.com/accept-invite` in chromium.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=1; https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright

<details><summary>Detail</summary>

```json
{"id": "landmark-one-main", "impact": "moderate", "description": "Ensure the document has a main landmark", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright"}
```

</details>

**Root cause:** Missing/extra landmarks — often no single `<main>`.

**Recommended fix:** Wrap primary content in one `<main>`; label complementary regions.

**Regression:** `cd qa && npx playwright test -g "/accept-invite" --project=chromium` and assert clean `landmark-one-main` / layout probes at the failing width.

### DEF-037 — axe `region` — Ensure all page content is contained by landmarks

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://vendor-web-production-a59cdbc0.up.railway.app/accept-invite` (Vendor accept invite) |
| Browsers | chromium |
| Viewports (px) | 375 |
| Matching rows | 1 |
| Source | `apps/vendor-web/src/app/accept-invite/page.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-vendor-web-production-a59cdbc0-up-railway-app-accept-invite-fold.png`, `screenshots/chromium-portrait-w375-vendor-web-production-a59cdbc0-up-railway-app-accept-invite-full.png` |

**Reproduction**
1. Open `https://vendor-web-production-a59cdbc0.up.railway.app/accept-invite` in chromium.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=1; https://dequeuniversity.com/rules/axe/4.14/region?application=playwright

<details><summary>Detail</summary>

```json
{"id": "region", "impact": "moderate", "description": "Ensure all page content is contained by landmarks", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/region?application=playwright"}
```

</details>

**Root cause:** Missing/extra landmarks — often no single `<main>`.

**Recommended fix:** Wrap primary content in one `<main>`; label complementary regions.

**Regression:** `cd qa && npx playwright test -g "/accept-invite" --project=chromium` and assert clean `region` / layout probes at the failing width.

### DEF-038 — axe `region` — Ensure all page content is contained by landmarks

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://admin.venohq.com/accept-invite` (Admin accept invite) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375 |
| Matching rows | 3 |
| Source | `(unmapped — inspect apps/*/src/app)` |
| Screenshots | `screenshots/chromium-portrait-w375-admin-venohq-com-accept-invite-fold.png`, `screenshots/chromium-portrait-w375-admin-venohq-com-accept-invite-full.png` |

**Reproduction**
1. Open `https://admin.venohq.com/accept-invite` in chromium.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=3; https://dequeuniversity.com/rules/axe/4.14/region?application=playwright

<details><summary>Detail</summary>

```json
{"id": "region", "impact": "moderate", "description": "Ensure all page content is contained by landmarks", "nodes": 3, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/region?application=playwright"}
```

</details>

**Root cause:** Missing/extra landmarks — often no single `<main>`.

**Recommended fix:** Wrap primary content in one `<main>`; label complementary regions.

**Regression:** `cd qa && npx playwright test -g "/accept-invite" --project=chromium` and assert clean `region` / layout probes at the failing width.

### DEF-039 — 2+ interactive elements below 40×40px

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/app` (Customer home) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 320, 360, 375, 390, 412, 430, 440 |
| Matching rows | 12 |
| Source | `apps/website/src/app/app/page.tsx`, `apps/website/src/components/product/DiscoverHome.tsx`, `apps/website/src/components/product/ProductShell.tsx` |
| Screenshots | `screenshots/chromium-portrait-w320-www-venohq-com-app-fold.png`, `screenshots/chromium-portrait-w320-www-venohq-com-app-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app` in chromium.
2. Set width to **320px** (also: 320, 360, 375, 390, 412, 430, 440).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 2+ interactive elements below 40×40px

<details><summary>Detail</summary>

```json
{"samples": [{"label": "A", "w": 92, "h": 28}, {"label": "INPUT", "w": 134, "h": 20}]}
```

</details>

**Root cause:** Interactive controls render below ~40×40px on narrow phones.

**Recommended fix:** Increase hit area (min 44×44 CSS px) via padding or invisible expanded targets.

**Regression:** `cd qa && npx playwright test -g "/app" --project=chromium` and assert clean `tiny-tap-target` / layout probes at the failing width.

### DEF-040 — axe `landmark-one-main` — Ensure the document has a main landmark

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/app` (Customer home) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375, 1280 |
| Matching rows | 4 |
| Source | `apps/website/src/app/app/page.tsx`, `apps/website/src/components/product/DiscoverHome.tsx`, `apps/website/src/components/product/ProductShell.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-www-venohq-com-app-fold.png`, `screenshots/chromium-portrait-w375-www-venohq-com-app-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app` in chromium.
2. Set width to **375px** (also: 375, 1280).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=1; https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright

<details><summary>Detail</summary>

```json
{"id": "landmark-one-main", "impact": "moderate", "description": "Ensure the document has a main landmark", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright"}
```

</details>

**Root cause:** Missing/extra landmarks — often no single `<main>`.

**Recommended fix:** Wrap primary content in one `<main>`; label complementary regions.

**Regression:** `cd qa && npx playwright test -g "/app" --project=chromium` and assert clean `landmark-one-main` / layout probes at the failing width.

### DEF-041 — axe `region` — Ensure all page content is contained by landmarks

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/app` (Customer home) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375, 1280 |
| Matching rows | 4 |
| Source | `apps/website/src/app/app/page.tsx`, `apps/website/src/components/product/DiscoverHome.tsx`, `apps/website/src/components/product/ProductShell.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-www-venohq-com-app-fold.png`, `screenshots/chromium-portrait-w375-www-venohq-com-app-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app` in chromium.
2. Set width to **375px** (also: 375, 1280).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=4; https://dequeuniversity.com/rules/axe/4.14/region?application=playwright

<details><summary>Detail</summary>

```json
{"id": "region", "impact": "moderate", "description": "Ensure all page content is contained by landmarks", "nodes": 4, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/region?application=playwright"}
```

</details>

**Root cause:** Missing/extra landmarks — often no single `<main>`.

**Recommended fix:** Wrap primary content in one `<main>`; label complementary regions.

**Regression:** `cd qa && npx playwright test -g "/app" --project=chromium` and assert clean `region` / layout probes at the failing width.

### DEF-042 — 1 overlapping interactive pairs detected

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/app/bookings` (Bookings (auth gate)) |
| Browsers | chromium |
| Viewports (px) | 568, 667 |
| Matching rows | 2 |
| Source | `apps/website/src/app/app/bookings/`, `apps/website/src/components/product/ProductShell.tsx` |
| Screenshots | `screenshots/chromium-landscape-w568-www-venohq-com-app-bookings-fold.png`, `screenshots/chromium-landscape-w568-www-venohq-com-app-bookings-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app/bookings` in chromium.
2. Set width to **568px** (also: 568, 667).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 1 overlapping interactive pairs detected

<details><summary>Detail</summary>

```json
{"samples": ["A:Sign in \u2229 A:Home"]}
```

</details>

**Root cause:** Interactive hitboxes overlap (tight headers/forms at narrow widths).

**Recommended fix:** Increase gap, allow wrap, or collapse secondary actions into a menu under ~400px.

**Regression:** `cd qa && npx playwright test -g "/app/bookings" --project=chromium` and assert clean `overlapping` / layout probes at the failing width.

### DEF-043 — 1+ interactive elements below 40×40px

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/app/bookings` (Bookings (auth gate)) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 320, 360, 375, 390, 412, 430, 440 |
| Matching rows | 11 |
| Source | `apps/website/src/app/app/bookings/`, `apps/website/src/components/product/ProductShell.tsx` |
| Screenshots | `screenshots/chromium-portrait-w320-www-venohq-com-app-bookings-fold.png`, `screenshots/chromium-portrait-w320-www-venohq-com-app-bookings-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app/bookings` in chromium.
2. Set width to **320px** (also: 320, 360, 375, 390, 412, 430, 440).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 1+ interactive elements below 40×40px

<details><summary>Detail</summary>

```json
{"samples": [{"label": "A", "w": 92, "h": 28}]}
```

</details>

**Root cause:** Interactive controls render below ~40×40px on narrow phones.

**Recommended fix:** Increase hit area (min 44×44 CSS px) via padding or invisible expanded targets.

**Regression:** `cd qa && npx playwright test -g "/app/bookings" --project=chromium` and assert clean `tiny-tap-target` / layout probes at the failing width.

### DEF-044 — axe `landmark-one-main` — Ensure the document has a main landmark

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/app/bookings` (Bookings (auth gate)) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375, 1280 |
| Matching rows | 4 |
| Source | `apps/website/src/app/app/bookings/`, `apps/website/src/components/product/ProductShell.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-www-venohq-com-app-bookings-fold.png`, `screenshots/chromium-portrait-w375-www-venohq-com-app-bookings-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app/bookings` in chromium.
2. Set width to **375px** (also: 375, 1280).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=1; https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright

<details><summary>Detail</summary>

```json
{"id": "landmark-one-main", "impact": "moderate", "description": "Ensure the document has a main landmark", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright"}
```

</details>

**Root cause:** Missing/extra landmarks — often no single `<main>`.

**Recommended fix:** Wrap primary content in one `<main>`; label complementary regions.

**Regression:** `cd qa && npx playwright test -g "/app/bookings" --project=chromium` and assert clean `landmark-one-main` / layout probes at the failing width.

### DEF-045 — axe `region` — Ensure all page content is contained by landmarks

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/app/bookings` (Bookings (auth gate)) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375, 1280 |
| Matching rows | 4 |
| Source | `apps/website/src/app/app/bookings/`, `apps/website/src/components/product/ProductShell.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-www-venohq-com-app-bookings-fold.png`, `screenshots/chromium-portrait-w375-www-venohq-com-app-bookings-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app/bookings` in chromium.
2. Set width to **375px** (also: 375, 1280).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=1; https://dequeuniversity.com/rules/axe/4.14/region?application=playwright

<details><summary>Detail</summary>

```json
{"id": "region", "impact": "moderate", "description": "Ensure all page content is contained by landmarks", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/region?application=playwright"}
```

</details>

**Root cause:** Missing/extra landmarks — often no single `<main>`.

**Recommended fix:** Wrap primary content in one `<main>`; label complementary regions.

**Regression:** `cd qa && npx playwright test -g "/app/bookings" --project=chromium` and assert clean `region` / layout probes at the failing width.

### DEF-046 — 1+ interactive elements below 40×40px

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/app/bookings/return` (Booking return) |
| Browsers | chromium |
| Viewports (px) | 375, 390 |
| Matching rows | 2 |
| Source | `apps/website/src/app/app/bookings/`, `apps/website/src/components/product/ProductShell.tsx` |
| Screenshots | `screenshots/chromium-portrait-w390-www-venohq-com-app-bookings-return-fold.png`, `screenshots/chromium-portrait-w390-www-venohq-com-app-bookings-return-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app/bookings/return` in chromium.
2. Set width to **375px** (also: 375, 390).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 1+ interactive elements below 40×40px

<details><summary>Detail</summary>

```json
{"samples": [{"label": "A", "w": 92, "h": 28}]}
```

</details>

**Root cause:** Interactive controls render below ~40×40px on narrow phones.

**Recommended fix:** Increase hit area (min 44×44 CSS px) via padding or invisible expanded targets.

**Regression:** `cd qa && npx playwright test -g "/app/bookings/return" --project=chromium` and assert clean `tiny-tap-target` / layout probes at the failing width.

### DEF-047 — axe `landmark-one-main` — Ensure the document has a main landmark

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/app/bookings/return` (Booking return) |
| Browsers | chromium |
| Viewports (px) | 375, 1280 |
| Matching rows | 2 |
| Source | `apps/website/src/app/app/bookings/`, `apps/website/src/components/product/ProductShell.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-www-venohq-com-app-bookings-return-fold.png`, `screenshots/chromium-portrait-w375-www-venohq-com-app-bookings-return-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app/bookings/return` in chromium.
2. Set width to **375px** (also: 375, 1280).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=1; https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright

<details><summary>Detail</summary>

```json
{"id": "landmark-one-main", "impact": "moderate", "description": "Ensure the document has a main landmark", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright"}
```

</details>

**Root cause:** Missing/extra landmarks — often no single `<main>`.

**Recommended fix:** Wrap primary content in one `<main>`; label complementary regions.

**Regression:** `cd qa && npx playwright test -g "/app/bookings/return" --project=chromium` and assert clean `landmark-one-main` / layout probes at the failing width.

### DEF-048 — axe `region` — Ensure all page content is contained by landmarks

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/app/bookings/return` (Booking return) |
| Browsers | chromium |
| Viewports (px) | 375, 1280 |
| Matching rows | 2 |
| Source | `apps/website/src/app/app/bookings/`, `apps/website/src/components/product/ProductShell.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-www-venohq-com-app-bookings-return-fold.png`, `screenshots/chromium-portrait-w375-www-venohq-com-app-bookings-return-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app/bookings/return` in chromium.
2. Set width to **375px** (also: 375, 1280).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=1; https://dequeuniversity.com/rules/axe/4.14/region?application=playwright

<details><summary>Detail</summary>

```json
{"id": "region", "impact": "moderate", "description": "Ensure all page content is contained by landmarks", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/region?application=playwright"}
```

</details>

**Root cause:** Missing/extra landmarks — often no single `<main>`.

**Recommended fix:** Wrap primary content in one `<main>`; label complementary regions.

**Regression:** `cd qa && npx playwright test -g "/app/bookings/return" --project=chromium` and assert clean `region` / layout probes at the failing width.

### DEF-049 — 1+ interactive elements below 40×40px

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/app/explore` (Explore) |
| Browsers | chromium, firefox |
| Viewports (px) | 320, 360, 375, 390, 412, 430, 440 |
| Matching rows | 9 |
| Source | `apps/website/src/app/app/explore/page.tsx`, `apps/website/src/components/product/` |
| Screenshots | `screenshots/chromium-portrait-w320-www-venohq-com-app-explore-fold.png`, `screenshots/chromium-portrait-w320-www-venohq-com-app-explore-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app/explore` in chromium.
2. Set width to **320px** (also: 320, 360, 375, 390, 412, 430, 440).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 1+ interactive elements below 40×40px

<details><summary>Detail</summary>

```json
{"samples": [{"label": "A", "w": 92, "h": 28}]}
```

</details>

**Root cause:** Interactive controls render below ~40×40px on narrow phones.

**Recommended fix:** Increase hit area (min 44×44 CSS px) via padding or invisible expanded targets.

**Regression:** `cd qa && npx playwright test -g "/app/explore" --project=chromium` and assert clean `tiny-tap-target` / layout probes at the failing width.

### DEF-050 — 2 overlapping interactive pairs detected

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/app/explore` (Explore) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 320, 360, 390, 412, 430, 568, 667, 768, 844, 915, 926 |
| Matching rows | 15 |
| Source | `apps/website/src/app/app/explore/page.tsx`, `apps/website/src/components/product/` |
| Screenshots | `screenshots/chromium-portrait-w320-www-venohq-com-app-explore-fold.png`, `screenshots/chromium-portrait-w320-www-venohq-com-app-explore-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app/explore` in chromium.
2. Set width to **320px** (also: 320, 360, 390, 412, 430, 568, 667, 768).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 2 overlapping interactive pairs detected

<details><summary>Detail</summary>

```json
{"samples": ["A:Next glow \u2229 A:Home", "A:Next glow \u2229 A:Explore"]}
```

</details>

**Root cause:** Interactive hitboxes overlap (tight headers/forms at narrow widths).

**Recommended fix:** Increase gap, allow wrap, or collapse secondary actions into a menu under ~400px.

**Regression:** `cd qa && npx playwright test -g "/app/explore" --project=chromium` and assert clean `overlapping` / layout probes at the failing width.

### DEF-051 — 7 browser console errors

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (functional) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/app/explore` (Explore) |
| Browsers | webkit |
| Viewports (px) | 375, 390, 768, 1280 |
| Matching rows | 4 |
| Source | `apps/website/src/app/app/explore/page.tsx`, `apps/website/src/components/product/` |
| Screenshots | `screenshots/webkit-portrait-w375-www-venohq-com-app-explore-fold.png`, `screenshots/webkit-portrait-w375-www-venohq-com-app-explore-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app/explore` in webkit.
2. Set width to **375px** (also: 375, 390, 768, 1280).
3. Inspect layout / tap targets / overlaps.

**Expected:** Clean console on happy-path load

**Actual:** The Content Security Policy 'default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https: http://localhost:3000 http://127.0.0.1:3000; frame-src 'self' https:; base-uri 'self'; form-action 'self'' was delivered in report-only mode, but does not specify a 'report-to'; the policy will have no effect. Please either add a 'report-to' directive, or deliver the policy via the 'Content-Security-Policy' header.; Cancelled load to https://backend-production-5f99dcca.up.railway.app/public/listing-media/71985668-3754-4075-b614-bf7855e62d74 because it violates the resource's Cross-Origin-Resource-Policy response header.; Cannot load image https://backend-production-5f99dcca.up.railway.app/public/listing-media/71985668-3754-4075-b614-bf7855e62d74 due to access control checks.

**Root cause:** Repeated browser console errors during page load.

**Recommended fix:** Inspect network/API failures and client exceptions; fix or silence expected noise.

**Regression:** `cd qa && npx playwright test -g "/app/explore" --project=chromium` and assert clean `console` / layout probes at the failing width.

### DEF-052 — axe `landmark-one-main` — Ensure the document has a main landmark

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/app/explore` (Explore) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375, 1280 |
| Matching rows | 4 |
| Source | `apps/website/src/app/app/explore/page.tsx`, `apps/website/src/components/product/` |
| Screenshots | `screenshots/chromium-portrait-w375-www-venohq-com-app-explore-fold.png`, `screenshots/chromium-portrait-w375-www-venohq-com-app-explore-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app/explore` in chromium.
2. Set width to **375px** (also: 375, 1280).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=1; https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright

<details><summary>Detail</summary>

```json
{"id": "landmark-one-main", "impact": "moderate", "description": "Ensure the document has a main landmark", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright"}
```

</details>

**Root cause:** Missing/extra landmarks — often no single `<main>`.

**Recommended fix:** Wrap primary content in one `<main>`; label complementary regions.

**Regression:** `cd qa && npx playwright test -g "/app/explore" --project=chromium` and assert clean `landmark-one-main` / layout probes at the failing width.

### DEF-053 — axe `region` — Ensure all page content is contained by landmarks

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/app/explore` (Explore) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375, 1280 |
| Matching rows | 4 |
| Source | `apps/website/src/app/app/explore/page.tsx`, `apps/website/src/components/product/` |
| Screenshots | `screenshots/chromium-portrait-w375-www-venohq-com-app-explore-fold.png`, `screenshots/chromium-portrait-w375-www-venohq-com-app-explore-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app/explore` in chromium.
2. Set width to **375px** (also: 375, 1280).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=1; https://dequeuniversity.com/rules/axe/4.14/region?application=playwright

<details><summary>Detail</summary>

```json
{"id": "region", "impact": "moderate", "description": "Ensure all page content is contained by landmarks", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/region?application=playwright"}
```

</details>

**Root cause:** Missing/extra landmarks — often no single `<main>`.

**Recommended fix:** Wrap primary content in one `<main>`; label complementary regions.

**Regression:** `cd qa && npx playwright test -g "/app/explore" --project=chromium` and assert clean `region` / layout probes at the failing width.

### DEF-054 — 1+ interactive elements below 40×40px

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/app/profile` (Profile (auth gate)) |
| Browsers | chromium |
| Viewports (px) | 375, 390 |
| Matching rows | 2 |
| Source | `apps/website/src/app/app/profile/page.tsx`, `apps/website/src/components/product/ProductShell.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-www-venohq-com-app-profile-fold.png`, `screenshots/chromium-portrait-w375-www-venohq-com-app-profile-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app/profile` in chromium.
2. Set width to **375px** (also: 375, 390).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 1+ interactive elements below 40×40px

<details><summary>Detail</summary>

```json
{"samples": [{"label": "A", "w": 92, "h": 28}]}
```

</details>

**Root cause:** Interactive controls render below ~40×40px on narrow phones.

**Recommended fix:** Increase hit area (min 44×44 CSS px) via padding or invisible expanded targets.

**Regression:** `cd qa && npx playwright test -g "/app/profile" --project=chromium` and assert clean `tiny-tap-target` / layout probes at the failing width.

### DEF-055 — axe `landmark-one-main` — Ensure the document has a main landmark

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/app/profile` (Profile (auth gate)) |
| Browsers | chromium |
| Viewports (px) | 375, 1280 |
| Matching rows | 2 |
| Source | `apps/website/src/app/app/profile/page.tsx`, `apps/website/src/components/product/ProductShell.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-www-venohq-com-app-profile-fold.png`, `screenshots/chromium-portrait-w375-www-venohq-com-app-profile-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app/profile` in chromium.
2. Set width to **375px** (also: 375, 1280).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=1; https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright

<details><summary>Detail</summary>

```json
{"id": "landmark-one-main", "impact": "moderate", "description": "Ensure the document has a main landmark", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright"}
```

</details>

**Root cause:** Missing/extra landmarks — often no single `<main>`.

**Recommended fix:** Wrap primary content in one `<main>`; label complementary regions.

**Regression:** `cd qa && npx playwright test -g "/app/profile" --project=chromium` and assert clean `landmark-one-main` / layout probes at the failing width.

### DEF-056 — axe `region` — Ensure all page content is contained by landmarks

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/app/profile` (Profile (auth gate)) |
| Browsers | chromium |
| Viewports (px) | 375, 1280 |
| Matching rows | 2 |
| Source | `apps/website/src/app/app/profile/page.tsx`, `apps/website/src/components/product/ProductShell.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-www-venohq-com-app-profile-fold.png`, `screenshots/chromium-portrait-w375-www-venohq-com-app-profile-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app/profile` in chromium.
2. Set width to **375px** (also: 375, 1280).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=1; https://dequeuniversity.com/rules/axe/4.14/region?application=playwright

<details><summary>Detail</summary>

```json
{"id": "region", "impact": "moderate", "description": "Ensure all page content is contained by landmarks", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/region?application=playwright"}
```

</details>

**Root cause:** Missing/extra landmarks — often no single `<main>`.

**Recommended fix:** Wrap primary content in one `<main>`; label complementary regions.

**Regression:** `cd qa && npx playwright test -g "/app/profile" --project=chromium` and assert clean `region` / layout probes at the failing width.

### DEF-057 — 2 overlapping interactive pairs detected

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/app/sign-in` (Customer sign-in) |
| Browsers | chromium |
| Viewports (px) | 844, 915 |
| Matching rows | 2 |
| Source | `apps/website/src/app/app/sign-in/page.tsx`, `apps/website/src/components/product/AuthForm.tsx` |
| Screenshots | `screenshots/chromium-landscape-w844-www-venohq-com-app-sign-in-fold.png`, `screenshots/chromium-landscape-w844-www-venohq-com-app-sign-in-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app/sign-in` in chromium.
2. Set width to **844px** (also: 844, 915).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 2 overlapping interactive pairs detected

<details><summary>Detail</summary>

```json
{"samples": ["INPUT: \u2229 A:Explore", "INPUT: \u2229 A:Bookings"]}
```

</details>

**Root cause:** Interactive hitboxes overlap (tight headers/forms at narrow widths).

**Recommended fix:** Increase gap, allow wrap, or collapse secondary actions into a menu under ~400px.

**Regression:** `cd qa && npx playwright test -g "/app/sign-in" --project=chromium` and assert clean `overlapping` / layout probes at the failing width.

### DEF-058 — 2+ interactive elements below 40×40px

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/app/sign-in` (Sign-in focus order) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 320, 360, 375, 390, 412, 430, 440 |
| Matching rows | 13 |
| Source | `apps/website/src/app/app/sign-in/page.tsx`, `apps/website/src/components/product/AuthForm.tsx` |
| Screenshots | `screenshots/chromium-signin-focus-360-fold.png`, `screenshots/chromium-signin-focus-360-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app/sign-in` in chromium.
2. Set width to **320px** (also: 320, 360, 375, 390, 412, 430, 440).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 2+ interactive elements below 40×40px

<details><summary>Detail</summary>

```json
{"samples": [{"label": "A", "w": 92, "h": 28}, {"label": "Create an account", "w": 123, "h": 18}]}
```

</details>

**Root cause:** Interactive controls render below ~40×40px on narrow phones.

**Recommended fix:** Increase hit area (min 44×44 CSS px) via padding or invisible expanded targets.

**Regression:** `cd qa && npx playwright test -g "/app/sign-in" --project=chromium` and assert clean `tiny-tap-target` / layout probes at the failing width.

### DEF-059 — axe `landmark-one-main` — Ensure the document has a main landmark

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/app/sign-in` (Sign-in focus order) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 360, 375, 1280 |
| Matching rows | 6 |
| Source | `apps/website/src/app/app/sign-in/page.tsx`, `apps/website/src/components/product/AuthForm.tsx` |
| Screenshots | `screenshots/chromium-signin-focus-360-fold.png`, `screenshots/chromium-signin-focus-360-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app/sign-in` in chromium.
2. Set width to **360px** (also: 360, 375, 1280).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=1; https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright

<details><summary>Detail</summary>

```json
{"id": "landmark-one-main", "impact": "moderate", "description": "Ensure the document has a main landmark", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright"}
```

</details>

**Root cause:** Missing/extra landmarks — often no single `<main>`.

**Recommended fix:** Wrap primary content in one `<main>`; label complementary regions.

**Regression:** `cd qa && npx playwright test -g "/app/sign-in" --project=chromium` and assert clean `landmark-one-main` / layout probes at the failing width.

### DEF-060 — axe `region` — Ensure all page content is contained by landmarks

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/app/sign-in` (Sign-in focus order) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 360, 375, 1280 |
| Matching rows | 6 |
| Source | `apps/website/src/app/app/sign-in/page.tsx`, `apps/website/src/components/product/AuthForm.tsx` |
| Screenshots | `screenshots/chromium-signin-focus-360-fold.png`, `screenshots/chromium-signin-focus-360-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app/sign-in` in chromium.
2. Set width to **360px** (also: 360, 375, 1280).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=5; https://dequeuniversity.com/rules/axe/4.14/region?application=playwright

<details><summary>Detail</summary>

```json
{"id": "region", "impact": "moderate", "description": "Ensure all page content is contained by landmarks", "nodes": 5, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/region?application=playwright"}
```

</details>

**Root cause:** Missing/extra landmarks — often no single `<main>`.

**Recommended fix:** Wrap primary content in one `<main>`; label complementary regions.

**Regression:** `cd qa && npx playwright test -g "/app/sign-in" --project=chromium` and assert clean `region` / layout probes at the failing width.

### DEF-061 — 2 overlapping interactive pairs detected

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/app/sign-up` (Customer sign-up) |
| Browsers | chromium |
| Viewports (px) | 844, 915, 926 |
| Matching rows | 3 |
| Source | `apps/website/src/app/app/sign-up/page.tsx`, `apps/website/src/components/product/AuthForm.tsx` |
| Screenshots | `screenshots/chromium-landscape-w844-www-venohq-com-app-sign-up-fold.png`, `screenshots/chromium-landscape-w844-www-venohq-com-app-sign-up-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app/sign-up` in chromium.
2. Set width to **844px** (also: 844, 915, 926).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 2 overlapping interactive pairs detected

<details><summary>Detail</summary>

```json
{"samples": ["INPUT: \u2229 A:Explore", "INPUT: \u2229 A:Bookings"]}
```

</details>

**Root cause:** Interactive hitboxes overlap (tight headers/forms at narrow widths).

**Recommended fix:** Increase gap, allow wrap, or collapse secondary actions into a menu under ~400px.

**Regression:** `cd qa && npx playwright test -g "/app/sign-up" --project=chromium` and assert clean `overlapping` / layout probes at the failing width.

### DEF-062 — 2+ interactive elements below 40×40px

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/app/sign-up` (Customer sign-up) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 320, 360, 375, 390, 412, 430, 440 |
| Matching rows | 11 |
| Source | `apps/website/src/app/app/sign-up/page.tsx`, `apps/website/src/components/product/AuthForm.tsx` |
| Screenshots | `screenshots/chromium-portrait-w360-www-venohq-com-app-sign-up-fold.png`, `screenshots/chromium-portrait-w360-www-venohq-com-app-sign-up-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app/sign-up` in chromium.
2. Set width to **320px** (also: 320, 360, 375, 390, 412, 430, 440).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 2+ interactive elements below 40×40px

<details><summary>Detail</summary>

```json
{"samples": [{"label": "A", "w": 92, "h": 28}, {"label": "Sign in", "w": 46, "h": 18}]}
```

</details>

**Root cause:** Interactive controls render below ~40×40px on narrow phones.

**Recommended fix:** Increase hit area (min 44×44 CSS px) via padding or invisible expanded targets.

**Regression:** `cd qa && npx playwright test -g "/app/sign-up" --project=chromium` and assert clean `tiny-tap-target` / layout probes at the failing width.

### DEF-063 — axe `landmark-one-main` — Ensure the document has a main landmark

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/app/sign-up` (Customer sign-up) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375, 1280 |
| Matching rows | 4 |
| Source | `apps/website/src/app/app/sign-up/page.tsx`, `apps/website/src/components/product/AuthForm.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-www-venohq-com-app-sign-up-fold.png`, `screenshots/chromium-portrait-w375-www-venohq-com-app-sign-up-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app/sign-up` in chromium.
2. Set width to **375px** (also: 375, 1280).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=1; https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright

<details><summary>Detail</summary>

```json
{"id": "landmark-one-main", "impact": "moderate", "description": "Ensure the document has a main landmark", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright"}
```

</details>

**Root cause:** Missing/extra landmarks — often no single `<main>`.

**Recommended fix:** Wrap primary content in one `<main>`; label complementary regions.

**Regression:** `cd qa && npx playwright test -g "/app/sign-up" --project=chromium` and assert clean `landmark-one-main` / layout probes at the failing width.

### DEF-064 — axe `region` — Ensure all page content is contained by landmarks

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/app/sign-up` (Customer sign-up) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375, 1280 |
| Matching rows | 4 |
| Source | `apps/website/src/app/app/sign-up/page.tsx`, `apps/website/src/components/product/AuthForm.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-www-venohq-com-app-sign-up-fold.png`, `screenshots/chromium-portrait-w375-www-venohq-com-app-sign-up-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/app/sign-up` in chromium.
2. Set width to **375px** (also: 375, 1280).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=7; https://dequeuniversity.com/rules/axe/4.14/region?application=playwright

<details><summary>Detail</summary>

```json
{"id": "region", "impact": "moderate", "description": "Ensure all page content is contained by landmarks", "nodes": 7, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/region?application=playwright"}
```

</details>

**Root cause:** Missing/extra landmarks — often no single `<main>`.

**Recommended fix:** Wrap primary content in one `<main>`; label complementary regions.

**Regression:** `cd qa && npx playwright test -g "/app/sign-up" --project=chromium` and assert clean `region` / layout probes at the failing width.

### DEF-065 — axe `landmark-one-main` — Ensure the document has a main landmark

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/book/serene-spa` (Booking page Serene Spa) |
| Browsers | firefox, webkit |
| Viewports (px) | 375 |
| Matching rows | 2 |
| Source | `apps/website/src/app/book/[slug]/page.tsx`, `apps/website/src/lib/booking-page.ts`, `apps/website/src/components/home/Sections.tsx` |
| Screenshots | `screenshots/firefox-portrait-w375-www-venohq-com-book-serene-spa-fold.png`, `screenshots/firefox-portrait-w375-www-venohq-com-book-serene-spa-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/book/serene-spa` in firefox.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=1; https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright

<details><summary>Detail</summary>

```json
{"id": "landmark-one-main", "impact": "moderate", "description": "Ensure the document has a main landmark", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright"}
```

</details>

**Root cause:** Missing/extra landmarks — often no single `<main>`.

**Recommended fix:** Wrap primary content in one `<main>`; label complementary regions.

**Regression:** `cd qa && npx playwright test -g "/book/serene-spa" --project=chromium` and assert clean `landmark-one-main` / layout probes at the failing width.

### DEF-066 — axe `page-has-heading-one` — Ensure that the page, or at least one of its frames contains a level-one heading

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/book/serene-spa` (Booking page Serene Spa) |
| Browsers | firefox, webkit |
| Viewports (px) | 375 |
| Matching rows | 2 |
| Source | `apps/website/src/app/book/[slug]/page.tsx`, `apps/website/src/lib/booking-page.ts`, `apps/website/src/components/home/Sections.tsx` |
| Screenshots | `screenshots/firefox-portrait-w375-www-venohq-com-book-serene-spa-fold.png`, `screenshots/firefox-portrait-w375-www-venohq-com-book-serene-spa-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/book/serene-spa` in firefox.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=1; https://dequeuniversity.com/rules/axe/4.14/page-has-heading-one?application=playwright

<details><summary>Detail</summary>

```json
{"id": "page-has-heading-one", "impact": "moderate", "description": "Ensure that the page, or at least one of its frames contains a level-one heading", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/page-has-heading-one?application=playwright"}
```

</details>

**Root cause:** Inspect listed source files for responsive CSS / a11y attributes.

**Recommended fix:** Fix the failing rule and add a Playwright regression for the route×width.

**Regression:** `cd qa && npx playwright test -g "/book/serene-spa" --project=chromium` and assert clean `page-has-heading-one` / layout probes at the failing width.

### DEF-067 — 10+ interactive elements below 40×40px

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/cookies` (Cookies) |
| Browsers | chromium |
| Viewports (px) | 375, 390 |
| Matching rows | 2 |
| Source | `apps/website/src/app/`, `apps/website/src/components/site/LegalPage.tsx` |
| Screenshots | `screenshots/chromium-portrait-w390-www-venohq-com-cookies-fold.png`, `screenshots/chromium-portrait-w390-www-venohq-com-cookies-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/cookies` in chromium.
2. Set width to **375px** (also: 375, 390).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 10+ interactive elements below 40×40px

<details><summary>Detail</summary>

```json
{"samples": [{"label": "Veno home", "w": 105, "h": 32}, {"label": "Veno", "w": 34, "h": 18}, {"label": "How it works", "w": 89, "h": 19}, {"label": "Categories", "w": 74, "h": 19}, {"label": "Questions", "w": 69, "h": 19}, {"label": "Veno for partners", "w": 119, "h": 19}, {"label": "Get set up", "w": 71, "h": 19}, {"label": "Inside the app", "w": 97, "h": 19}, {"label": "Sign in", "w": 47, "h": 19}, {"label": "Privacy policy", "w": 94, "h": 19}]}
```

</details>

**Root cause:** Interactive controls render below ~40×40px on narrow phones.

**Recommended fix:** Increase hit area (min 44×44 CSS px) via padding or invisible expanded targets.

**Regression:** `cd qa && npx playwright test -g "/cookies" --project=chromium` and assert clean `tiny-tap-target` / layout probes at the failing width.

### DEF-068 — axe `heading-order` — Ensure the order of headings is semantically correct

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/cookies` (Cookies) |
| Browsers | chromium |
| Viewports (px) | 375, 1280 |
| Matching rows | 2 |
| Source | `apps/website/src/app/`, `apps/website/src/components/site/LegalPage.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-www-venohq-com-cookies-fold.png`, `screenshots/chromium-portrait-w375-www-venohq-com-cookies-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/cookies` in chromium.
2. Set width to **375px** (also: 375, 1280).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=1; https://dequeuniversity.com/rules/axe/4.14/heading-order?application=playwright

<details><summary>Detail</summary>

```json
{"id": "heading-order", "impact": "moderate", "description": "Ensure the order of headings is semantically correct", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/heading-order?application=playwright"}
```

</details>

**Root cause:** Heading levels skip in the outline.

**Recommended fix:** Restore sequential heading hierarchy (h1→h2→h3).

**Regression:** `cd qa && npx playwright test -g "/cookies" --project=chromium` and assert clean `heading-order` / layout probes at the failing width.

### DEF-069 — 1+ interactive elements below 40×40px

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **medium** |
| Host / route | `https://vendor-web-production-a59cdbc0.up.railway.app/forgot-password` (Vendor forgot password) |
| Browsers | chromium |
| Viewports (px) | 375, 390 |
| Matching rows | 2 |
| Source | `apps/vendor-web/src/app/forgot-password/page.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-vendor-web-production-a59cdbc0-up-railway-app-forgot-password-fold.png`, `screenshots/chromium-portrait-w375-vendor-web-production-a59cdbc0-up-railway-app-forgot-password-full.png` |

**Reproduction**
1. Open `https://vendor-web-production-a59cdbc0.up.railway.app/forgot-password` in chromium.
2. Set width to **375px** (also: 375, 390).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 1+ interactive elements below 40×40px

<details><summary>Detail</summary>

```json
{"samples": [{"label": "Back to sign in", "w": 95, "h": 18}]}
```

</details>

**Root cause:** Interactive controls render below ~40×40px on narrow phones.

**Recommended fix:** Increase hit area (min 44×44 CSS px) via padding or invisible expanded targets.

**Regression:** `cd qa && npx playwright test -g "/forgot-password" --project=chromium` and assert clean `tiny-tap-target` / layout probes at the failing width.

### DEF-070 — 2+ interactive elements below 40×40px

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/forgot-password` (Forgot password (legacy)) |
| Browsers | chromium |
| Viewports (px) | 375, 390 |
| Matching rows | 2 |
| Source | `apps/website/src/app/`, `apps/website/src/components/site/LegalPage.tsx` |
| Screenshots | `screenshots/chromium-portrait-w390-www-venohq-com-forgot-password-fold.png`, `screenshots/chromium-portrait-w390-www-venohq-com-forgot-password-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/forgot-password` in chromium.
2. Set width to **375px** (also: 375, 390).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 2+ interactive elements below 40×40px

<details><summary>Detail</summary>

```json
{"samples": [{"label": "Veno home", "w": 105, "h": 32}, {"label": "Back to sign in", "w": 99, "h": 18}]}
```

</details>

**Root cause:** Interactive controls render below ~40×40px on narrow phones.

**Recommended fix:** Increase hit area (min 44×44 CSS px) via padding or invisible expanded targets.

**Regression:** `cd qa && npx playwright test -g "/forgot-password" --project=chromium` and assert clean `tiny-tap-target` / layout probes at the failing width.

### DEF-071 — 2+ interactive elements below 40×40px

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **medium** |
| Host / route | `https://admin.venohq.com/forgot-password` (Admin forgot password) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375, 390 |
| Matching rows | 4 |
| Source | `apps/admin-web/src/app/forgot-password/page.tsx` |
| Screenshots | `screenshots/chromium-portrait-w390-admin-venohq-com-forgot-password-fold.png`, `screenshots/chromium-portrait-w390-admin-venohq-com-forgot-password-full.png` |

**Reproduction**
1. Open `https://admin.venohq.com/forgot-password` in chromium.
2. Set width to **375px** (also: 375, 390).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 2+ interactive elements below 40×40px

<details><summary>Detail</summary>

```json
{"samples": [{"label": "INPUT", "w": 318, "h": 38}, {"label": "Back to sign in", "w": 91, "h": 16}]}
```

</details>

**Root cause:** Interactive controls render below ~40×40px on narrow phones.

**Recommended fix:** Increase hit area (min 44×44 CSS px) via padding or invisible expanded targets.

**Regression:** `cd qa && npx playwright test -g "/forgot-password" --project=chromium` and assert clean `tiny-tap-target` / layout probes at the failing width.

### DEF-072 — axe `landmark-one-main` — Ensure the document has a main landmark

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://vendor-web-production-a59cdbc0.up.railway.app/forgot-password` (Vendor forgot password) |
| Browsers | chromium |
| Viewports (px) | 375 |
| Matching rows | 1 |
| Source | `apps/vendor-web/src/app/forgot-password/page.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-vendor-web-production-a59cdbc0-up-railway-app-forgot-password-fold.png`, `screenshots/chromium-portrait-w375-vendor-web-production-a59cdbc0-up-railway-app-forgot-password-full.png` |

**Reproduction**
1. Open `https://vendor-web-production-a59cdbc0.up.railway.app/forgot-password` in chromium.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=1; https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright

<details><summary>Detail</summary>

```json
{"id": "landmark-one-main", "impact": "moderate", "description": "Ensure the document has a main landmark", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright"}
```

</details>

**Root cause:** Missing/extra landmarks — often no single `<main>`.

**Recommended fix:** Wrap primary content in one `<main>`; label complementary regions.

**Regression:** `cd qa && npx playwright test -g "/forgot-password" --project=chromium` and assert clean `landmark-one-main` / layout probes at the failing width.

### DEF-073 — axe `landmark-one-main` — Ensure the document has a main landmark

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://admin.venohq.com/forgot-password` (Admin forgot password) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375 |
| Matching rows | 3 |
| Source | `apps/admin-web/src/app/forgot-password/page.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-admin-venohq-com-forgot-password-fold.png`, `screenshots/chromium-portrait-w375-admin-venohq-com-forgot-password-full.png` |

**Reproduction**
1. Open `https://admin.venohq.com/forgot-password` in chromium.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=1; https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright

<details><summary>Detail</summary>

```json
{"id": "landmark-one-main", "impact": "moderate", "description": "Ensure the document has a main landmark", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright"}
```

</details>

**Root cause:** Missing/extra landmarks — often no single `<main>`.

**Recommended fix:** Wrap primary content in one `<main>`; label complementary regions.

**Regression:** `cd qa && npx playwright test -g "/forgot-password" --project=chromium` and assert clean `landmark-one-main` / layout probes at the failing width.

### DEF-074 — axe `region` — Ensure all page content is contained by landmarks

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://vendor-web-production-a59cdbc0.up.railway.app/forgot-password` (Vendor forgot password) |
| Browsers | chromium |
| Viewports (px) | 375 |
| Matching rows | 1 |
| Source | `apps/vendor-web/src/app/forgot-password/page.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-vendor-web-production-a59cdbc0-up-railway-app-forgot-password-fold.png`, `screenshots/chromium-portrait-w375-vendor-web-production-a59cdbc0-up-railway-app-forgot-password-full.png` |

**Reproduction**
1. Open `https://vendor-web-production-a59cdbc0.up.railway.app/forgot-password` in chromium.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=5; https://dequeuniversity.com/rules/axe/4.14/region?application=playwright

<details><summary>Detail</summary>

```json
{"id": "region", "impact": "moderate", "description": "Ensure all page content is contained by landmarks", "nodes": 5, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/region?application=playwright"}
```

</details>

**Root cause:** Missing/extra landmarks — often no single `<main>`.

**Recommended fix:** Wrap primary content in one `<main>`; label complementary regions.

**Regression:** `cd qa && npx playwright test -g "/forgot-password" --project=chromium` and assert clean `region` / layout probes at the failing width.

### DEF-075 — axe `region` — Ensure all page content is contained by landmarks

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://admin.venohq.com/forgot-password` (Admin forgot password) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375 |
| Matching rows | 3 |
| Source | `apps/admin-web/src/app/forgot-password/page.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-admin-venohq-com-forgot-password-fold.png`, `screenshots/chromium-portrait-w375-admin-venohq-com-forgot-password-full.png` |

**Reproduction**
1. Open `https://admin.venohq.com/forgot-password` in chromium.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=5; https://dequeuniversity.com/rules/axe/4.14/region?application=playwright

<details><summary>Detail</summary>

```json
{"id": "region", "impact": "moderate", "description": "Ensure all page content is contained by landmarks", "nodes": 5, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/region?application=playwright"}
```

</details>

**Root cause:** Missing/extra landmarks — often no single `<main>`.

**Recommended fix:** Wrap primary content in one `<main>`; label complementary regions.

**Regression:** `cd qa && npx playwright test -g "/forgot-password" --project=chromium` and assert clean `region` / layout probes at the failing width.

### DEF-076 — 2+ interactive elements below 40×40px

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **medium** |
| Host / route | `https://vendor-web-production-a59cdbc0.up.railway.app/login` (Vendor login) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 320, 360, 375, 390, 412, 430, 440 |
| Matching rows | 11 |
| Source | `apps/vendor-web/src/app/login/page.tsx` |
| Screenshots | `screenshots/chromium-portrait-w360-vendor-web-production-a59cdbc0-up-railway-app-login-fold.png`, `screenshots/chromium-portrait-w360-vendor-web-production-a59cdbc0-up-railway-app-login-full.png` |

**Reproduction**
1. Open `https://vendor-web-production-a59cdbc0.up.railway.app/login` in chromium.
2. Set width to **320px** (also: 320, 360, 375, 390, 412, 430, 440).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 2+ interactive elements below 40×40px

<details><summary>Detail</summary>

```json
{"samples": [{"label": "Forgot password?", "w": 99, "h": 16}, {"label": "Register your business", "w": 149, "h": 18}]}
```

</details>

**Root cause:** Interactive controls render below ~40×40px on narrow phones.

**Recommended fix:** Increase hit area (min 44×44 CSS px) via padding or invisible expanded targets.

**Regression:** `cd qa && npx playwright test -g "/login" --project=chromium` and assert clean `tiny-tap-target` / layout probes at the failing width.

### DEF-077 — 3+ interactive elements below 40×40px

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **medium** |
| Host / route | `https://admin.venohq.com/login` (Admin login) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375, 390 |
| Matching rows | 5 |
| Source | `apps/admin-web/src/app/login/page.tsx` |
| Screenshots | `screenshots/chromium-portrait-w390-admin-venohq-com-login-fold.png`, `screenshots/chromium-portrait-w390-admin-venohq-com-login-full.png` |

**Reproduction**
1. Open `https://admin.venohq.com/login` in chromium.
2. Set width to **375px** (also: 375, 390).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 3+ interactive elements below 40×40px

<details><summary>Detail</summary>

```json
{"samples": [{"label": "INPUT", "w": 318, "h": 38}, {"label": "INPUT", "w": 318, "h": 38}, {"label": "Forgot password?", "w": 96, "h": 14}]}
```

</details>

**Root cause:** Interactive controls render below ~40×40px on narrow phones.

**Recommended fix:** Increase hit area (min 44×44 CSS px) via padding or invisible expanded targets.

**Regression:** `cd qa && npx playwright test -g "/login" --project=chromium` and assert clean `tiny-tap-target` / layout probes at the failing width.

### DEF-078 — axe `landmark-one-main` — Ensure the document has a main landmark

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://vendor-web-production-a59cdbc0.up.railway.app/login` (Vendor login) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375 |
| Matching rows | 5 |
| Source | `apps/vendor-web/src/app/login/page.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-vendor-web-production-a59cdbc0-up-railway-app-login-fold.png`, `screenshots/chromium-portrait-w375-vendor-web-production-a59cdbc0-up-railway-app-login-full.png` |

**Reproduction**
1. Open `https://vendor-web-production-a59cdbc0.up.railway.app/login` in chromium.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=1; https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright

<details><summary>Detail</summary>

```json
{"id": "landmark-one-main", "impact": "moderate", "description": "Ensure the document has a main landmark", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright"}
```

</details>

**Root cause:** Missing/extra landmarks — often no single `<main>`.

**Recommended fix:** Wrap primary content in one `<main>`; label complementary regions.

**Regression:** `cd qa && npx playwright test -g "/login" --project=chromium` and assert clean `landmark-one-main` / layout probes at the failing width.

### DEF-079 — axe `landmark-one-main` — Ensure the document has a main landmark

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://admin.venohq.com/login` (Admin login) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375 |
| Matching rows | 4 |
| Source | `apps/admin-web/src/app/login/page.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-admin-venohq-com-login-fold.png`, `screenshots/chromium-portrait-w375-admin-venohq-com-login-full.png` |

**Reproduction**
1. Open `https://admin.venohq.com/login` in chromium.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=1; https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright

<details><summary>Detail</summary>

```json
{"id": "landmark-one-main", "impact": "moderate", "description": "Ensure the document has a main landmark", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright"}
```

</details>

**Root cause:** Missing/extra landmarks — often no single `<main>`.

**Recommended fix:** Wrap primary content in one `<main>`; label complementary regions.

**Regression:** `cd qa && npx playwright test -g "/login" --project=chromium` and assert clean `landmark-one-main` / layout probes at the failing width.

### DEF-080 — axe `region` — Ensure all page content is contained by landmarks

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://vendor-web-production-a59cdbc0.up.railway.app/login` (Vendor login) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375 |
| Matching rows | 5 |
| Source | `apps/vendor-web/src/app/login/page.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-vendor-web-production-a59cdbc0-up-railway-app-login-fold.png`, `screenshots/chromium-portrait-w375-vendor-web-production-a59cdbc0-up-railway-app-login-full.png` |

**Reproduction**
1. Open `https://vendor-web-production-a59cdbc0.up.railway.app/login` in chromium.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=6; https://dequeuniversity.com/rules/axe/4.14/region?application=playwright

<details><summary>Detail</summary>

```json
{"id": "region", "impact": "moderate", "description": "Ensure all page content is contained by landmarks", "nodes": 6, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/region?application=playwright"}
```

</details>

**Root cause:** Missing/extra landmarks — often no single `<main>`.

**Recommended fix:** Wrap primary content in one `<main>`; label complementary regions.

**Regression:** `cd qa && npx playwright test -g "/login" --project=chromium` and assert clean `region` / layout probes at the failing width.

### DEF-081 — axe `region` — Ensure all page content is contained by landmarks

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://admin.venohq.com/login` (Admin login) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375 |
| Matching rows | 4 |
| Source | `apps/admin-web/src/app/login/page.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-admin-venohq-com-login-fold.png`, `screenshots/chromium-portrait-w375-admin-venohq-com-login-full.png` |

**Reproduction**
1. Open `https://admin.venohq.com/login` in chromium.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=5; https://dequeuniversity.com/rules/axe/4.14/region?application=playwright

<details><summary>Detail</summary>

```json
{"id": "region", "impact": "moderate", "description": "Ensure all page content is contained by landmarks", "nodes": 5, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/region?application=playwright"}
```

</details>

**Root cause:** Missing/extra landmarks — often no single `<main>`.

**Recommended fix:** Wrap primary content in one `<main>`; label complementary regions.

**Regression:** `cd qa && npx playwright test -g "/login" --project=chromium` and assert clean `region` / layout probes at the failing width.

### DEF-082 — 10+ interactive elements below 40×40px

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/partners` (Partners) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 320, 360, 375, 390, 412, 430, 440 |
| Matching rows | 11 |
| Source | `apps/website/src/app/partners/page.tsx`, `apps/website/src/components/partners/SetupSteps.tsx`, `apps/website/src/components/partners/FeatureTour.tsx` |
| Screenshots | `screenshots/chromium-portrait-w320-www-venohq-com-partners-fold.png`, `screenshots/chromium-portrait-w320-www-venohq-com-partners-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/partners` in chromium.
2. Set width to **320px** (also: 320, 360, 375, 390, 412, 430, 440).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 10+ interactive elements below 40×40px

<details><summary>Detail</summary>

```json
{"samples": [{"label": "Veno home", "w": 105, "h": 32}, {"label": "Learn more", "w": 224, "h": 20}, {"label": "Learn more", "w": 224, "h": 20}, {"label": "Learn more", "w": 224, "h": 20}, {"label": "Learn more", "w": 224, "h": 20}, {"label": "Learn more", "w": 224, "h": 20}, {"label": "Learn more", "w": 224, "h": 20}, {"label": "How it works", "w": 89, "h": 19}, {"label": "Categories", "w": 74, "h": 19}, {"label": "Questions", "w": 69, "h": 19}]}
```

</details>

**Root cause:** Interactive controls render below ~40×40px on narrow phones.

**Recommended fix:** Increase hit area (min 44×44 CSS px) via padding or invisible expanded targets.

**Regression:** `cd qa && npx playwright test -g "/partners" --project=chromium` and assert clean `tiny-tap-target` / layout probes at the failing width.

### DEF-083 — 12+ elements extend past viewport right edge

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/partners` (Partners) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 320, 360, 375, 390, 412, 430, 440, 568, 667, 768, 844, 915, 926, 1024, 1280, 1440, 1920 |
| Matching rows | 26 |
| Source | `apps/website/src/app/partners/page.tsx`, `apps/website/src/components/partners/SetupSteps.tsx`, `apps/website/src/components/partners/FeatureTour.tsx` |
| Screenshots | `screenshots/chromium-portrait-w320-www-venohq-com-partners-fold.png`, `screenshots/chromium-portrait-w320-www-venohq-com-partners-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/partners` in chromium.
2. Set width to **320px** (also: 320, 360, 375, 390, 412, 430, 440, 568).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 12+ elements extend past viewport right edge

<details><summary>Detail</summary>

```json
{"offenders": [{"tag": "div", "className": "grid min-w-[680px] grid-cols-[52px_repeat(4,1fr)]", "right": 697, "width": 680}, {"tag": "div", "className": "border-b border-l border-slate-100 px-2 py-3 text-center", "right": 383, "width": 157}, {"tag": "p", "className": "mt-1.5 text-sm font-semibold text-slate-950", "right": 375, "width": 140}, {"tag": "div", "className": "relative border-l border-slate-100", "right": 383, "width": 157}, {"tag": "div", "className": "absolute inset-x-1.5 overflow-hidden rounded-lg px-2 py-1.5 bg-emerald-50", "right": 377, "width": 144}, {"tag": "p", "className": "truncate text-[11px] font-medium text-slate-500", "right": 369, "width": 128}, {"tag": "p", "className": "truncate text-sm font-semibold text-slate-950", "right": 369, "width": 128}, {"tag": "p", "className": "truncate text-xs text-slate-600", "right": 369, "width": 128}, {"tag": "div", "className":…
```

</details>

**Root cause:** Elements extend past the viewport right edge (fixed widths / missing `min-w-0` / uncontained horizontal media).

**Recommended fix:** Contain overflow, add `min-w-0` on flex children, use responsive widths.

**Regression:** `cd qa && npx playwright test -g "/partners" --project=chromium` and assert clean `clipped-content` / layout probes at the failing width.

### DEF-084 — axe `heading-order` — Ensure the order of headings is semantically correct

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/partners` (Partners) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375, 1280 |
| Matching rows | 4 |
| Source | `apps/website/src/app/partners/page.tsx`, `apps/website/src/components/partners/SetupSteps.tsx`, `apps/website/src/components/partners/FeatureTour.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-www-venohq-com-partners-fold.png`, `screenshots/chromium-portrait-w375-www-venohq-com-partners-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/partners` in chromium.
2. Set width to **375px** (also: 375, 1280).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=1; https://dequeuniversity.com/rules/axe/4.14/heading-order?application=playwright

<details><summary>Detail</summary>

```json
{"id": "heading-order", "impact": "moderate", "description": "Ensure the order of headings is semantically correct", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/heading-order?application=playwright"}
```

</details>

**Root cause:** Heading levels skip in the outline.

**Recommended fix:** Restore sequential heading hierarchy (h1→h2→h3).

**Regression:** `cd qa && npx playwright test -g "/partners" --project=chromium` and assert clean `heading-order` / layout probes at the failing width.

### DEF-085 — 10+ interactive elements below 40×40px

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/privacy` (Privacy) |
| Browsers | chromium |
| Viewports (px) | 375, 390 |
| Matching rows | 2 |
| Source | `apps/website/src/app/`, `apps/website/src/components/site/LegalPage.tsx` |
| Screenshots | `screenshots/chromium-portrait-w390-www-venohq-com-privacy-fold.png`, `screenshots/chromium-portrait-w390-www-venohq-com-privacy-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/privacy` in chromium.
2. Set width to **375px** (also: 375, 390).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 10+ interactive elements below 40×40px

<details><summary>Detail</summary>

```json
{"samples": [{"label": "Veno home", "w": 105, "h": 32}, {"label": "Veno", "w": 34, "h": 18}, {"label": "How it works", "w": 89, "h": 19}, {"label": "Categories", "w": 74, "h": 19}, {"label": "Questions", "w": 69, "h": 19}, {"label": "Veno for partners", "w": 119, "h": 19}, {"label": "Get set up", "w": 71, "h": 19}, {"label": "Inside the app", "w": 97, "h": 19}, {"label": "Sign in", "w": 47, "h": 19}, {"label": "Privacy policy", "w": 94, "h": 19}]}
```

</details>

**Root cause:** Interactive controls render below ~40×40px on narrow phones.

**Recommended fix:** Increase hit area (min 44×44 CSS px) via padding or invisible expanded targets.

**Regression:** `cd qa && npx playwright test -g "/privacy" --project=chromium` and assert clean `tiny-tap-target` / layout probes at the failing width.

### DEF-086 — axe `heading-order` — Ensure the order of headings is semantically correct

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/privacy` (Privacy) |
| Browsers | chromium |
| Viewports (px) | 375, 1280 |
| Matching rows | 2 |
| Source | `apps/website/src/app/`, `apps/website/src/components/site/LegalPage.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-www-venohq-com-privacy-fold.png`, `screenshots/chromium-portrait-w375-www-venohq-com-privacy-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/privacy` in chromium.
2. Set width to **375px** (also: 375, 1280).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=1; https://dequeuniversity.com/rules/axe/4.14/heading-order?application=playwright

<details><summary>Detail</summary>

```json
{"id": "heading-order", "impact": "moderate", "description": "Ensure the order of headings is semantically correct", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/heading-order?application=playwright"}
```

</details>

**Root cause:** Heading levels skip in the outline.

**Recommended fix:** Restore sequential heading hierarchy (h1→h2→h3).

**Regression:** `cd qa && npx playwright test -g "/privacy" --project=chromium` and assert clean `heading-order` / layout probes at the failing width.

### DEF-087 — 1+ interactive elements below 40×40px

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **medium** |
| Host / route | `https://vendor-web-production-a59cdbc0.up.railway.app/register` (Vendor register) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 320, 360, 375, 390, 412, 430, 440 |
| Matching rows | 9 |
| Source | `apps/vendor-web/src/app/register/page.tsx` |
| Screenshots | `screenshots/chromium-portrait-w320-vendor-web-production-a59cdbc0-up-railway-app-register-fold.png`, `screenshots/chromium-portrait-w320-vendor-web-production-a59cdbc0-up-railway-app-register-full.png` |

**Reproduction**
1. Open `https://vendor-web-production-a59cdbc0.up.railway.app/register` in chromium.
2. Set width to **320px** (also: 320, 360, 375, 390, 412, 430, 440).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 1+ interactive elements below 40×40px

<details><summary>Detail</summary>

```json
{"samples": [{"label": "Sign in", "w": 44, "h": 18}]}
```

</details>

**Root cause:** Interactive controls render below ~40×40px on narrow phones.

**Recommended fix:** Increase hit area (min 44×44 CSS px) via padding or invisible expanded targets.

**Regression:** `cd qa && npx playwright test -g "/register" --project=chromium` and assert clean `tiny-tap-target` / layout probes at the failing width.

### DEF-088 — axe `landmark-one-main` — Ensure the document has a main landmark

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://vendor-web-production-a59cdbc0.up.railway.app/register` (Vendor register) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375 |
| Matching rows | 3 |
| Source | `apps/vendor-web/src/app/register/page.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-vendor-web-production-a59cdbc0-up-railway-app-register-fold.png`, `screenshots/chromium-portrait-w375-vendor-web-production-a59cdbc0-up-railway-app-register-full.png` |

**Reproduction**
1. Open `https://vendor-web-production-a59cdbc0.up.railway.app/register` in chromium.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=1; https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright

<details><summary>Detail</summary>

```json
{"id": "landmark-one-main", "impact": "moderate", "description": "Ensure the document has a main landmark", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright"}
```

</details>

**Root cause:** Missing/extra landmarks — often no single `<main>`.

**Recommended fix:** Wrap primary content in one `<main>`; label complementary regions.

**Regression:** `cd qa && npx playwright test -g "/register" --project=chromium` and assert clean `landmark-one-main` / layout probes at the failing width.

### DEF-089 — axe `region` — Ensure all page content is contained by landmarks

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://vendor-web-production-a59cdbc0.up.railway.app/register` (Vendor register) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375 |
| Matching rows | 3 |
| Source | `apps/vendor-web/src/app/register/page.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-vendor-web-production-a59cdbc0-up-railway-app-register-fold.png`, `screenshots/chromium-portrait-w375-vendor-web-production-a59cdbc0-up-railway-app-register-full.png` |

**Reproduction**
1. Open `https://vendor-web-production-a59cdbc0.up.railway.app/register` in chromium.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=5; https://dequeuniversity.com/rules/axe/4.14/region?application=playwright

<details><summary>Detail</summary>

```json
{"id": "region", "impact": "moderate", "description": "Ensure all page content is contained by landmarks", "nodes": 5, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/region?application=playwright"}
```

</details>

**Root cause:** Missing/extra landmarks — often no single `<main>`.

**Recommended fix:** Wrap primary content in one `<main>`; label complementary regions.

**Regression:** `cd qa && npx playwright test -g "/register" --project=chromium` and assert clean `region` / layout probes at the failing width.

### DEF-090 — 1+ interactive elements below 40×40px

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **medium** |
| Host / route | `https://vendor-web-production-a59cdbc0.up.railway.app/reset-password` (Vendor reset password) |
| Browsers | chromium |
| Viewports (px) | 375, 390 |
| Matching rows | 2 |
| Source | `apps/vendor-web/src/app/reset-password/page.tsx` |
| Screenshots | `screenshots/chromium-portrait-w390-vendor-web-production-a59cdbc0-up-railway-app-reset-password-fold.png`, `screenshots/chromium-portrait-w390-vendor-web-production-a59cdbc0-up-railway-app-reset-password-full.png` |

**Reproduction**
1. Open `https://vendor-web-production-a59cdbc0.up.railway.app/reset-password` in chromium.
2. Set width to **375px** (also: 375, 390).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 1+ interactive elements below 40×40px

<details><summary>Detail</summary>

```json
{"samples": [{"label": "Back to sign in", "w": 95, "h": 18}]}
```

</details>

**Root cause:** Interactive controls render below ~40×40px on narrow phones.

**Recommended fix:** Increase hit area (min 44×44 CSS px) via padding or invisible expanded targets.

**Regression:** `cd qa && npx playwright test -g "/reset-password" --project=chromium` and assert clean `tiny-tap-target` / layout probes at the failing width.

### DEF-091 — 5+ interactive elements below 40×40px

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **medium** |
| Host / route | `https://admin.venohq.com/reset-password` (Admin reset password) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375, 390 |
| Matching rows | 4 |
| Source | `apps/admin-web/src/app/reset-password/page.tsx` |
| Screenshots | `screenshots/chromium-portrait-w390-admin-venohq-com-reset-password-fold.png`, `screenshots/chromium-portrait-w390-admin-venohq-com-reset-password-full.png` |

**Reproduction**
1. Open `https://admin.venohq.com/reset-password` in chromium.
2. Set width to **375px** (also: 375, 390).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 5+ interactive elements below 40×40px

<details><summary>Detail</summary>

```json
{"samples": [{"label": "INPUT", "w": 318, "h": 38}, {"label": "INPUT", "w": 318, "h": 38}, {"label": "INPUT", "w": 318, "h": 38}, {"label": "INPUT", "w": 318, "h": 38}, {"label": "Back to sign in", "w": 91, "h": 16}]}
```

</details>

**Root cause:** Interactive controls render below ~40×40px on narrow phones.

**Recommended fix:** Increase hit area (min 44×44 CSS px) via padding or invisible expanded targets.

**Regression:** `cd qa && npx playwright test -g "/reset-password" --project=chromium` and assert clean `tiny-tap-target` / layout probes at the failing width.

### DEF-092 — axe `landmark-one-main` — Ensure the document has a main landmark

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://vendor-web-production-a59cdbc0.up.railway.app/reset-password` (Vendor reset password) |
| Browsers | chromium |
| Viewports (px) | 375 |
| Matching rows | 1 |
| Source | `apps/vendor-web/src/app/reset-password/page.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-vendor-web-production-a59cdbc0-up-railway-app-reset-password-fold.png`, `screenshots/chromium-portrait-w375-vendor-web-production-a59cdbc0-up-railway-app-reset-password-full.png` |

**Reproduction**
1. Open `https://vendor-web-production-a59cdbc0.up.railway.app/reset-password` in chromium.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=1; https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright

<details><summary>Detail</summary>

```json
{"id": "landmark-one-main", "impact": "moderate", "description": "Ensure the document has a main landmark", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright"}
```

</details>

**Root cause:** Missing/extra landmarks — often no single `<main>`.

**Recommended fix:** Wrap primary content in one `<main>`; label complementary regions.

**Regression:** `cd qa && npx playwright test -g "/reset-password" --project=chromium` and assert clean `landmark-one-main` / layout probes at the failing width.

### DEF-093 — axe `landmark-one-main` — Ensure the document has a main landmark

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://admin.venohq.com/reset-password` (Admin reset password) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375 |
| Matching rows | 3 |
| Source | `apps/admin-web/src/app/reset-password/page.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-admin-venohq-com-reset-password-fold.png`, `screenshots/chromium-portrait-w375-admin-venohq-com-reset-password-full.png` |

**Reproduction**
1. Open `https://admin.venohq.com/reset-password` in chromium.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=1; https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright

<details><summary>Detail</summary>

```json
{"id": "landmark-one-main", "impact": "moderate", "description": "Ensure the document has a main landmark", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/landmark-one-main?application=playwright"}
```

</details>

**Root cause:** Missing/extra landmarks — often no single `<main>`.

**Recommended fix:** Wrap primary content in one `<main>`; label complementary regions.

**Regression:** `cd qa && npx playwright test -g "/reset-password" --project=chromium` and assert clean `landmark-one-main` / layout probes at the failing width.

### DEF-094 — axe `region` — Ensure all page content is contained by landmarks

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://vendor-web-production-a59cdbc0.up.railway.app/reset-password` (Vendor reset password) |
| Browsers | chromium |
| Viewports (px) | 375 |
| Matching rows | 1 |
| Source | `apps/vendor-web/src/app/reset-password/page.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-vendor-web-production-a59cdbc0-up-railway-app-reset-password-fold.png`, `screenshots/chromium-portrait-w375-vendor-web-production-a59cdbc0-up-railway-app-reset-password-full.png` |

**Reproduction**
1. Open `https://vendor-web-production-a59cdbc0.up.railway.app/reset-password` in chromium.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=8; https://dequeuniversity.com/rules/axe/4.14/region?application=playwright

<details><summary>Detail</summary>

```json
{"id": "region", "impact": "moderate", "description": "Ensure all page content is contained by landmarks", "nodes": 8, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/region?application=playwright"}
```

</details>

**Root cause:** Missing/extra landmarks — often no single `<main>`.

**Recommended fix:** Wrap primary content in one `<main>`; label complementary regions.

**Regression:** `cd qa && npx playwright test -g "/reset-password" --project=chromium` and assert clean `region` / layout probes at the failing width.

### DEF-095 — axe `region` — Ensure all page content is contained by landmarks

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://admin.venohq.com/reset-password` (Admin reset password) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375 |
| Matching rows | 3 |
| Source | `apps/admin-web/src/app/reset-password/page.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-admin-venohq-com-reset-password-fold.png`, `screenshots/chromium-portrait-w375-admin-venohq-com-reset-password-full.png` |

**Reproduction**
1. Open `https://admin.venohq.com/reset-password` in chromium.
2. Set width to **375px** (also: 375).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=8; https://dequeuniversity.com/rules/axe/4.14/region?application=playwright

<details><summary>Detail</summary>

```json
{"id": "region", "impact": "moderate", "description": "Ensure all page content is contained by landmarks", "nodes": 8, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/region?application=playwright"}
```

</details>

**Root cause:** Missing/extra landmarks — often no single `<main>`.

**Recommended fix:** Wrap primary content in one `<main>`; label complementary regions.

**Regression:** `cd qa && npx playwright test -g "/reset-password" --project=chromium` and assert clean `region` / layout probes at the failing width.

### DEF-096 — 10+ interactive elements below 40×40px

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/samples/spa` (Sample category Spa) |
| Browsers | chromium |
| Viewports (px) | 375, 390 |
| Matching rows | 2 |
| Source | `apps/website/src/app/samples/`, `apps/website/src/lib/samples.ts` |
| Screenshots | `screenshots/chromium-portrait-w390-www-venohq-com-samples-spa-fold.png`, `screenshots/chromium-portrait-w390-www-venohq-com-samples-spa-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/samples/spa` in chromium.
2. Set width to **375px** (also: 375, 390).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 10+ interactive elements below 40×40px

<details><summary>Detail</summary>

```json
{"samples": [{"label": "Veno home", "w": 105, "h": 32}, {"label": "All services", "w": 78, "h": 18}, {"label": "How it works", "w": 89, "h": 19}, {"label": "Categories", "w": 74, "h": 19}, {"label": "Questions", "w": 69, "h": 19}, {"label": "Veno for partners", "w": 119, "h": 19}, {"label": "Get set up", "w": 71, "h": 19}, {"label": "Inside the app", "w": 97, "h": 19}, {"label": "Sign in", "w": 47, "h": 19}, {"label": "Privacy policy", "w": 94, "h": 19}]}
```

</details>

**Root cause:** Interactive controls render below ~40×40px on narrow phones.

**Recommended fix:** Increase hit area (min 44×44 CSS px) via padding or invisible expanded targets.

**Regression:** `cd qa && npx playwright test -g "/samples/spa" --project=chromium` and assert clean `tiny-tap-target` / layout probes at the failing width.

### DEF-097 — axe `heading-order` — Ensure the order of headings is semantically correct

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/samples/spa` (Sample category Spa) |
| Browsers | chromium |
| Viewports (px) | 375, 1280 |
| Matching rows | 2 |
| Source | `apps/website/src/app/samples/`, `apps/website/src/lib/samples.ts` |
| Screenshots | `screenshots/chromium-portrait-w375-www-venohq-com-samples-spa-fold.png`, `screenshots/chromium-portrait-w375-www-venohq-com-samples-spa-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/samples/spa` in chromium.
2. Set width to **375px** (also: 375, 1280).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=1; https://dequeuniversity.com/rules/axe/4.14/heading-order?application=playwright

<details><summary>Detail</summary>

```json
{"id": "heading-order", "impact": "moderate", "description": "Ensure the order of headings is semantically correct", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/heading-order?application=playwright"}
```

</details>

**Root cause:** Heading levels skip in the outline.

**Recommended fix:** Restore sequential heading hierarchy (h1→h2→h3).

**Regression:** `cd qa && npx playwright test -g "/samples/spa" --project=chromium` and assert clean `heading-order` / layout probes at the failing width.

### DEF-098 — 10+ interactive elements below 40×40px

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/samples/spa/serene-spa` (Sample listing Serene Spa) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 320, 360, 375, 390, 412, 430, 440 |
| Matching rows | 11 |
| Source | `apps/website/src/app/samples/`, `apps/website/src/lib/samples.ts` |
| Screenshots | `screenshots/chromium-portrait-w320-www-venohq-com-samples-spa-serene-spa-fold.png`, `screenshots/chromium-portrait-w320-www-venohq-com-samples-spa-serene-spa-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/samples/spa/serene-spa` in chromium.
2. Set width to **320px** (also: 320, 360, 375, 390, 412, 430, 440).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 10+ interactive elements below 40×40px

<details><summary>Detail</summary>

```json
{"samples": [{"label": "Veno home", "w": 105, "h": 32}, {"label": "Spa listings", "w": 79, "h": 18}, {"label": "INPUT", "w": 1, "h": 1}, {"label": "INPUT", "w": 1, "h": 1}, {"label": "INPUT", "w": 1, "h": 1}, {"label": "INPUT", "w": 1, "h": 1}, {"label": "INPUT", "w": 1, "h": 1}, {"label": "How it works", "w": 89, "h": 19}, {"label": "Categories", "w": 74, "h": 19}, {"label": "Questions", "w": 69, "h": 19}]}
```

</details>

**Root cause:** Interactive controls render below ~40×40px on narrow phones.

**Recommended fix:** Increase hit area (min 44×44 CSS px) via padding or invisible expanded targets.

**Regression:** `cd qa && npx playwright test -g "/samples/spa/serene-spa" --project=chromium` and assert clean `tiny-tap-target` / layout probes at the failing width.

### DEF-099 — axe `heading-order` — Ensure the order of headings is semantically correct

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/samples/spa/serene-spa` (Sample listing Serene Spa) |
| Browsers | chromium, firefox, webkit |
| Viewports (px) | 375, 1280 |
| Matching rows | 4 |
| Source | `apps/website/src/app/samples/`, `apps/website/src/lib/samples.ts` |
| Screenshots | `screenshots/chromium-portrait-w375-www-venohq-com-samples-spa-serene-spa-fold.png`, `screenshots/chromium-portrait-w375-www-venohq-com-samples-spa-serene-spa-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/samples/spa/serene-spa` in chromium.
2. Set width to **375px** (also: 375, 1280).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=1; https://dequeuniversity.com/rules/axe/4.14/heading-order?application=playwright

<details><summary>Detail</summary>

```json
{"id": "heading-order", "impact": "moderate", "description": "Ensure the order of headings is semantically correct", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/heading-order?application=playwright"}
```

</details>

**Root cause:** Heading levels skip in the outline.

**Recommended fix:** Restore sequential heading hierarchy (h1→h2→h3).

**Regression:** `cd qa && npx playwright test -g "/samples/spa/serene-spa" --project=chromium` and assert clean `heading-order` / layout probes at the failing width.

### DEF-100 — 10+ interactive elements below 40×40px

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (layout) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/terms` (Terms) |
| Browsers | chromium |
| Viewports (px) | 375, 390 |
| Matching rows | 2 |
| Source | `apps/website/src/app/`, `apps/website/src/components/site/LegalPage.tsx` |
| Screenshots | `screenshots/chromium-portrait-w390-www-venohq-com-terms-fold.png`, `screenshots/chromium-portrait-w390-www-venohq-com-terms-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/terms` in chromium.
2. Set width to **375px** (also: 375, 390).
3. Inspect layout / tap targets / overlaps.

**Expected:** No overflow, clipping, overlap, or sub-40px tap targets on phones

**Actual:** 10+ interactive elements below 40×40px

<details><summary>Detail</summary>

```json
{"samples": [{"label": "Veno home", "w": 105, "h": 32}, {"label": "Veno", "w": 34, "h": 18}, {"label": "How it works", "w": 89, "h": 19}, {"label": "Categories", "w": 74, "h": 19}, {"label": "Questions", "w": 69, "h": 19}, {"label": "Veno for partners", "w": 119, "h": 19}, {"label": "Get set up", "w": 71, "h": 19}, {"label": "Inside the app", "w": 97, "h": 19}, {"label": "Sign in", "w": 47, "h": 19}, {"label": "Privacy policy", "w": 94, "h": 19}]}
```

</details>

**Root cause:** Interactive controls render below ~40×40px on narrow phones.

**Recommended fix:** Increase hit area (min 44×44 CSS px) via padding or invisible expanded targets.

**Regression:** `cd qa && npx playwright test -g "/terms" --project=chromium` and assert clean `tiny-tap-target` / layout probes at the failing width.

### DEF-101 — axe `heading-order` — Ensure the order of headings is semantically correct

| Field | Value |
|---|---|
| Kind | **Confirmed defect** (accessibility) |
| Severity | **medium** |
| Host / route | `https://www.venohq.com/terms` (Terms) |
| Browsers | chromium |
| Viewports (px) | 375, 1280 |
| Matching rows | 2 |
| Source | `apps/website/src/app/`, `apps/website/src/components/site/LegalPage.tsx` |
| Screenshots | `screenshots/chromium-portrait-w375-www-venohq-com-terms-fold.png`, `screenshots/chromium-portrait-w375-www-venohq-com-terms-full.png` |

**Reproduction**
1. Open `https://www.venohq.com/terms` in chromium.
2. Set width to **375px** (also: 375, 1280).
3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.

**Expected:** WCAG 2.1 AA for automated axe rules

**Actual:** impact=moderate; nodes=1; https://dequeuniversity.com/rules/axe/4.14/heading-order?application=playwright

<details><summary>Detail</summary>

```json
{"id": "heading-order", "impact": "moderate", "description": "Ensure the order of headings is semantically correct", "nodes": 1, "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/heading-order?application=playwright"}
```

</details>

**Root cause:** Heading levels skip in the outline.

**Recommended fix:** Restore sequential heading hierarchy (h1→h2→h3).

**Regression:** `cd qa && npx playwright test -g "/terms" --project=chromium` and assert clean `heading-order` / layout probes at the failing width.

## 11. Regression test recommendations

1. `cd qa && npm run test:chromium` on PRs touching website/vendor-web.
2. CI gate: no HTTP ≥400 on critical routes; no axe critical/serious on `/`, `/partners`, `/app`, `/app/sign-in`, vendor `/login`; no horizontal overflow at 375/390.
3. Nightly WebKit 375/390.
4. `RUN_AUTHENTICATED=1` + sandbox secrets when available.
5. Explicit test: marketing booking demo URLs must 200 or must not appear in copy.

## 12. Prioritised remediation backlog

| Priority | ID | Severity | Item | Route | Viewports |
|---|---|---|---|---|---|
| P1 | DEF-001 | critical | axe `aria-required-children` — Ensure elements with an ARIA role that require child roles contain them | `/partners` | 375, 1280 |
| P1 | DEF-002 | critical | axe `aria-required-parent` — Ensure elements with an ARIA role that require parent roles are contained by them | `/partners` | 375, 1280 |
| P2 | DEF-003 | high | axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds | `/` | 375, 390, 1280 |
| P2 | DEF-004 | high | axe `scrollable-region-focusable` — Ensure elements that have scrollable content are accessible by keyboard in Safari | `/` | 375, 390, 1280 |
| P2 | DEF-005 | high | axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds | `/accept-invite` | 375 |
| P2 | DEF-006 | high | axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds | `/app` | 375 |
| P2 | DEF-007 | high | axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds | `/app/bookings` | 375 |
| P2 | DEF-008 | high | axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds | `/app/bookings/return` | 375 |
| P2 | DEF-009 | high | axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds | `/app/explore` | 375 |
| P2 | DEF-010 | high | axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds | `/app/profile` | 375 |
| P2 | DEF-011 | high | 4 overlapping interactive pairs detected | `/app/sign-in` | 568, 667, 926 |
| P2 | DEF-012 | high | axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds | `/app/sign-in` | 360, 375 |
| P2 | DEF-013 | high | 4 overlapping interactive pairs detected | `/app/sign-up` | 320, 360, 375, 568, 667 |
| P2 | DEF-014 | high | axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds | `/app/sign-up` | 375, 1280 |
| P2 | DEF-015 | high | HTTP 404 loading /book/serene-spa | `/book/serene-spa` | 320, 360, 375, 390, 412, 430 |
| P2 | DEF-016 | high | axe `html-has-lang` — Ensure every HTML document has a lang attribute | `/book/serene-spa` | 375 |
| P2 | DEF-017 | high | axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds | `/forgot-password` | 375 |
| P2 | DEF-018 | high | axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds | `/forgot-password` | 375 |
| P2 | DEF-019 | high | axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds | `/login` | 375 |
| P2 | DEF-020 | high | axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds | `/login` | 375 |
| P2 | DEF-021 | high | axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds | `/partners` | 375, 1280 |
| P2 | DEF-022 | high | axe `listitem` — Ensure <li> elements are used semantically | `/partners` | 375, 1280 |
| P2 | DEF-023 | high | axe `scrollable-region-focusable` — Ensure elements that have scrollable content are accessible by keyboard in Safari | `/partners` | 375, 1280 |
| P2 | DEF-024 | high | axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds | `/register` | 375 |
| P2 | DEF-025 | high | axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds | `/reset-password` | 375 |
| P2 | DEF-026 | high | axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds | `/reset-password` | 375 |
| P2 | DEF-027 | high | axe `color-contrast` — Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds | `/samples/spa/serene-spa` | 375, 1280 |
| P3 | DEF-028 | medium | 10+ interactive elements below 40×40px | `/` | 320, 360, 375, 390, 412, 430 |
| P3 | DEF-029 | medium | 2 overlapping interactive pairs detected | `/` | 390 |
| P3 | DEF-030 | medium | 6+ elements extend past viewport right edge | `/` | 320, 360, 375, 390, 412, 430 |
| P3 | DEF-031 | medium | axe `heading-order` — Ensure the order of headings is semantically correct | `/` | 375, 390, 1280 |
| P3 | DEF-032 | medium | 10+ interactive elements below 40×40px | `/#faq` | 375 |
| P3 | DEF-033 | medium | 6+ elements extend past viewport right edge | `/#faq` | 375 |
| P3 | DEF-034 | medium | 2+ interactive elements below 40×40px | `/accept-invite` | 375, 390 |
| P3 | DEF-035 | medium | axe `landmark-one-main` — Ensure the document has a main landmark | `/accept-invite` | 375 |
| P3 | DEF-036 | medium | axe `landmark-one-main` — Ensure the document has a main landmark | `/accept-invite` | 375 |
| P3 | DEF-037 | medium | axe `region` — Ensure all page content is contained by landmarks | `/accept-invite` | 375 |
| P3 | DEF-038 | medium | axe `region` — Ensure all page content is contained by landmarks | `/accept-invite` | 375 |
| P3 | DEF-039 | medium | 2+ interactive elements below 40×40px | `/app` | 320, 360, 375, 390, 412, 430 |
| P3 | DEF-040 | medium | axe `landmark-one-main` — Ensure the document has a main landmark | `/app` | 375, 1280 |
| P3 | DEF-041 | medium | axe `region` — Ensure all page content is contained by landmarks | `/app` | 375, 1280 |
| P3 | DEF-042 | medium | 1 overlapping interactive pairs detected | `/app/bookings` | 568, 667 |
| P3 | DEF-043 | medium | 1+ interactive elements below 40×40px | `/app/bookings` | 320, 360, 375, 390, 412, 430 |
| P3 | DEF-044 | medium | axe `landmark-one-main` — Ensure the document has a main landmark | `/app/bookings` | 375, 1280 |
| P3 | DEF-045 | medium | axe `region` — Ensure all page content is contained by landmarks | `/app/bookings` | 375, 1280 |
| P3 | DEF-046 | medium | 1+ interactive elements below 40×40px | `/app/bookings/return` | 375, 390 |
| P3 | DEF-047 | medium | axe `landmark-one-main` — Ensure the document has a main landmark | `/app/bookings/return` | 375, 1280 |
| P3 | DEF-048 | medium | axe `region` — Ensure all page content is contained by landmarks | `/app/bookings/return` | 375, 1280 |
| P3 | DEF-049 | medium | 1+ interactive elements below 40×40px | `/app/explore` | 320, 360, 375, 390, 412, 430 |
| P3 | DEF-050 | medium | 2 overlapping interactive pairs detected | `/app/explore` | 320, 360, 390, 412, 430, 568 |
| P3 | DEF-051 | medium | 7 browser console errors | `/app/explore` | 375, 390, 768, 1280 |
| P3 | DEF-052 | medium | axe `landmark-one-main` — Ensure the document has a main landmark | `/app/explore` | 375, 1280 |
| P3 | DEF-053 | medium | axe `region` — Ensure all page content is contained by landmarks | `/app/explore` | 375, 1280 |
| P3 | DEF-054 | medium | 1+ interactive elements below 40×40px | `/app/profile` | 375, 390 |
| P3 | DEF-055 | medium | axe `landmark-one-main` — Ensure the document has a main landmark | `/app/profile` | 375, 1280 |
| P3 | DEF-056 | medium | axe `region` — Ensure all page content is contained by landmarks | `/app/profile` | 375, 1280 |
| P3 | DEF-057 | medium | 2 overlapping interactive pairs detected | `/app/sign-in` | 844, 915 |
| P3 | DEF-058 | medium | 2+ interactive elements below 40×40px | `/app/sign-in` | 320, 360, 375, 390, 412, 430 |
| P3 | DEF-059 | medium | axe `landmark-one-main` — Ensure the document has a main landmark | `/app/sign-in` | 360, 375, 1280 |
| P3 | DEF-060 | medium | axe `region` — Ensure all page content is contained by landmarks | `/app/sign-in` | 360, 375, 1280 |
| P3 | DEF-061 | medium | 2 overlapping interactive pairs detected | `/app/sign-up` | 844, 915, 926 |
| P3 | DEF-062 | medium | 2+ interactive elements below 40×40px | `/app/sign-up` | 320, 360, 375, 390, 412, 430 |
| P3 | DEF-063 | medium | axe `landmark-one-main` — Ensure the document has a main landmark | `/app/sign-up` | 375, 1280 |
| P3 | DEF-064 | medium | axe `region` — Ensure all page content is contained by landmarks | `/app/sign-up` | 375, 1280 |
| P3 | DEF-065 | medium | axe `landmark-one-main` — Ensure the document has a main landmark | `/book/serene-spa` | 375 |
| P3 | DEF-066 | medium | axe `page-has-heading-one` — Ensure that the page, or at least one of its frames contains a level-one heading | `/book/serene-spa` | 375 |
| P3 | DEF-067 | medium | 10+ interactive elements below 40×40px | `/cookies` | 375, 390 |
| P3 | DEF-068 | medium | axe `heading-order` — Ensure the order of headings is semantically correct | `/cookies` | 375, 1280 |
| P3 | DEF-069 | medium | 1+ interactive elements below 40×40px | `/forgot-password` | 375, 390 |
| P3 | DEF-070 | medium | 2+ interactive elements below 40×40px | `/forgot-password` | 375, 390 |
| P3 | DEF-071 | medium | 2+ interactive elements below 40×40px | `/forgot-password` | 375, 390 |
| P3 | DEF-072 | medium | axe `landmark-one-main` — Ensure the document has a main landmark | `/forgot-password` | 375 |
| P3 | DEF-073 | medium | axe `landmark-one-main` — Ensure the document has a main landmark | `/forgot-password` | 375 |
| P3 | DEF-074 | medium | axe `region` — Ensure all page content is contained by landmarks | `/forgot-password` | 375 |
| P3 | DEF-075 | medium | axe `region` — Ensure all page content is contained by landmarks | `/forgot-password` | 375 |
| P3 | DEF-076 | medium | 2+ interactive elements below 40×40px | `/login` | 320, 360, 375, 390, 412, 430 |
| P3 | DEF-077 | medium | 3+ interactive elements below 40×40px | `/login` | 375, 390 |
| P3 | DEF-078 | medium | axe `landmark-one-main` — Ensure the document has a main landmark | `/login` | 375 |
| P3 | DEF-079 | medium | axe `landmark-one-main` — Ensure the document has a main landmark | `/login` | 375 |
| P3 | DEF-080 | medium | axe `region` — Ensure all page content is contained by landmarks | `/login` | 375 |
| P3 | DEF-081 | medium | axe `region` — Ensure all page content is contained by landmarks | `/login` | 375 |
| P3 | DEF-082 | medium | 10+ interactive elements below 40×40px | `/partners` | 320, 360, 375, 390, 412, 430 |
| P3 | DEF-083 | medium | 12+ elements extend past viewport right edge | `/partners` | 320, 360, 375, 390, 412, 430 |
| P3 | DEF-084 | medium | axe `heading-order` — Ensure the order of headings is semantically correct | `/partners` | 375, 1280 |
| P3 | DEF-085 | medium | 10+ interactive elements below 40×40px | `/privacy` | 375, 390 |
| P3 | DEF-086 | medium | axe `heading-order` — Ensure the order of headings is semantically correct | `/privacy` | 375, 1280 |
| P3 | DEF-087 | medium | 1+ interactive elements below 40×40px | `/register` | 320, 360, 375, 390, 412, 430 |
| P3 | DEF-088 | medium | axe `landmark-one-main` — Ensure the document has a main landmark | `/register` | 375 |
| P3 | DEF-089 | medium | axe `region` — Ensure all page content is contained by landmarks | `/register` | 375 |
| P3 | DEF-090 | medium | 1+ interactive elements below 40×40px | `/reset-password` | 375, 390 |
| P3 | DEF-091 | medium | 5+ interactive elements below 40×40px | `/reset-password` | 375, 390 |
| P3 | DEF-092 | medium | axe `landmark-one-main` — Ensure the document has a main landmark | `/reset-password` | 375 |
| P3 | DEF-093 | medium | axe `landmark-one-main` — Ensure the document has a main landmark | `/reset-password` | 375 |
| P3 | DEF-094 | medium | axe `region` — Ensure all page content is contained by landmarks | `/reset-password` | 375 |
| P3 | DEF-095 | medium | axe `region` — Ensure all page content is contained by landmarks | `/reset-password` | 375 |
| P3 | DEF-096 | medium | 10+ interactive elements below 40×40px | `/samples/spa` | 375, 390 |
| P3 | DEF-097 | medium | axe `heading-order` — Ensure the order of headings is semantically correct | `/samples/spa` | 375, 1280 |
| P3 | DEF-098 | medium | 10+ interactive elements below 40×40px | `/samples/spa/serene-spa` | 320, 360, 375, 390, 412, 430 |
| P3 | DEF-099 | medium | axe `heading-order` — Ensure the order of headings is semantically correct | `/samples/spa/serene-spa` | 375, 1280 |
| P3 | DEF-100 | medium | 10+ interactive elements below 40×40px | `/terms` | 375, 390 |
| P3 | DEF-101 | medium | axe `heading-order` — Ensure the order of headings is semantically correct | `/terms` | 375, 1280 |

## Blocked tests

- **Vendor authenticated suite** (`https://vendor-web-production-a59cdbc0.up.railway.app/dashboard/*`): Blocked: RUN_AUTHENTICATED!=1 or missing VENDOR_EMAIL/VENDOR_PASSWORD. No sandbox credentials available in repo.
- **Admin authenticated suite** (`https://admin.venohq.com/dashboard/*`): Blocked: RUN_AUTHENTICATED!=1 or missing ADMIN_EMAIL/ADMIN_PASSWORD. No sandbox credentials available in repo.
- **Customer authenticated booking management** (`https://www.venohq.com/app/bookings (authenticated)`): Blocked: missing CUSTOMER_EMAIL/CUSTOMER_PASSWORD. Auth-gated UI reachable but signed-in flows not executed.

- **Live Paystack completion** — sandbox only; no payment test keys provided.
- **Create/cancel real appointments** — policy.
- **Live notifications** — policy.
- **`app.venohq.com` / `api.venohq.com`** — DNS NXDOMAIN.

## Untested scenarios

- Native apps (`apps/mobile`, `apps/vendor-mobile`)
- Full vendor/admin dashboards (credentials)
- Physical notch devices beyond viewport-meta / `env(safe-area-inset-*)` checks
- Meta ads live campaigns

## Usability recommendations

- Default `/app` empty state for “Yaba, Lagos” is correct empty UX; consider defaulting new visitors to all-Lagos until density improves (`DiscoverHome.tsx`).
- Replace marketing `venohq.com/book/serene-spa` with `/samples/spa/serene-spa` until a real vendor exists.
- Communicate Railway vendor hostname until `app.venohq.com` DNS is live.
- Store sandbox QA accounts in a private secrets manager for CI.

## Infrastructure notes

| Host | Result |
|---|---|
| https://www.venohq.com | Live (Vercel) |
| https://venohq.com | Browser OK; non-browser clients may 403 |
| https://vendor-web-production-a59cdbc0.up.railway.app | Live vendor |
| https://admin.venohq.com | Live admin |
| https://app.venohq.com | **DNS NXDOMAIN** |
| https://api.venohq.com | **DNS NXDOMAIN** |

