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
  // The bold-italic accent-warm run that can open any service block's body — the HEALS-content
  // hook sentence and the "$100" cost amount on /services, and any equivalent on the
  // test-registration sub-pages. Previously two entries ('service-detail__lead' and
  // 'service-detail__cost-highlight'); ServiceDetailSection's generalisation to `blocks[]`
  // collapsed them into the single `highlight` run, so the two markers became one class.
  // See docs/a11y-known-issues.md issue 6.
  { rule: 'color-contrast', markers: ['service-detail__highlight'] },
  // NGO-only (node 5990:3672): the footer wordmark's green ".org" suffix on NGO's dark teal
  // footer surface — see docs/a11y-known-issues.md issue N2. The wordmark now comes from the
  // shared BrandLockup, so the marker pairs the `.org` class with the `--lg` size to keep the
  // NGO *header*'s (`--sm`) lockup out of scope. The two `--lg` instances this can still reach —
  // Consultancy's header (green on white) and its footer (3.67:1, passes the large threshold) —
  // never produce a violation, so the filter has nothing to remove there.
  // (The NGO secondary "Learn more" on dark is already covered by the 'btn--secondary' entry.)
  { rule: 'color-contrast', markers: ['brand-lockup__tld', 'brand-lockup--lg'] },
  // NGO Home (/ngo, node 5990:3672) — issues N3–N7 in docs/a11y-known-issues.md. NGO's kicker
  // is ORANGE (#E65320) and its heading-accent GREEN (#007F0E) — the inverse of Consultancy —
  // and both are confirmed source-design fills, so the CLAUDE.md #2 exception applies. Markers
  // use each section's unique parent class (all NGO-Home-only), so none can swallow a
  // Consultancy node. N3 — orange kicker on white + orange "Publication" news tag on white
  // (3.73:1):
  { rule: 'color-contrast', markers: ['who__intro', 'u-eyebrow'] },
  { rule: 'color-contrast', markers: ['programs__intro', 'u-eyebrow'] },
  { rule: 'color-contrast', markers: ['success__intro', 'u-eyebrow'] },
  { rule: 'color-contrast', markers: ['news__intro', 'u-eyebrow'] },
  { rule: 'color-contrast', markers: ['news__tag'] },
  // N4 — orange "Get Involved" kicker on the dark teal CTA panel (3.16:1):
  { rule: 'color-contrast', markers: ['u-eyebrow', 'cta__panel'] },
  // N5 — orange "Explore Consultancy" cross-brand pill on its peach fill #F5BAA6 (2.22:1):
  { rule: 'color-contrast', markers: ['hero__cross-link'] },
  // N6 — green "Learn more"/"View case study" link labels on the dark teal program cards and
  // testimonial (2.27:1). These are btn--link (no fill), so the existing btn--secondary entry
  // doesn't cover them:
  { rule: 'color-contrast', markers: ['programs__card', 'btn--link'] },
  { rule: 'color-contrast', markers: ['testimonial', 'btn--link'] },
  // N7 — green "Movement?" heading-accent em on the dark teal CTA panel (2.27:1; 48px bold is
  // "large", so 3:1 applies, but it still misses):
  { rule: 'color-contrast', markers: ['u-accent-em', 'cta__panel'] },
  // NGO Partners (/ngo/partners, node 7434:8750) — issues N8–N10 in docs/a11y-known-issues.md.
  // Same NGO orange-kicker / green-accent source palette as NGO Home, on a page cloned from the
  // NGO About frame. Markers use NGO-Partners-only classes (`partners-breadcrumb` doesn't exist
  // on the Consultancy Partners page; `ngo-partners-form` scopes the teal panel so the shared
  // `partners-form*` classes can't swallow Consultancy's — its labels/accent pass on violet).
  // N8 — the "HOME / ABOUT" breadcrumb, orange #E65320 on white (3.73:1):
  { rule: 'color-contrast', markers: ['partners-breadcrumb'] },
  // N9 — green form labels #007F0E on the dark teal panel (2.26:1):
  { rule: 'color-contrast', markers: ['partners-form__label', 'ngo-partners-form'] },
  // N10 — green "Partner" heading-accent em on the dark teal panel (2.26:1; 48px bold is
  // "large", so 3:1 applies, but it still misses):
  { rule: 'color-contrast', markers: ['u-accent-em', 'ngo-partners-form'] },
  // NGO About (/ngo/about, node 7429:5025) — issue N11 in docs/a11y-known-issues.md. The
  // "HOME / ABOUT" breadcrumb, orange #E65320 on white — same pairing/ratio as Partners' N8,
  // this page's own confirmed breadcrumb fill. `about-breadcrumb` is About-only (Partners uses
  // `partners-breadcrumb`), so neither marker can swallow the other page's node. Note: the
  // Core Team section's colour-inverted "CORE TEAM" (green) and "One Trusted Partner." (orange)
  // both pass AA/AA-large as measured (green-on-white and orange-on-white-at-large-text
  // respectively) — no allowlist needed for either.
  { rule: 'color-contrast', markers: ['about-breadcrumb'] },
  // NGO Program (/ngo/program, node 7447:6027) — issues N12–N15 in docs/a11y-known-issues.md.
  // Same NGO orange-kicker / green-accent source palette, plus one muted teal-blue label colour
  // unique to this page. Markers use NGO-Program-only parent classes (`program-breadcrumb`,
  // `partner-programs__card`, `program-contact`) so no other route's node can match.
  // N12 — the "HOME / PROGRAMS" breadcrumb, orange #E65320 on white (3.73:1):
  { rule: 'color-contrast', markers: ['program-breadcrumb'] },
  // N13 — green "Learn more" link labels on the dark teal Partner-Programs cards (2.27:1). These
  // are btn--link (no fill), so the btn--secondary entry doesn't cover them:
  { rule: 'color-contrast', markers: ['partner-programs__card', 'btn--link'] },
  // N14 — green "Now" heading-accent em on the dark teal Contact panel (2.27:1; 48px bold is
  // "large", so 3:1 applies, but it still misses):
  { rule: 'color-contrast', markers: ['u-accent-em', 'program-contact'] },
  // N15 — muted teal-blue form labels #69A4B8 on the dark teal Contact panel (4.27:1). A colour
  // unique to this page (Partners' labels are green), so it needs its own entry:
  { rule: 'color-contrast', markers: ['program-contact__label', 'program-contact'] },
  // NGO Contact (/ngo/contact, node 7461:5854) — issues N16–N19 in docs/a11y-known-issues.md.
  // Same recurring orange-breadcrumb / green-accent / muted-label palette as Program, plus one
  // genuinely new gap: the contact-info block's micro-labels, which are flat black at 50%
  // opacity (not a colour token) composited to #7F7F7F on white. Markers use Contact-only
  // parent classes so no other route's node can match.
  // N16 — the "HOME / PROGRAMS" breadcrumb, orange #E65320 on white (3.73:1):
  { rule: 'color-contrast', markers: ['contact-breadcrumb'] },
  // N17 — the contact-info micro-labels ("HEAD OFFICE", "PHONE"…), #7F7F7F on white (4.00:1):
  { rule: 'color-contrast', markers: ['contact-info__label'] },
  // N18 — green "Message" heading-accent em on the dark teal form panel (2.27:1; 48px bold is
  // "large", so 3:1 applies, but it still misses):
  { rule: 'color-contrast', markers: ['u-accent-em', 'contact-form'] },
  // N19 — muted teal-blue form labels #69A4B8 on the dark teal form panel (4.27:1), same colour
  // as Program's N15 but a distinct selector so each page's allowlist stays scoped:
  { rule: 'color-contrast', markers: ['contact-form__label', 'contact-form'] },
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
