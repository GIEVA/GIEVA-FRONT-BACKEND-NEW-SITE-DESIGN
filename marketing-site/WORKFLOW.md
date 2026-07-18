# GIEVA Website — Workflow & Working Agreement

> This document is the playbook for building the GIEVA website frontend. It is the
> thing we sign off on **before** scaffolding. If a decision changes, we change it
> here first, then act.

---

## 1. Guiding principles

1. **Parity is a verifiable state, not a vibe.** "Does this match the design?" must be
   answerable objectively and repeatedly — via tokens, reference screenshots, and visual
   regression — not by eyeballing once and hoping. Building an exact replica is the
   _minimum bar_; delight comes after, on solid bones.
2. **Solid bones first, delight second.** We build the exact design with no deviation,
   sign off on parity, and _only then_ layer subtle animation and craft enhancements —
   in clearly separated commits so "beyond spec" never silently drifts from "spec".
3. **Accessibility is a build-time gate, not a final audit.** Every component is built
   keyboard-navigable and screen-reader-correct from line one. Retrofitting a11y at the
   end is the classic failure mode; we refuse it structurally.
4. **Native HTML first.** Reach for a real `<button>`, `<a>`, `<details>`, `<dialog>`,
   `<nav>`, `<form>` before any ARIA-on-a-`<div>`. ARIA is a patch for gaps in native
   semantics, not a starting point.
5. **Progressive enhancement is the default, not an afterthought.** The static HTML must
   be usable before any JavaScript runs. JS enhances a working baseline; it is never the
   thing that makes content accessible. (See §6.)
6. **The design is materialised into the repo.** Because this environment is ephemeral
   and network-restricted, the design becomes durable, version-controlled reference
   artifacts (token JSON, per-screen measurements, screenshots) — not a live dependency.

---

## 2. Accessibility standard

