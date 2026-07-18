import { test, expect } from '@playwright/test';
import { routes } from './routes';

// Visual regression makes "exact replica" machine-checked (WORKFLOW.md §1, §5). Baselines are
// committed; a diff fails CI. Update intentionally with `npm run test:update-snapshots`.
//
// We render each route at the breakpoints we author responsive behaviour for — desktop,
// tablet, and mobile — since no mobile Figma frames exist and the responsive layout is ours
// to sign off (docs/consultancy-build-plan.md). One baseline per route × viewport.
const viewports = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
] as const;

/**
 * Astro's <Image> defaults to `loading="lazy"`, even for content that's visually above the
 * fold — the browser's IntersectionObserver still needs a tick to fire, and below-the-fold
 * images don't start fetching until scrolled into view at all. A fullPage screenshot's own
 * internal scroll-and-stitch races both of those, intermittently capturing a still-loading
 * image (most visible on image-heavy pages like Home, but not exclusive to them — confirmed
 * during the Services build). Scroll down in steps (giving the observer a moment to fire at
 * each one, rather than jumping straight to the bottom) so every image at least starts
 * fetching, then wait for it.
 *
 * Only images actually reachable by that vertical scroll count: Home's partners marquee is a
 * `width: max-content` row wider than the viewport inside an `overflow: hidden` track — the
 * genuinely-visible logos run past the right edge, and the whole *second*, `aria-hidden`
 * copy (duplicated for the infinite-scroll illusion) sits off-screen to the right of that.
 * With the CSS animation frozen (`prefers-reduced-motion`, set for this whole project — see
 * `use.reducedMotion` in playwright.config.ts), none of that horizontally-clipped content
 * ever scrolls into view, so Chromium correctly never fetches it — same as a real visitor
 * with the same OS preference would see. Waiting for those images to "complete" is waiting for
 * something that will never happen, which is what made this hang; the `rect.left <
 * innerWidth` check keeps the wait scoped to what a screenshot can actually show.
 */
async function waitForImages(page: import('@playwright/test').Page): Promise<void> {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= height; y += 900) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(150);
  }
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForFunction(
    () =>
      Array.from(document.images).every(
        (img) => img.getBoundingClientRect().left >= window.innerWidth || img.complete,
      ),
    { timeout: 10_000 },
  );
  // Give the last decode a couple of paints to land before the screenshot.
  await page.evaluate(
    () =>
      new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}

for (const route of routes) {
  for (const vp of viewports) {
    test(`visual: ${route.name} @ ${vp.name} (${route.path}) matches baseline`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(route.path);
      await waitForImages(page);
      // Neutralise animations/carets so snapshots are deterministic.
      await expect(page).toHaveScreenshot(`${route.name}-${vp.name}.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    });
  }
}
