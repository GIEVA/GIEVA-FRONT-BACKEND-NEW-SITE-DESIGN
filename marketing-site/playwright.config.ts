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
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: undefined },
    },
  ],
});