- **Target: WCAG 2.2 Level AA across the whole site; Level AAA wherever achievable**
  (notably contrast, and where AAA doesn't fight the design).
- **Usable, not just compliant.** Beyond the checklist: correct landmark structure so a
  screen-reader user gets a high-level map of every page; logical focus order; visible,
  high-contrast focus indicators; skip links; reduced-motion honoured; meaningful
  alt text; correct heading hierarchy.
- **Lived-experience pass (Phase 5).** Near completion, the site is tested the way a
  person living with a disability would use it (keyboard-only, screen reader, zoom to
  200–400%, reduced motion), findings looped back and fixed. This is a first-class phase,
  not a rubber stamp.

---

## 3. Tech stack & architecture

| Concern      | Choice                              | Why                                                                                                                                                           |
| ------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework    | **Astro**                           | Static-first, zero-JS-by-default. Ships working HTML before any script — makes progressive enhancement the _default_. Islands add JS only where truly needed. |
| Language     | **TypeScript**                      | Safety on the interactive islands and build scripts.                                                                                                          |
| Styling      | **Vanilla CSS + custom properties** | Maximum control for pixel-exact craft; no abstraction between us and the spec; zero runtime cost. The tokens _are_ the design language in code.               |
| Tokens → CSS | **Style Dictionary**                | Single source of truth (GIEVA token JSON) transformed into CSS custom properties. No hand-copying values.                                                     |
| Fonts        | **Arial (system font)**             | The design uses Arial. Zero web-font loading → instant text, nothing to FOUT, survives a failed network. A performance gift; we keep it.                      |

**CSS layering strategy:**

- **Primitive tokens** (`--color-electric-violet`, `--font-size-*`) — raw values, generated.
- **Semantic aliases** (`--color-action-primary`, `--color-text-default`) — role-based,
  authored by us (the design didn't export a semantic layer). This is where theming and
  intent live.
- Components consume **semantic** tokens, never primitives directly.

---

## 3a. Two-site architecture

GIEVA is **two sites sharing one design system and component library**:

- **Consultancy** — brand primary electric violet `#581CFF`.
- **NGO** — brand primary dark teal `#0E3E40`.

**Brand theming = the semantic layer.** Semantic tokens are defined once; each brand
supplies a value-set, switched via a root attribute (`[data-brand="consultancy"|"ngo"]`).
Components never touch primitives, so the same component renders correctly in either brand.

**Page inventory (16 pages, ~10 unique templates):**

| Site            | Pages                                                                            | Unique templates                          |
| --------------- | -------------------------------------------------------------------------------- | ----------------------------------------- |
| **Consultancy** | Home, About, Partners, **Services ×7** (one template, 7 content sets), Resources | Home, About, Partners, Service, Resources |
| **NGO**         | Home, About, Partners, Program, Contact                                          | Home, About, Partners, Program, Contact   |

The 7 Services pages share structure/components — one template. Home layouts differ clearly
between brands (consultancy: services cards + testimonials + FAQ + stats; NGO: initiatives +
real-life stories/video + testimonial + news). Whether About/Partners **share a template
across brands** or diverge is _to-confirm_ from screens.

**Architecture (decided):** the two sites are **path-prefixed under one domain** — so this
is **one Astro project** with a shared `src/components` library and two brand themes,
routed by path (e.g. consultancy at the root, NGO under an `/ngo`-style prefix; exact
prefixes to confirm from the sitemap). The brand theme is set once per route tree via the
root `data-brand` attribute. One remaining question: whether About/Partners **share a
template across brands** or diverge (see §9).

## 4. Phased plan

### Phase 0 — Foundations (no UI)

- Scaffold Astro + TypeScript + Prettier/ESLint.
- Wire the **quality gates** (§5) into CI _first_, so every later commit is measured.
- Extract a clean **GIEVA-only** token source file (the uploaded export is multi-client
  and must not be committed wholesale — see §8).

### Phase 1 — Design system & tokens (the foundation, mostly free & ready)

- Run the token JSON through Style Dictionary → CSS custom properties.
- Author the **semantic alias layer** (colour roles, type scale) — each mapping confirmed
  against screens, documented in `TOKENS.md`.
- Build a living **`/styleguide` route** rendering every token and, later, every component.
  This is where the system is proven coherent before any page is built.
- **Deliverable:** foundation reviewed and signed off before a single page component.

### Phase 2 — Component library (bottom-up, a11y-first)

- Atoms → molecules → sections. Each: native HTML, keyboard + focus built in, progressive
  enhancement per component, verified against the design in the styleguide _before_ use.

### Phase 3 — Page assembly

- Compose the 15–20 pages from proven components. Match layout to spec exactly, using the
  manual-spacing loop (§6) and screenshot verification.

### Phase 4 — Enhancement layer (delight)

- **Only after parity sign-off.** Subtle motion using motion tokens, all gated behind
  `prefers-reduced-motion`. Kept in separate, clearly-scoped commits.

### Phase 5 — Lived-experience accessibility pass

- Real assistive-tech testing; findings looped back and fixed (§2).

---

## 5. Quality gates (CI)

- **Automated a11y:** axe-core via Playwright on every route.
- **Visual regression:** Playwright screenshots vs approved references — makes "exact
  replica" machine-checked, not remembered.
- **Performance budgets:** Lighthouse (with Arial + static Astro, we should score high by
  default; the budget keeps us honest).
- **Lint/format:** ESLint + Prettier.

**Definition of done for any piece of UI:** matches the design (visual regression green) +
passes automated a11y + keyboard-operable + works with JS disabled (baseline) + reviewed.

---

## 6. The design pipeline (how design becomes code)

Because live Figma access is constrained (§7), we work from **materialised artifacts**:

1. **Tokens — done, free, unlimited.** Exported via the Design Tokens plugin (runs inside
   Figma, _not_ the REST API, so no rate limit). Colour + typography values are exact and
   in hand.
2. **Per-screen layout — screenshot-driven.** For each screen you provide high-res exports
   (and key states). Because the token set is small and distinctive, mapping any colour or
   type style in a screenshot back to its token is near-certain.
3. **Spacing — the manual loop.** GIEVA's spacing was **not** published as variables, so
   for each screen I give you an explicit list of the spacing/size/radius values I need;
   you read them off Figma and hand them back. These get recorded per-screen as reference.
4. **Progressive enhancement per component.** Each interactive component ships a working,
   static, no-JS baseline; JS is added _from inside the script_ to enhance it (create
   controls, set ARIA, hide panels) so a JS failure never leaves a broken control or
   hidden content.

---

## 7. Figma access reality & contingency

- **Framelink MCP** uses Figma's REST API. On the **free (Starter) plan**, the Tier-1
  endpoints it needs (GET file / file nodes) are limited to **~6 requests per _month_** —
  not viable for live building. Framelink is therefore **off the table on free**.
- **Figma's official Dev Mode MCP** is higher fidelity (preserves variable/token bindings,
  Code Connect component mappings, exact Dev Mode measurements) **but** requires a paid
  Dev/Full seat _and_ runs locally against the desktop app — awkward to bridge into this
  remote environment.
- **Chosen path: free-first.** Tokens (free) + screenshots + the manual spacing loop get
  us to parity at **$0**. The small, distinctive palette makes the reverse-mapping trivial.
- **Contingency (only if spacing precision causes real friction):** buy **one month** of a
  Full/Dev seat, batch-extract all screens into committed reference JSON, then downgrade.
  Total cost ~$15, once — never an ongoing subscription.

---

## 8. Repository & git conventions

- **Feature branch:** `claude/gieva-website-frontend-c7e21a`. All work develops here.
- **Never** commit the multi-client token export (`*.tokens.json` as uploaded) — it
  contains other clients' data. Only a **GIEVA-only** extracted source file is committed.
- Commits are small, descriptive, and phase-scoped. Enhancement (Phase 4) commits are kept
  separate from parity commits.
- No PR is opened unless explicitly requested.

---

## 9. Open questions & assumptions log

| #   | Item                                                                      | Status                                                                       |
| --- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1   | Do NGO brand colours exist as Figma variables?                            | **Blocking Phase 1 palette** — if yes, 2nd plugin export; if no, manual loop |
| 2   | Full NGO palette (only primary `#0E3E40` known)                           | To capture                                                                   |
| 3   | Semantic colour mappings per brand                                        | Proposed in `TOKENS.md` §2, confirm                                          |
| 4   | Type scale rationalisation (no H4; mixed weights) + shared across brands? | Proposed in `TOKENS.md`, confirm                                             |
| 5   | Breakpoints / responsive scale                                            | Not exported; derive from screens                                            |
| 6   | Do About/Partners share a template across brands?                         | To confirm from screens                                                      |
| 7   | ~~Domain strategy~~                                                       | **Resolved: path-prefixed, one domain → one Astro project**                  |
| 8   | Exact path prefixes per site (from sitemap)                               | To confirm                                                                   |
| 9   | Spacing values per screen                                                 | Manual loop, per §6                                                          |

**Confirmed:** two sites (Consultancy = electric violet, NGO = dark teal `#0E3E40`), one
shared component library themed by brand; 16 pages / ~10 templates; **font = Arial**;
spacing not in variables (manual loop); only `gieva.org` branches belong to GIEVA;
styling = vanilla CSS + custom properties; framework = Astro.
