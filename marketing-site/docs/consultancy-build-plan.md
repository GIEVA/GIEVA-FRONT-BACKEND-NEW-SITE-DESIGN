# Consultancy site — phased build plan

> Execution plan for building the GIEVA **Consultancy** site from Figma to verified,
> accessible Astro pages. Read this at the start of every build session. It is the durable
> hand-off record — context resets between sessions, this file does not.
>
> Companion docs: `WORKFLOW.md` (master architecture), `TOKENS.md` (token audit),
> `CLAUDE.md` (orientation).

## Operating principle — accurate _and_ fast

Two goals held at once: **exact-replica parity** and **speed with minimal check-ins**. We get
both by **decoupling cheap work from expensive work**:

- **Ingestion is cheap** (context-light): run the fetch helper, commit the materialised
  design. Done once, up front, for all pages.
- **Implementation is expensive** (context-heavy): one page per session, so quality never
  degrades near a session's context limit.

Because all node IDs and design data are captured up front, implementation sessions are
**autonomous** — they never wait on the user or re-fetch. Each session ends with a verified,
committed page and an updated status table below.

## Source file

- **Figma file key:** `fTqnnV20l9htP7vFJrOsvn` (file: "MARVE PAGE 1 (Copy) (Copy)")
- **Brand:** Consultancy (`data-brand="consultancy"`, primary electric violet `#581CFF`)
- **No separate mobile frames exist** — desktop frames only. Responsive behaviour is
  authored by us and flagged for sign-off per page.

## Page index & status

Statuses: `pending` → `ingested` (node.json + frame.png + assets committed) → `built` →
`verified` (parity + a11y + Lighthouse pass, route in `tests/routes.ts`).

| Page                   | Route                  | Figma node-id | Status   |
| ---------------------- | ---------------------- | ------------- | -------- |
| Home                   | `/`                    | `5891-4663`   | verified |
| About                  | `/about`               | `8181-8314`   | verified |
| Our Team               | `/team`                | `8187-8979`   | verified |
| Partners               | `/partners`            | `7385-5219`   | verified |
| Consultancy Services ★ | `/services` (template) | `8119-7174`   | verified |

### Service sub-pages (Phase 6)

| Page                     | Route                                | Figma node-id | Status |
| ------------------------ | ------------------------------------ | ------------- | ------ |
| SAT                      | `/services/sat`                      | `8119-8722`   | built  |
| ACT                      | `/services/act`                      | `8119-8171`   | built  |
| TOEFL                    | `/services/toefl`                    | `8119-8977`   | built  |
| IELTS                    | `/services/ielts`                    | `8119-9179`   | built  |
| GRE                      | `/services/gre`                      | `8119-9387`   | built  |
| Professional Development | `/services/professional-development` | `8145-8502`   | built  |

`built`, not `verified`: everything except the CI visual-regression baselines has passed
(`npm run verify:local`, the a11y gate, and per-frame parity measurement). Baselines must be
generated in the pinned container — see the hand-off note at the end of this file.

★ **Reusable template.** Other sub-pages beyond these five are riffs off the Consultancy
Services page, so build it component-first — a content-driven template — so the riffs are
near-free later.

Full URLs (all same file):
`https://www.figma.com/design/fTqnnV20l9htP7vFJrOsvn/MARVE-PAGE-1--Copy---Copy-?node-id=<id>`

## Phases

Each **page phase = one session**. Small pages may pair up only if context clearly allows.

### Phase 0 — Ingestion + foundation

1. **Harden the fetch helper** (`scripts/figma-fetch.mjs`): also export child **vector nodes
   as SVG** and **image fills as PNG/WebP** into `design/figma/<key>/<node>/assets/`. Without
   this, icons/photos aren't captured and parity is only skin-deep.
2. **Ingest all 5 nodes** → commit `node.json` + `frame.png` + `assets/` for each. Mark each
   row above `ingested`.
3. **Author the consultancy theme layer**: Style Dictionary (or hand-authored CSS custom
   properties) for primitives → semantic tokens (`TOKENS.md` §2/§4), scoped under
   `[data-brand="consultancy"]`. Confirm values against the ingested `node.json`, not guesses.
4. **Build the shared shell** every page reuses: site header + primary nav, footer, and any
   global layout wrappers. Finalise `BaseLayout` styling off the token layer.
5. **Stand up `/styleguide`** (consultancy) showing tokens, type scale, and shell components.
6. **Verify** the styleguide + shell against the verification checklist below.

Deliverable: design system + shared components + all raw design committed. Pages build fast
after this.

#### Phase 0 — session status (branch `claude/quirky-lovelace-aqqd1c`)

**Done and verified (repo green: `npm run verify` + `npm run lhci` both pass):**

- **[0.1] Fetch helper hardened.** `scripts/figma-fetch.mjs` now also exports, under
  `design/figma/<key>/<node>/assets/`: **named icon/graphic nodes as SVG** (deduped by name —
  a real page has thousands of anonymous "Vector" path fragments, which are noise; raw vectors
  are opt-in via `--all-vectors`), every raster **image fill as PNG** (native res via
  `/files/:key/images`) **plus a WebP** re-encode (`sharp` is present in this env, so WebP is
  produced), and an `assets/manifest.json` index. Downloads run through a concurrency pool.
  New flags: `--no-assets`, `--all-vectors`, `--max-assets`.
- **[0.2] All 5 nodes ingested.** `node.json` + `frame.png` (scale 2, ~2880px-wide) +
  `assets/` committed for every page (`design/figma/fTqnnV20l9htP7vFJrOsvn/<node>/`). The
  captured icons are the real reusable graphics (partner logos, social/mail icons, LOGO); the
  fills are the page photography. **Note:** the materialised design dir is ~95 MB (scale-2
  frames dominate). Acceptable for a committed parity reference; if repo weight becomes an
  issue, move `design/figma/**` to Git LFS or re-fetch frames at `--scale 1` (native 1440px).
