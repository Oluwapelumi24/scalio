# npm audit — PR 3 (`npm audit --omit=dev`)

## Before

```
37 vulnerabilities (15 moderate, 19 high, 3 critical)
```

Critical packages included `next`, `proxy-addr`, and `shell-quote`.

## After

```
14 vulnerabilities (11 moderate, 3 high, 0 critical)
```

**Critical: zero.**

## Changes applied

- `next` + `eslint-config-next`: **16.2.7 → 16.4.6** (vendor-web, admin-web, website). Same major; crossed 16.2 → 16.4 because the critical App Router / Turbopack advisory is only fixed in ≥16.4.5 (see Next November 2026 security release / v16.4.5–16.4.6 notes). This repo does not pre-compress route-handler bodies, so 16.4.6’s auto-compress behaviour should not double-encode responses.
- `@nestjs/platform-express`: **11.1.24 → 11.2.11** (patch/minor within Nest 11).
- Ran `npm audit fix` (**not** `--force`) for remaining non-breaking transitive fixes (`proxy-addr`, `shell-quote`, etc.).

## Remaining high (not forced)

### zod (`<4.6.6`)

- GHSA-mrhx-c7xc-m3w5 (memory exhaustion on oversized constrained collections).
- Fix requires Zod **4.x** (breaking). Backend and Expo still pin Zod 3; migrating is out of scope for this patch PR.

### image-size (`0.6.3 - 2.0.2`)

- Transitive via Metro / React Native (Expo 56 build tooling under `expo-linear-gradient` → `react-native`).
- Not a production Railway API dependency. Forcing upgrades the Expo toolchain.

### @expo/cli

- Transitive Expo 56 CLI / build tooling advisories.
- `npm audit fix --force` would pull Expo majors beyond 56. Leave for a dedicated Expo upgrade.

## Remaining moderate (Expo toolchain)

Most remaining moderates are under `@expo/*`, `glob`, `minimatch`, `expo-updates`. They affect local/CI mobile build tooling, not the Nest production API. Do not `--force`.
