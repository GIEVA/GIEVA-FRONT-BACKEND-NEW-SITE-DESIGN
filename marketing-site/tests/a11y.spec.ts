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
  // Issue 7 / N5 — the cross-site switcher pill (`BrandSwitchLink.astro`). The only entry here
  // that spans BOTH brands and ALL 18 routes, because the pill is shell chrome rendered by
  // BaseLayout. Consultancy: green #007F0E on the mint fill composited to #B3D9B7 (3.34:1).
  // NGO: orange #E65320 on the peach fill composited to #F8CBBC (2.53:1). Both fills and both
  // label colours are confirmed instance values on the one shared Figma component (5986:3665 /
  // 5990:4604). `brand-switch` is unique to that component, so nothing else can match.
  { rule: 'color-contrast', markers: ['brand-switch'] },
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
  // footer surface — see docs/a11y-known-issues.md issue N2. The wordmark comes from the shared
  // BrandLockup, so the marker pairs the `.org` class with the `--inverse` ink to keep the two
  // light-surface lockups (both headers) out of scope. This used to pair with the `--lg` size
  // instead, back when the NGO header had its own smaller `--sm` treatment; the design turned
  // out to instance one 247×48 lockup everywhere, so both size classes are gone and the ink
  // variant — which is only ever the dark footer — is the narrower anchor anyway. The one other
  // `--inverse` instance in reach, Consultancy's footer (3.67:1, passes the large threshold), is
  // not a violation, so the filter has nothing to remove there.
  // (The NGO secondary "Learn more" on dark is already covered by the 'btn--secondary' entry.)
  { rule: 'color-contrast', markers: ['brand-lockup__tld', 'brand-lockup--inverse'] },
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
  // Same issue N3, on the two NGO Resources routes: the orange kicker on white and the category
  // pill on the article cards. `resources__eyebrow` and `article__eyebrow` are style-free hooks
  // added purely so these match without a bare `u-eyebrow` marker, which would allowlist every
  // eyebrow on all 18 routes.
  { rule: 'color-contrast', markers: ['resources__eyebrow'] },
  { rule: 'color-contrast', markers: ['article__eyebrow'] },
  // `article-card__tag` is deliberately unpaired, unlike the entries above. ArticleCard is
  // brand-neutral and its pill consumes `--color-accent-warm`, which resolves to the same
  // #E65320 on BOTH brands, so a Consultancy /resources built from this component would show the
  // identical 3.73:1 pairing rather than a different, unexamined one. Scope confirmed, not
  // accidental — see docs/a11y-known-issues.md N3.
  { rule: 'color-contrast', markers: ['article-card__tag'] },
  // N4 — orange "Get Involved" kicker on the dark teal CTA panel (3.16:1):
  { rule: 'color-contrast', markers: ['u-eyebrow', 'cta__panel'] },
  // (N5 moved: the cross-brand pill is no longer NGO-Home-only — see issue 7 / N5 below.)
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
  // NGO About (/ngo/about) has NO allowlist entry. It used to carry one for issue N11, the
  // "HOME / ABOUT" breadcrumb — the 2026-08 redesign of node 7429:5025 replaced that header
  // with a photo hero, so the node is gone and `color-contrast` is fully enforced on the route
  // again. See the RESOLVED N11 entry in docs/a11y-known-issues.md before re-adding anything.
  // NGO Program (/ngo/program, node 7447:6027) — issues N14–N15 in docs/a11y-known-issues.md.
  // Markers use NGO-Program-only parent classes (`program-contact`) so no other route's node can
  // match. Two of this page's four original entries are gone: N12 (the "HOME / PROGRAMS"
  // breadcrumb) and N13 (the green "Learn more" links on the Partner-Programs cards) were both
  // closed by the 2026-08 redesign of node 7447:6027, which replaced the breadcrumb header with
  // a photo hero and deleted the Partner-Programs block outright. `color-contrast` is enforced
  // again on both — see the RESOLVED N12/N13 entries in docs/a11y-known-issues.md before
  // re-adding anything.
  // N14 — green "Now" heading-accent em on the dark teal Contact panel (2.27:1; 48px bold is
  // "large", so 3:1 applies, but it still misses):
  { rule: 'color-contrast', markers: ['u-accent-em', 'program-contact'] },
  // N15 — muted teal-blue form labels #69A4B8 on the dark teal Contact panel (4.27:1). A colour
  // unique to this page (Partners' labels are green), so it needs its own entry:
  { rule: 'color-contrast', markers: ['program-contact__label', 'program-contact'] },
  // NGO Contact (/ngo/contact, node 7461:5854) — issues N17–N19 in docs/a11y-known-issues.md.
  // Same recurring green-accent / muted-label palette as Program, plus one genuinely new gap:
  // the contact-info block's micro-labels, which are flat black at 50% opacity (not a colour
  // token) composited to #7F7F7F on white. Markers use Contact-only parent classes so no other
  // route's node can match. N16 (the "HOME / PROGRAMS" breadcrumb) is gone — the 2026-08
  // redesign of node 7461:5854 replaced that header with a photo hero, exactly as it did on
  // About (N11) and Program (N12), so `color-contrast` is enforced again on those nodes. N20
  // (the 50%-opacity "Your Answer" placeholder) has NO entry on purpose: axe-core's
  // color-contrast rule does not evaluate placeholder text, so it never reaches this list —
  // see the entry in docs/a11y-known-issues.md before assuming one is missing.
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
