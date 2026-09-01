import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

// This container ships Chromium at PLAYWRIGHT_BROWSERS_PATH; point at it explicitly to
// skip the disabled "playwright install" download. Elsewhere (e.g. CI) the path won't
// exist, so fall back to Playwright's managed browser.
const LOCAL_CHROMIUM = '/opt/pw-browsers/chromium';
const executablePath = existsSync(LOCAL_CHROMIUM) ? LOCAL_CHROMIUM : undefined;
const PORT = 4321;

export default defineConfig({
  testDir: './tests',
  // Visual-regression baselines live next to the tests, committed as the parity baseline.
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  // A tiny tolerance absorbs sub-pixel antialiasing noise without hiding real regressions.
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.02 } },
  use: {
    baseURL: `http://localhost:${PORT}`,
    launchOptions: executablePath ? { executablePath } : undefined,
  },
  // Build the static site and serve it exactly as production would.
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT}`,
    // tests/routes.ts covers /styleguide and /ngo/styleguide, which a plain build now omits
    // — they live outside src/pages/ and are injected only on demand (see astro.config.mjs).
    env: { INCLUDE_STYLEGUIDE: '1' },
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: undefined },
    },
    // The mobile tier (tokens.css §4) is a second design point with its own type scale, its own
    // gutters and, on several components, its own layout — so a desktop-only axe run leaves half
    // the shipped CSS ungated. This project re-runs the a11y spec ALONE at the mobile frame's
    // 390×844, which is where the shrunk type and the collapsed layouts actually resolve.
    //
    // Scoped by `testMatch` on purpose: the visual-regression spec must NOT run here, or every
    // route would want a second committed baseline. Extending visual parity to mobile is a
    // separate decision with a real cost, not a side effect of widening the a11y net.
    //
    // Built on Desktop Chrome rather than a `devices['iPhone …']` preset: those presets set
    // `defaultBrowserType: 'webkit'`, and this repo only ever installs Chromium.
    {
      name: 'mobile-a11y',
      testMatch: /a11y\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        channel: undefined,
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
