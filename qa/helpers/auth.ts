import type { Page } from '@playwright/test'
import { CREDENTIALS, HOSTS, hasCredentials } from './config'

export function authBlockedReason(role: 'customer' | 'vendor' | 'admin'): string {
  if (!hasCredentials(role)) {
    return `Blocked: no ${role} credentials. Set ${role.toUpperCase()}_EMAIL and ${role.toUpperCase()}_PASSWORD in qa/.env (sandbox accounts only).`
  }
  return ''
}

export async function customerSignIn(page: Page): Promise<{ ok: boolean; note: string }> {
  const blocked = authBlockedReason('customer')
  if (blocked) return { ok: false, note: blocked }

  await page.goto(`${HOSTS.website}/app/sign-in`, { waitUntil: 'domcontentloaded' })
  await page.getByLabel(/email/i).fill(CREDENTIALS.customer.email)
  await page.getByLabel(/password/i).fill(CREDENTIALS.customer.password)
  await page.getByRole('button', { name: /sign in|log in|continue/i }).click()
  await page.waitForTimeout(2000)
  const url = page.url()
  const ok = !url.includes('sign-in')
  return { ok, note: ok ? `Signed in as customer → ${url}` : `Sign-in did not leave sign-in page (${url})` }
}

export async function vendorSignIn(page: Page): Promise<{ ok: boolean; note: string }> {
  const blocked = authBlockedReason('vendor')
  if (blocked) return { ok: false, note: blocked }

  await page.goto(`${HOSTS.vendor}/login`, { waitUntil: 'domcontentloaded' })
  await page.getByLabel(/email/i).fill(CREDENTIALS.vendor.email)
  await page.getByLabel(/password/i).fill(CREDENTIALS.vendor.password)
  await page.getByRole('button', { name: /sign in|log in|continue/i }).click()
  await page.waitForTimeout(2500)
  const url = page.url()
  const ok = url.includes('/dashboard')
  return { ok, note: ok ? `Signed in as vendor → ${url}` : `Vendor sign-in failed (${url})` }
}

export async function adminSignIn(page: Page): Promise<{ ok: boolean; note: string }> {
  const blocked = authBlockedReason('admin')
  if (blocked) return { ok: false, note: blocked }

  await page.goto(`${HOSTS.admin}/login`, { waitUntil: 'domcontentloaded' })
  await page.getByLabel(/email/i).fill(CREDENTIALS.admin.email)
  await page.getByLabel(/password/i).fill(CREDENTIALS.admin.password)
  await page.getByRole('button', { name: /sign in|log in|continue/i }).click()
  await page.waitForTimeout(2500)
  const url = page.url()
  const ok = url.includes('/dashboard')
  return { ok, note: ok ? `Signed in as admin → ${url}` : `Admin sign-in failed (${url})` }
}
