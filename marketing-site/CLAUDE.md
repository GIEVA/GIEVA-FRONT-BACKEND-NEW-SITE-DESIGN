# CLAUDE.md — orientation for Claude Code

Read this first. It captures the state, decisions, and conventions for the GIEVA website so
any Claude instance (cloud or local) can continue without re-deriving context.

## What this is

Frontend for **GIEVA** — **two path-prefixed sites under one domain**, sharing one design
system and component library:

- **Consultancy** — brand primary electric violet `#581CFF`
- **NGO** — brand primary dark teal `#0E3E40`

Built as **one Astro project** (static, zero-JS by default), themed per brand via a root
`data-brand` attribute over a semantic token layer. Full plan in **`WORKFLOW.md`**; tokens
in **`TOKENS.md`**.

## Non-negotiables (from the client)

1. **Exact-replica first, delight second.** Match the design with no deviation; sign off on
   parity; only then add subtle animation/craft, in separate commits.
2. **Accessibility is a build-time gate, not a final audit.** WCAG 2.2 **AA minimum, AAA
   where achievable**. Native HTML first; ARIA only to fill genuine gaps. Full keyboard
   support, landmarks, visible focus, `prefers-reduced-motion`. Usable, not just compliant.
   **Exception — colour-contrast failures traced to a real, confirmed source-design colour**
   (client direction, set 2026-07-18): don't unilaterally darken/lighten a brand colour to
   force an automated pass. Ship the design colour as-is and **track the gap** instead — see
   "Known a11y gaps — workflow" below. This exception is narrow and colour-contrast-only;
   every other WCAG failure (missing labels, keyboard traps, broken landmarks, focus order,
   etc.) still blocks the build immediately, no exceptions.
3. **Progressive enhancement is the baseline.** Static HTML must work before any JS. JS
   enhances a working baseline from inside the script; it never _is_ the thing that makes
   content accessible.
4. **Parity is verified, not eyeballed** — via committed tokens, screenshots, and the
   visual-regression gate.

## Current state

**Both sites are built — 18 routes, all in `tests/routes.ts`.** This is a maintenance and
sign-off posture now, not a greenfield one; read the relevant build plan before changing a
built page.

- **Foundation — done.** Astro + TS strict scaffold; accessible `BaseLayout` (skip link,
  landmarks, `data-brand` hook); the semantic + two-brand theme layer (`src/styles/tokens.css`,
  exercised by both `/styleguide` routes); ESLint (strict jsx-a11y) + Prettier; Playwright a11y
  (axe) + visual-regression harness; Lighthouse budgets; GitHub Actions CI.
