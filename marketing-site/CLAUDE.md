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

- **Phase 0 — DONE.** Astro + TS strict scaffold; accessible `BaseLayout` (skip link,
  landmarks, `data-brand` hook); ESLint (strict jsx-a11y) + Prettier; Playwright a11y
  (axe) + visual-regression harness; Lighthouse budgets; GitHub Actions CI. `npm run
verify` runs everything and passes.
- **Phase 1 — NEXT.** Style Dictionary → CSS custom properties from
  `design/tokens/gieva.source.tokens.json`; author the semantic + two-brand theme layer;
  stand up a `/styleguide` route for both brands. Sign off before building pages.
- Phases 2–5 (components → pages → enhancement → lived-experience a11y): see `WORKFLOW.md`.

> **▶ Active work — Consultancy build.** The phased, session-by-session execution plan for
> the Consultancy site (page index, Figma node IDs, per-phase deliverables, and the
> mandatory verification checklist) lives in **`docs/consultancy-build-plan.md`**. Read it at
> the start of every build session — it is the durable hand-off record between sessions.
> Ingest via `npm run figma:fetch -- "<figma-url>"` (REST; the Figma MCP is unavailable in
> cloud without interactive OAuth).

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

- **Branch:** `claude/gieva-website-frontend-c7e21a`. Don't push elsewhere without asking.
- **Components consume semantic tokens, never primitives.** Brand differences live only in
  the theme value-sets.
- **Every new route** goes into `tests/routes.ts` → automatically held to the a11y gate and
  given a visual baseline.
- **Visual baselines are Chromium-build-specific** — generate them in the canonical
  environment (see README "Visual regression"). CI uses the pinned Playwright container.
- Run `npm run verify` before committing non-trivial changes.
- **Design-sourced colour-contrast failures** don't get patched ad hoc — follow "Known a11y
  gaps — workflow" above.

## Quick start (local)

```bash
npm ci          # install (Node ≥ 22.12.0, required by Astro 7)
npm run dev     # dev server
npm run verify  # check + lint + format + build + a11y/visual tests
```
