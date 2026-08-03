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

| Page       | Route           | Figma node-id | Status   | Notes                                                                                                                                                                                                                |
| ---------- | --------------- | ------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home       | `/ngo`          | `5990-3672`   | verified | Built Phase 1 — parity + a11y + Lighthouse pass, route in `tests/routes.ts` + `lighthouserc.json` (see Phase 1 note)                                                                                                 |
| About      | `/ngo/about`    | `7429-5025`   | verified | Built Phase 3 — "ABOUT PAGE NGO" confirmed the genuine About page; parity + a11y + Lighthouse pass, route in `tests/routes.ts` + `lighthouserc.json` (see Phase 3 note)                                              |
| Partners   | `/ngo/partners` | `7434-8750`   | verified | Built Phase 2 — node-id confirmed correct (frame is mislabeled "ABOUT PAGE NGO" but is the real Partners page); parity + a11y + Lighthouse pass, route in `tests/routes.ts` + `lighthouserc.json` (see Phase 2 note) |
| Program    | `/ngo/program`  | `7447-6027`   | verified | Built Phase 4 — "PROGRAM PAGE NGO" confirmed by frame name (no collision); parity + a11y + Lighthouse pass, route in `tests/routes.ts` + `lighthouserc.json` (see Phase 4 note)                                      |
| Contact us | `/ngo/contact`  | `7461-5854`   | verified | Built Phase 5 — "CONTACT US PAGE NGO" confirmed by frame name; parity + a11y + Lighthouse pass, route in `tests/routes.ts` + `lighthouserc.json` (see Phase 5 note)                                                  |

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

> **Phase 3 — About decisions recorded (done).** Built `src/pages/ngo/about.astro` against node
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

> **Phase 4 — Program decisions recorded (done).** Built `src/pages/ngo/program.astro` +
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