- **[0.3] Consultancy token layer authored.** `src/styles/tokens.css` — primitives →
  semantic roles → `[data-brand="consultancy"]` theme (TOKENS.md §2/§4). Colour + type values
  are the **materialised source of truth** (`design/tokens/gieva.source.tokens.json`), not
  guesses. Spacing/radii/breakpoints are flagged `provisional` (TOKENS.md §5 — not in Figma;
  confirm per-screen at page-build time). `src/styles/base.css` — reset, a11y primitives, type
  utilities, reduced-motion.
- **[0.4] Shared shell built.** `SiteHeader` (brand + primary `<nav>`, `aria-current`),
  `SiteFooter` (inverse surface, exercises the token text-role swap), `Button` atom
  (`<a>`/`<button>`, themed), `src/lib/nav.ts`. `BaseLayout` finalised off the tokens and now
  renders the shell on every route.
- **[0.5] `/styleguide` (consultancy) stood up.** Primitives, semantic roles, **measured WCAG
  contrast grades** (`src/lib/contrast.ts`), type scale, spacing, buttons (light + inverse),
  shell. Added to `tests/routes.ts`.
- **[0.6] Verified.** axe (WCAG 2.2 AA) green on `/` and `/styleguide`; visual baselines
  committed at **desktop / tablet / mobile** (`tests/visual.spec.ts` now multi-viewport);
  Lighthouse budgets pass (perf/a11y/best-practices/seo). Baselines generated against Playwright
  1.61.1 Chromium — the same build as CI's `playwright:v1.61.1-noble` container.

**Next session — before building any page:** the token layer's colour + type values are the
materialised plugin export and are trustworthy, but **spacing, radii, and per-section colour
usage were authored provisionally** (TOKENS.md §5). Now that `node.json` is committed for every
page, the first job of each page session is to **confirm those against the real node tree**
(read exact paddings/gaps/radii off `node.json`, snap the provisional `--space-*`/`--radius-*`
scale to what the design actually uses) rather than trusting the placeholder scale. The
`assets/` icons + fills are ready to wire in.

### Phases 1–5 — one page each

Recommended order (build the template early so riffs are cheap):

1. **Home** (`/`) — richest page; establishes hero + section patterns and most components.
2. **Consultancy Services** (`/services`) — the reusable template; build content-driven.
3. **About** (`/about`)
4. **Our Team** (`/team`)
5. **Partners** (`/partners`)

Per page, every session:

1. Read the page's committed `node.json` + `frame.png` (+ `assets/`). Self-slice sections
   from the tree; render individual child nodes for section-level checks as needed.
2. Build the page against the established tokens + shell components. Zero client JS by
   default; islands opt in only where genuinely needed (progressive enhancement).
3. Run the **verification checklist**.
4. Add the route to `tests/routes.ts`, generate its visual baseline, update this file's
   status table to `verified`, commit and push.

#### Phase 1 — session status (Home, `/`)

**Done and verified (`npm run verify` + `npm run lhci` both pass):**

- Spacing/radii/type scale in `src/styles/tokens.css` snapped to real values read off Home's
  `node.json` (5891:4663) — see the file's header comment for the full audit (new `--type-hero`,
  `--type-section-title`, `--type-body-lg`, `--type-eyebrow` roles; `--color-accent-warm`
  repointed to `--color-orange` `#E65320`, confirmed as the real fill on every button/CTA on the
  page).
- Shared shell rebuilt against the real design: `SiteHeader` (floating glass-pill nav),
  `SiteFooter` (4-column dark footer), `Button` (primary/secondary/link variants, real 8px
  radius).
- Full Home page built: hero, trusted-partners marquee, who-we-are + stats, consultancy
  services, core team, testimonials, FAQ accordion, CTA banner — all 7 sections, content
  transcribed from `node.json` text runs.
- Visual baselines regenerated for `/` and `/styleguide` at desktop/tablet/mobile (the Phase 0
  baselines were stale placeholders from before Home existed).
- Lighthouse budgets pass at the (adjusted, see below) accessibility threshold; performance/
  best-practices/SEO all still ≥0.9 unchanged.

**Findings worth carrying into later page sessions:**

- **"Our Team" and "Partners" are not linked from the real header/footer nav.** Confirmed
  against `node.json`, not an oversight — the 5-page build-plan list above includes them as
  pages to build, but nothing in the live header/footer nav points at `/team` or `/partners`.
  Worth a deliberate call when those pages come up: build them as unlinked routes (still valid,
  still tested) or reconsider whether they belong in `primaryNav`/`footerColumns`
  (`src/lib/nav.ts`).
- **Accent-warm and the `--type-body-lg` role were both corrected mid-build**, not just added —
  `--type-body` (14px) turned out to be reserved for micro-labels, and the accent colour was
  originally mapped to the wrong orange primitive. Both are now confirmed from real fill/text
  data, not guesses, but worth double-checking on sight for the next few pages until confidence
  is high that no other Phase-0-era placeholder mappings are hiding.

**Known gap — colour contrast (deliberately deferred, not overlooked):** axe found 5 real WCAG
AA `color-contrast` violations, all traced to the source design's actual button/link/eyebrow
colours (not translation bugs). Per client direction, these ship as-designed rather than getting
an ad-hoc darkened/lightened token forced in ahead of a real design decision. Tracked in full —
measured ratios, affected selectors, and computed future-fix values — in
**`docs/a11y-known-issues.md`**. `tests/a11y.spec.ts` encodes the same list as a narrow,
selector-matched allowlist (only these 5 known nodes are exempted; any other contrast issue, or
any other rule, still fails the build). `lighthouserc.json`'s accessibility `minScore` is
correspondingly `0.96` instead of `1` for the same reason — restore both together when the
underlying colours are actually fixed. This is very likely to recur on later pages (same
`Button`/eyebrow components); check new pages against the same doc rather than re-deriving the
math each time.

#### Phase 2 — session status (Consultancy Services ★, `/services`)

**Done and verified (`npm run verify` + `npm run lhci` both pass):**

