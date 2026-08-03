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
- **Open deferrals.** Colour-contrast gaps in `docs/a11y-known-issues.md` (tracked, not fixed —
  non-negotiable #2); craft ideas in `docs/enhancement-backlog.md`; a shell-level parity gap
  affecting all 18 routes (the header sits above the hero rather than over it) recorded in
  `docs/consultancy-build-plan.md` Phase 6.

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
- **Every new route** goes into `tests/routes.ts` → automatically held to the a11y gate and
  given a visual baseline.
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
