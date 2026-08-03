# Known accessibility issues — tracked, not silently ignored

> Read this alongside `CLAUDE.md` non-negotiable #2 ("a11y is a build-time gate... WCAG AA
> minimum") and non-negotiable #1 ("exact-replica first, delight second"). Client direction for
> the Consultancy Home build (2026-07-18): for **colour-contrast** specifically, ship the
> source design's real colours as designed rather than pre-emptively darkening/lightening brand
> colours to force an automated pass. Usability and visual parity both matter — this file is the
> mechanism that keeps contrast gaps visible and trackable instead of either (a) silently failing
> the build forever or (b) getting quietly waived with no record. Nothing here is "fixed and
> forgotten" — it's "known, measured, and deferred."
>
> `tests/a11y.spec.ts` encodes this file as data: a `KNOWN_CONTRAST_ISSUES` allowlist filters
> exactly these violations (by selector, not by blanket-disabling the `color-contrast` rule) out
> of the axe results before asserting zero violations. Any _new_ contrast issue, or any issue on
> a selector not listed here, still fails the build. When one of these is actually fixed, delete
> its allowlist entry — the test will then fail loudly if the fix regresses.

## Open issues (7 + 19 NGO)

All measured via `@axe-core/playwright` (WCAG 2 AA, `color-contrast` rule) against the built
Home (`/`), `/styleguide`, and (issues 6–7, added in the Services build) `/services` routes,
plus (issues N1–N2, added in the NGO Phase 0B build) `/ngo/styleguide` and (issues N3–N7, added
in the NGO Home / Phase 1 build) `/ngo`, (issues N8–N10, added in the NGO Partners / Phase 2
build) `/ngo/partners`, (issue N11, added in the NGO About / Phase 3 build) `/ngo/about`, (issues
N12–N15, added in the NGO Program / Phase 4 build) `/ngo/program`, and (issues N16–N19, added in
the NGO Contact / Phase 5 build) `/ngo/contact`,
Playwright 1.61.1 Chromium. Button/label text on these pages is 18px (`--type-body-lg`), which
is **not** "large text" under WCAG (needs ≥24px normal or ≥18.66px/14pt bold) even where the
label happens to be bold — confirmed via `src/lib/contrast.ts`'s `wcagLevel()` — so all of
these need the strict 4.5:1 threshold, not the relaxed 3:1 large-text one.

### 1. `.btn--primary` — white label on `--color-accent-warm` fill

- **Where:** every primary `<Button>` — header "Book Consultancy", hero/CTA "Book Free
  Consultation", styleguide swatches.
- **Measured:** white `#ffffff` on `#e65320` = **3.73:1**. Needs 4.5:1.
- **Why kept as-is:** `#E65320` is the confirmed real fill from every button/CTA in Home's
  `node.json` (see `tokens.css` header comment) — not a translation guess.
- **Future-fix direction:** darken the fill only, keep white text. `#c4471b` (accent-warm ×
  0.85 scale) → **4.92:1** against white text — clears AA with margin. Candidate token:
  `--color-accent-warm-accessible`.

### 2. `.btn--secondary` — `--color-accent-warm` label on `--color-orange-10` tint fill

- **Where:** header "Log In", "Learn more about us", styleguide secondary swatches.
- **Measured:** `#e65320` on the tint, composited over white = `#fdeee9` → **3.30:1**; inside
  the header's translucent glass pill the effective composite reads `#fceee9` → **3.29:1**.
  Both need 4.5:1.