- **Consultancy — 12 routes.** `/`, `/styleguide`, `/services`, the five test-registration
  sub-pages (`/services/sat|act|toefl|ielts|gre`), `/services/professional-development`,
  `/about`, `/team`, `/partners`. Phases 0–6 of `docs/consultancy-build-plan.md` are done. The
  six service sub-pages are `built`, not `verified` — everything passed except CI visual
  baselines, and that file's **Phase 6** notes list the deliberate deviations awaiting client
  sign-off (SAT's block spacing, the "Councellor" spelling fix, placeholder Prof. Dev. copy).
- **NGO — 6 routes.** `/ngo`, `/ngo/styleguide`, `/ngo/partners`, `/ngo/about`, `/ngo/program`,
  `/ngo/contact` — all `verified`. See `docs/ngo-build-plan.md`.
- **The stat count-up is live** on `/`, `/about`, `/ngo` and `/ngo/about` — `StatCounter.astro`,
  driven by stock **Motion** (`animate` + `inView`, open-source core; it replaced `number-flow`
  on 2026-08-27 because making that component actually _count_ needed a bespoke tuned driver).
  It costs 21.9 kB gz, all of it `animate`. **Read `docs/enhancement-backlog.md` E-08 before
  touching a stat rail** — the ease choice, the width ghost and the weight trade are recorded
  there.
- **Open deferrals.** Colour-contrast gaps in `docs/a11y-known-issues.md` (tracked, not fixed —
  non-negotiable #2); craft ideas in `docs/enhancement-backlog.md`; a shell-level parity gap
  affecting all 18 routes (the header sits above the hero rather than over it) recorded in
  `docs/consultancy-build-plan.md` Phase 6; and the footer newsletter, which is now fully wired on
  our side but waits on `POST /api/newsletter/subscribe` being built in the backend repo — the
  contract is `docs/backend-api-requests.md` #13, and until it exists the form renders with no
  `action` and reloads the page, exactly as before.
- **The logo mark was rebuilt in 3D as a prototype, and that prototype is NOT part of this
  export.** Every mark the site paints is the drawn Figma artwork, on every route, so no page
  here depends on it. The Blender generator and renders (`design/blender/`), the `MarkOrbit`
  component, and the `/styleguide` section that previewed them live only in the upstream
  marketing-site repo (`Akintayo74/gieva-website-fiat`), which stays the canonical home for
  design prototypes. `docs/enhancement-backlog.md` E-02 still carries the decision record, the
  measured motion-option matrix and the fidelity gaps, and it refers to files you will not find
  in this directory — that is expected, not a missing-file bug. The same applies to the
  `/styleguide` stat-count-up lab: the tuning harness stayed upstream, while the `StatCounter`
  it tuned ships here and is live on four routes.
  - **Where it stands (2026-08-25).** The resting frame was signed off for the Consultancy hero
    that morning and shipped with the light orbiting above 900px; **later the same day the hero
    was reverted to the drawn artwork on client direction**. So `heroRing` on `/`, `logoMark` (the
    48px lockup on every route) and the NGO hero's ring are all the 2D artwork — the 3D mark was
    never on the NGO site at all.

> **▶ The build plans are the durable hand-off record.** Page index, Figma node IDs, per-phase
> deliverables, the mandatory verification checklist, and every deviation logged against a frame
> live in **`docs/consultancy-build-plan.md`** and **`docs/ngo-build-plan.md`**. Read the
> relevant one at the start of every session that touches a page — including maintenance, since
> the reason a value looks "wrong" is usually recorded there. Ingest new frames via
> `npm run figma:fetch -- "<figma-url>"` (REST; the Figma MCP is unavailable in cloud without
> interactive OAuth).

> **▶ Handoff to the official GIEVA repo — PR TARGET RULE.** This marketing site is being
> integrated into the official backend+LMS repo **`GIEVA/gieva-front-backend-new-site-design`**
> as a top-level `marketing-site/` directory (sibling to `backend/` and `frontend/`), so the
> backend dev can wire up the LMS/CMS. **ALWAYS open PRs against that repo's
> `frontend/marketing-site` branch — NEVER against `main`.** The staging fork we push to is
> **`Akintayo74/gieva-new-site-redesign`** (this session's GitHub integration is read-only on
> the GIEVA org, so we push the work branch to the fork and open the cross-fork PR from there
> into `frontend/marketing-site`).

## Design ingestion

The design lives in Figma; extracted data is **materialised into `design/`** as the durable
source of truth — the MCP is an ingestion tool, not a live dependency.

- **Locally (VS Code / CLI):** use Figma's **Dev Mode MCP** (Figma desktop → enable the Dev
  Mode MCP server at `localhost:3845`; needs a Dev/Full seat). Highest fidelity — variable
  bindings, measurements. A cloud container **cannot** reach it (localhost-only).
- **Cloud sessions:** use **Framelink** (declared in `.mcp.json`, needs `FIGMA_API_KEY` env
  var). REST-based, reachable from the cloud.
- **Token export** is via the Design Tokens plugin (whole-workspace; sliced to `gieva.org`).
  Tokens are file-scoped in Figma, so re-exports contain the whole workspace — that's normal;
  re-slice by namespace. Never commit the raw multi-client export (`.gitignore` blocks it).

## Known gaps (build these ourselves, confirm from screens)

- **Spacing, radii, breakpoints** — not published as Figma variables. Capture per-screen
  (Dev Mode MCP measurements, or the manual value loop).
- **NGO palette** — only primary `#0E3E40` known; assume the rest is hard-coded, capture as
  needed.
- **Semantic colour + type layer** — authored by us (`TOKENS.md` §2/§4), confirm per-screen.
- See `WORKFLOW.md` §9 for the live assumptions/decisions log.

## Known a11y gaps — workflow

When axe (or Lighthouse) fails a **colour-contrast** check against a colour that's confirmed
straight from `node.json` — not a translation bug — use this mechanism instead of quietly
patching the palette. First used, and best studied, on the Consultancy Home build; see
`docs/a11y-known-issues.md` for a worked example of the format/rigor expected.

1. **Confirm it's real, not a bug.** Verify the failing colour against the source `node.json`
   fill/text data before doing anything else — this exception never applies to values that are
   just wrong.
2. **Log it in `docs/a11y-known-issues.md`** (create if absent): affected selector/component,
   routes, measured ratio vs. required, why the colour is the confirmed design value, and a
   **computed** (not eyeballed) future-fix direction using `src/lib/contrast.ts`'s functions —
   darken for light-surface pairings, lighten for dark-surface ones; a single token rarely
   serves both directions, say so if it doesn't.
3. **Allowlist narrowly in `tests/a11y.spec.ts`**, not by disabling the `color-contrast` rule
   wholesale: match specific known nodes (by selector/html marker, since axe's generated
   target selectors aren't consistently class-based — check both `node.html` and
   `relatedNodes[].html`, not just `target`) and filter only those out of the violations before
   asserting the rest is empty. Every other node, and every other rule, keeps failing the build.
4. **If Lighthouse also dips below its threshold** for the same reason (it runs axe-core
   internally too), lower `lighthouserc.json`'s `categories:accessibility` `minScore` to match
   the measured score — never below what's actually observed — and note the adjustment in the
   same doc.
5. **When an issue is actually fixed:** delete its `docs/a11y-known-issues.md` entry and its
   `tests/a11y.spec.ts` allowlist entry, and restore `lighthouserc.json`'s `minScore` back
   toward `1`, all in the same commit — the gates should immediately start enforcing it again.

## Conventions

- **Branch:** work on a `claude/<topic>` branch cut from `main` in this repo
  (`Akintayo74/gieva-website-fiat`), and open the PR there. Never commit to `main` directly, and
  don't push to another remote without asking. Delivery to the client's repo is a separate flow
  with its own rule — see the **PR TARGET RULE** above. (This line used to name one long-lived
  branch, `claude/gieva-website-frontend-c7e21a`; that branch is merged and deleted, and the
  work has been per-topic branches since.)
- **Components consume semantic tokens, never primitives.** Brand differences live only in
  the theme value-sets.
- **The design has TWO authored widths, and so does the token layer.** 1440px (every page's
  build frames) and 390px (the Consultancy Home mobile frame, node 12490:10106). `tokens.css`
  §4 holds the 390 values — a different type scale (48px hero vs 64, 32px section titles vs 48,
  14px paragraphs vs 18), a 20px gutter and a 64px section rhythm — behind one `max-width: 640px`
  query. **Author mobile differences there, or in a component's own `@media (max-width: 640px)`
  block; never by restating a font size in a page.** A page-local override of a `--font-size-*`
  PRIMITIVE silently opts that element out of the whole mobile tier (SubPageHero did exactly
  this and rendered its titles at desktop size). Roles with no mobile frame yet are marked
  `(derived)` in §4 — replace them when the remaining mobile frames land.
- **The a11y gate runs at both widths.** `playwright.config.ts` has a `mobile-a11y` project that
  re-runs `tests/a11y.spec.ts` alone at 390×844. Visual regression stays desktop-only on
  purpose — a second baseline per route is a real cost and a separate decision.
- **Every new route** goes into `tests/routes.ts` → automatically held to the a11y gate and
  given a visual baseline.
- **Styleguides are internal-only and are NOT deployed.** `/styleguide` and `/ngo/styleguide`
  live in **`src/internal/`**, outside `src/pages/`, so file-based routing cannot see them;
  `astro.config.mjs`'s `gieva:internal-styleguide-routes` integration injects them back on
  `astro dev` (always) or when **`INCLUDE_STYLEGUIDE=1`** is set. A plain `npm run build` — what
  a deploy runs — omits the pages _and_ everything only they reference, which is how the 3D
  mark's ~1 MB of sprite sheets stays out of production. Deleting the built page in
  `astro:build:done` would not have achieved that: the bundler emits a page's assets before that
  hook runs, so the bytes would ship orphaned.
  - Both routes stay in `tests/routes.ts` and `lighthouserc.json` and stay gated:
    `playwright.config.ts` sets the flag on its webServer build, and CI sets it on the Lighthouse
    and snapshot-refresh builds. The `quality` job builds _without_ it, so the production build is
    covered too. The accepted trade is that the gated build differs from the deployed one by
    exactly these two pages.
  - **If you build by hand and a styleguide 404s, that is the design, not a break** — use
    `npm run dev`, or `INCLUDE_STYLEGUIDE=1 npm run build`.
  - `public/robots.txt` disallows both paths as belt-and-braces, for anything already indexed
    and for any deploy someone builds with the flag on.
- **Visual baselines are Chromium-build-specific** — generate them in the canonical
  environment (see README "Visual regression"). CI uses the pinned Playwright container.
- **Testing cadence (WORKFLOW.md §5a):** iterate with **`npm run verify:quick`** (check + lint,
  seconds) plus the a11y spec scoped to the routes you touched
  (`npx playwright test tests/a11y.spec.ts -g "<route>"`, ~5s); before every non-trivial commit
  run **`npm run verify:local`** (full a11y + functional suite, screenshot diffing skipped); let
  CI's pinned container own visual-regression + Lighthouse. `npm run verify` runs the same gate
  _with_ screenshots, so it only passes inside that container — not on your machine.
  **Don't run the full `verify:local` on every edit when working locally** — it's the pre-commit
  gate, not the inner loop. Keep the scoped a11y run though: it's the only tier-1 check that
  catches what looking at the page can't. Note `tests/search.spec.ts`'s two cases fail on a clean
  tree (WORKFLOW.md §5a) — not a regression, don't chase them.
- **Check parity by looking, not by diffing.** Render the page (`npm run dev`) or screenshot the
  component and compare it to the Figma frame yourself. Local screenshot _diffing_ is noise
  (baselines are container-specific); local screenshot _looking_ is how design detail that no
  assertion covers actually gets caught. Visible changes to a built route mean its CI baselines
  need regenerating — say so in the hand-off.
- **A repeated Figma component becomes one Astro component**, even when it currently appears on
  only two pages — instantiate it, don't re-author its markup per page. Page-local copies drift
  (Home's and /team's team cards had already diverged in typography before `TeamCard.astro`
  merged them), and there must be a single canonical place to tune a shared treatment. Put the
  confirmed `node.json` geometry and the reasoning in that component's header comment, and leave
  a one-line pointer where the page-local CSS used to be.
- **Design-sourced colour-contrast failures** don't get patched ad hoc — follow "Known a11y
  gaps — workflow" above.

## Quick start (local)

```bash
npm ci          # install (Node ≥ 22.12.0, required by Astro 7)
npm run dev     # dev server
npm run verify  # check + lint + format + build + a11y/visual tests
```
