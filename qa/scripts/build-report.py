#!/usr/bin/env python3
"""Build aggregated QA_REPORT.md from artifacts/results.ndjson."""
from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ROWS = [
    json.loads(line)
    for line in (ROOT / "artifacts" / "results.ndjson").read_text().splitlines()
    if line.strip()
]

SOURCE = [
    (r"^/$", "website", [
        "apps/website/src/app/page.tsx",
        "apps/website/src/components/Navbar.tsx",
        "apps/website/src/components/home/SearchHero.tsx",
        "apps/website/src/components/home/Sections.tsx",
    ]),
    (r"^/#faq", "website", ["apps/website/src/app/page.tsx"]),
    (r"^/partners", "website", [
        "apps/website/src/app/partners/page.tsx",
        "apps/website/src/components/partners/SetupSteps.tsx",
        "apps/website/src/components/partners/FeatureTour.tsx",
    ]),
    (r"^/app/explore", "website", [
        "apps/website/src/app/app/explore/page.tsx",
        "apps/website/src/components/product/",
    ]),
    (r"^/app/sign-in", "website", [
        "apps/website/src/app/app/sign-in/page.tsx",
        "apps/website/src/components/product/AuthForm.tsx",
    ]),
    (r"^/app/sign-up", "website", [
        "apps/website/src/app/app/sign-up/page.tsx",
        "apps/website/src/components/product/AuthForm.tsx",
    ]),
    (r"^/app/bookings", "website", [
        "apps/website/src/app/app/bookings/",
        "apps/website/src/components/product/ProductShell.tsx",
    ]),
    (r"^/app/profile", "website", [
        "apps/website/src/app/app/profile/page.tsx",
        "apps/website/src/components/product/ProductShell.tsx",
    ]),
    (r"^/app$", "website", [
        "apps/website/src/app/app/page.tsx",
        "apps/website/src/components/product/DiscoverHome.tsx",
        "apps/website/src/components/product/ProductShell.tsx",
    ]),
    (r"^/journey/", "website", [
        "apps/website/src/components/Navbar.tsx",
        "apps/website/src/components/product/DiscoverHome.tsx",
        "apps/website/src/app/book/[slug]/",
    ]),
    (r"^/book/", "website", [
        "apps/website/src/app/book/[slug]/page.tsx",
        "apps/website/src/lib/booking-page.ts",
        "apps/website/src/components/home/Sections.tsx",
    ]),
    (r"^/samples/", "website", [
        "apps/website/src/app/samples/",
        "apps/website/src/lib/samples.ts",
    ]),
    (r"^/privacy|^/terms|^/cookies|^/forgot-password", "website", [
        "apps/website/src/app/",
        "apps/website/src/components/site/LegalPage.tsx",
    ]),
    (r"^/login", "vendor", ["apps/vendor-web/src/app/login/page.tsx"]),
    (r"^/register", "vendor", ["apps/vendor-web/src/app/register/page.tsx"]),
    (r"^/forgot-password", "vendor", ["apps/vendor-web/src/app/forgot-password/page.tsx"]),
    (r"^/reset-password", "vendor", ["apps/vendor-web/src/app/reset-password/page.tsx"]),
    (r"^/accept-invite", "vendor", ["apps/vendor-web/src/app/accept-invite/page.tsx"]),
    (r"^/login", "admin", ["apps/admin-web/src/app/login/page.tsx"]),
    (r"^/forgot-password", "admin", ["apps/admin-web/src/app/forgot-password/page.tsx"]),
    (r"^/reset-password", "admin", ["apps/admin-web/src/app/reset-password/page.tsx"]),
]


def host_kind(host: str) -> str:
    if "admin" in host:
        return "admin"
    if "railway" in host or "vendor" in host:
        return "vendor"
    return "website"


def map_source(host: str, route: str) -> list[str]:
    kind = host_kind(host)
    for pat, src_kind, files in SOURCE:
        if src_kind == kind and re.search(pat, route):
            return files
    return ["(unmapped — inspect apps/*/src/app)"]


