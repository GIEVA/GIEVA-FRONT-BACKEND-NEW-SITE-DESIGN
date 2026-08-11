# NGO site — phased build plan

> Execution plan for building the GIEVA **NGO** site from Figma to verified, accessible Astro
> pages. Read this at the start of every NGO build session. It is the durable hand-off record —
> context resets between sessions, this file does not.
>
> Companion docs: `consultancy-build-plan.md` (the sibling site, already complete — read it for
> the conventions this plan inherits), `WORKFLOW.md` (master architecture), `TOKENS.md` (token
> audit), `CLAUDE.md` (orientation).

## Operating principle — accurate _and_ fast

Same decoupling that made the Consultancy build work: **ingestion is cheap, implementation is
expensive.**

- **Ingestion is cheap** (context-light): `npm run figma:fetch` writes `node.json` /
  `frame.png` / `assets/` to disk **without reading them into context**, so all five pages are
  ingested in one light session.
- **Implementation is expensive** (context-heavy): capped at **one page per session** — and
  even then we never `cat` a whole `node.json`. Read `frame.png` first, then slice the tree by
  section. That discipline kept every Consultancy page inside one context window; NGO pages are
  comparable or simpler.

**Context budget:** every phase/sub-phase below is scoped to fit one session under ~200k
tokens. Ingestion sessions barely register; per-page sessions are bounded by the
read-frame-then-slice discipline. One page = one session is a hard rule.

## Source file

