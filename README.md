# GIEVA-FRONT-BACKEND-NEW-SITE-DESIGN

Monorepo for the GIEVA platform. It contains three **independent** projects that are
developed, built, and deployed separately — they do not share a build, a bundle, or a
runtime.

## Repository layout

```
.
├── backend/          # Express JSON API + Sequelize (DB) + cron jobs — the LMS/CMS server
├── frontend/         # React + MUI + Electron LMS / meeting app (Create React App)
└── marketing-site/   # Astro static marketing site (Consultancy) — zero-JS by default
```

### `backend/` — API server

A headless JSON API (default port `5000`). All routes live under `/api/*` and `/admin/*`
(LMS, payments, LiveKit meetings, campaigns, and the CMS: `/api/admin/cms`,
`/api/public/...`). It serves **no** HTML — every frontend consumes it over HTTP.

```bash
npm install
npm run devStart        # nodemon backend/index.js   (needs a .env — see backend/)
```

### `frontend/` — LMS / meeting app

React (Create React App) + Material UI, packaged with Electron. Talks to `backend/` via
its `/api/*` endpoints (LiveKit, tldraw whiteboard, tiptap editor, etc.).

```bash
cd frontend
npm install
npm start               # dev server on http://localhost:3000
npm run dev             # start + Electron shell
```

### `marketing-site/` — Astro marketing site

The public Consultancy marketing site. Static HTML output (`output: 'static'`), zero client
JS by default. Completely standalone: it does **not** call `backend/` and shares nothing with
`frontend/`. Being a different framework (Astro vs React) is irrelevant — the two never load
in the same page. See `marketing-site/CLAUDE.md`, `WORKFLOW.md`, and `TOKENS.md` for the full
design-system and build conventions.

```bash
cd marketing-site
npm ci                  # Node >= 22.12.0
npm run dev             # astro dev server
npm run build           # -> marketing-site/dist/  (6 pages)
npm run verify          # check + lint + format + build + a11y/visual tests
```

## How the three fit together

- The **backend** is the single source of data (LMS + CMS). Anything with dynamic content
  calls its `/api/*` routes.
- The **frontend** LMS app is the authenticated product UI, consuming the backend API.
- The **marketing-site** is the public brochure site. It is static today; if/when it needs
  dynamic content (e.g. CMS-driven articles), it would fetch from the backend's public API at
  build time or via a small island — but that integration is not wired up yet.

## Notes

- Each project has its own `package.json` / lockfile — run `install`/`build` inside each
  directory, not at the repo root.
- `marketing-site/.github/workflows/*.yml` do **not** run as CI here; GitHub only executes
  workflows from the repo-root `.github/`. Move/adapt them to root if those gates are wanted.
- `marketing-site/astro.config.mjs` has no `base` set — fine standalone; set a `base` if the
  site is served under a path prefix alongside the app.
