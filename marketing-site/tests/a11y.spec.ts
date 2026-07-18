import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { Result, NodeResult } from 'axe-core';
import { routes } from './routes';

// Accessibility is a build-time gate (WORKFLOW.md §2): every route must pass axe against
// the WCAG 2.0/2.1/2.2 A and AA rulesets. AAA is pursued in design, but the automated gate
// asserts AA since AAA can't be fully machine-verified.
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

// Known, measured, deliberately-deferred colour-contrast gaps — see
// docs/a11y-known-issues.md for the full rationale and future-fix values for each. These are
// the source design's real confirmed colours; the client's direction is to ship them as
// designed and track the gap rather than darken/lighten brand colour ahead of a design
// decision. Matched against every string axe gives us for a node (its own html, its target
// selector chain, and every relatedNodes html) since axe's generated target selector isn't
// consistently class-based — a lone `<button type="button">` gets matched by attribute, not
// class, so selector-only matching silently misses it. `markers` must ALL be present
// somewhere in that combined haystack, so multi-word entries (e.g. the active nav link) don't
// accidentally swallow unrelated nodes. Delete an entry here the day its underlying fix lands.
const KNOWN_CONTRAST_ISSUES: { rule: string; markers: string[] }[] = [
  { rule: 'color-contrast', markers: ['btn--primary'] },
  { rule: 'color-contrast', markers: ['btn--secondary'] },
  { rule: 'color-contrast', markers: ['site-nav__link', 'aria-current'] },
  { rule: 'color-contrast', markers: ['services__card'] },
  // Matched on 'cta__card' (the element axe's relatedNodes reports as carrying the inverse
  // background) rather than 'cta__text' — 'cta__text' only showed up in Home's own generated
  // target selector because Home has 6 `.u-eyebrow`s on one page and axe needed the extra
  // ancestor for a unique selector; Services has only one, so its target is bare `.u-eyebrow`
  // and never mentions 'cta__text'. 'cta__card' is present in relatedNodes on both routes.
  { rule: 'color-contrast', markers: ['u-eyebrow', 'cta__card'] },
  // Services-only (node 8119:7174): the bold-italic accent-warm hook sentence leading the
  // HEALS-content "about" paragraphs, and the bold-italic accent-warm cost amount ("$100") —
  // see docs/a11y-known-issues.md issues 6/7.
  { rule: 'color-contrast', markers: ['service-detail__lead'] },
  { rule: 'color-contrast', markers: ['service-detail__cost-highlight'] },
];

// `target`/`relatedNodes[].target` entries are `CrossTreeSelector`s, which can themselves be
// nested arrays for shadow-DOM-piercing selectors — flatten to plain strings before matching.
function flattenSelector(target: readonly unknown[]): string[] {
  return target.flat(Infinity).filter((t): t is string => typeof t === 'string');
}

function nodeHaystack(node: NodeResult): string[] {
  const strings = [...flattenSelector(node.target), node.html];
  for (const checks of [node.any, node.all, node.none]) {
    for (const check of checks) {
      for (const related of check.relatedNodes ?? []) {
        strings.push(...flattenSelector(related.target), related.html);
      }
    }
  }
  return strings;
}

function isKnownIssue(rule: string, node: NodeResult): boolean {
  const haystack = nodeHaystack(node);
  return KNOWN_CONTRAST_ISSUES.some(
    (known) =>
      known.rule === rule &&
      known.markers.every((marker) => haystack.some((h) => h.includes(marker))),
  );
}

/** Strip allowlisted known-issue nodes out of each violation; drop violations left with none. */
function withoutKnownIssues(violations: Result[]): Result[] {
  return violations
    .map((violation) => ({
      ...violation,
      nodes: violation.nodes.filter((node) => !isKnownIssue(violation.id, node)),
    }))
    .filter((violation) => violation.nodes.length > 0);
}

for (const route of routes) {
  test(`a11y: ${route.name} (${route.path}) has no WCAG A/AA violations`, async ({ page }) => {
    await page.goto(route.path);
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(withoutKnownIssues(results.violations)).toEqual([]);
  });
}