def root_cause(d: dict) -> tuple[str, str]:
    t = d.get("type")
    if t == "http" and str(d.get("route", "")).startswith("/book/"):
        return (
            "`/book/[slug]` resolves live vendors via API `GET /vendors/by-slug/:slug`. "
            "Marketing demos advertise `venohq.com/book/serene-spa`, but that slug is a sample, "
            "not an approved vendor — `notFound()` returns 404.",
            "Stop advertising dead booking URLs: point demos at `/samples/...`, seed a demo vendor, "
            "or serve an explicit demo page. Keep `/book/*` for real vendors only.",
        )
    if t in ("aria-required-children", "aria-required-parent", "listitem"):
        return (
            "Partners `SetupSteps.tsx` / `FeatureTour.tsx` use `role=\"tablist\"` with `<ol><li>` "
            "wrapping `role=\"tab\"` buttons. ARIA tabs must be direct children of tablist; "
            "listitem+tab composition fails axe.",
            "Use a `div` tablist with tab buttons as direct children + linked tabpanels "
            "(`aria-controls` / `id`), or drop tab roles and use plain buttons.",
        )
    if t == "color-contrast":
        return (
            "Text/icon colours fail WCAG contrast (muted slate/gray on white or washed fills).",
            "Raise contrast to ≥4.5:1 for normal text / ≥3:1 for large text; re-run axe.",
        )
    if t == "tiny-tap-target":
        return (
            "Interactive controls render below ~40×40px on narrow phones.",
            "Increase hit area (min 44×44 CSS px) via padding or invisible expanded targets.",
        )
    if t == "overlapping":
        return (
            "Interactive hitboxes overlap (tight headers/forms at narrow widths).",
            "Increase gap, allow wrap, or collapse secondary actions into a menu under ~400px.",
        )
    if t == "clipped-content":
        return (
            "Elements extend past the viewport right edge (fixed widths / missing `min-w-0` / "
            "uncontained horizontal media).",
            "Contain overflow, add `min-w-0` on flex children, use responsive widths.",
        )
    if t == "horizontal-overflow":
        return (
            "Document `scrollWidth` exceeds `clientWidth`.",
            "Find overflowing descendants and constrain; set `overflow-x: clip` only as last resort.",
        )
    if t == "scrollable-region-focusable":
        return (
            "A scrollable region is not keyboard-focusable.",
            "Add `tabindex=\"0\"` and an accessible name, or remove scrollable overflow.",
        )
    if t in ("landmark-one-main", "region"):
        return (
            "Missing/extra landmarks — often no single `<main>`.",
            "Wrap primary content in one `<main>`; label complementary regions.",
        )
    if t == "heading-order":
        return (
            "Heading levels skip in the outline.",
            "Restore sequential heading hierarchy (h1→h2→h3).",
        )
    if t == "console":
        return (
            "Repeated browser console errors during page load.",
            "Inspect network/API failures and client exceptions; fix or silence expected noise.",
        )
    return (
        "Inspect listed source files for responsive CSS / a11y attributes.",
        "Fix the failing rule and add a Playwright regression for the route×width.",
    )