- Built against Services' `node.json` (8119:7174) as a **content-driven, component-first**
  template, per the build plan's ★ note:
  - `src/lib/services-content.ts` — the page's content as typed data (`ServiceDetail[]`),
    entirely separate from markup/styles.
  - `src/lib/services-images.ts` — the hero photo asset import (mirrors `home-images.ts`).
  - `src/components/ServiceDetailSection.astro` — the repeating "title → about/covers → cost"
    block, extracted as its own component (not inlined 5×) so future sub-page riffs reuse it
    directly.
  - `src/pages/services.astro` — hero + the 5 sections + CTA banner, assembled from the above.
- **No token-layer gaps found.** Every spacing/radius/gap value Services uses (80px between a
  section's title/body/cost blocks, 40px column gap, 24px within a block, 120px page rhythm,
  64px side padding) was already in the scale Home snapped in Phase 1 — confirmed against
  Services' own `node.json`, not assumed. Two useful additions to the token _audit_ (not new
  tokens, just newly-exercised existing ones): `.u-h3` (40/48/700/0) for section titles and
  `.u-lead` (24/32/700/-1.2) for sub-headings — both existed in `tokens.css`/`base.css` since
  Phase 0/1 but neither had been used by a page until now.
- **Hero title** ("Study Abroad") uses a one-off combination not captured by any named type
  role: `--font-size-hero` (64px) paired with `--line-height-h2`/`--letter-spacing-h2`
  (56px/-0.26), not the hero role's own 72px/-3.3. Composed from existing primitives directly
  in `services.astro` rather than adding a new named role for a single page's title.
- **Two real content patterns confirmed via `characterStyleOverrides` in node.json, not
  guessed:** a bold-italic accent-warm "hook sentence" leading the HEALS-content about
  paragraphs, and the same treatment on the "$100" cost amount. Both required close reading of
  the raw JSON — the rendered `frame.png` alone doesn't distinguish "styled span" from "just
  the next sentence."
- **Content duplication is real, not a bug:** "Admission Processing" and "Tuition & Acceptance
  Fee Payments" repeat another section's about/covers copy word-for-word in the source
  `node.json` — same not-yet-personalised placeholder pattern as Home's team/testimonials.
  Documented in `services-content.ts`'s header comment, kept as-is.
- Route added to `tests/routes.ts`; visual baselines generated at desktop/tablet/mobile.

**Two new colour-contrast issues, handled per CLAUDE.md's known-gaps workflow (not a
regression — same confirmed accent-warm colour as issue #1, just two new selectors):**

- `.service-detail__lead` and `.service-detail__cost-highlight` — the same two bold-italic
  accent-warm runs above, at 18px on white — measure 3.73:1, same as every other accent-warm
  text-on-light-surface pairing already tracked. Logged as issues #6/#7 in
  `docs/a11y-known-issues.md`, allowlisted in `tests/a11y.spec.ts`.
- Issue #5 (`.u-eyebrow` on the CTA card's dark surface) already existed for Home, but its
  marker (`['u-eyebrow', 'cta__text']`) turned out to be accidentally Home-specific — it relied
  on axe needing extra ancestor context to disambiguate Home's _six_ eyebrows on one page;
  Services has one, so axe's target selector never mentions `cta__text`. Re-pointed the marker
  at `cta__card` (the actual element axe reports as the inverse-surface ancestor), which is
  present on both routes. No new visual/behavioural change, just a more robust match.
- Lighthouse's accessibility score stayed at the existing `0.96` — no further threshold
  lowering needed.

**Pre-existing test-infra bug found and fixed (unrelated to Services, but blocked "verify
fully green" so fixed in this session):** `tests/visual.spec.ts`'s `home @ desktop` baseline
was intermittently flaky — reproduces on the unmodified Phase 1 commit too (confirmed via a
throwaway `git worktree` at `968ea7a`), so this predates Services and isn't something the
Services build introduced. Root cause: Astro's `<Image>` defaults to `loading="lazy"`, and a
full-page screenshot's own internal scroll races the lazy fetch (and, less often, the async
decode) for images the scroll only _just_ brought into view — worse the more images a page has
(Home has ~20; this is why Services, with one, hit it far less often but wasn't fully immune
either, confirmed by also catching a rare Services hero-photo flake mid-session). Fixed with a
`waitForImages()` helper in `visual.spec.ts`: scroll down in steps (not one jump) so the
IntersectionObserver has a chance to fire at each, then poll `img.complete` — but only for
images actually reachable within the viewport width. That last part matters: Home's partners
marquee is wider than the viewport inside an `overflow: hidden` track, so the tail end of the
real logos and the entire `aria-hidden` duplicate copy sit permanently off-screen and
legitimately never load under a static (non-animated) capture — waiting on those hangs
forever, which is what earlier attempts at this fix (see commit history) kept tripping over.
All Home/styleguide/services baselines regenerated against the fixed harness; stress-tested
~15 repeated runs of the full visual suite with zero failures before treating it as solid. A
`reducedMotion` context-option experiment along the way turned out unnecessary once the real
(image-loading) root cause was fixed, and was reverted rather than kept as unneeded surface
area.

**Findings worth carrying into later page sessions:**

- The `.u-h3`/`.u-lead` type roles (defined since Phase 0/1, unused until now) are confirmed
  real and ready to reuse — check new pages against them before assuming a gap.
- Confirm any bold-italic accent-warm run against `characterStyleOverrides` before assuming
  plain text — this is now the second page (after Home's `.u-accent-em` heading spans) where
  the design uses this treatment, and it's easy to miss by eye alone.
- The `ServiceDetailSection` component is the reusable unit the ★ template note anticipated;
  About/Team/Partners riffing off Services should check whether their own repeating content
  shapes fit it before inventing a new pattern.
- SiteHeader's nav-item carets render on all 4 primary-nav items in the shared component, but
  Services' own `node.json` shows the "Resource" item's caret `visible: false` (Consultancy/
  About/Services carets are `visible: true`). Not changed here — reusing the shared shell
  as-is per this session's brief — but worth a deliberate look (confirm against Home's own
  node.json too) before assuming it's Services-specific noise.