- **Figma file key:** `fTqnnV20l9htP7vFJrOsvn` (same file as Consultancy: "MARVE PAGE 1 (Copy)
  (Copy)")
- **Brand:** NGO (`data-brand="ngo"`, primary green **`#007F0E`** — confirmed against the real
  frame). All other colour roles are read from each page's ingested `node.json`, **not** the
  full-workspace token export (Consultancy and NGO share one flat `gieva.org` token namespace
  with no brand label, so the export can't be split mechanically — fetch is the canonical source
  of truth for NGO, per the client's own instruction).
- **Route prefix:** `/ngo/*`. The Consultancy site stays at root (`/`, `/about`, …) untouched —
  zero disruption to its 6 verified routes and their visual baselines.
- Full URLs (all same file):
  `https://www.figma.com/design/fTqnnV20l9htP7vFJrOsvn/MARVE-PAGE-1--Copy---Copy-?node-id=<id>`

## Page index & status

Statuses: `pending` → `ingested` (node.json + frame.png + assets committed) → `built` →
`verified` (parity + a11y + Lighthouse pass, route in `tests/routes.ts`).

| Page       | Route           | Figma node-id | Status   | Notes                                                                                                                                                                                                                    |
| ---------- | --------------- | ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Home       | `/ngo`          | `5990-3672`   | verified | Built Phase 1 — parity + a11y + Lighthouse pass, route in `tests/routes.ts` + `lighthouserc.json` (see Phase 1 note)                                                                                                     |
| About      | `/ngo/about`    | `7429-5025`   | built    | Built Phase 3; **rebuilt 2026-08-07** against the redesigned frame (see the Design-pass note below). a11y passes and N11 is now closed; CI visual baselines need regenerating, so not back to `verified` yet             |
| Partners   | `/ngo/partners` | `7434-8750`   | verified | Built Phase 2 — node-id confirmed correct (frame is mislabeled "ABOUT PAGE NGO" but is the real Partners page); parity + a11y + Lighthouse pass, route in `tests/routes.ts` + `lighthouserc.json` (see Phase 2 note)     |
| Program    | `/ngo/program`  | `7447-6027`   | built    | Built Phase 4; **rebuilt 2026-08-07** against the redesigned frame (see the Design-pass note below). a11y passes and N12/N13 are now closed; CI visual baselines need regenerating, so not back to `verified` yet        |
| Contact us | `/ngo/contact`  | `7461-5854`   | built    | Built Phase 5; **rebuilt 2026-08-07** against the redesigned frame (see the Design-pass note below). a11y passes, N16 is now closed and N20 opened; CI visual baselines need regenerating, so not back to `verified` yet |

> **Phase 0A note (recorded during 0B).** Phase 0A had not actually landed when 0B began — the
> `design/figma/**` tree held only the _Consultancy_ nodes, and the status table read `pending`.
> 0B re-ran ingestion for all five NGO nodes (`npm run figma:fetch`, scale 2). Four confirm by
> frame name; **`7434-8750` (planned as Partners) ingests as a second "ABOUT PAGE NGO" frame** —
> the Partners node-id in this table is suspect. Resolve it (re-open the Figma file, grab the
> real Partners frame id) at the start of the Partners build session, before assuming reuse.
> Repo-weight decision (0A step 3): frames left at scale 2 for now; revisit LFS/scale-1 if the
> `design/figma/**` dir becomes a problem.
>
> **RESOLVED (Phase 2, Partners build).** Walked the Figma file's page section (`5839:2529`,
> "GIEVA.ORG WEBSITE"): there is **no** frame literally named "PARTNERS PAGE NGO". The NGO page
> row is `HOME PAGE NGO` (5990-3672) · `ABOUT PAGE NGO` (7429-5025) · `ABOUT PAGE NGO`
> (**7434-8750**) · `PROGRAM PAGE NGO` (7447-6027) · `CONTACT US PAGE NGO` (7461-5854). The two
> "ABOUT PAGE NGO" frames are: 7429-5025 = the genuine About page ("Our Story"); **7434-8750 =
> the Partners page** ("Our Partners" + 24-logo directory + "Become a Partner" form) — the
> designer duplicated the About frame to make Partners and never renamed it. So the original
> table node-id **was correct all along**; only the frame _name_ was misleading. 7434-8750 was
> already correctly ingested (content, not name, is what matters) — **no re-fetch needed**.

## What NGO inherits (the expensive work is already done)

The Consultancy build paid the foundational cost once. NGO is largely a second theme + per-page
builds, **not** a second design system:

- **The semantic token layer is brand-agnostic** (`src/styles/tokens.css` §1–2). Components
  consume semantic roles, never primitives — brand differences live only in the
  `[data-brand='…']` value-set.
- **Shell components already exist** (`SiteHeader`, `SiteFooter`, `Button`, `SocialIcon`,
  `ServiceDetailSection`) and consume semantic tokens — so they re-theme by attribute.
- **The whole verification harness is in place**: `tests/routes.ts` (a11y + visual gate),
  `lighthouserc.json` (Lighthouse budgets), `src/lib/contrast.ts` (measured WCAG grading),
  `docs/a11y-known-issues.md` (deferred-contrast workflow).

## Phases

### Phase 0 — Foundation (two sub-sessions)

#### Phase 0A — Ingestion _(one short, context-light session)_

1. Run `npm run figma:fetch -- "<url>"` for all 5 NGO nodes → commit `node.json` +
   `frame.png` + `assets/` for each under
   `design/figma/fTqnnV20l9htP7vFJrOsvn/<node>/`. The fetch helper is already hardened
   (Consultancy Phase 0: named SVGs, image fills as PNG+WebP, `assets/manifest.json`) — no
   tooling work needed.
2. Mark each row above `ingested`.
3. **Flag repo weight.** Consultancy's materialised design dir is ~95 MB; NGO adds a similar
   amount (scale-2 frames dominate). If repo weight bites, move `design/figma/**` to Git LFS or
   re-fetch frames at `--scale 1` (native ~1440px). Note the decision here.
   - **Decision (2026-07-20):** kept default `--scale 2`, no LFS. NGO added ~66 MB (Home 25 MB,
     About 18 MB, Partners 7.1 MB, Program 15 MB, Contact 1.9 MB) → `design/figma/**` totals
     ~161 MB, working tree ~230 MB. Largest individual files are ~9.7 MB (frame.png) and
     ~9.3 MB (an image fill) — nowhere near GitHub's 100 MB hard limit, and consistent with the
     Consultancy precedent of committing raw. `git-lfs` isn't even installed in this cloud
     environment, so switching would add tooling cost with no repo-size benefit yet. Revisit if
     later phases (Phase 6 parity sweep, additional scale needs) push the repo meaningfully
     past this.
4. **Deliverable:** all raw NGO design committed. Almost no context consumed — you _may_ start
   0B in the same session if budget is clearly ample, but the safe default is to stop here.

#### Phase 0B — Theme + shell + styleguide _(one session)_

1. **Read Home's `node.json` selectively** (header, footer, hero, first section) — this grounds
   both the palette and the shell decision. Do not read the whole file.
2. **Author the `[data-brand='ngo']` value-set** in `src/styles/tokens.css`, mirroring the
   existing `[data-brand='consultancy']` block (§3). Map semantic roles to real NGO fills read
   off `node.json`: green `#007F0E` → `--color-action-primary`; every other role confirmed from
   the tree, not the token export. Add the dark-surface role-flip block if NGO uses inverse
   sections (mirror the consultancy `.surface-inverse` block).
3. **Shell decision (confirmed approach: decide from `node.json`).** From Home's real
   header/footer nodes, decide: reuse the shared `SiteHeader`/`SiteFooter` themed green, or
   build NGO-specific chrome. Implement whichever the design actually shows. Add the NGO nav
   model to `src/lib/nav.ts`.
4. **Routing scaffold.** `BaseLayout` passes `brand="ngo"` for `/ngo/*` routes. Stand up
   `/ngo/styleguide` (NGO tokens, type scale, measured contrast grades, shell components).
5. **Wire the gates.** Add `/ngo/styleguide` to `tests/routes.ts` **and** `lighthouserc.json`
   (keep the two in sync by hand — plain JSON can't import the TS array; the Phase 5
   autodiscovery-cap lesson). Generate its visual baseline in the canonical Playwright
   container.
6. **Verify** the styleguide + shell against the checklist below.
7. **Deliverable:** NGO theme + chrome + styleguide, repo green.

> **Phase 0B — decisions recorded (done).** Built against Home `node.json` (5990:3672):
>
> - **Palette** (`tokens.css` §3b, `[data-brand='ngo']`) read fill-by-fill off the tree:
>   action/CTA green `#007F0E`; dark surface deep-teal `#0E3E40` (footer + program cards +
>   testimonial + CTA — inverse block added, it's genuinely used); text ink violet `#120633`;
>   inverse text all-white; eyebrow accent orange `#E65320`. **Key split:** NGO uses green for
>   buttons/controls but orange for eyebrows, where Consultancy uses one colour (orange) for
>   both. Resolved by giving the shell a `--color-cta*` role (buttons) distinct from
>   `--color-accent-warm` (eyebrows); on Consultancy the two resolve identically (both `#E65320`)
>   so its render + visual baselines are unchanged. `Button`/`SiteFooter` retargeted to `--color-cta*`.
> - **Footer → REUSED** (`SiteFooter`, themed). Evidence: NGO Home's footer is the same
>   `oo-footer → Footer` component instance as Consultancy's, identical column structure
>   (Newsletter / CONSULTANCY / NGO / CONTACT / Terms·Privacy·social); only the surface colour
>   (`#0E3E40` vs `#120633`) and CTA (green vs orange) differ, both handled by the token theme.
>   Only per-brand tweak: the brand/logo `homeHref` (`/ngo`), added as a prop.
> - **Header → NGO-SPECIFIC** (`NgoSiteHeader.astro`). Evidence: NGO header (7417:7717 →
>   Container 7417:7718) is a solid full-bleed **white bar** (`#ffffff`, 1440×102, no
>   translucency/blur/pill), vs Consultancy's floating glass pill (`rgb(255 255 255 / .85)` +
>   `backdrop-filter: blur(6px)` + radius). Different chrome, different nav (`ngoPrimaryNav`:
>   NGO · About us · Programs · Resources · Contact) and different CTAs (Donate secondary /
>   Get Involved primary) — a separate component, not a themed `SiteHeader`. Not treated as an
>   "architectural fork" (same landmark skeleton, same accessible `<details>` mobile disclosure,
>   same `Button` atom) — just per-brand chrome the plan pre-authorised.
> - **Routing:** `BaseLayout` derives `data-brand` from the path (`/ngo/*` → `ngo`) and renders
>   the NGO header + `/ngo`-homed footer for NGO routes; Consultancy root routes untouched.
> - **Gates:** `/ngo/styleguide` added to `tests/routes.ts` + `lighthouserc.json`; visual
>   baseline committed. One tracked contrast gap (issue N1, `docs/a11y-known-issues.md`): green
>   "Learn more" on the dark teal surface is 2.27:1 — shipped as designed, covered by the
>   existing `btn--secondary` allowlist. Everything else passes AA.

> **Phase 1 — Home decisions recorded (done).** Built `src/pages/ngo/index.astro` +
> `src/lib/ngo-home-images.ts` against Home `node.json` (5990:3672):
>
> - **Sections (7):** hero (badge + green-accented H1 + two CTAs + brand torus with the peach
>   "Explore Consultancy" cross-link) → trusted-partners marquee → Who-We-Are + boat-photo stats
>   band (10,000+/30+/12+/98%) → Our Programs (centered intro + 2×2 deep-teal cards: STEP /
>   CHOICES / GVP / PARTNERSHIP PROGRAMS, white-25% divider, green "Learn more" link) → Success
>   Stories (video thumbnail with play button + single deep-teal testimonial, portrait left /
>   quote right) → Recent News (3 cards, orange "Publication" tag, "See all news") → CTA (boat
>   photo left / teal panel right with three white arrow-link rows). Copy transcribed from the
>   node.json text runs; accent phrases pulled from `characterStyleOverrides`.
> - **Shell finalization — the one real correction Home surfaced:** NGO **inverts** the
>   Consultancy eyebrow↔heading-accent colour pairing. Consultancy = green kicker + orange
>   emphasis; NGO = **orange kicker (#E65320) + green emphasis (#007F0E)**, both confirmed off the
>   node.json text runs. The shared `.u-eyebrow`/`.u-accent-em` utilities hard-coded the
>   Consultancy mapping, so introduced two brand-aware roles — `--color-eyebrow` and
>   `--color-heading-accent` (`tokens.css` §3/§3b, consumed in `base.css`). **Consultancy render
>   is unchanged** (its roles resolve to the same green/orange as before); only NGO flips. Header
>   and footer needed no change beyond 0B (footer link labels are the shared component's existing
>   choice — left as-is to avoid disturbing Consultancy's verified baselines).
> - **Gates:** `/ngo` added to `tests/routes.ts` + `lighthouserc.json`; desktop/tablet/mobile
>   visual baselines committed (canonical Playwright container). `/ngo/styleguide` baseline
>   regenerated (its eyebrow specimen flipped green→orange with the token change).
> - **Tracked contrast gaps (issues N3–N7, `docs/a11y-known-issues.md`):** NGO's orange kicker
>   (3.73:1 on white, 3.16:1 on teal), the peach cross-link (2.22:1), the orange news tag
>   (3.73:1), the green card/testimonial links (2.27:1) and the green CTA "Movement?" accent
>   (2.27:1) — all confirmed source-design colours, shipped as designed per `CLAUDE.md` #2 and
>   allowlisted narrowly. Everything structural (landmarks, heading order, keyboard, focus,
>   reduced-motion) passes clean.

> **Phase 2 — Partners decisions recorded (done).** Built `src/pages/ngo/partners.astro` against
> node `7434-8750` (see the STEP-0 resolution note above; the frame is mislabeled "ABOUT PAGE
> NGO" in Figma but is the real Partners page). The page header carries a full doc comment.
>
> - **Reuse validated, not assumed.** Sliced this page's own `node.json` before reusing anything.
>   The 24-org directory is **identical** to the Consultancy Partners page (7385-5219): same
>   orgs, same visual (row,col) grid order, same descriptions (23/24 byte-for-byte; UniJos
>   differs only by a trailing space), same special cases (Datadotorg "Data.Org" underline,
>   Care4Water authored line breaks, Sterling Bank "Vector"-only logo). So `partnerOrgs` +
>   `partnerFormFields` are **reused verbatim** from `@lib/partners-content` (logos via
>   `@lib/partners-images`) — no NGO-specific content/image module needed.
> - **Both documented Consultancy traps checked & handled.** (1) Manual GRID anchoring recurs
>   (`gridColumnAnchorIndex` 0/3/6/9 ≠ document order) — the reused array is already sorted by
>   real (row,col) order, so it maps 1:1. (2) The stroke-only divider recurs: a 5px top border on
>   each card's "Heading 4" frame (`individualStrokeWeights.top:5` + `paddingTop:24`), **green
>   #007F0E** on NGO (orange on Consultancy) — invisible in a JSON-only skim, caught by reading
>   the tree + frame.png.
> - **NGO-specific (NOT a straight theme-swap):** no photo hero — a white breadcrumb + "Our
>   Partners" page-header instead (mirrors NGO About); green card dividers + green form labels +
>   green "Partner" accent (vs Consultancy orange); a **rounded** (radius 12) deep-teal form
>   panel; form labels in a fixed **387px right-aligned** column (Consultancy used right-aligned
>   `max-content`); neutral near-black ink (#292929 title / #16191A cards), not NGO's violet
>   default. Card names promoted h3→h2 (no lead sentence above the grid) to keep heading order
>   clean. The breadcrumb text is literally "HOME / ABOUT" — a duplication artifact from the
>   About frame — reproduced verbatim per exact-replica-first; **flagged for a post-sign-off
>   copy fix** (it should read the Partners path), tracked alongside contrast issue N8.
> - **Gates:** `/ngo/partners` added to `tests/routes.ts` + `lighthouserc.json`; desktop/tablet/
>   mobile visual baselines committed (canonical Playwright container). `npm run verify` and
>   `npm run lhci` green.
> - **Tracked contrast gaps (issues N8–N10, `docs/a11y-known-issues.md`):** the orange "HOME /
>   ABOUT" breadcrumb (3.73:1 on white), the green form labels (2.26:1 on teal) and the green
>   "Partner" accent (2.26:1 on teal) — all confirmed source-design colours, allowlisted with
>   NGO-Partners-only selectors (`partners-breadcrumb`, `ngo-partners-form`) so the shared
>   `partners-form*` classes can't swallow the Consultancy page's passing nodes. Everything
>   structural (landmarks, heading order, keyboard, focus, reduced-motion) passes clean.

> **Design pass — About rebuilt 2026-08-07 (done).** Node `7429:5025` was **redesigned after the
> Phase 3 build**, so most of the Phase 3 record below now describes a frame that no longer
> exists. The committed `design/figma/…/7429-5025/node.json` is the 2026-07-20 fetch and is
> **stale** (5547px tall; the live frame is 4066px). This pass read the live node through the
> Figma MCP; only the new hero fill (`fill-8ab4e0ec…`, imageRef read off node 12330:13417) was
> added to the snapshot, by hand, because no `FIGMA_API_KEY` was available. **Re-run
> `npm run figma:fetch -- "<about-url>"` to resync `node.json` before trusting it again.**
>
> - **What the redesign changed:** a full-bleed photo hero + "Who We Are" h1 replaced the
>   "HOME / ABOUT" breadcrumb header (which is gone entirely, closing a11y issue N11); the boat
>   photo that opened the intro was dropped; Core Values became five title-case headings with
>   descriptive paragraphs in a 2-col grid, with the source typos fixed upstream
>   ("INTERGRITY"→"Integrity", "EMPOERMENT"→"Empowerment", and "INCLUSIVENESS"→"Inclusivity", a
>   different word); and the whole Core Team section — eyebrow, "Every Major Test. One Trusted
>   Partner.", lead paragraph and 8 portrait cards — was deleted, taking its documented
>   green/orange accent inversion with it. **"Mision" was NOT fixed** and stays verbatim.
> - **Reuse:** the hero is Consultancy's `SubPageHero`, which grew a `photo` prop — the redesign
>   gave NGO the identical 1440×670 / 25%-scrim / bottom-120 / `u-page-title` treatment with a
>   different image. The CTA rows are real `GIEVA Button` instances in the design and now render
>   as `Button` (new `on-inverse` variant), retiring one of the three hand-drawn arrow copies
>   Button.astro's header tracks.
> - **Type correction:** the section headings moved from `u-section-title` to `u-h2`. The design's
>   `GIEVA.org/Arial/Heading 2` tracks −0.26px; `u-section-title` resolves to
>   `--letter-spacing-display` (−3.3px, the 110px display step) and rendered visibly tighter.
>   Fixed page-locally — **`--type-section-title-tracking` looks wrong at the token layer, which
>   would affect all 18 routes; deliberately not changed here.**
> - **Known residual:** the CTA panel measures 686px against the design's 676. The three row
>   buttons render 54px (NGO's `--control-padding-block`, calibrated against NGO's own button
>   instances) where these three instances measure 52px. Left as-is rather than overriding the
>   shared component for one page — the design's own button heights disagree between instances.
> - **Sibling drift, NOT addressed:** the Partners (`7434:8750`) and Program (`7447:6027`) frames
>   have grown the same photo hero and still render the old breadcrumb header in code. Contact
>   not checked. `/ngo/about` is currently the only NGO route in the new style.
>   **Program has since been done — see the note below. Partners and Contact are still open.**
>
> **Design pass — Program rebuilt 2026-08-07 (done).** Node `7447:6027` was **redesigned after the
> Phase 4 build**, the same sweep that hit About, so much of the Phase 4 record below now
> describes a frame that no longer exists. The committed `design/figma/…/7447-6027/node.json` is
> the 2026-07-20 fetch and is **stale** (4593px tall; the live frame is 4264px). This pass read
> the live node through the Figma MCP; only the re-cropped detail fill
> (`fill-1b88c3421e…-cropped.png`) was added to the snapshot, by hand, because no `FIGMA_API_KEY`
> was available. **Re-run `npm run figma:fetch -- "<program-url>"` to resync `node.json` before
> trusting it again.**
>
> - **What the redesign changed:** a full-bleed photo hero + "Our Programs" h1 replaced the
>   "HOME / PROGRAMS" breadcrumb header (gone entirely, closing a11y issue N12); and the whole
>   **Partner Programs** block — centred intro plus the three deep-teal cards of the old node
>   `7447:6518` — was **deleted**, closing N13. The design now runs GVP straight into "Contact Us
>   Now" with no section between them and no replacement. Deleting live copy off one frame was
>   flagged for sign-off and confirmed by the user before removal.
> - **Reuse:** the hero is `SubPageHero` with the shared `ngoHeroPhoto`. The Program and About
>   hero fills are **byte-identical** (diffed at equal size, RMSE exactly 0), so
>   `src/lib/ngo-about-images.ts` was renamed `ngo-hero-images.ts` and its export
>   `aboutHeroPhoto` → `ngoHeroPhoto`. That also retires a genuine name collision: Consultancy's
>   `src/lib/about-images.ts` exports a _different_ photo under the same old name.
> - **Detail photos, three corrections:** the design gives them **no corner radius** (confirmed by
>   cropping the rendered node's corners — "rounded-rectangle" in the metadata is just Figma's
>   node type, not a radius), **mirrors** them (`scaleX(-1)`), and aligns the fill to
>   `object-position: bottom`. The fill also carries a **crop transform** (~0.7 zoom, offset
>   down/right) that `figma-fetch` does not download — it fetches the raw imageRef — so the raw
>   file frames the shot wider than any frame ever shows it. The MCP-exported cropped file is now
>   what `ngo-program-images.ts` imports; the raw fill stays in the directory as the true export.
> - **Copy-column spacing:** the two gaps in the column differ in the design and had been built as
>   one. Heading→copy is 40px (node `7463:5841`), paragraph→button is 64px (node `7463:5844`);
>   both were `--space-lg` (32px). The column also carries 40px block padding.
> - **Contact panel row height — a real parity bug, not a redesign change.** The panel measured
>   **796px** against the frame's **1020px**. Its seven rows are a fixed **74px** in the design
>   (the input box is only 42px of that; the remaining 32px is empty), but the CSS let them size
>   to content and they collapsed to 42px — 224px of missing panel. Now `grid-auto-rows: 74px`
>   with `align-items: start` and an 8px label offset. Arithmetic reconciles: 7 × 74 + 6 × 16 =
>   614 (node `7447:6451`) and 64 + 96 + 64 + 614 + 64 + 54 + 64 = 1020.
> - **Type, deliberately NOT changed:** "Contact Us Now" keeps `u-section-title`. About moved its
>   headings to `u-h2` because _About's_ specify tracking −0.26 — but this frame's h2
>   (node `7447:6448`) really does carry **−3.3px**, which is what `u-section-title` resolves to.
>   Do not propagate About's fix here.
> - **Verified geometry (rendered, not eyeballed):** hero 1440×670 with the title 427×56 at
>   x=506; details 1312×450 at 120px intervals; copy column 40/92/40/120/64/54/40 = 450; contact
>   panel 1312×1020. Document height 4366 = the design's 4264 + our 102px in-flow header, i.e.
>   the shell-level header-overlay gap and nothing else.
> - **Sibling drift, NOT addressed:** `/ngo/partners` carries a byte-identical copy of the contact
>   form's CSS (`align-items: center`, content-sized rows) and so almost certainly has the same
>   74px row bug — but its own frame (`7434:8750`) was not measured in this pass, so it was left
>   alone rather than changed blind. **Measure `7434:8750` before assuming the fix transfers.**
>   Partners and Contact also still render the old breadcrumb header.
>   **Contact has since been done — see the note below. Partners is the last one open.**
>
> **Design pass — Contact rebuilt 2026-08-07 (done).** Triggered by a review of node `7447:6444`,
> which turned out to be _Program's_ "Contact Us Now" panel rather than anything on
> `/ngo/contact` — the real frame is `7461:5854`, and it had been **redesigned after the Phase 5
> build**, the same sweep that hit About and Program. The committed
> `design/figma/…/7461-5854/node.json` is the 2026-07-20 fetch and is **stale** (2660px tall; the
> live frame is 2974px). This pass read the live node through the Figma MCP and added no new
> assets — the hero photo is already in the tree. **Re-run
> `npm run figma:fetch -- "<contact-url>"` to resync `node.json` before trusting it again.**
>
> - **What the redesign changed — one thing only:** a full-bleed photo hero + "Contact" h1 (node
>   `12330:13424`) replaced the "HOME / PROGRAMS" breadcrumb header, closing a11y issue N16
>   exactly as N11/N12 closed on About/Program. Note the title is **"Contact"**, not "Contact Us"
>   — the design shortened it. The contact-info block and the form panel are the same nodes at
>   the same sizes; everything else below is a parity bug this pass caught, not a redesign delta.
> - **Reuse:** the hero is `SubPageHero` with the shared `ngoHeroPhoto` — the Contact fill is
>   **byte-identical** to About's and Program's (4096×3067, diffed at equal size, RMSE exactly 0),
>   so all three NGO sub-pages now pass the same prop and no fourth asset was committed.
> - **Contact panel row height — the same 74px bug that was fixed on Program**, and the reason
>   that fix's hand-off said to check the siblings. The panel measured **796px** against the
>   frame's **1020px**: its seven rows are a fixed 74px in the design (the input box is only 42px;
>   the remaining 32px is empty) but the CSS let them size to content. Now `grid-auto-rows: 74px`
>   with `align-items: start` and an 8px label offset. Arithmetic reconciles: 7 × 74 + 6 × 16 =
>   614 (node `7461:5944`) and 64 + 96 + 64 + 614 + 64 + 54 + 64 = 1020.
> - **Contact-info block — four small misses, all now fixed.** (a) The micro-labels are the
>   design's named style "GIEVA.org/Arial/Narrow" (Arial Narrow 14/20/−0.14), which is exactly the
>   `--type-label-*` role — they were hand-rolled on the base family, so they now use **`.u-label`**.
>   (b) Each label+row group carries an **8px horizontal inset** (node `7461:6194` etc.) that was
>   missing, so the whole block sat 8px left of the design. (c) The location pin was authored
>   **16×20** with its glyph in the bottom 15px — a 24-space icon in the wrong viewBox — rendering
>   ~4px low and reserving 20px of row; re-anchored to 16×16 by shifting every y by −4, which
>   reproduces the export's 8.33%/37.5% insets exactly. (d) The phone/email/hours rows are
>   `items-center` in the design, not `items-start`; only the three (two-line) address rows are
>   start-aligned, with a 4px pin offset. The call/mail/clock paths were re-diffed against the
>   design's own SVG exports and match character-for-character, float rounding aside.
> - **Input padding is asymmetric on purpose:** 8px top, 10px bottom (node `7461:5949`), which is
>   what makes the box 42px around a 24px line. It had been an even 8/8.
> - **Placeholder opacity — a deviation the client chose knowingly.** The design's "Your Answer"
>   runs sit at `opacity: 0.5` (node `7461:5950`); we shipped full-opacity white. Matching it was
>   flagged as the one change that _introduces_ a contrast gap — white at 50% over the teal is
>   `#879FA0`, **4.21:1**, against 11.79:1 for the full-opacity white it replaces — with a
>   recommendation to leave it. The client asked for it anyway, so it is matched and tracked as
>   **N20**, with the revert path recorded. **N20 has no `tests/a11y.spec.ts` allowlist entry and
>   needs none:** axe-core's `color-contrast` rule does not evaluate `::placeholder` text at all
>   (verified against the rebuilt page — 16 contrast nodes reported, no `<input>` among them).
> - **Verified geometry (rendered, not eyeballed):** hero 1440×670, body 1680 (120 + info 300 +
>   120 + panel 1020 + 120), info block 1312×300, panel 1312×1020, footer 624 — every one matching
>   the live node. Document height 3076 = the design's 2974 + our 102px in-flow header, i.e. the
>   shell-level header-overlay gap and nothing else.
> - **Still open, deliberately:** `/ngo/partners` is now the **last** NGO route on the old
>   breadcrumb header, and it carries a byte-identical copy of this form's CSS — so it almost
>   certainly has the same 74px row bug, and its design almost certainly has the same 50%
>   placeholder. Its frame (`7434:8750`) was not measured in this pass either, so it was again
>   left alone rather than changed blind. Program's and Partners' placeholders remain at full
>   opacity; only Contact was changed, since only Contact was measured and signed off.
>
> **CTA unified into `NgoCtaSection.astro` — 2026-08-08 (done).** Client-reported: the closing
> "Ready to Join the Movement?" panel behaved differently on `/ngo` than on `/ngo/about` (visible
> on hover), and they preferred About's button treatment. Both pages now render one component.
>
> - **Home's rows were a translation gap, not a design difference.** The About design pass had
>   recorded that Home's CTA was "a DIFFERENT (older) shape … its links are not button instances"
>   and left it alone on that basis. **That was wrong.** Home's three rows are the same
>   `GIEVA Button` instances (`componentId 5995:7321`, `Type: "NGO Tetiary"`, 52px, arrow shown)
>   — in the live frame read through the Figma MCP (node `5990:4479`) _and_ in Home's own
>   committed `node.json`, which has said so since the 2026-07-20 fetch. So Home's hand-rolled
>   anchors (text-width hit target, a hover underline the design never specifies, the hand-drawn
>   15×13 stroked arrow that is ~11% small and ~28% heavy) are now `Button variant="on-inverse"`,
>   matching About. This retires the second of the three hand-drawn arrow copies Button.astro
>   tracked; only `SiteFooter.astro` still carries one.
> - **Home's CTA heading moves `u-section-title` → `u-h2`, measured off the live frame.** Both
>   CTA headings render their first line **340px wide** (Home's node screenshot at 1:1; About's at
>   0.579 → 197/0.579 = 340.1), so both track **−0.26px**, not the −3.3px display step. Home's
>   committed `node.json` still reports −3.3 for `5990:4488` — it predates the redesign sweep, so
>   trusting it here would have shipped visibly tighter type. Same page-local correction About and
>   Program already made; `--type-section-title-tracking` remains suspect at the token layer and is
>   still deliberately unchanged.
> - **Copy block regrouped on both pages.** The source nests eyebrow + heading in one auto-layout
>   frame (16px gap) and sets 32px from that frame to the body paragraph (nodes `5990:4482` /
>   `5990:4485`). Both pages had flattened it to a single 24px gap; the component restores the
>   two-group structure, the same fix `CtaSection.astro` documents for Consultancy.
> - **`cta__panel` kept deliberately.** `tests/a11y.spec.ts` matches tracked contrast issues N4
>   (orange eyebrow) and N7 (green "Movement?") on that class name, so renaming it would silently
>   un-allowlist two signed-off gaps. `npx playwright test tests/a11y.spec.ts -g "ngo"` green on
>   all six routes.
> - **Baselines:** `/ngo` and `/ngo/about` both change visibly (row treatment, arrow glyph, Home's
>   heading tracking, copy-block spacing) — **CI visual baselines for both need regenerating.**
>
> **Phase 3 — About decisions recorded (superseded by the design pass above).** Built
> `src/pages/ngo/about.astro` against node
> `7429:5025` ("ABOUT PAGE NGO" — confirmed the genuine About page, "Our Story"; the sibling
> `7434:8750`, also named "ABOUT PAGE NGO", is the real Partners page, resolved in Phase 2).
>
> - **Maximal reuse confirmed, not assumed.** The boat photo and the Core Team placeholder
>   portrait are the exact same imageRefs already imported for Home (`fill-4eebccba…` /
>   `fill-8108addc…`), so both come straight from `@lib/ngo-home-images` — no new image module.
>   The CTA section (photo + teal panel, "GET INVOLVED" / "Ready to Join the Movement?" /
>   Volunteer·Donate·Other Partnership Opportunities) is byte-for-byte identical to Home's copy
>   and structure, so it's reused verbatim down to the class names (`cta__panel`, `u-eyebrow`,
>   `u-accent-em`) — which meant no new a11y allowlist entry was needed for it: Home's existing
>   N4/N7 entries already match on those classes regardless of route. The stats
>   (10,000+/30+/12+/98%) are the same four figures as Home's but rendered as a plain
>   black-on-white band with thin dividers, **not** overlaid on a photo with a gradient scrim —
>   confirmed against this page's own node.json rather than copying Home's markup wholesale.
> - **Three hidden placeholder text runs skipped.** The Vision, Mission, and Core Values
>   sections each carry a "GIEVA handles your entire registration process…" text node nested
>   under a `visible: false` parent — leftover boilerplate from duplicating a component,
>   invisible in both Figma and `frame.png`. Confirmed via node.json and omitted. The identical
>   sentence appears a fourth time under the Core Team heading, but that instance **is** visible
>   in node.json and frame.png — the real Core Team lead paragraph, reproduced verbatim. Easy to
>   miss if you trust "same text elsewhere on the page" instead of checking `visible` per node.
> - **Genuine accent-colour inversion, confirmed not assumed (the flagged trap).** The Core Team
>   block flips NGO's usual eyebrow/heading-accent pairing for that section only: "CORE TEAM"
>   renders **green** (`--color-heading-accent`) where NGO eyebrows are normally orange, and "One
>   Trusted Partner." renders **orange** (`--color-accent-warm`) where NGO's heading-accent is
>   normally green — both confirmed via `characterStyleOverrides`, not the shared-utility
>   default. Handled with page-local classes (`.team__eyebrow`, `.team__accent`) rather than
>   `.u-eyebrow`/`.u-accent-em`, which would have resolved backwards here. The CTA's "GET
>   INVOLVED"/"Movement?" on the same page follow the standard NGO mapping and use the shared
>   utilities unmodified — the inversion is scoped to Core Team only.
> - **Copy transcribed verbatim, typos included.** Core Values reproduces the source's own
>   spelling — "INTERGRITY" and "EMPOERMENT" (not "INTEGRITY"/"EMPOWERMENT") — and "Mision" (not
>   "Mission") for the Mission heading, same exact-replica-first precedent as the Partners page's
>   duplicated breadcrumb.
> - **Heading order:** h1 "Our Story" → h2 "Vision" → h2 "Mision" → h2 "Core Values" → h2 "Every
>   Major Test. One Trusted Partner." → (Core Team card names are plain text, not headings, same
>   precedent as the Consultancy Team page's `team-card__name`) → h2 "Ready to Join the
>   Movement?". No level skipped.
> - **Gates:** `/ngo/about` added to `tests/routes.ts` + `lighthouserc.json`; desktop/tablet/
>   mobile visual baselines committed (canonical Playwright container). `npm run verify` green.
> - **Tracked contrast gap (issue N11, `docs/a11y-known-issues.md`):** the "HOME / ABOUT"
>   breadcrumb (orange on white, 3.73:1 — same pairing as Partners' N8, but here the text is
>   _correct_ rather than a duplication artifact), allowlisted narrowly on `about-breadcrumb`.
>   The Core Team section's colour-inverted eyebrow/accent both measure as passing (green on
>   white, and orange-on-white at large-text size), so neither needed an allowlist entry.
>   Everything structural (landmarks, heading order, keyboard, focus, reduced-motion) passes
>   clean.

> **Phase 4 — Program decisions recorded (superseded by the design pass above).** Built `src/pages/ngo/program.astro` +
> `src/lib/ngo-program-images.ts` against node `7447:6027` ("PROGRAM PAGE NGO" — confirmed by
> frame name, no collision to resolve unlike About/Partners). The most net-new NGO page, as
> expected — no direct Consultancy analog — but it recombines established NGO patterns rather than
> needing brand-new components.
>
> - **Sections (4), confirmed section-by-section against this page's own node.json:** white page
>   header (breadcrumb "HOME / PROGRAMS" + "Our Programs" h1, same shell as About/Partners) → three
>   **program-detail** sections (STEP photo-left, HEALS photo-right, GVP photo-left) each a 40px
>   `u-h3` heading + one shared placeholder GIEVA paragraph + an outlined green "Learn more about
>   us" `Button variant="secondary"` → **Partner Programs** (centred heading/intro over a 3-across
>   deep-teal card grid: GENERATIVE AI Skilling Project / FEMALE LOCAL AREA MECHANICS - WATERAID /
>   AMIRA & FRIENDS - STERLING BANK, white divider + green "Learn more" link) → **Contact Us Now**
>   (deep-teal inverse form panel). Note the three detail programmes are STEP/HEALS/GVP — the Home
>   card grid names them STEP/CHOICES/GVP/PARTNERSHIP; this page is its own copy set, transcribed
>   from the node.json text runs, not carried over from Home.
> - **The whole page is the node 7447:6030 vertical stack** — a single `.container` grid with
>   `row-gap: --space-6xl` (120px, the source itemSpacing) rather than the per-`.section`
>   double-padding rhythm Home uses (that frame's spacing differs). Matches the 120px between-block
>   cadence exactly.
> - **New image module (`ngo-program-images.ts`).** All three detail sections reference the SAME
>   imageRef in the source (`fill-1b88c3421e…`, the placeholder laptop photo) — it is NOT one of
>   the Home/About imageRefs, so it needed its own import rather than reuse from `ngo-home-images`.
> - **Contact form = the NGO Partners form shape, two confirmed deltas.** Same 7-field labelled
>   `<form>` (fixed 387px right-aligned label column, 122px gap, white-underline inputs, centred
>   `Send Message` submit), but (1) the labels are a **muted teal-blue #69A4B8** (node fill), NOT
>   Partners' green #007F0E, and (2) the heading accent "Now" is the standard NGO green
>   heading-accent (`.u-accent-em`, confirmed via `characterStyleOverrides` index 4 — not an
>   inversion). All seven visible labels read "What is your name?" in the source (placeholder
>   copy) — reproduced verbatim per exact-replica-first, each wired to a uniquely-id'd input so the
>   label→input association stays valid. Recurring-trap sweep: no hidden `visible:false` runs on
>   this page, no manual grid-anchor reordering (both card grids are document-order), the
>   Partner-Programs card divider is a real 1px `LINE` (not a low-opacity stroke), all confirmed
>   against frame.png at 1440 (pixel comparison not skipped).
> - **Gates:** `/ngo/program` added to `tests/routes.ts` + `lighthouserc.json`; desktop/tablet/
>   mobile visual baselines committed (canonical Playwright container). `npm run verify` and
>   `npm run lhci` green; `/ngo/program` lands at exactly **0.96** a11y, same as every other NGO
>   route.
> - **Tracked contrast gaps (issues N12–N15, `docs/a11y-known-issues.md`):** the orange
>   "HOME / PROGRAMS" breadcrumb (3.73:1 on white), the green Partner-Programs "Learn more" links
>   (2.27:1 on teal), the green "Now" accent (2.27:1 on teal), and the muted #69A4B8 form labels
>   (4.27:1 on teal — the closest-to-passing NGO gap yet) — all confirmed source-design colours,
>   shipped as designed per `CLAUDE.md` #2 and allowlisted with Program-only parent classes
>   (`program-breadcrumb`, `partner-programs__card`, `program-contact`,
>   `program-contact__label`). Everything structural (landmarks, heading order h1→h2→h2→h2→h2→h3
>   ×3→h2, keyboard, focus, reduced-motion) passes clean.

> **Phase 5 — Contact us decisions recorded (done).** Built `src/pages/ngo/contact.astro` against
> node `7461:5854` ("CONTACT US PAGE NGO" — confirmed by frame name, no collision to resolve). The
> cheapest reuse page, as expected — but not a straight lift, confirmed against this page's own
> node.json rather than assumed:
>
> - **Shape (3 blocks), all one 120px (`--space-6xl`) rhythm.** White page header (breadcrumb +
>   "Contact Us" h1, node 7958:30382) → a **contact-info block** (node 7461:6164) not present on
>   any prior NGO page — two 636px columns, 40px gap: HEAD OFFICE / LAGOS BRANCH OFFICE / JOS
>   BRANCH OFFICE addresses on the left, PHONE / EMAIL / OFFICE HOURS on the right, each row led
>   by a green `#007F0E` icon (location pin / call / mail / clock) → "Send us a Message", the
>   deep-teal inverse form panel (node 7461:5938). Every gap in the source (header paddingBottom
>   120, content itemSpacing 120, content paddingBottom 120) is the same step, so — like Program —
>   the whole page is one `.container` grid with a uniform `row-gap`, not per-section
>   double-padding.
> - **Form panel: reuse validated, not assumed.** Sliced this page's own node.json before reusing
>   anything from Program's "Contact Us Now" panel. Confirmed identical: the same 7-field
>   labelled `<form>` shape (fixed 387px right-aligned label column, 122px gap, white-underline
>   inputs, centred submit), the same muted teal-blue `#69A4B8` label colour (not Partners'
>   green), and the same non-inverted green heading-accent. The real deltas are the
>   heading/subheading copy ("Send us a Message" / "Answer Interview questions…") and three of the
>   seven field labels being genuine ("What is your full name?" / "What is your email address?" /
>   "Phone Number") rather than all seven reading the "What is your name?" placeholder — the last
>   four still do, reproduced verbatim per exact-replica-first.
> - **A genuinely new colour-contrast mechanism, not just a new colour.** The contact-info block's
>   six micro-labels ("HEAD OFFICE" etc.) aren't a distinct colour token at all: each sits inside a
>   Figma frame with `opacity: 0.5` over a raw black fill, which Figma composites to a flat
>   mid-grey at render. The JSON's raw fill alone reads pure black — doesn't match the rendered
>   pixels — so this one required sampling `frame.png` directly to find the true value (`#7F7F7F`),
>   confirmed against the node's `opacity` field rather than guessed. Logged as issue N17, the
>   first opacity-derived (not literal-fill) contrast gap on either site.
> - **Two missing icon exports, pulled individually rather than re-fetched.** The location pin and
>   mail icons were captured by the original Phase 0A ingestion (top-level "icon"-tagged nodes),
>   but the call and clock glyphs sit one level deeper in the tree and were missed. Rather than
>   re-running the full-page fetch, their two SVGs were pulled directly via Framelink
>   (`download_figma_images`) and committed into this page's existing `assets/` folder — a
>   targeted top-up, not a re-ingest.
> - **Recurring-trap sweep, all clear:** no hidden `visible:false` runs; no manual grid-anchor
>   reordering (info columns and form rows are both document-order); no low-opacity-stroke
>   dividers (this panel has none, unlike Partners'); `frame.png` pixel-compared throughout,
>   including for the opacity discovery above.
> - **Gates:** `/ngo/contact` added to `tests/routes.ts` + `lighthouserc.json`; desktop/tablet/
>   mobile visual baselines committed (canonical Playwright container). `npm run verify` and
>   `npm run lhci` green; `/ngo/contact` lands at exactly **0.96** a11y, same as every other NGO
>   route.
> - **Tracked contrast gaps (issues N16–N19, `docs/a11y-known-issues.md`):** the orange
>   "HOME / PROGRAMS" breadcrumb (3.73:1 on white — another duplication artifact, this time from
>   the Program frame), the contact-info micro-labels' opacity-flattened `#7F7F7F` (4.00:1 on
>   white — the new one), the green "Message" heading-accent (2.27:1 on teal), and the muted
>   `#69A4B8` form labels (4.27:1 on teal) — all confirmed source-design colours, shipped as
>   designed per `CLAUDE.md` #2 and allowlisted with Contact-only parent classes
>   (`contact-breadcrumb`, `contact-info__label`, `contact-form`, `contact-form__label`).
>   Everything structural (landmarks, heading order h1→h2, keyboard, focus, reduced-motion)
>   passes clean.
>
> **All five NGO pages are now verified — Phase 6 (cross-page parity sweep + enhancement) is
> unblocked.**

> **Shell change — cross-site switcher promoted to all 18 routes (AWAITING CLIENT SIGN-OFF).**
> The "Explore Consultancy" / "Explore NGO" pill was authored into each Home hero, so the other
> 16 routes had no visible way across — worse on NGO, where `ngoPrimaryNav` is flat and
> Consultancy's header at least carries a "Switch GIEVA" dropdown on every page. The two copies
> had also drifted (a stray arrow glyph on Consultancy, different padding, different shadow,
> different fill opacity).
>
> - **Collapsed into `src/components/BrandSwitchLink.astro`**, rendered by `BaseLayout` after the
>   footer (outside `<main>`, so it stays out of the pagefind index). Both source instances are
>   the _same_ Figma component — `GIEVA Button`, `Type: "C Secondary"`, `Show ArrowRight: false`,
>   radius 8, padding 12/32, 1px stroke, fill @ 0.75, 18px Bold — nodes **5986:3665**
>   (Consultancy Home 5891:4663) and **5990:4604** (NGO Home 5990:3672).
> - **Deviation 1 — reach.** The design only _places_ the pill on the two Home frames, though
>   both nodes are `isFixed: true` / `scrollBehavior: FIXED`, i.e. drawn as viewport-pinned
>   chrome rather than hero content. Rendering it everywhere is our call and needs sign-off.
> - **Deviation 2 — box-shadow.** Not in either node (`effects: []`). Kept, and now more load-
>   bearing than before: the pill floats over 18 pages of arbitrary content, not two hero toruses.
> - **Two slips corrected, not deviations.** Consultancy's copy carried an arrow glyph although
>   `Show ArrowRight` is `false` on both instances; NGO's fill was flat `#f5baa6` although the
>   node specifies 0.75 opacity. Correcting the alpha _improved_ NGO's tracked contrast ratio
>   from 2.22:1 to 2.53:1.
> - **Gates:** all 18 a11y routes pass. The Consultancy half now fails `color-contrast` where it
>   previously read as passing (3.34:1 — it only escaped axe on Home because the torus behind it
>   made the background indeterminate), so the tracked entry is now cross-brand: **issue 7 / N5**
>   in `docs/a11y-known-issues.md`, allowlisted once as `['brand-switch']`. Lighthouse is
>   unaffected (every route already sat at 0.96). **All 18 visual baselines need regenerating in
>   the canonical container** — the pill is a visible change on 16 routes.

### Phases 1–5 — one NGO page per session

Recommended order — Home first to establish patterns; Partners early as the cheap
reuse-validation win (mirrors how Consultancy built its reusable template early):

1. **Home** (`/ngo`, `5990-3672`) — richest page; establishes NGO hero + section patterns and
   most components; finalizes the shell against the real design.
2. **Partners** (`/ngo/partners`, `7434-8750`) — attempt maximal reuse of the Consultancy
   `partners.astro` / `partners-content.ts`; **confirm structure against its own `node.json`
   before assuming a straight theme-swap** (Consultancy Partners had a manual-grid-ordering
   trap and a stroke-only divider that a JSON-only read missed — check for the same).
3. **About** (`/ngo/about`, `7429-5025`).
4. **Program** (`/ngo/program`, `7447-6027`) — expect the most net-new components; no
   Consultancy analog to riff off.
5. **Contact us** (`/ngo/contact`, `7461-5854`) — reuse Partners' labelled-`<form>` pattern
   (real `<label>` per field, no submission endpoint in scope, progressively enhanceable).

**Per page, every session:**

1. Read the page's committed `frame.png`, then slice its `node.json` by section (never read the
   whole file). Render individual child nodes for section-level checks as needed.
2. Build against the established NGO tokens + shell components. Zero client JS by default;
   islands opt in only where genuinely needed (progressive enhancement).
3. Run the **verification checklist** below.
4. Add the route to `tests/routes.ts` **and** `lighthouserc.json`; generate its visual baseline;
   update this file's status table to `verified`; commit and push.

> **Expect the known-a11y-gaps workflow to recur.** NGO's green/orange on light surfaces will
> likely trip axe `color-contrast`, exactly as Consultancy's accent-warm did. Handle per
> `CLAUDE.md` "Known a11y gaps — workflow" (confirm against `node.json` → log in
> `docs/a11y-known-issues.md` → narrow allowlist in `tests/a11y.spec.ts` → adjust
> `lighthouserc.json` `minScore` only if needed). **Do not patch the palette.**

### Phase 6 — Parity sweep + enhancement _(optional, after all 5 verified)_

Cross-page consistency pass, then the deferred motion/craft layer — exact-replica first,
delight second (`CLAUDE.md` non-negotiable #1), in separate commits.

#### Masthead fit ladder — authored, 2026-08-03

The design authorises exactly one width (1440) and there is no NGO mobile frame, so everything
between 1440 and the disclosure is ours. It was previously `flex-wrap: wrap` with the disclosure
at 900px — and because the lockup and the actions group are both `flex: none`, the nav was the
only thing in the pill that could give. Below **1420px** it broke the five labels onto two and
three rows and grew the pill from 86px to 120px. 1366px, the most common laptop width, sat
squarely in that band. `SiteHeader` had the same defect with a 1303px floor.

Both mastheads now step down through measured tiers instead (`NgoSiteHeader.astro` /
`SiteHeader.astro`, `@media` block at the foot of each stylesheet), pinned by
`tests/header-fit.spec.ts`:

|                         | NGO                | Consultancy                         |
| ----------------------- | ------------------ | ----------------------------------- |
| design-exact            | ≥1420 (floor 1414) | ≥1300 (floor 1287)                  |
| cells hug their labels  | ≥1340 (floor 1321) | — no per-cell `minWidth` to give up |
| our own slack comes off | ≥1260 (floor 1241) | ≥1230 (floor 1215)                  |
| disclosure              | <1260              | <1230                               |

Two things worth knowing before touching this:

- **Nothing in the ladder fires at 1440**, so parity with `7429:5891` is untouched. Tier A is
  deliberately the tightest (6px headroom) — every pixel below 1420 that stays in Tier A is a
  pixel of design fidelity, and the 90.64px cells are what produce the design's label rhythm.
- **The failure mode is invisible.** With `justify-content: space-between`, content that exceeds
  the pill silently eats the pill's own padding rather than overlapping or scrolling the page —
  it never looks broken. That is why the spec asserts SLACK ≥ 0 and not just "no overflow"; a
  hand sweep of the range missed Consultancy overflowing by 6.8px at 1280 and 14.8px at 1200.
  If a nav label or button word legitimately grows, re-measure and move the threshold rather
  than widening the tolerance.

#### `Button` arrow box — corrected, 2026-08-03

The arrow was drawn at 15×13, the size of the glyph. All **103** `ArrowRight` nodes across every
ingested frame are a 20×20 frame wrapping a 15.00×12.50 vector — the transparent margin is part
of the component's metrics. Every arrow-bearing button on both sites was therefore 5px narrow:
NGO's header measured 154.1/196.1 against the design's 160/202, and the 11.8px shortfall in the
actions group pushed the whole nav 6.4px right of its designed position via `space-between`.
Now 159.1/201.1 and the nav is within 1.4px — the residue is Liberation Sans standing in for
Arial (~1px per string), not a layout error.

Not replicated, deliberately: the design's Donate arrow vector is `#292929` while its label is
green — an unoverridden component default, not an intent. Ours stays `currentColor`.

## Cross-page link map

Added 2026-08-08. The NGO site's internal links were audited end to end; this section is the
durable record of what was found, what was fixed, and what is still open. **Read it before
adding or repointing any NGO link.**

### Routes that are linked but do not exist

Three `/ngo/*` paths were referenced from built pages and 404ed. None has a Figma frame — the
file holds five NGO frames (see the page index above) and no Resources, Donate or Get-Involved
screen — so none can be built exact-replica-first. They are listed here rather than papered
over, and the count is why they matter:

| Missing route        | Inbound links | Linked from                                                                                   |
| -------------------- | ------------- | --------------------------------------------------------------------------------------------- |
| ~~`/ngo/resources`~~ | ~~11~~        | **BUILT 2026-08-11** — see "NGO Resources" below. Still no frame; built as a design proposal. |
| `/ngo/donate`        | 6             | NGO masthead ×2, Home hero secondary, `NgoCtaSection` row 2 (`/ngo` + `/ngo/about`)           |
| `/ngo/get-involved`  | 6             | NGO masthead ×2, Home hero primary, `NgoCtaSection` "Volunteer" row (`/ngo` + `/ngo/about`)   |

`/terms`, `/privacy` (footer bottom bar) and `/resources` (footer Consultancy column) are the
same class of gap, site-wide rather than NGO-specific.

**Open question for the client**, in priority order: (1) ~~does a Resources/news system exist to
design against, or is it CMS-backed~~ — **answered 2026-08-11: CMS-backed.** The handoff repo's
backend already ships the article store, a public read API and an admin dashboard; the marketing
site now consumes it. (2) is "Donate" a real payment flow — if so it is a backend integration,
not a marketing page, and should be scoped that way rather than built as a screen; (3) Get
Involved is the only one the existing component set could carry as-is. Until (2) and (3) are
answered the masthead's "Donate" CTA, on every NGO page, still leads nowhere.

## NGO Resources — CMS-backed, and a design proposal (2026-08-11)

`/ngo/resources` and `/ngo/resources/[slug]` are built. **Neither has a Figma frame**, so both
are **design proposals awaiting client sign-off**, assembled the same way `/404` was: only out of
vocabulary the design already confirms. Read this before changing either page.

**Where the content comes from.** The handoff repo's backend (`GIEVA/…`, `backend/`) owns the
articles: `Article` model, a public read API at `/api/public/articles*`, and the
`AdminArticles`/`CreateArticle`/`EditArticle` dashboard. `src/lib/articles.ts` is the only module
that knows the API exists. Fetching happens **at build time**, keeping the zero-JS baseline, full
SEO, and Pagefind coverage of article bodies — the trade is that publishing needs a rebuild, so
the dashboard must fire a deploy webhook. `GIEVA_API_URL` selects the backend; **unset, the build
runs on fixtures**, which is how dev machines and CI work and what gives the two routes stable
visual baselines.

**What was borrowed, not invented.** Hero: `SubPageHero` + `ngoHeroPhoto`. Intro: Home's
"Recent News" block. Cards: `ArticleCard`, which IS Home's news card (node 5990:3672) lifted into
a component — Home now renders it too, replacing three copies of one hard-coded placeholder, so
the row's design is unchanged but its content is real and each card deep-links to its article.
Closing CTA: `NgoCtaSection`.

**The authored decisions, i.e. what to actually review:**

- **The reading measure** — `50rem` (~800px, ~85 characters at the 18px body). Nothing in the
  design speaks to long-form running text; the bare 1200px container would set ~150 characters.
  Widened from a narrower first pass on client direction 2026-08-11.
- **In-article heading sizes** — body `h2` takes the design's 24px "lead" step, not
  `--type-h2-size` (48px). 48px is the full-width section-title scale and competes with the 64px
  article title inside the measure. The scale jumps 48 → 24 with nothing between; `h3` and deeper
  all land on 18px bold, a documented limitation rather than an invented step.
- **Author-entered headings are demoted** to start at `h2` (`@lib/article-html`), because Tiptap
  lets authors pick `h1` and the page already has one — otherwise a CMS edit could red the axe
  gate on a page nobody touched.
- **CMS HTML is sanitised at build** against the editor's real extension set. Nothing sanitises
  in the API. YouTube embeds degrade to links rather than shipping a third-party iframe.
- **Empty states are real** — the listing says so plainly, and Home's whole news section is
  suppressed when there are no articles rather than framing an empty grid.
- **Deferred:** category filtering (zero-JS means a route per category — scope that should follow
  a design, not precede it) and cover-image optimisation (remote URLs need
  `image.remotePatterns`, and the CDN host isn't confirmed).

**Contrast:** both routes extend tracked issue N3 (orange `#E65320` on white, 3.73:1) — the same
confirmed pairing already accepted on Home. See `docs/a11y-known-issues.md`.

**Asks outstanding on the backend dev:** an explicit `site` column so brand filtering isn't
overloaded onto `category` (currently keyed on `tags`, which is a fuzzy `LIKE` match); moving the
`views` increment off `GET /articles/slug/:slug`, which mutates on read and is inflated by every
build and crawler; and the publish→rebuild webhook.

### Fixed 2026-08-08

- **`/ngo/program` detail sections carry `id`s** (`#step`, `#heals`, `#gvp`), and Home's program
  cards deep-link to them. Previously all four cards pointed at the page root.
- **The three "Learn more about us" buttons on `/ngo/program` pointed at `/ngo/program`** — the
  page rendering them. Now `/ngo/about`, which is what the design's own label names.
- **`scroll-padding-top` on `<html>`** (`src/styles/base.css`) so anchored sections clear the
  sticky masthead (98px Consultancy / 102px NGO wrapper) instead of landing behind it. Global on
  purpose — per-section `scroll-margin-top` drifts.
- **Anchor targets added** for cross-page CTAs: `#become-a-partner` (`/ngo/partners`) and
  `#contact-form` (`/ngo/contact` and `/ngo/program`).
- **`/404` now exists** (`src/pages/404.astro`), in `tests/routes.ts`. No frame exists for it, so
  it is built only from confirmed primitives and adds no new visual vocabulary — replace it with
  a real frame if one is drawn, don't reconcile the two. It is `data-pagefind-ignore`d so it
  can't surface in site search, and it lists both sites' real routes because a static 404 is
  built once at `/404` and so always resolves to `data-brand="consultancy"`.

### Deliberate deviations awaiting sign-off

- **Footer NGO column carries a fourth item, "Partners"** (`src/lib/nav.ts`). The design gives
  every footer column exactly three. `/ngo/partners` is a built, verified route that the design
  places in no persistent navigation at all — not the 5-item masthead (7417:7718), not the
  footer — leaving `NgoCtaSection`'s "Other Partnership Opportunities" row, present on only 2 of
  6 NGO pages, as its single inbound link. **This changes the footer on all 18 routes, so every
  committed visual baseline needs regenerating in the pinned container.**
- **Two of Home's four program cards still point at `/ngo/program` root**, not an anchor. The
  design's own two frames disagree about the programme set: Home names STEP · CHOICES · GVP ·
  PARTNERSHIP PROGRAMS (node 5990:3672), Programs details STEP · HEALS · GVP (node 7447:6027).
  CHOICES has no section anywhere; PARTNERSHIP PROGRAMS is titled for partnerships but carries
  HEALS's description verbatim. Both readings are defensible, neither is confirmed, so no anchor
  was guessed. **Client question: which is right — is CHOICES retired, or is HEALS missing from
  Home, or are Home's four cards meant to be four separate programme pages?**

### Known, out of scope for this pass

The **Consultancy** nav's seven anchor links are all dead: `/services#heals`,
`#admission-processing`, `#scholarship-advising`, `#career-guidance`,
`#tuition-acceptance-fee-payments`, and `/services/professional-development#teacher-training`,
`#technology-training`. Neither `src/pages/services.astro` nor
`src/pages/services/professional-development.astro` defines a single `id`, so every one of them
lands at the top of the page. Same class of bug as the NGO anchors, fixed the same way — logged
in `docs/consultancy-build-plan.md`, not fixed here.

## Verification checklist (run every phase — non-negotiable)

Parity is verified, not eyeballed (`CLAUDE.md` non-negotiable #4).

- [ ] **Pixel parity** — Playwright renders the route at desktop (and the tablet/mobile
      breakpoints we author); screenshot diffed against the Figma `frame.png`. Investigate and
      resolve meaningful deltas; note intentional responsive deviations for sign-off. A
      `frame.png` comparison is **not optional** even when `node.json` looks complete (the
      Consultancy Partners 5px stroke-only divider was invisible in the JSON).
- [ ] **Accessibility** — `@axe-core/playwright` passes at WCAG 2.2 **AA min** (AAA where
      achievable): landmarks, heading order, full keyboard path, visible focus, contrast,
      `prefers-reduced-motion`. Build-time gate, not a final audit.
- [ ] **Visual regression** — route added to `tests/routes.ts`; committed baseline in the
      canonical Chromium (pinned Playwright container).
- [ ] **Lighthouse budgets** — `npm run lhci` within budget; route added to `lighthouserc.json`'s
      explicit `collect.url` list (kept in sync with `tests/routes.ts` by hand).
- [ ] **`npm run verify`** — check + lint + format + build + a11y all green.
- [ ] **Commit + push** to the NGO work branch; update the status table above.

## Session hand-off protocol

- **Start of session:** read `CLAUDE.md` → this plan → the target page's `node.json`.
- **End of session:** update the status table, commit, push. Leave the repo green
  (`npm run verify` passing) so the next session starts from a clean base.
- **Ambiguity or architectural forks:** stop and ask, rather than guessing — the cost of a
  wrong large-scale choice outweighs a check-in.

## Environment notes

- Cloud sessions ingest via `npm run figma:fetch -- "<url>"` (REST + `FIGMA_API_KEY`). The
  official Figma MCP is unavailable in cloud without interactive OAuth; Dev Mode MCP is
  local-only. REST reads the same node data — sufficient for the build.
- Playwright/Chromium is preinstalled (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`); never run
  `playwright install`. Visual baselines are Chromium-build-specific — generate them in the
  canonical environment (README "Visual regression").