- **Why kept as-is:** tint + label colour are both the confirmed real values (10%-alpha
  `--color-orange` fill/border, per Home's `node.json`).
- **Future-fix direction:** darkening the _label_ to the same `#c4471b` (0.85×) only reaches
  4.36:1 against the tint — still short. Needs 0.8× → `#b8421a` → **4.85:1**. Note this is a
  _different_ darkening factor than issue #1's background fix, so a single shared token can't
  cleanly serve both unless the tint is also recomposed against the darker base.

### 3. `.site-nav__link[aria-current='page']` — accent-warm active nav label

- **Where:** `SiteHeader` desktop + mobile nav, whichever link matches the current route
  (`aria-current="page"`, native semantics — see the component's own header comment).
- **Measured:** `#e65320` bold 18px on the header's white/glass pill background = **3.73:1**.
  Bold at 18px is still under the 18.66px "large text" cutoff, so 4.5:1 applies, not 3:1.
- **Why kept as-is:** same confirmed accent-warm value; the active-link colour treatment is
  the only visual cue for current-page state, so this one has a11y stakes beyond aesthetics —
  flagged as the highest-priority of the five to actually fix.
- **Future-fix direction:** same `#c4471b` (0.85× darkening) as issue #1 clears 4.92:1 against
  white/light backgrounds — this one _can_ share the token from #1 since both sit on a light
  surface.

### 4. `.services__card .btn--link` — "Learn more" label on dark card fill

- **Where:** all 3 Consultancy Services cards (dark `#291e47` card background).
- **Measured:** `#e65320` on `#291e47` = **4.10:1**. Needs 4.5:1 — closest of the five to
  passing outright.
- **Why kept as-is:** confirmed real card fill + link colour from `node.json`.
- **Future-fix direction:** the opposite move from issues #1–3 — this pairing needs the accent
  **lightened**, not darkened, since it sits on a dark surface. Lightening `#E65320` toward
  white by 15% → `#ea6d41` → **4.93:1**. A single "accessible accent-warm" token can't serve
  both the light-surface cases (darker) and this dark-surface case (lighter) — would need a
  second token (e.g. `--color-accent-warm-on-dark-accessible`) or a surface-aware pair like the
  existing inverse text-role flip in `tokens.css` §3.

### 5. `.u-eyebrow` on the CTA banner's dark surface (`.cta__card.surface-inverse`)

- **Where:** every CTA banner's "Get in Touch" eyebrow — Home (`/`) and Services (`/services`)
  both carry the identical CTA block (same copy, same markup shape), so this recurs on both
  routes. Allowlisted on `['u-eyebrow', 'cta__card']` rather than `['u-eyebrow', 'cta__text']`
  (the original Home-only marker): axe only mentions `cta__text` in Home's generated target
  selector because Home has 6 `.u-eyebrow`s on one page and axe needs the extra ancestor to
  disambiguate; Services has one, so its target is bare `.u-eyebrow`. `cta__card` — the
  element axe's `relatedNodes` reports as the actual inverse-surface ancestor — is present on
  both, so it's the more robust match.
- **Measured:** `#007f0e` bold 14px on `#120633` = **3.67:1**. Needs 4.5:1.
- **Why kept as-is:** `.u-eyebrow`'s green is the confirmed "kicker" colour used throughout
  Home (`--color-green`, also the success-feedback role); this is the one spot it lands on an
  inverse/dark surface instead of the usual light one.
- **Future-fix direction:** lighten, same logic as #4. `#007F0E` lightened 15% toward white →
  `#269232` → **4.77:1** against `#120633`. Could plausibly become a
  `--color-feedback-success` (or eyebrow-specific) value in the existing
  `.surface-inverse` text-role flip block, rather than a one-off override.

### 6. `.service-detail__highlight` — bold-italic accent-warm run opening a block's body

> Merges what were issues #6 and #7. They described the same pairing at the same measured
> ratio on two class names — `.service-detail__lead` (the hook sentence) and
> `.service-detail__cost-highlight` (the "$100" amount). Generalising `ServiceDetailSection`
> to `blocks[]` collapsed both into one optional `highlight` run, so they are now one class,
> one entry, and one allowlist marker. There is deliberately no issue #7.

- **Where:** any service block whose body opens with a highlighted run. On Services
  (`/services`) that is the HEALS-content "about" lead sentence ("Studying abroad shouldn't
  come down to who you know.") and the "$100" cost lead-in, both on the HEALS and Admission
  Processing sections only — they share the same source copy (see
  `docs/consultancy-build-plan.md` Phase 2 notes). The other three sections' about/cost copy
  has no highlighted run at all (confirmed via `characterStyleOverrides` being empty on those
  text nodes).
- **Measured:** `#e65320` bold italic 18px on `#ffffff` = **3.73:1**. Needs 4.5:1 (18px bold is
  still under the 18.66px large-text cutoff).
- **Why kept as-is:** `#E65320` is the confirmed real `characterStyleOverrides` colour for these
  runs in Services' `node.json` (8119:8150 / 8216:9385 for the hook sentence, 8145:8498 for the
  cost amount) — the same accent-warm value as every other issue here, not a new guess.
- **Future-fix direction:** same pairing/direction as issue #3 (accent-warm foreground on a
  light surface) — darken to `#c4471b` (0.85×) → **4.92:1**. Can share that token.

### N1. NGO `.btn--secondary` — green label on green-tint fill over the dark teal surface

- **Where:** `/ngo/styleguide` "Buttons" section, the secondary button shown on the inverse
  surface (`.sg__buttons.surface-inverse`). Same shape as the real NGO Home "Learn more" links
  inside the dark program cards (node 5990:3672), which will recur when Home is built.
- **Measured:** green `#007f0e` label on the deep-teal inverse surface `#0e3e40` (the green-10%
  tint barely shifts it) = **2.27:1**. Needs 4.5:1 — the widest NGO gap, mirroring how
  Consultancy's warm accent lands hardest on its dark surface (issue #4).
- **Why kept as-is:** `#007F0E` is the confirmed NGO action/CTA colour from every button and
  "Learn more" link in Home's `node.json`, and `#0E3E40` is the confirmed inverse-surface fill
  (footer/program cards/testimonial/CTA). Neither is a translation guess. Per `CLAUDE.md`
  non-negotiable #2 (colour-contrast exception), ships as designed and is tracked here.
- **Allowlist:** covered by the existing `['btn--secondary']` entry in `KNOWN_CONTRAST_ISSUES`
  (rule + class marker, route-agnostic) — no new allowlist entry needed. On light surfaces the
  NGO secondary button passes (green on white = 5.20:1), so only the on-dark instance trips.
- **Future-fix direction:** lighten the green toward white (dark-surface pairing, like issues
  #4/#5). `#5cb466` → **4.59:1** against `#0E3E40` (computed via `src/lib/contrast.ts`) — clears
  AA with a small margin; the milder `#4da558` only reaches 3.84:1, so it must go this light.
  Candidate: a surface-aware CTA value in the `[data-brand='ngo'] .surface-inverse` flip block
  (green on light stays as-is; green-on-dark lifts to the accessible tint).

### N2. NGO `.brand-lockup__tld` — green ".org" wordmark suffix on the dark teal footer

- **Where:** every `/ngo/*` route's shared `SiteFooter`. The wordmark's ".org" suffix
  (`--color-feedback-success` → green). Previously `.site-footer__tld`; the lockup moved into the
  shared `BrandLockup.astro` when the header's and footer's copies were merged.
- **Measured:** green `#007f0e` on the deep-teal footer `#0e3e40` = **2.26:1**, at 32px regular.
  That is "large text" (≥24px at normal weight), so the 3:1 threshold applies, not 4.5:1 — but it
  misses even that. The identical element on Consultancy's violet footer (`#120633`) reads
  **3.67:1** and passes the large threshold, so this only fails on NGO's lighter teal surface.
- **Why kept as-is:** the green ".org" is the confirmed footer wordmark colour in Home's
  `node.json` (footer text node ".org" → `#007f0e`); the teal is the confirmed footer fill.
  Both are source-design values — the `CLAUDE.md` #2 colour-contrast exception applies.
- **Allowlist:** narrow entry `['brand-lockup__tld', 'brand-lockup--lg']` in
  `KNOWN_CONTRAST_ISSUES`. The size marker keeps the NGO _header_'s `--sm` lockup out of scope;
  the two `--lg` instances still in reach (Consultancy's header, green on white, and its footer at
  3.67:1) aren't violations, so the filter never has anything to remove there.
- **Future-fix direction:** lighten toward white (dark-surface pairing). Only 3:1 is required
  here (large text), so a mild lift suffices — `#4da558` → **3.84:1** clears it; the shared
  `#5cb466` from issue N1 (4.59:1) would cover both. Best expressed as a surface-aware
  `--color-feedback-success` / tld value in the `[data-brand='ngo'] .surface-inverse` flip block.

### N3. NGO orange kicker (`.u-eyebrow`) + "Publication" news tag on white

- **Where:** NGO Home (`/ngo`) — the "WHO WE ARE", "OUR PROGRAMS", "SUCCESS STORIES", "RECENT
  NEWS" kickers (each on a white section) and the "Publication" pill on every news card
  (`.news__tag`, orange-on-white too). NGO's kicker is orange where Consultancy's is green —
  the two brands invert the eyebrow↔heading-accent colour pairing (see `tokens.css`
  `--color-eyebrow` / `--color-heading-accent`, added this build).
- **Measured:** `#e65320` bold 14px on `#ffffff` = **3.73:1**. Needs 4.5:1 (14px bold is under
  the 18.66px large-text cutoff). Same pairing as Consultancy issues #6/#7, different colour role.
- **Why kept as-is:** `#E65320` is the confirmed kicker/tag fill on every one of these nodes in
  Home's `node.json` (e.g. 5990:4285, 5990:4338, I7417:7623;7417:7798) — a source-design colour,
  per the `CLAUDE.md` #2 exception.
- **Allowlist:** `['who__intro','u-eyebrow']`, `['programs__intro','u-eyebrow']`,
  `['success__intro','u-eyebrow']`, `['news__intro','u-eyebrow']`, `['news__tag']` — each keyed
  on an NGO-Home-only parent class so no Consultancy node can match.
- **Future-fix direction:** darken the kicker orange for light surfaces (same as issue #6):
  `#c4471b` (accent-warm × 0.85) → **4.92:1** on white. Candidate: `--color-accent-warm-accessible`
  wired into `--color-eyebrow` on light NGO surfaces only (the on-teal instance, N4, needs the
  opposite direction, so a single value can't serve both).

### N4. NGO orange kicker on the dark teal CTA panel (`.cta__panel`)

- **Where:** NGO Home (`/ngo`) CTA — the "GET INVOLVED" kicker on the deep-teal panel.
- **Measured:** `#e65320` bold 14px on `#0e3e40` = **3.16:1**. Needs 4.5:1.
- **Why kept as-is:** confirmed orange kicker fill (5990:4486) on the confirmed inverse-surface
  teal (5990:4480) — both source-design values.
- **Allowlist:** `['u-eyebrow','cta__panel']`.
- **Future-fix direction:** dark-surface pairing → _lighten_ the kicker orange. `#ee8763`
  (accent-warm lightened ~30% toward white) → **4.65:1** on `#0E3E40` (via `src/lib/contrast.ts`).
  Opposite move from N3, so best expressed as a surface-aware `--color-eyebrow` in the
  `[data-brand='ngo'] .surface-inverse` flip block.

### N5. NGO "Explore Consultancy" cross-brand pill (`.hero__cross-link`)

- **Where:** NGO Home (`/ngo`) hero — the peach pill floating over the hero torus, the
  counterpart to Consultancy's green "Explore NGO" pill. Styled in _Consultancy's_ accent orange
  on a peach fill, deliberately (each brand's cross-link wears the other brand's colour).
- **Measured:** `#e65320` bold 18px on the pill's `#f5baa6` fill = **2.22:1**. Needs 4.5:1 (18px
  bold is not large text). The widest orange gap on the page.
- **Why kept as-is:** both the fill `#F5BAA6` and text `#E65320` are the confirmed instance values
  in `node.json` (5990:4604) — a source-design pairing.
- **Allowlist:** `['hero__cross-link']`.
- **Future-fix direction:** the peach fill is light, so the text must go much darker than the
  0.85× used elsewhere — `#8a3213` (accent-warm × 0.6) → **4.89:1** on `#F5BAA6`. Deepening the
  peach instead makes it worse (it drops toward the text). A pill-specific darker-orange token is
  the cleanest fix.

### N6. NGO green link labels ("Learn more" / "View case study") on dark teal

- **Where:** NGO Home (`/ngo`) — the `btn--link` "Learn more" inside each deep-teal program card
  and "View case study" in the testimonial card. These have _no_ fill (link variant), so the
  existing `['btn--secondary']` entry (which covers the filled secondary button) doesn't reach
  them.
- **Measured:** green `#007f0e` normal 18px on `#0e3e40` = **2.27:1**. Needs 4.5:1 — the same
  green-on-teal pairing as issue N1, on link-variant buttons.
- **Why kept as-is:** `#007F0E` is the confirmed "Learn more"/"View case study" label colour in
  `node.json` (I7403:5274…, I7102:33516…) on the confirmed teal card fills — source-design values.
- **Allowlist:** `['programs__card','btn--link']`, `['testimonial','btn--link']`.
- **Future-fix direction:** lighten the green for dark surfaces (as N1): `#66b26e`
  (green lightened ~40%) → **4.58:1** on `#0E3E40`; the milder `#4da556` only reaches 3.83:1.
  Shared with N7 via a surface-aware CTA/link value in the NGO inverse flip block.

### N7. NGO green heading-accent ("Movement?") on the dark teal CTA panel

- **Where:** NGO Home (`/ngo`) CTA heading "Ready to Join the **Movement?**" — the bold-italic
  green accent run (`.u-accent-em`) on the teal panel. NGO's heading accent is green (the inverse
  of Consultancy's orange).
- **Measured:** green `#007f0e` bold 48px on `#0e3e40` = **2.27:1**. 48px bold _is_ "large text",
  so only 3:1 is required — but it still misses.
- **Why kept as-is:** `#007F0E` is the confirmed `characterStyleOverrides` colour for the accent
  run (5990:4488) on the confirmed teal panel fill — source-design values.
- **Allowlist:** `['u-accent-em','cta__panel']`. (The same green accent on white sections —
  "One Youth…", "Real Impact", "Impacts made", "With Us" — passes at **5.20:1** and is not
  allowlisted, so a regression there would still fail the build.)
- **Future-fix direction:** lighten as N6 — `#66b26e` → **4.58:1** (clears even the 4.5 normal
  threshold, well past the 3:1 this large text needs) on `#0E3E40`.

### N8. NGO Partners breadcrumb ("HOME / ABOUT") orange on white

- **Where:** NGO Partners (`/ngo/partners`) page-header breadcrumb `.partners-breadcrumb`. The
  text is literally "HOME / ABOUT" — a duplication artifact from the About frame this page was
  cloned off (see the page's header comment); reproduced verbatim per exact-replica-first and
  tracked for a post-sign-off correction, separately from this contrast gap.
- **Measured:** orange `#e65320` bold 18px on `#ffffff` = **3.73:1**. 18px/700 is 13.5pt bold,
  which is _not_ "large text" (needs ≥14pt/18.66px bold), so the 4.5:1 normal threshold applies
  and it misses — identical to NGO Home's orange kicker (N3).
- **Why kept as-is:** `#E65320` is the confirmed breadcrumb fill (node 7434:8753) — the NGO
  eyebrow/kicker colour, a source-design value shipped as designed (CLAUDE.md #2 exception).
- **Allowlist:** `['partners-breadcrumb']` (NGO-Partners-only class; the Consultancy Partners
  page has no breadcrumb).
- **Future-fix direction:** darken the eyebrow orange for small text on white, exactly as N3 —
  `#c4471b` (accent-warm × 0.85) → **4.92:1** on `#FFFFFF` (verified via `src/lib/contrast.ts`).
  A single token can't serve both this white-surface pairing and the teal-surface green pairings
  below; they move in opposite directions.

### N9. NGO Partners form labels green on the dark teal panel

- **Where:** NGO Partners (`/ngo/partners`) "Become a Partner" form — the seven green field
  labels (`.partners-form__label`) on the teal panel (`.ngo-partners-form`).
- **Measured:** green `#007f0e` 18px on `#0e3e40` = **2.26:1**. 18px/400 normal text, needs
  4.5:1 — misses.
- **Why kept as-is:** `#007F0E` is the confirmed label fill and `#0E3E40` the confirmed panel
  fill (nodes under 7434:9542) — source-design values.
- **Allowlist:** `['partners-form__label','ngo-partners-form']`. The `ngo-partners-form` class
  scopes the teal panel so the shared `partners-form__label` class can't swallow the Consultancy
  Partners labels, which are orange on violet and pass at **5.11:1** (not allowlisted).
- **Future-fix direction:** lighten the green for the dark surface, as N6 — `#66b26e` →
  **4.58:1** on `#0E3E40` (`src/lib/contrast.ts` `lightenToContrast`, clearing the 4.5 normal
  threshold this small text needs).

### N10. NGO Partners green heading-accent ("Partner") on the dark teal panel

- **Where:** NGO Partners (`/ngo/partners`) heading "Become a **Partner**" — the bold-italic
  green accent run (`.u-accent-em`) on the teal panel (`.ngo-partners-form`).
- **Measured:** green `#007f0e` bold 48px on `#0e3e40` = **2.26:1**. 48px bold _is_ "large text",
  so only 3:1 is required — but it still misses (same as N7 on NGO Home).
- **Why kept as-is:** `#007F0E` is the confirmed `characterStyleOverrides` accent colour (node
  under 7434:9542, override index 4) on the confirmed teal panel — source-design values.
- **Allowlist:** `['u-accent-em','ngo-partners-form']`. The same green accent inside the
  Consultancy Partners form is orange on violet and passes (not allowlisted).
- **Future-fix direction:** lighten as N7 — `#66b26e` → **4.58:1** on `#0E3E40` (well past the
  3:1 this large text needs).

### N11. NGO About breadcrumb ("HOME / ABOUT") orange on white

- **Where:** NGO About (`/ngo/about`) page-header breadcrumb `.about-breadcrumb`. Unlike the
  Partners page's identical-looking breadcrumb (a duplication artifact, tracked separately as
  N8), "HOME / ABOUT" is the _correct_ text here — About really is one level under Home.
- **Measured:** orange `#e65320` bold 18px on `#ffffff` = **3.73:1**. 18px/700 is under the
  18.66px large-text bold cutoff, so the 4.5:1 normal threshold applies and it misses —
  identical pairing to N3/N8.
- **Why kept as-is:** `#E65320` is the confirmed breadcrumb fill (node 7958:30346) — the NGO
  eyebrow/kicker colour, a source-design value shipped as designed (CLAUDE.md #2 exception).
- **Allowlist:** `['about-breadcrumb']` (About-only class; distinct from Partners'
  `partners-breadcrumb` so neither page's marker can swallow the other's node).
- **Future-fix direction:** darken the eyebrow orange for small text on white, exactly as
  N3/N8 — `#c4471b` (accent-warm × 0.85) → **4.92:1** on `#FFFFFF` (`src/lib/contrast.ts`).

### N12. NGO Program breadcrumb ("HOME / PROGRAMS") orange on white

- **Where:** NGO Program (`/ngo/program`) page-header breadcrumb `.program-breadcrumb`. Unlike
  the Partners page's breadcrumb (a duplication artifact, N8), "HOME / PROGRAMS" is the _correct_
  text — Programs really is one level under Home (same as About's N11).
- **Measured:** orange `#e65320` bold 18px on `#ffffff` = **3.73:1**. 18px/700 is 13.5pt bold,
  under the 18.66px/14pt large-text cutoff, so the 4.5:1 normal threshold applies and it misses —
  identical pairing to N3/N8/N11.
- **Why kept as-is:** `#E65320` is the confirmed breadcrumb fill (node 7958:30364) — the NGO
  eyebrow/kicker colour, a source-design value shipped as designed (CLAUDE.md #2 exception).
- **Allowlist:** `['program-breadcrumb']` (Program-only class; distinct from `about-breadcrumb`
  and `partners-breadcrumb` so no page's marker can swallow another's node).
- **Future-fix direction:** darken the eyebrow orange for small text on white, exactly as
  N3/N8/N11 — `#c4471b` (accent-warm × 0.85) → **4.92:1** on `#FFFFFF` (`src/lib/contrast.ts`).

### N13. NGO Program green "Learn more" links on the dark teal Partner-Programs cards

- **Where:** NGO Program (`/ngo/program`) — the `btn--link` "Learn more" inside each of the three
  deep-teal Partner-Programs cards (`.partner-programs__card`). These have no fill (link variant),
  so the existing `['btn--secondary']` entry doesn't reach them — same situation as NGO Home's N6.
- **Measured:** green `#007f0e` normal 18px on `#0e3e40` = **2.27:1**. Needs 4.5:1 — the same
  green-on-teal pairing as N1/N6/N9.
- **Why kept as-is:** `#007F0E` is the confirmed "Learn more" label colour (node under 7447:6518)
  on the confirmed teal card fill `#0E3E40` — source-design values.
- **Allowlist:** `['partner-programs__card','btn--link']` — the Program-only card class scopes it
  so the Home `programs__card` / Consultancy `services__card` links can't be swallowed.
- **Future-fix direction:** lighten the green for the dark surface, as N6 — `#66b26e` →
  **4.58:1** on `#0E3E40` (`src/lib/contrast.ts` `lightenToContrast`). Shared with N14 via a
  surface-aware CTA/link value in the NGO inverse flip block.

### N14. NGO Program green heading-accent ("Now") on the dark teal Contact panel

- **Where:** NGO Program (`/ngo/program`) Contact heading "Contact Us **Now**" — the bold-italic
  green accent run (`.u-accent-em`) on the teal panel (`.program-contact`). Standard NGO
  heading-accent (green), confirmed via `characterStyleOverrides` (index 4, #007F0E) — not an
  inversion.
- **Measured:** green `#007f0e` bold 48px on `#0e3e40` = **2.27:1**. 48px bold _is_ "large text",
  so only 3:1 is required — but it still misses (same as N7/N10).
- **Why kept as-is:** `#007F0E` is the confirmed accent-run colour (node 7447:6446, override
  index 4) on the confirmed teal panel fill — source-design values.
- **Allowlist:** `['u-accent-em','program-contact']`. The `program-contact` panel class scopes it
  so the Home/Partners `u-accent-em` entries (`cta__panel`/`ngo-partners-form`) stay distinct, and
  the same green accent on this page's white sections isn't touched.
- **Future-fix direction:** lighten as N7 — `#66b26e` → **4.58:1** on `#0E3E40` (well past the
  3:1 this large text needs).

### N15. NGO Program muted form labels (#69A4B8) on the dark teal Contact panel

- **Where:** NGO Program (`/ngo/program`) "Contact Us Now" form — the seven field labels
  (`.program-contact__label`) on the teal panel. Unlike the NGO Partners form (whose labels are
  green #007F0E, N9), these are a **muted teal-blue #69A4B8** — a colour unique to this page.
- **Measured:** `#69a4b8` normal 18px on `#0e3e40` = **4.27:1**. 18px/400 is normal text, needs
  4.5:1 — misses by a small margin (the closest-to-passing NGO gap so far).
- **Why kept as-is:** `#69A4B8` is the confirmed label fill (nodes under 7447:6451) on the
  confirmed teal panel `#0E3E40` — a source-design value, per the CLAUDE.md #2 exception.
- **Allowlist:** `['program-contact__label','program-contact']` — both Program-only, so no other
  form's labels can match.
- **Future-fix direction:** lighten this specific label blue toward white (dark-surface pairing).
  It's only 0.23 short, so a mild lift suffices — `#7cb2c4` (≈#69A4B8 lightened ~12% toward white)
  → **4.86:1** on `#0E3E40` (computed via `src/lib/contrast.ts`), clearing the 4.5 normal
  threshold. A page-local `--color-program-label-accessible`, since this hue isn't reused
  elsewhere.

### N16. NGO Contact breadcrumb ("HOME / PROGRAMS") orange on white

- **Where:** NGO Contact (`/ngo/contact`) page-header breadcrumb `.contact-breadcrumb`. The text
  is literally "HOME / PROGRAMS" — a duplication artifact, this time from the Program frame
  rather than About (contrast N8's source); reproduced verbatim per exact-replica-first, same
  precedent as Partners' "HOME / ABOUT" (N8).
- **Measured:** orange `#e65320` bold 18px on `#ffffff` = **3.73:1**. 18px/700 is under the
  18.66px large-text bold cutoff, so the 4.5:1 normal threshold applies and it misses —
  identical pairing to N3/N8/N11/N12.
- **Why kept as-is:** `#E65320` is the confirmed breadcrumb fill (node 7958:30383) — the NGO
  eyebrow/kicker colour, a source-design value shipped as designed (CLAUDE.md #2 exception).
- **Allowlist:** `['contact-breadcrumb']` (Contact-only class; distinct from every other page's
  breadcrumb marker so none can swallow another's node).
- **Future-fix direction:** darken the eyebrow orange for small text on white, exactly as
  N3/N8/N11/N12 — `#c4471b` (accent-warm × 0.85) → **4.92:1** on `#FFFFFF` (`src/lib/contrast.ts`).

### N17. NGO Contact info micro-labels (opacity-flattened black) on white

- **Where:** NGO Contact (`/ngo/contact`) contact-info block `.contact-info__label` — the six
  all-caps micro-labels ("HEAD OFFICE", "LAGOS BRANCH OFFICE", "JOS BRANCH OFFICE", "PHONE",
  "EMAIL", "OFFICE HOURS"). Unlike every other tracked issue, this one isn't a distinct colour
  token: each label's Figma frame carries a raw black (`#000000`) text fill _and_ `opacity: 0.5`
  on the frame itself (confirmed in node.json — e.g. node 7461:6195 for "HEAD OFFICE"), which
  Figma composites to a flat mid-grey at render time. Sampled directly off `frame.png` (the JSON
  alone only shows the pre-opacity black, which doesn't match the rendered pixels) at
  **`#7F7F7F`** — this page is new territory (no prior NGO page has an opacity-based label), so
  it isn't a copy of the existing `--color-mid-gray` (`#636366`) token, which reads visibly
  darker.
- **Measured:** `#7f7f7f` normal 14px on `#ffffff` = **4.00:1** (computed via
  `src/lib/contrast.ts`). 14px/400 is normal text, needs 4.5:1 — misses by a small margin.
- **Why kept as-is:** both the black fill and the 50% opacity are the confirmed source-design
  values (node 7461:6195 and its five siblings) — not a translation guess, and not a corrected
  "should have been a real muted-text token" fix; the CLAUDE.md #2 exception covers colours
  traced to a confirmed source, and an opacity-composited colour is still a real, confirmed
  source colour.
- **Allowlist:** `['contact-info__label']` (Contact-only class).
- **Future-fix direction:** this is a light-surface pairing needing a _darker_ effective value —
  reducing the opacity (raising the composited darkness) rather than picking a new hue is the
  most faithful fix. `rgba(0,0,0,0.6)` composites to `#666666` → **5.74:1** on `#FFFFFF`, clearing
  AA with room. Candidate: replace the ad hoc `#7f7f7f` literal with a page-local
  `--color-contact-label-accessible` once signed off, rather than a shared token (no other page
  has this opacity pattern yet).

### N18. NGO Contact green heading-accent ("Message") on the dark teal form panel

- **Where:** NGO Contact (`/ngo/contact`) heading "Send us a **Message**" — the bold-italic green
  accent run (`.u-accent-em`) on the teal panel (`.contact-form`). Standard NGO heading-accent
  (green), confirmed via `characterStyleOverrides` (index 4, `#007F0E`) — not an inversion, same
  as Program's "Now" (N14).
- **Measured:** green `#007f0e` bold 48px on `#0e3e40` = **2.27:1**. 48px bold _is_ "large text",
  so only 3:1 is required — but it still misses (same as N7/N10/N14).
- **Why kept as-is:** `#007F0E` is the confirmed accent-run colour (node 7461:5941, override
  index 4) on the confirmed teal panel fill — source-design values.
- **Allowlist:** `['u-accent-em', 'contact-form']`. The `contact-form` panel class scopes it so
  the other pages' `u-accent-em` entries stay distinct.
- **Future-fix direction:** lighten as N7/N10/N14 — `#66b26e` → **4.58:1** on `#0E3E40` (well
  past the 3:1 this large text needs).

### N19. NGO Contact muted form labels (#69A4B8) on the dark teal form panel

- **Where:** NGO Contact (`/ngo/contact`) "Send us a Message" form — the seven field labels
  (`.contact-form__label`) on the teal panel. Same muted teal-blue `#69A4B8` as Program's
  identical form shape (N15), confirmed independently against this page's own node.json (nodes
  under 7461:5944), not assumed carried over.
- **Measured:** `#69a4b8` normal 18px on `#0e3e40` = **4.27:1**. 18px/400 is normal text, needs
  4.5:1 — misses by a small margin, same as N15.
- **Why kept as-is:** `#69A4B8` is the confirmed label fill on the confirmed teal panel fill
  `#0E3E40` — a source-design value, per the CLAUDE.md #2 exception.
- **Allowlist:** `['contact-form__label', 'contact-form']` — both Contact-only, so no other
  form's labels can match.
- **Future-fix direction:** identical to N15 — lighten toward white, `#7cb2c4` → **4.86:1** on
  `#0E3E40` (`src/lib/contrast.ts`), clearing the 4.5 normal threshold.

## Checked and passing (not violations, but flagged in hand-off as "not yet verified")

- **`.hero__ngo-link`** — green `#007F0E` text/border on the mint badge
  (`rgb(153 204 159 / 0.75)`) floating over the hero visual. Not present in the axe violation
  list for either route — passes as rendered (the actual composited background under the badge
  reads lighter than a flat-white worst case would suggest).

- **`.team-card__name` / `.team-card__role`** (`TeamCard.astro`, on `/` and `/team`) — white
  caption text over a portrait, backed by the design's confirmed treatment: a progressive
  backdrop blur (0 → 32px) plus a scrim topping out at `rgb(0 0 0 / 0.32)`. **Not measurable by
  axe** — it cannot compute a contrast ratio against a raster image behind a `backdrop-filter`,
  so this returns an `incomplete` result, never a violation, and needs no `KNOWN_CONTRAST_ISSUES`
  entry. Flagged because it is genuinely unverified rather than verified-and-waived: legibility
  depends on the photograph behind it, and every card currently shows the same placeholder
  portrait (which the blur + scrim handle comfortably). **Re-check by eye when real headshots
  land** — a light or high-contrast background behind the name could fall below AA with no
  automated gate to catch it. The scrim value itself is design-confirmed
  (node 8090:7151, `fills[1]` at `opacity: 0.32`), so the fix if needed is a deeper scrim on
  this component alone, not a token change.

## Lighthouse CI

`lighthouserc.json`'s `categories:accessibility` gate is temporarily `0.96` (was `1`) —
Lighthouse's own accessibility audit hits the same `color-contrast` findings above (it also
runs axe-core under the hood) and lands at a consistent `0.96` across all 3 runs on every route,
including the NGO ones — `/ngo`, `/ngo/styleguide`, `/ngo/partners`, `/ngo/about`,
`/ngo/program`, and `/ngo/contact` all land at exactly `0.96` too (color-contrast is a single
weighted audit, so the extra NGO findings — N8–N10 on Partners, N11 on About, N12–N15 on Program,
and N16–N19 on Contact included — don't drop it further). This isn't a separate
gap; it's the same tracked list surfacing in a second tool. **Restore `minScore` to `1`
in the same commit that closes out the contrast issues above** — if the score is still below 1 at
that point, something regressed and the gate should catch it.

## Non-colour a11y status

Everything else axe checks (landmarks, heading order, labels, keyboard path, `aria-current`
semantics, focus visibility, `prefers-reduced-motion`) is clean on every route, NGO Home
included — `color-contrast` is the _only_ rule and the listed selectors the _only_ nodes
currently allowlisted. See `KNOWN_CONTRAST_ISSUES` in `tests/a11y.spec.ts` for the enforced list.