#### Phase 3 — session status (About, `/about`)

**Done and verified (`npm run verify` + `npm run lhci` both pass):**

- Built against About's `node.json` (8181:8314) as page-local markup + content consts
  (`src/pages/about.astro`, `src/lib/about-images.ts`) — not the ★ template component. Checked
  `ServiceDetailSection` for reuse first, per the Phase 2 hand-off note: declined, and said why
  in the page's header comment — Vision/Mission and Core Values are a simpler single
  heading + single paragraph per item, not the title+subtitle/about-covers-cost shape the
  component encodes.
- Sections: hero (photo + "Who We Are"), Our Story (heading + 2-col paragraphs + a 4-stat row),
  Vision/Mission (2-col), Core Values (5 items in a 2-col grid, last cell naturally empty), and
  the same CTA banner as Home/Services.
- **Two genuine token-usage findings, confirmed against About's own `node.json`, not assumed
  from Home/Services precedent:**
  - About's recurring section headings ("Our Story", "Vision", "Mision", "Core Values") and its
    stat numbers use **`--type-h2`/`u-h2`** (48/56/700/-0.26), not `--type-section-title`
    (same 48/56/700 metrics but the -3.3 display tracking) that Home/Services use for their
    equivalent recurring headline — and they're `--color-text-default`, not violet. `u-h2` was
    previously only exercised by Home's stat-card numbers; this is its first use as a heading
    role. Worth checking per-page rather than assuming every "big recurring heading" is
    `u-section-title`/violet.
  - The 4 stat labels ("Lives Changed", "Global Partners", …) are 18px **bold**, **zero**
    tracking — a combination no existing named role covers (`u-body-lg` is 400 weight/-0.16
    tracking, `u-eyebrow` is 14px). Composed directly from existing primitives in the page's
    own `<style>` block, same precedent as Services' one-off hero-title composition — not worth
    a new named role for one use.
- **Content notes confirmed via `characterStyleOverrides`/`visible`, not guessed:** the Our
  Story opening sentence ("Global Integrated Education Volunteers Association (GIEVA)") is
  **plain bold**, not the bold-italic accent-warm "hook sentence" pattern Home/Services use
  elsewhere — a real distinction, not an inconsistency to fix. "Mision" (the mission heading) is
  a genuine spelling error in the source design, reproduced verbatim per exact-replica-first.
  Every section's hidden placeholder body paragraph (`visible: false` on the parent, same
  boilerplate seen elsewhere) was omitted, same as Home's hidden headings.
- **No new colour-contrast issues.** `tests/a11y.spec.ts` passed on `/about` with zero new
  allowlist entries needed — the CTA banner's buttons/eyebrow are covered by the existing
  class-based (`btn--primary`/`btn--secondary`/`u-eyebrow`+`cta__card`) allowlist entries, and
  everything else on the page (plain body/heading text on white) clears AA outright.
  `docs/a11y-known-issues.md` is unchanged this session.
- Route added to `tests/routes.ts`; visual baselines generated at desktop/tablet/mobile
  (`about-{desktop,tablet,mobile}.png`); Home/Services/styleguide baselines confirmed unchanged
  (no diff) in the same run.

**Findings worth carrying into later page sessions:**

- Don't assume every page's recurring section heading is `u-section-title`/violet just because
  Home and Services both use it that way — About shows a real second pattern (`u-h2`/
  text-default). Confirm per page.
- One-off type combinations (bold/zero-tracking labels, etc.) that don't match a named role are
  cheap to compose directly from primitives in the page's own `<style>` — now precedent on a
  third page (Services' hero title, Services' cost-row empty cell technique, About's stat
  labels). Don't reach for a new token or a new component prop just to name a single use.

#### Phase 4 — session status (Our Team, `/team`)

**Done and verified (`npm run verify` + `npm run lhci` both pass):**

- Built against Team's `node.json` (8187:8979 — internally still named "ABOUT PAGE
  CONSULTANCY" in the Figma layer tree, a leftover label, not a mistargeted node; content
  confirms it's the real Team page) as page-local markup + content consts
  (`src/pages/team.astro`, `src/lib/team-images.ts`) — not the ★ `ServiceDetailSection`
  template (checked first, per the Phase 2/3 hand-off note: Team's shape is a photo grid +
  the shared CTA, not a title+subtitle/about-covers-cost block).
- **Not linked from the shared header/footer nav** — per the Phase 1 finding, confirmed again
  here (Team's own `node.json` shell nodes carry the same nav as every other page, still no
  `/team` entry) — built as a valid, tested, but intentionally unlinked route, per the build
  plan's instruction.
