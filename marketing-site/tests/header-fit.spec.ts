import { test, expect } from '@playwright/test';

/**
 * Header fit ladder — pins the responsive thresholds in SiteHeader.astro and NgoSiteHeader.astro.
 *
 * Both mastheads used to be `flex-wrap: wrap` with the disclosure breakpoint at 900px, which is
 * hundreds of pixels below the width at which either layout actually stops fitting. The nav was
 * the only flexible thing in the pill (lockup and actions are both `flex: none`), so everything
 * between the true floor and 900px broke the labels onto extra rows and grew the pill — worst on
 * NGO, where the design's 90.64px cells pushed the floor up to 1420 and so a 1366 laptop, the
 * single most common desktop width, rendered a three-row masthead.
 *
 * The failure mode these tests exist to catch is not "it looks wrong" but "the pill's content
 * exceeds its content box". That one is invisible to the eye and to the visual-regression gate:
 * with `justify-content: space-between`, overflow silently eats the pill's own padding rather
 * than overlapping anything or scrolling the page. SLACK is the assertion that matters.
 *
 * Thresholds live in the components; this file asserts the ladder holds across the whole desktop
 * range, so moving a nav label or a button word is caught at the tier it breaks rather than in
 * someone's browser. If a label legitimately grows, re-measure and move the threshold — don't
 * widen the tolerance.
 */

interface Masthead {
  label: string;
  path: string;
  pill: string;
  nav: string;
  actions: string;
  lockup: string;
  /** Width at which the desktop layout gives way to the <details> disclosure. */
  disclosureBelow: number;
  /** Pill height while in desktop mode — NGO's buttons are 54px, Consultancy's 50px. */
  pillHeight: number;
}

const MASTHEADS: Masthead[] = [
  {
    label: 'Consultancy',
    path: '/',
    pill: '.site-header__pill',
    nav: '.site-nav--desktop',
    actions: '.site-header__actions--desktop',
    lockup: '.site-header__pill > a',
    disclosureBelow: 1230,
    pillHeight: 82,
  },
  {
    label: 'NGO',
    path: '/ngo/about',
    pill: '.ngo-header__bar',
    nav: '.ngo-nav--desktop',
    actions: '.ngo-header__actions--desktop',
    lockup: '.ngo-header__bar > a',
    disclosureBelow: 1260,
    pillHeight: 86,
  },
];

/** Widths worth pinning: the design width, common laptops, and each tier boundary ±1. */
const WIDTHS = [
  1920, 1600, 1512, 1440, 1439, 1420, 1419, 1366, 1340, 1339, 1300, 1299, 1280, 1260, 1259,
  1230, 1229, 1200, 1024, 900, 768, 480, 320,
];

async function probe(page: import('@playwright/test').Page, m: Masthead) {
  return page.evaluate(
    ([pillSel, navSel, actionsSel, lockupSel]) => {
      const pill = document.querySelector(pillSel)!;
      const cs = getComputedStyle(pill);
      const rect = pill.getBoundingClientRect();
      const inner = rect.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const gap = parseFloat(cs.columnGap);

      const visible = (sel: string) => {
        const el = document.querySelector<HTMLElement>(sel);
        return el && el.offsetParent !== null ? el : null;
      };
      const groups = [lockupSel, navSel, actionsSel].map(visible);
      const widths = groups.filter(Boolean).map((el) => el!.getBoundingClientRect().width);
      const need = widths.reduce((a, c) => a + c, 0) + gap * Math.max(0, widths.length - 1);

      const nav = visible(navSel);
      const actions = visible(actionsSel);
      return {
        desktop: nav !== null,
        height: Math.round(rect.height),
        slack: +(inner - need).toFixed(1),
        // Direct children only — Consultancy's dropdown panels are nested <li> lists, and they
        // are supposed to stack.
        navRows: nav
          ? new Set(
              Array.from(nav.querySelectorAll(':scope > ul > li')).map((li) =>
                Math.round(li.getBoundingClientRect().top),
              ),
            ).size
          : 0,
        overlaps:
          nav !== null &&
          actions !== null &&
          nav.getBoundingClientRect().right > actions.getBoundingClientRect().left + 0.5,
        pageOverflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
    },
    [m.pill, m.nav, m.actions, m.lockup] as const,
  );
}

for (const m of MASTHEADS) {
  test.describe(`${m.label} masthead fit`, () => {
    test(`fits at every width from 320 to 1920 without wrapping`, async ({ page }) => {
      await page.goto(m.path);

      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 });
        const r = await probe(page, m);

        expect(r.pageOverflow, `${width}px: page scrolls horizontally`).toBe(false);
        expect(r.overlaps, `${width}px: nav overlaps the actions group`).toBe(false);
        // The one that matters: `space-between` hides overflow inside the pill's own padding,
        // so a negative slack never looks broken but always is.
        expect(
          r.slack,
          `${width}px: pill content overflows its content box`,
        ).toBeGreaterThanOrEqual(0);

        if (r.desktop) {
          expect(r.navRows, `${width}px: nav wrapped onto ${r.navRows} rows`).toBe(1);
          expect(r.height, `${width}px: pill grew past its design height`).toBe(m.pillHeight);
        }
      }
    });

    test(`switches to the disclosure at ${m.disclosureBelow}px, not before`, async ({
      page,
    }) => {
      await page.goto(m.path);

      await page.setViewportSize({ width: m.disclosureBelow, height: 900 });
      expect((await probe(page, m)).desktop, 'should still be the desktop masthead').toBe(
        true,
      );

      await page.setViewportSize({ width: m.disclosureBelow - 1, height: 900 });
      expect((await probe(page, m)).desktop, 'should have collapsed to the disclosure').toBe(
        false,
      );
    });
  });
}

test('NGO keeps the design-exact nav cells down to 1420px', async ({ page }) => {
  // Tier A is the only tier with design fidelity at stake: the 90.64px per-cell minWidth is what
  // produces the design's uneven label rhythm (7429:5894 et al). Tier B gives it up, so the
  // threshold is where the replica stops.
  await page.goto('/ngo/about');
  const cellWidth = () =>
    page.evaluate(
      () =>
        document
          .querySelector('.ngo-nav--desktop .ngo-nav__list > li')!
          .getBoundingClientRect().width,
    );

  await page.setViewportSize({ width: 1420, height: 900 });
  expect(await cellWidth(), 'design cells should still apply at 1420').toBeCloseTo(90.64, 1);

  await page.setViewportSize({ width: 1419, height: 900 });
  expect(await cellWidth(), 'cells should hug their label below 1420').toBeLessThan(90);
});
