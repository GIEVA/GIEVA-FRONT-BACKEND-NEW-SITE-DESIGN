import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// SiteSearch is a JS-only enhancement over the static Pagefind index (built into /pagefind/ by
// the `pagefind` build step). These tests run against the real preview build, so the index is
// present and search is exercised end-to-end. See src/components/SiteSearch.astro.

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

test.describe('site search', () => {
  test('opens, searches, shows highlighted results, and closes (Consultancy)', async ({
    page,
  }) => {
    await page.goto('/');

    // Locate by a stable hook, not the accessible name — the name flips to "Close search" once
    // the panel opens, so a name-based locator would stop resolving mid-test.
    const toggle = page.locator('.site-search__toggle');
    // JS-only: the trigger is hidden in the no-JS baseline, revealed by the enhancement script.
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAccessibleName('Search the site');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await toggle.click();

    const input = page.getByRole('searchbox', { name: 'Search GIEVA' });
    await expect(input).toBeFocused();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle).toHaveAccessibleName('Close search');

    await input.fill('scholarship');

    const results = page.locator('.site-search__result');
    await expect(results.first()).toBeVisible();
    // Query is highlighted in context (Pagefind <mark> excerpt).
    await expect(page.locator('.site-search__result-excerpt mark').first()).toBeVisible();
    // Results are real links, keyboard-reachable.
    await expect(results.first()).toHaveAttribute('href', /.+/);
    await expect(page.locator('#site-search-status')).toContainText(/result/i);

    // The open search panel must itself pass the WCAG gate.
    const axe = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .include('#site-search-panel')
      .analyze();
    expect(axe.violations).toEqual([]);

    // ArrowDown moves focus from the input into the first result.
    await input.press('ArrowDown');
    await expect(results.first()).toBeFocused();

    // Escape closes and restores focus to the trigger.
    await page.keyboard.press('Escape');
    await expect(page.locator('#site-search-panel')).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
  });

  test('search covers NGO pages from the NGO header', async ({ page }) => {
    await page.goto('/ngo');

    const toggle = page.locator('.site-search__toggle');
    await expect(toggle).toBeVisible();
    await toggle.click();

    const input = page.getByRole('searchbox', { name: 'Search GIEVA' });
    await input.fill('scholarship');

    await expect(page.locator('.site-search__result').first()).toBeVisible();
  });
});