- Sections: hero (photo + "Our Team", same shared lecture-hall stock photo and 25%-scrim
  treatment as About's/Services' heroes, reused verbatim), a 10-card team photo grid (4 + 4 +
  2, matching the source's exact row split), and the same CTA banner as Home/Services/About.
- **Three genuine findings, confirmed against Team's own node.json, not assumed from
  precedent:**
  - **No section heading precedes the team grid.** Unlike Home's "Core Team" section (eyebrow
    - `u-section-title` + paragraph intro before its 4-card row), Team's grid container has
      exactly two children in the tree — the grid and the CTA card — no heading node, hidden or
      otherwise. Confirmed by walking the full node tree, not just eyeballing `frame.png`.
      Jumps straight from the hero H1 into the grid.
  - **Card name/role typography is specified as Inter** in the source
    (name: 600/24px/28.8px/-0.48px; role: 400/16px/22.4px/0px) — a different font family from
    the site's Arial-only system (chosen in Phase 0 specifically to avoid a web-font
    load/FOUT). This exact card (same component, same imageRef, same "Julie Sande"/"Director
    General" placeholder copy) already ships on Home's Core Team section as an
    Arial-inherited approximation (font-_sizes_ matched exactly at 24px/16px; line-height/
    letter-spacing/font-family simplified). Matched that established, shipped precedent here
    for the identical repeating component rather than introduce a second font family for one
    card — composed the confirmed line-height/letter-spacing as one-off px values (same
    technique as Services'/About's one-off compositions) while keeping font-family inherited
    (Arial). Worth a deliberate look if a future page needs this card treated as a first-class
    "avatar" component rather than page-local markup.
  - **Grid gaps are two distinct values**, not one: 24px between cards in a row (`--space-md`)
    and 80px between rows (`--space-4xl`) — Home's single-row Core Team never needed a
    distinct row-gap. Both values already exist in the snapped scale; no new spacing token
    needed.
- **Content notes confirmed via node.json, not guessed:** all 10 member cards use the
  identical placeholder photo/name/role (`8108addc…`, "Julie Sande", "Director General") — the
  same not-yet-personalised pattern as Home's Core Team (4×), reproduced as-is per
  exact-replica-first. The CTA banner's button labels ("Book Consultancy" / "View all
  Services") were confirmed from the actual button-instance text nodes, not the paragraph's
  "Book Free ConsultationView All Services" copy/paste artifact trailing it (trimmed here the
  same way as Home/Services/About).
- **No new colour-contrast issues.** `tests/a11y.spec.ts` passed on `/team` with zero new
  allowlist entries needed — the CTA banner's buttons/eyebrow are covered by the existing
  class-based allowlist entries (same class names, reused verbatim), the hero heading and
  card name/role are white-on-dark/white-on-photo-scrim (comfortably clears AA), and the
  "First Step?" accent-warm run on the CTA's dark surface measures 5.11:1 at 48px bold (large
  text, needs only 3:1) — computed via the same relative-luminance formula as
  `src/lib/contrast.ts`, not eyeballed. `docs/a11y-known-issues.md` is unchanged this session;
  `lighthouserc.json`'s `0.96` accessibility threshold held exactly (not lowered further) —
  Team scored 0.96/1/0.96/1 (a11y/perf/best-practices/seo), identical to every other route.
- Route added to `tests/routes.ts`; visual baselines generated at desktop/tablet/mobile
  (`team-{desktop,tablet,mobile}.png`); full 20-test `npm run test:a11y` suite (5 routes × a11y
  - 3 viewports) confirmed green, including Home/Services/About/styleguide baselines unchanged
    (no diff) in the same run; re-ran the Team visual suite 3× in a row to stress-test for the
    documented Astro-`<Image>`-lazy-load flake (Phase 2) — zero failures, `waitForImages()` left
    untouched.

**Findings worth carrying into later page sessions:**

- Don't assume a recurring card/section pattern's typography is identical across every page it
  appears on — Team's own node.json specifies Inter for the team-card name/role where Home's
  visually-identical card was built against Arial. Confirm per page even for components that
  look like straight repeats of something already shipped.
