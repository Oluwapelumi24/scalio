import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'

const ROOT = __dirname

export default defineConfig({
  testDir: path.join(ROOT, 'tests'),
  globalSetup: path.join(ROOT, 'global-setup.ts'),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 2 : 4,
  timeout: 90_000,
  expect: { timeout: 12_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: path.join(ROOT, 'reports', 'html'), open: 'never' }],
    ['json', { outputFile: path.join(ROOT, 'artifacts', 'playwright-results.json') }],
  ],
  outputDir: path.join(ROOT, 'traces'),
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    ignoreHTTPSErrors: false,
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 VenoQA/1.0',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
})