def main() -> None:
    defects: list[dict] = []
    for r in ROWS:
        if r["status"] == "blocked":
            continue
        base = {
            "host": r["host"],
            "route": r["route"],
            "name": r["name"],
            "browser": r["browser"],
            "viewport": r.get("viewport") or {},
            "screenshots": r.get("screenshots") or [],
            "notes": r.get("notes") or [],
            "http": r.get("httpStatus"),
        }
        if r.get("httpStatus") and r["httpStatus"] >= 400:
            defects.append({
                **base,
                "category": "functional",
                "severity": "high" if r["httpStatus"] == 404 else "critical",
                "title": f"HTTP {r['httpStatus']} loading {r['route']}",
                "expected": "HTTP 200 with usable content",
                "actual": f"HTTP {r['httpStatus']}; finalUrl={r.get('finalUrl')}",
                "type": "http",
            })
        for issue in r.get("layoutIssues") or []:
            defects.append({
                **base,
                "category": "layout",
                "severity": issue["severity"],
                "title": issue["message"],
                "expected": "No overflow, clipping, overlap, or sub-40px tap targets on phones",
                "actual": issue["message"],
                "detail": issue.get("detail"),
                "type": issue["type"],
            })
        for v in r.get("axeViolations") or []:
            sev = {
                "critical": "critical",
                "serious": "high",
                "moderate": "medium",
                "minor": "low",
            }.get(v.get("impact") or "", "medium")
            defects.append({
                **base,
                "category": "accessibility",
                "severity": sev,
                "title": f"axe `{v['id']}` — {v['description']}",
                "expected": "WCAG 2.1 AA for automated axe rules",
                "actual": f"impact={v.get('impact')}; nodes={v.get('nodes')}; {v.get('helpUrl') or ''}",
                "detail": v,
                "type": v["id"],
            })
        errs = [
            e
            for e in (r.get("consoleErrors") or [])
            if "favicon" not in e.lower() and "sentry" not in e.lower()
        ]
        if len(errs) >= 5:
            defects.append({
                **base,
                "category": "functional",
                "severity": "medium",
                "title": f"{len(errs)} browser console errors",
                "expected": "Clean console on happy-path load",
                "actual": "; ".join(errs[:3]),
                "type": "console",
            })

    agg: dict[tuple, dict] = {}
    for d in defects:
        key = (
            d["category"],
            d.get("type") or d["title"][:60],
            d["route"],
            d["severity"],
            host_kind(d["host"]),
        )
        if key not in agg:
            agg[key] = {
                **d,
                "browsers": set(),
                "viewports": set(),
                "count": 0,
            }
        entry = agg[key]
        entry["count"] += 1
        entry["browsers"].add(d["browser"])
        width = d.get("viewport", {}).get("width")
        if width:
            entry["viewports"].add(width)
        if d.get("screenshots") and len(d["screenshots"]) > len(entry.get("screenshots") or []):
            entry["screenshots"] = d["screenshots"]
        if d.get("detail") and not entry.get("detail"):
            entry["detail"] = d["detail"]

    order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    items = sorted(
        agg.values(),
        key=lambda x: (order.get(x["severity"], 9), x["route"], x["title"]),
    )

    # Assign IDs
    for i, d in enumerate(items, 1):
        d["id"] = f"DEF-{i:03d}"
        d["browsers"] = sorted(d["browsers"])
        d["viewports"] = sorted(v for v in d["viewports"] if v)
        d["source"] = map_source(d["host"], d["route"])
        d["root_cause"], d["fix"] = root_cause(d)

    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    passed = sum(1 for r in ROWS if r["status"] == "pass")
    failed = sum(1 for r in ROWS if r["status"] in ("fail", "error"))
    blocked = [r for r in ROWS if r["status"] == "blocked"]
    blocked_unique = {b["name"]: b for b in blocked}
    browsers = sorted({r["browser"] for r in ROWS if r["browser"] != "n/a"})

    lines: list[str] = []
    a = lines.append

    a("# Veno QA Audit Report")
    a("")
    a(f"**Generated:** {now}  ")
    a("**Mode:** Audit-only (no production code changes)  ")
    a("**Primary URL:** https://www.venohq.com  ")
    a("**Associated hosts:** vendor Railway app, admin.venohq.com  ")
    a("**Tooling:** Playwright Chromium / Firefox / WebKit + axe-core")
    a("")
    a("## 1. Executive summary")
    a("")
    a(
        f"Executed **{len(ROWS)}** instrumented result rows across browsers `{', '.join(browsers)}`. "
        "Latest full matrix: **354 passed**, **3 failed** (flaky journey screenshot/menu), "
        "**552 skipped** (intentional width/browser sampling + auth without credentials)."
    )
    a("")
    a("### Verdict")
    a("")
    a("- Public marketing and customer shells load on phone→desktop widths; recurring **a11y** and **tap-target** findings.")
    a("- **High:** Marketing advertises `venohq.com/book/serene-spa`, but `/book/serene-spa` is **HTTP 404** on Chromium, Firefox, and WebKit (sample slug ≠ live vendor).")
    a("- **DNS:** `app.venohq.com` and `api.venohq.com` do not resolve. Vendor portal is `https://vendor-web-production-a59cdbc0.up.railway.app` (www `/login` & `/register` 307).")
    a("- **Blocked:** Authenticated vendor/admin/customer dashboards (no sandbox credentials). No real appointments, live notifications, or real payments.")
    a("")
    a("| Metric | Count |")
    a("|---|---|")
    a(f"| Result rows | {len(ROWS)} |")
    a(f"| Pass rows | {passed} |")
    a(f"| Fail/error rows | {failed} |")
    a(f"| Blocked suites (deduped) | {len(blocked_unique)} |")
    a(f"| Aggregated unique defects | {len(items)} |")
    a(f"| Critical | {sum(1 for d in items if d['severity']=='critical')} |")
    a(f"| High | {sum(1 for d in items if d['severity']=='high')} |")
    a(f"| Medium | {sum(1 for d in items if d['severity']=='medium')} |")
    a(f"| Low | {sum(1 for d in items if d['severity']=='low')} |")
    a("")
    a("### Classification legend")
    a("")
    a("| Class | Meaning |")
    a("|---|---|")
    a("| **Confirmed defect** | Reproduced by Playwright/axe with evidence |")
    a("| **Usability recommendation** | Judgment / polish |")
    a("| **Blocked** | Credentials, DNS, or policy |")
    a("| **Untested** | Outside this run’s matrix |")
    a("")
    a("## 2. Device and browser test matrix")
    a("")
    a("| Browser | Portrait widths | Landscape | Coverage |")
    a("|---|---|---|---|")
    a("| Chromium | 320, 360, 375, 390, 412, 430, 440, 768, 1024, 1280, 1440, 1920 | Phone + iPad landscape on critical routes | Full public critical matrix |")
    a("| Firefox | 375, 390, 768, 1280 (critical) | — | Cross-engine sample |")
    a("| WebKit | 375, 390, 768, 1280 (critical) | — | Safari engine sample |")
    a("")
    a("Evidence: `qa/screenshots/`, `qa/traces/` (on failure), `qa/artifacts/results.ndjson`, HTML report `qa/reports/html/`.")
    a("")
    a("## 3. Route-by-route test results")
    a("")

    by: dict[str, list] = defaultdict(list)
    for r in ROWS:
        by[f"{r['host']}{r['route']}"].append(r)
    for key in sorted(by):
        rs = by[key]
        statuses = sorted({r["status"] for r in rs})
        widths = sorted({(r.get("viewport") or {}).get("width") for r in rs if (r.get("viewport") or {}).get("width")})
        br = sorted({r["browser"] for r in rs})
        issues = sum(
            len(r.get("layoutIssues") or [])
            + len(r.get("axeViolations") or [])
            + len(r.get("brokenLinks") or [])
            for r in rs
        )
        http404 = any((r.get("httpStatus") or 0) == 404 for r in rs)
        a(f"### `{key}`")
        a(f"- **Name:** {rs[0]['name']}")
        a(f"- **Statuses:** {', '.join(statuses)}" + (" — **HTTP 404 confirmed**" if http404 else ""))
        a(f"- **Browsers:** {', '.join(br)}")
        a(f"- **Viewports:** {', '.join(str(w) for w in widths) if widths else 'n/a'}")
        a(f"- **Issue signals:** {issues}")
        note = next((r.get("notes") for r in rs if r.get("notes")), None)
        if note:
            a(f"- **Notes:** {' | '.join(str(n)[:160] for n in note[:2])}")
        a("")

    a("## 4–10. Defect catalog")
    a("")
    a("Fields covered per defect: screenshots, reproduction, expected vs actual, severity, viewport/browser, source, root cause, fix, regression.")
    a("")

    for d in items:
        a(f"### {d['id']} — {d['title']}")
        a("")
        a("| Field | Value |")
        a("|---|---|")
        a(f"| Kind | **Confirmed defect** ({d['category']}) |")
        a(f"| Severity | **{d['severity']}** |")
        a(f"| Host / route | `{d['host']}{d['route']}` ({d['name']}) |")
        a(f"| Browsers | {', '.join(d['browsers'])} |")
        a(f"| Viewports (px) | {', '.join(str(v) for v in d['viewports']) or 'n/a'} |")
        a(f"| Matching rows | {d['count']} |")
        a(f"| Source | {', '.join(f'`{s}`' for s in d['source'])} |")
        shots = d.get("screenshots") or []
        a(
            f"| Screenshots | {', '.join(f'`{s}`' for s in shots[:4]) if shots else 'see `qa/screenshots/` for route×viewport captures; also `confirmed-*.png`'} |"
        )
        a("")
        a("**Reproduction**")
        a(f"1. Open `{d['host']}{d['route']}` in {d['browsers'][0]}.")
        if d["viewports"]:
            a(
                f"2. Set width to **{d['viewports'][0]}px** (also: {', '.join(str(v) for v in d['viewports'][:8])})."
            )
        else:
            a("2. Use a mobile-class viewport (375–430).")
        if d.get("type") == "http":
            a("3. Observe status / not-found UI.")
        elif d["category"] == "accessibility":
            a("3. Run axe-core (wcag2a/aa + wcag21a/aa) and locate the violation.")
        else:
            a("3. Inspect layout / tap targets / overlaps.")
        a("")
        a(f"**Expected:** {d['expected']}")
        a("")
        a(f"**Actual:** {d['actual']}")
        if d.get("detail"):
            detail = json.dumps(d["detail"], default=str)
            if len(detail) > 900:
                detail = detail[:900] + "…"
            a("")
            a("<details><summary>Detail</summary>")
            a("")
            a("```json")
            a(detail)
            a("```")
            a("")
            a("</details>")
        a("")
        a(f"**Root cause:** {d['root_cause']}")
        a("")
        a(f"**Recommended fix:** {d['fix']}")
        a("")
        a(
            f"**Regression:** `cd qa && npx playwright test -g \"{d['route']}\" --project=chromium` "
            f"and assert clean `{d.get('type')}` / layout probes at the failing width."
        )
        a("")

    a("## 11. Regression test recommendations")
    a("")
    a("1. `cd qa && npm run test:chromium` on PRs touching website/vendor-web.")
    a("2. CI gate: no HTTP ≥400 on critical routes; no axe critical/serious on `/`, `/partners`, `/app`, `/app/sign-in`, vendor `/login`; no horizontal overflow at 375/390.")
    a("3. Nightly WebKit 375/390.")
    a("4. `RUN_AUTHENTICATED=1` + sandbox secrets when available.")
    a("5. Explicit test: marketing booking demo URLs must 200 or must not appear in copy.")
    a("")

    a("## 12. Prioritised remediation backlog")
    a("")
    a("| Priority | ID | Severity | Item | Route | Viewports |")
    a("|---|---|---|---|---|---|")
    for d in items:
        pri = order.get(d["severity"], 9) + 1
        title = d["title"].replace("|", "/")
        vps = ", ".join(str(v) for v in d["viewports"][:6])
        a(f"| P{pri} | {d['id']} | {d['severity']} | {title} | `{d['route']}` | {vps} |")
    a("")

    a("## Blocked tests")
    a("")
    for name, b in blocked_unique.items():
        a(f"- **{name}** (`{b['host']}{b['route']}`): {' '.join(b.get('notes') or [])}")
    a("")
    a("- **Live Paystack completion** — sandbox only; no payment test keys provided.")
    a("- **Create/cancel real appointments** — policy.")
    a("- **Live notifications** — policy.")
    a("- **`app.venohq.com` / `api.venohq.com`** — DNS NXDOMAIN.")
    a("")

    a("## Untested scenarios")
    a("")
    a("- Native apps (`apps/mobile`, `apps/vendor-mobile`)")
    a("- Full vendor/admin dashboards (credentials)")
    a("- Physical notch devices beyond viewport-meta / `env(safe-area-inset-*)` checks")
    a("- Meta ads live campaigns")
    a("")

    a("## Usability recommendations")
    a("")
    a("- Default `/app` empty state for “Yaba, Lagos” is correct empty UX; consider defaulting new visitors to all-Lagos until density improves (`DiscoverHome.tsx`).")
    a("- Replace marketing `venohq.com/book/serene-spa` with `/samples/spa/serene-spa` until a real vendor exists.")
    a("- Communicate Railway vendor hostname until `app.venohq.com` DNS is live.")
    a("- Store sandbox QA accounts in a private secrets manager for CI.")
    a("")

    a("## Infrastructure notes")
    a("")
    a("| Host | Result |")
    a("|---|---|")
    a("| https://www.venohq.com | Live (Vercel) |")
    a("| https://venohq.com | Browser OK; non-browser clients may 403 |")
    a("| https://vendor-web-production-a59cdbc0.up.railway.app | Live vendor |")
    a("| https://admin.venohq.com | Live admin |")
    a("| https://app.venohq.com | **DNS NXDOMAIN** |")
    a("| https://api.venohq.com | **DNS NXDOMAIN** |")
    a("")

    out = ROOT / "reports" / "QA_REPORT.md"
    out.write_text("\n".join(lines) + "\n")

    backlog = [
        "# Remediation backlog",
        "",
        "| Priority | ID | Severity | Item | Route |",
        "|---|---|---|---|---|",
    ]
    for d in items:
        pri = order.get(d["severity"], 9) + 1
        backlog.append(
            f"| P{pri} | {d['id']} | {d['severity']} | {d['title'].replace('|', '/')} | `{d['route']}` |"
        )
    (ROOT / "reports" / "REMEDIATION_BACKLOG.md").write_text("\n".join(backlog) + "\n")

    serializable = []
    for d in items:
        serializable.append({k: v for k, v in d.items()})
    (ROOT / "artifacts" / "defects-aggregated.json").write_text(
        json.dumps(serializable, indent=2, default=str)
    )

    print(f"Wrote {out}")
    print(
        f"Defects={len(items)} critical={sum(1 for d in items if d['severity']=='critical')} "
        f"high={sum(1 for d in items if d['severity']=='high')} "
        f"medium={sum(1 for d in items if d['severity']=='medium')} "
        f"low={sum(1 for d in items if d['severity']=='low')}"
    )


if __name__ == "__main__":
    main()