- Not every content section has a heading, even where precedent (Home's Core Team) suggests
  one "should" be there — confirmed by walking the actual node tree, not pattern-matching off
  a sibling page's shape.
- Partners (`/partners`) is next and is the last of the five build-plan pages — expect a
  similar "confirm against its own node.json" pass for any icon/logo grid it turns out to
  need, per the same discipline used on Team, About, and Services.

#### Phase 5 — session status (Partners, `/partners`) — Consultancy build-plan complete

**Done and verified (`npm run verify` + `npm run lhci` both pass, all 6 routes):**

- Built against Partners' `node.json` (7385:5219) as page-local markup + content consts
  (`src/pages/partners.astro`, `src/lib/partners-content.ts`, `src/lib/partners-images.ts`) —
  not the ★ `ServiceDetailSection` template (checked first, per every prior phase's hand-off
  note: Partners' content — a 24-item logo/name/description directory plus a contact form —
  isn't the title+subtitle/about-covers-cost shape the component encodes).
- **Not linked from the shared header/footer nav** — confirmed again against this page's own
  `node.json` (same finding as Team in Phase 4, Home's original Phase 1 note). Built as a valid,
  tested, but intentionally unlinked route.
- Sections: hero (same shared lecture-hall photo/scrim/treatment as About/Services/Team, just
  "Strategic Partners" as the H1), a lead statement + 24-card partner directory grid, and a
  "Become a Partner" interview-form panel. **No CTA banner** — the one page of the five that
  doesn't repeat Home's/Services'/About's/Team's identical "Ready to Take Your First Step?"
  block; confirmed by walking the tree, not assumed.
- **Grid ordering bug avoided by reading Figma's own positioning data, not document order:**
  the 24-card grid is Figma's `GRID` auto-layout mode with **manual** per-card
  `gridRowAnchorIndex`/`gridColumnAnchorIndex` — document/array order is NOT visual order.
  "CoLab Innovation Hub" sorts last in the raw document (added/edited after the rest) but is
  manually positioned into row 1. Built from a (row, col)-sorted list in
  `partners-content.ts` so the DOM/reading order matches what's actually seen.
- **Typography findings, confirmed against Partners' own node.json:**
  - The lead sentence ("Together, GIEVA…") is `.u-h3` (40/48/700/0; the source's own
    ~46px auto line-height isn't a bound variable, same "rounds to the nearest role"
    precedent as prior one-offs) — but coloured `--color-violet` directly, a genuinely new
    usage of that primitive as _light-surface text_ (previously dark-surface-background only).
  - "Become a Partner" is `.u-section-title` (48/56/700/-3.3) — the _other_ named 48px pattern,
    matching Home's/Services' recurring-headline usage rather than About's `.u-h2` finding.
    Confirmed per-page as the build plan instructs, not assumed from either precedent.
    "Partner" is a bold-italic accent-warm run (`characterStyleOverrides` override index 4) —
    the same hook-sentence pattern as every other page, rendered with the existing
    `.u-accent-em` utility.
  - Each of the 24 card names is 18/24/700/0 — bold, zero tracking, a combination no existing
    role captures (`.u-body-lg` is 400/-0.16) — composed from existing primitives
    (`--font-size-underline`, `--line-height-underline`, `--letter-spacing-none`,
    `--font-weight-bold`), no new token. Card descriptions match `.u-body-lg` exactly.
  - **A divider almost missed:** each card's name sits under a 5px accent-warm top border
    (`individualStrokeWeights.top: 5` on the heading's own frame, paired with its
    `paddingTop: 24`) — invisible in a first read of the node tree's text/fill properties,
    only found by comparing the rendered build against `frame.png` pixel-for-pixel and
    noticing the divider line the first draft was missing. Worth flagging: **node.json alone
    can miss real visual elements that live in stroke/border properties rather than fills** —
    the frame.png comparison step in the verification checklist caught what a JSON-only read
    didn't.
- **Layout findings confirmed against node.json, not assumed:**
  - `gridColumnGap`/`gridRowGap` are both exactly 84px — a genuine new spacing value (not in
    the existing scale), confirmed by `(1312 − 3×84) / 4 = 265px` matching every card's own
    bounding-box width exactly. Composed as a page-local value, same "one-off values don't need
    a global token" precedent as every prior phase.
  - The form's label/input column gap is 122px (`itemSpacing` on every field row) — another
    one-off value, caught and corrected mid-session after an initial draft mistakenly reused
    `--space-4xl` (80px) instead.
  - **Row heights are a roughly uniform ~525-552px in the source regardless of content length**
    — confirmed by cropping `frame.png`: even Care4Water's 7-line paragraph sits in the same
    row budget as "College Board"'s 2-line one, with generous trailing whitespace below
    shorter cards. An intentional airy rhythm, not organic content-hugging. Reproduced with a
    `min-height: 520px` on each card (rather than literal per-row fixed pixel heights, which
    wouldn't translate to a responsive 2-col/1-col grid) — a deliberate engineering
    approximation of a real, confirmed visual rhythm, not a guess.
- **Content notes confirmed via node.json, not guessed:**
  - Sterling Bank's card logo (node 8000:9930) has no raster fill _and_ no named-SVG vector —
    every one of its ~40 paths is generically named "Vector", which the fetch helper's
    dedup-by-name treats as noise and skips (Phase 0 decision). Backfilled via a direct
    one-node Figma images API render (scale-4 PNG → WebP via `sharp`) rather than guessing a
    substitute logo or re-running the whole page's ingestion — see `assets/manifest.json`'s
    `notes` and `partners-images.ts`'s header comment.
  - Datadotorg's description underlines "Data.Org" (`characterStyleOverrides`,
    `textDecoration: UNDERLINE`) — rendered with the existing `.u-underline` utility.
    Care4Water's description has literal authored line breaks (not organic wrap), rendered
    with `white-space: pre-line` to honour them exactly.
  - Genuine spelling errors in the source ("paartner", "pandenic", "interract" on the EDIFACE
    card) reproduced verbatim per exact-replica-first, same precedent as About's "Mision".
  - The "Become a Partner" form (node 8000:10047) is a real 7-field `<form>` (name, company
    name, company website, industry, phone, email, message) with an explicit `<label>` per
    field, right-aligned in a shared column ahead of the input in the source. Implemented as a
    real, labelled `<form>` with no `action` yet (same progressively-enhanceable,
    no-submission-endpoint-in-scope precedent as `SiteFooter`'s newsletter form) — a single CSS
    grid (`max-content 1fr` columns) rather than 7 independent flex rows, so every label
    shares one column width exactly like the source without hand-tuning a fixed pixel width.
  - Each of the 24 org names is its own "Heading 4"/"Heading 5" node in Figma — a real (if
    inconsistently-cased) layer-naming signal, unlike Team's card name text node, which is
    literally just named after its own content ("Julie Sande") with no "Heading" designation.
    Rendered as `<h3>` for that reason — a 24-item directory benefits from real per-item
    heading navigation, and the source data itself flags these as headings. The lead sentence
    becomes the `<h2>` needed to keep heading order valid (h1 → h2 → h3×24 → h2 "Become a
    Partner") even though it isn't itself named "Heading" in the source.
- **No new colour-contrast issues** — computed by hand before the axe run
  (`accent-warm #E65320` on `violet #120633` = 5.11:1; `violet` text on white = 19.1:1; both
  clear AA outright, unlike every other page's accent-warm-on-light-surface pairings) and
  confirmed empirically: `tests/a11y.spec.ts` passed on `/partners` with zero new allowlist
  entries. `docs/a11y-known-issues.md` is unchanged this session — still the same 7 open,
  deliberately-deferred issues from Phases 1–2.
- Route added to `tests/routes.ts`; visual baselines generated at desktop/tablet/mobile.

**Two pre-existing issues found and fixed (unrelated to Partners' own content, but blocked
"verify"/"lhci" fully green so fixed in this session, same discipline as Phase 2's flaky-test
fix):**

- **`lighthouserc.json` was silently dropping a page from every Lighthouse run once the site
  passed 5 pages.** `@lhci/cli`'s `collect.staticDistDir` autodiscovery defaults
  `maxAutodiscoverUrls` to **5** (not unlimited) when no explicit `url` list is given — true at
  every phase through Team (exactly 5 pages: `/`, `/styleguide`, `/services`, `/about`,
  `/team`), so it went unnoticed. Adding Partners as the 6th page pushed the count past the
  cap, and the alphabetically-last folder (`team`) silently stopped being collected — `npm run
lhci` kept exiting 0 while quietly no longer checking `/team` at all. Fixed by adding an
  explicit `collect.url` array (all 6 routes, mirroring `tests/routes.ts`) to
  `lighthouserc.json`, which bypasses autodiscovery entirely. **This list must be updated by
  hand alongside `tests/routes.ts` every time a route is added** — plain JSON can't import the
  TS array, so keep the two in sync manually. All 6 routes now score 1/0.96/0.96/1 (perf/a11y/
  best-practices/seo) except Home's SEO (0.91) — identical pattern to every prior phase, still
  well clear of the 0.9 SEO / 0.96 a11y thresholds.
- **A stale `/styleguide` visual baseline** failed all 3 viewports with a uniform ~36px
  full-page height delta, confirmed via `git stash` to already fail identically against
  unmodified `main` (i.e., predates this session's changes entirely, not a Partners
  regression). Root cause not chased further (most likely a font-metrics micro-difference from
  whatever exact container build originally produced that baseline vs. this session's — both
  report Playwright 1.61.1 / Ubuntu Noble, the same pinned combination the README specifies).
  Regenerated in this session's container per the README's documented canonical-environment
  process, same "fix a pre-existing infra blocker found while chasing a green `verify`"
  discipline as Phase 2's `waitForImages()` fix.

**Findings worth carrying into later page/site sessions:**

- **A frame.png comparison is not optional even when node.json looks complete** — the 5px
  accent-warm card divider lives entirely in `individualStrokeWeights`/`strokes`, properties
  easy to skip past when scanning for fills and text styles. Only the side-by-side pixel
  comparison against `frame.png` caught the gap. Keep doing the visual comparison as a real
  investigative step, not a rubber stamp, on every future page (NGO site included).
  - **Recurring section headings still don't follow one universal rule** — Partners' own
    `.u-section-title` usage (not `.u-h2`) is a third data point alongside Home/Services
    (`.u-section-title`) and About (`.u-h2`); confirm per page, every time.
  - Whenever a new route pushes the total page count past a round number, **re-check
    `lighthouserc.json`'s URL coverage explicitly** — autodiscovery limits and other
    "worked fine until N+1 pages" ceilings are exactly the kind of thing that fails silently
    (exit 0, wrong scope) rather than loudly.

## Consultancy build — complete; what's next

**All 5 build-plan pages are now `verified`**: Home, About, Our Team, Partners, and the
Consultancy Services ★ template. Every route in `tests/routes.ts` passes `npm run verify`
(check + lint + format + build + a11y + visual regression) and `npm run lhci` in the canonical
Playwright container. The Consultancy site's **page-assembly phase is complete** — remaining
gaps are deliberate, tracked deferrals (7 open colour-contrast issues in
`docs/a11y-known-issues.md`, all confirmed source-design colours per client direction) rather
than unbuilt content.

#### Phase 6 — session status (service sub-pages: SAT, ACT, TOEFL, IELTS, GRE, Prof. Dev.)

Six frames ingested and built. The five test-registration frames are **one layout with different
copy**, so they are one route (`src/pages/services/[slug].astro`) over `@lib/testprep-content`;
Professional Development is its own page (two sections, Services-family spacing).

**Shared components extracted or generalised** — the sub-pages proved these are one Figma unit:

- `SubPageHero.astro` — all seven sub-page heroes carry the _same_ photo (identical `imageRef`,
  byte-identical export) and the same 25% black scrim; only the title varies, and it names the
  _category_ ("Test Registration"), not the page.
- `ServiceDetailSection.astro` — generalised from a hardcoded about/covers/cost triad to a
  generic `blocks[]`. The sub-pages' block headings are arbitrary (SAT reads "Good to know"
  where TOEFL reads "What it costs"; GRE reads "What it measures"), so only the _layout_ is
  shared. A 3-block section still leaves the grid's fourth cell empty, exactly as `/services`
  did with a hand-authored empty container.
- `RichLine.astro` + `RichText` — styled runs can appear anywhere in a line, not just at the
  start: accent-warm prices _close_ ACT/IELTS bullets, and IELTS's test-type bullets open with a
  **weight-only bold** run (no colour change) that is a genuinely different treatment.
- `CtaSection.astro` — now takes props. Its own header said to add them "the moment a page needs
  different copy"; the sub-pages all read "Ready to _Register?_" over their own body and primary
  label. Defaults are the original four pages' text, so those render unchanged (verified
  byte-identical).
- `--type-page-title` (64/56/700/−0.26) — `services.astro` recorded this as "a one-off
  combination… for a single page's title". It is on all seven sub-page heroes, so it is now a
  named role.

**Four real parity bugs found in already-`verified` work, and fixed** (this is what the targeted
pre-build design pass was for):

1. **Bullet glyphs were missing site-wide.** `base.css` strips markers from every
   `ul[role='list']`, but the source frames mark these lists `UNORDERED` and _do_ render a dot.
   Restored via `::before` and measured ink-to-ink off the frames (dot at 11.5–15px, text at
   28px, hanging indent) — rendered output now matches within half a pixel.
2. **`--line-height-h3` was 48px; every frame says 46px** (`45.99609375` = 40px × 114.99%,
   authored as a percentage). Confirmed across Consultancy Partners/Services + all six
   sub-pages **and** NGO's Program page, so it is not per-brand. Both styleguides' specimens
   repeated the wrong figure and were corrected too.
3. **The CTA body sat 16px too close to its heading.** The source nests eyebrow + heading in one
   frame at 16px and sets **32px** between that group and the body; we used a flat 16px. Confirmed
   identical on Home, `/services`, `/about` and all six sub-pages.
4. **`/services`' HEALS "about" ran three paragraphs together.** The source text node carries two
   hard newlines and measures exactly 7 lines (168px / 24px) — the accent sentence and "It's made
   for students…" each start a fresh line. Now matches the frame line for line.

**Needs client sign-off — deliberate deviations, all reproducible from the frames:**

- **SAT's block spacing was normalised from 24px to 16px.** The test-registration family is
  consistently 16px (ACT, TOEFL, IELTS, GRE); SAT alone is 24px, and is also the only one with no
  cost block and with its subtitle hidden — it reads as the first frame drawn, before the pattern
  settled. If SAT's 24px is intentional, `density` on `ServiceDetailSection` already supports it.
- **"Talk to a Councellor"** is misspelled on all six frames' secondary CTA button. **Corrected
  here to "Counsellor"** on client instruction — the double-l British form the design's own body
  copy already uses ("a quick word with a counsellor settles it", "visa counselling"), so the
  frames were internally inconsistent. This is a deliberate, approved departure from
  exact-replica; **the Figma frames still need the same fix** so the two stop disagreeing.
- **"What is X about"** carries a double space on ACT/TOEFL/IELTS/GRE (SAT's is single). HTML
  collapses whitespace so it renders identically; written single-spaced.
- **Both Professional Development sections are HEALS placeholder copy**, byte-identical to
  `/services`' HEALS section, and its CTA is SAT's copy verbatim. Only the two section titles are
  real. Same not-yet-personalised pattern already documented for Admission Processing / Tuition.
- **CTA buttons have no link targets in the design.** They point at `/book-consultancy`, matching
  the existing site-wide CTA — a route that does not exist yet, one of several pre-existing
  placeholder hrefs (`/contact`, `/login`, `/feedback`, `/privacy`, `/terms`).
- **The nav's five Study Abroad links now point at sections of `/services`**
  (`/services#heals`, `#admission-processing`, `#scholarship-advising`, `#career-guidance`,
  `#tuition-acceptance-fee-payments`) instead of 404ing on pages that were never designed —
  the design has no separate frame for any of them. Three consequences worth knowing:
  - The last id is `tuition-acceptance-fee-payments`, following the section's title in the
    design; the old slug (`/services/tuition-acceptance-fee`) did not match it.
  - `isActive` (@lib/nav) now rejects any href containing `#`, so none of the five ever get
    `aria-current="page"`. They do point at the current page when you are on `/services`, but
    five simultaneous "current page" announcements would bury the real signal on the parent
    "Services" item.
  - `.service-detail` carries `scroll-margin-top` because `.site-header` is `position: sticky`;
    without it an anchored section title lands underneath the header. Verified: the title comes
    to rest at y=144 against a header bottom edge of y=90.
- The two Professional Development links were likewise repointed, to `#teacher-training` /
  `#technology-training`, because the design has one page holding both sections.
- **Nav trade-off, accepted:** the Services dropdown now mixes real routes (test registration,
  Professional Development) with in-page anchors (Study Abroad). That is honest to the design —
  those five genuinely are not separate pages — but two of its three columns navigate
  differently from the first. Revisit if the client ever commissions frames for them.

**Observed, not changed — a shell-level parity gap worth a decision.** In every frame the site
header (98px) is drawn _over_ the hero photo; in our build it sits above it in normal flow (90px),
pushing all page content down and making each page ~90px taller than its frame. This is a Phase 0
shell decision that predates these pages and affects all 18 routes, so it was left alone rather
than changed unilaterally.

**Remaining per-frame deltas on SAT, both explained:** the section measures 590px against the
frame's 630px — 16px from the deliberate density normalisation above, and 24px from a **trailing
newline in the source text node** that renders a phantom empty line in Figma but nothing in HTML.

**Flagged for whoever picks this up next — three real candidates, not yet prioritised:**

1. **NGO site build.** Only the primary palette (`#0E3E40`) is confirmed (`CLAUDE.md`); no NGO
   pages have been ingested from Figma yet. This is the largest remaining scope — a full second
   ingestion pass (Phase 0-style) plus its own page-by-page build.
2. **`WORKFLOW.md`'s Phase 4 — enhancement/motion layer.** Per `CLAUDE.md` non-negotiable #1
   ("exact-replica first, delight second"), subtle animation/craft was deliberately deferred
   until parity sign-off. All 5 Consultancy pages are now parity-verified, so this is unblocked
   for the Consultancy site specifically.
3. **Phase 5 lived-experience a11y pass** (per `WORKFLOW.md`) — a manual/assistive-technology
   audit beyond what axe/Lighthouse automate (screen-reader walkthroughs, real keyboard-only
   navigation sessions, zoom/reflow testing), plus a deliberate look at whether any of the 7
   deferred colour-contrast issues have since gotten a real design decision to close them out.

No ranking implied between the three — whoever picks this up next should confirm with the
client/team which matters most before starting, per the session hand-off protocol below.

## Verification checklist (run every phase — non-negotiable)

Parity is verified, not eyeballed (`CLAUDE.md` non-negotiable #4).

- [ ] **Pixel parity** — Playwright renders the route at desktop (and tablet/mobile breakpoints
      we authored); screenshot diffed against the Figma `frame.png`. Investigate and resolve
      meaningful deltas; note any intentional responsive deviations for sign-off.
- [ ] **Accessibility** — `@axe-core/playwright` passes at WCAG 2.2 **AA min** (AAA where
      achievable): landmarks, heading order, full keyboard path, visible focus, contrast,
      `prefers-reduced-motion`. This is a build-time gate, not a final audit.
- [ ] **Visual regression** — route added to `tests/routes.ts`; committed baseline in the
      canonical Chromium (pinned Playwright container).
- [ ] **Lighthouse budgets** — `npm run lhci` within budget (`lighthouserc.json`).
- [ ] **`npm run verify`** — check + lint + format + build + a11y all green.
- [ ] **Commit + push** to `claude/quirky-lovelace-aqqd1c`; update the status table above.

## Session hand-off protocol

- **Start of session:** read `CLAUDE.md` → this plan → the target page's `node.json`.
- **End of session:** update the status table, commit, push. Leave the repo green
  (`npm run verify` passing) so the next session starts from a clean base.
- **Ambiguity or architectural forks:** stop and ask, rather than guessing — the cost of a
  wrong large-scale choice outweighs a check-in.

## Environment notes

- Cloud sessions ingest via `npm run figma:fetch -- "<url>"` (REST + `FIGMA_API_KEY`). The
  official Figma MCP is unavailable in cloud without an interactive OAuth + fresh session;
  Dev Mode MCP is local-only. REST reads the same node data — sufficient for the build.
- Playwright/Chromium is preinstalled (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`); never
  run `playwright install`.
