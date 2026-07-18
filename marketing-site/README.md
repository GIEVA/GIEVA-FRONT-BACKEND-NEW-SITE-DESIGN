# GIEVA website

Frontend for GIEVA — two path-prefixed sites (a **Consultancy** side and an **NGO** side)
sharing one design system and component library, built with **Astro** for a static-first,
progressively-enhanced, highly-accessible result.

- **Approach & phases:** [`WORKFLOW.md`](./WORKFLOW.md)
- **Design tokens & the semantic layer:** [`TOKENS.md`](./TOKENS.md)
- **Token source of truth:** [`design/tokens/`](./design/tokens/)

## Stack

| Concern      | Choice                                           |
| ------------ | ------------------------------------------------ |
| Framework    | Astro (static, zero-JS by default)               |
| Language     | TypeScript (strict)                              |
| Styling      | Vanilla CSS + custom properties (Phase 1)        |
| Tokens → CSS | Style Dictionary (Phase 1)                       |
| Fonts        | Arial (system font — no web-font loading)        |
| Quality      | ESLint (strict jsx-a11y) · Prettier              |
| Testing      | Playwright + axe-core (a11y) · visual regression |
| Budgets      | Lighthouse CI                                    |

## Prerequisites

Node ≥ 22.12.0 (required by Astro 7). Install dependencies with `npm ci`.

## Scripts

| Script                            | What it does                                         |
| --------------------------------- | ---------------------------------------------------- |
| `npm run dev`                     | Start the Astro dev server                           |
| `npm run build`                   | Build the static site to `dist/`                     |
| `npm run preview`                 | Preview the built site                               |
| `npm run check`                   | Typecheck (`astro check`)                            |
| `npm run lint` / `lint:fix`       | ESLint (strict accessibility rules)                  |
| `npm run format` / `format:check` | Prettier write / verify                              |
| `npm run test:a11y`               | Build, serve, and run a11y + visual-regression tests |
| `npm run test:update-snapshots`   | Regenerate visual-regression baselines               |
| `npm run lhci`                    | Lighthouse budgets against the built site            |
| `npm run verify`                  | Everything: check + lint + format + build + tests    |

## Quality gates

Accessibility is a **build-time gate**, not a final audit (see `WORKFLOW.md` §2). CI runs
four gates on every push/PR (`.github/workflows/ci.yml`):

1. **Types · Lint · Format · Build** — `astro check`, ESLint (strict `jsx-a11y`), Prettier,
   and a production build.
2. **A11y** — axe-core against every route in [`tests/routes.ts`](./tests/routes.ts),
   asserting no WCAG 2.0/2.1/2.2 A or AA violations.
3. **Visual regression** — Playwright screenshots vs committed baselines, so "exact
   replica" is machine-checked.
4. **Lighthouse budgets** — performance ≥ 0.9, accessibility = 1.0, best-practices ≥ 0.9,
   SEO ≥ 0.9.

## Visual regression — baselines are environment-specific

Screenshot baselines depend on the exact Chromium build. **CI runs inside the pinned
Playwright container** (`mcr.microsoft.com/playwright:v1.61.1-noble`) so rendering is
reproducible, which means **baselines must be generated in that same environment**:

```bash
docker run --rm -v "$PWD":/work -w /work mcr.microsoft.com/playwright:v1.61.1-noble \
  bash -c "npm ci && npm run test:update-snapshots"
```

Commit the resulting `tests/__screenshots__/**` PNGs. (The initial placeholder baseline was
generated locally and will be re-seeded in the canonical environment during Phase 1, when
real UI replaces the scaffold.)

## Design ingestion (Figma MCP)

Live design access in **cloud sessions** uses the Framelink Figma MCP, declared in
[`.mcp.json`](./.mcp.json) so it loads at session start. To enable it:

1. Create a Figma **personal access token** (Figma → Settings → Security → Personal access
   tokens) with file-content read scope.
2. Add it as a `FIGMA_API_KEY` environment variable in the cloud environment's settings.
   (Note: env vars are visible to anyone who can edit the environment — no secrets store
   exists yet.)
3. Start a **new** cloud session — MCP servers only load at session start.

The official Figma **Dev Mode MCP** is higher fidelity but runs against the Figma desktop
app on `localhost`, which an isolated cloud container cannot reach; use it only when running
Claude Code **locally**. Either way, extracted design data is materialised into the repo
(`design/`) as the durable source of truth — the MCP is an ingestion tool, not a live
dependency.

## Repository layout

```
design/tokens/     GIEVA-only token source (see TOKENS.md)
public/            static assets
src/
  layouts/         accessible page shells (landmarks, skip link, brand theme hook)
  pages/           routes
tests/             Playwright a11y + visual specs, routes list, baselines
```

## Adding a page to the gates

Add its route to [`tests/routes.ts`](./tests/routes.ts); it is then automatically held to
the a11y gate and given a visual baseline on the next `test:update-snapshots` run.
