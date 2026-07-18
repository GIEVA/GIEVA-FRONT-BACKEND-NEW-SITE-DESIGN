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

## Open issues (7)

All measured via `@axe-core/playwright` (WCAG 2 AA, `color-contrast` rule) against the built
Home (`/`), `/styleguide`, and (issues 6–7, added in the Services build) `/services` routes,
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

### 6. `.service-detail__lead` — bold-italic accent-warm hook sentence on white

- **Where:** Services (`/services`) only — the HEALS-content "about" paragraphs' lead sentence
  ("Studying abroad shouldn't come down to who you know."), on both the HEALS and Admission
  Processing sections (they share the same source copy — see
  `docs/consultancy-build-plan.md` Phase 2 notes).
- **Measured:** `#e65320` bold italic 18px on `#ffffff` = **3.73:1**. Needs 4.5:1 (18px bold is
  still under the 18.66px large-text cutoff).
- **Why kept as-is:** `#E65320` is the confirmed real `characterStyleOverrides` colour for this
  run in Services' `node.json` (8119:8150 / 8216:9385) — the same accent-warm value as every
  other issue here, not a new guess.
- **Future-fix direction:** same pairing/direction as issue #3 (accent-warm foreground on a
  light surface) — darken to `#c4471b` (0.85×) → **4.92:1**. Can share that token.

### 7. `.service-detail__cost-highlight` — bold-italic accent-warm cost amount on white

- **Where:** Services (`/services`) only — the "$100" lead-in on the HEALS and Admission
  Processing sections' "What it costs" line. The other three sections' cost copy has no
  highlighted run (confirmed via `characterStyleOverrides` being empty on those text nodes),
  so this is only 2 of the 5 sections.
- **Measured:** `#e65320` bold italic 18px on `#ffffff` = **3.73:1**. Needs 4.5:1. Identical
  pairing to issue #6 (same font size/weight, same colour, same white background) — just a
  different run of text.
- **Why kept as-is:** same confirmed `characterStyleOverrides` colour (8145:8498), not a guess.
- **Future-fix direction:** identical to #6 — `#c4471b` (0.85×) → **4.92:1**, same shared token.

## Checked and passing (not violations, but flagged in hand-off as "not yet verified")

- **`.hero__ngo-link`** — green `#007F0E` text/border on the mint badge
  (`rgb(153 204 159 / 0.75)`) floating over the hero visual. Not present in the axe violation
  list for either route — passes as rendered (the actual composited background under the badge
  reads lighter than a flat-white worst case would suggest).

## Lighthouse CI

`lighthouserc.json`'s `categories:accessibility` gate is temporarily `0.96` (was `1`) —
Lighthouse's own accessibility audit hits the same 5 `color-contrast` findings above (it also
runs axe-core under the hood) and lands at a consistent `0.96` across all 3 runs on both `/`
and `/styleguide`. This isn't a separate gap; it's the same tracked list surfacing in a second
tool. **Restore `minScore` to `1` in the same commit that closes out issues 1–5 above** — if
the score is still below 1 at that point, something regressed and the gate should catch it.

## Non-colour a11y status

Everything else axe checks (landmarks, heading order, labels, keyboard path, `aria-current`
semantics, focus visibility, `prefers-reduced-motion`) is clean on both routes — these 5 are
the _only_ rule (`color-contrast`) and the _only_ selectors currently allowlisted. See
`KNOWN_CONTRAST_ISSUES` in `tests/a11y.spec.ts` for the enforced list.
