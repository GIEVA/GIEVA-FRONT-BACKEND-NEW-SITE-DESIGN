/**
 * CMS transport — the one place that knows the backend exists as an HTTP service.
 *
 * The content store lives in the handoff repo's Express/Sequelize backend
 * (`GIEVA/gieva-front-backend-new-site-design`, `backend/`), authored through its React admin
 * dashboard. Each content type gets its own module (`@lib/articles`, `@lib/staff`, …) which owns
 * its endpoints, its types and its fixtures; this file owns only the base URL and the failure
 * policy those modules share.
 *
 * Extracted from `@lib/articles` when `@lib/staff` became the second consumer. The failure
 * policy below is the part that must not be re-decided per module — a second copy would drift,
 * and the whole point is that a misconfigured build fails the same way everywhere.
 *
 * ## Why every consumer runs at build time
 *
 * The site is `output: 'static'` with a zero-JS baseline (CLAUDE.md #3). Fetching at build time
 * means CMS content ships as real HTML: indexed by Pagefind, server-rendered for SEO, readable
 * with JS off. The cost is that publishing needs a rebuild, so the admin dashboard has to fire a
 * deploy webhook on publish — see docs/backend-api-requests.md. That is a deliberate trade, made
 * with the client 2026-08-11.
 */

/**
 * Base URL of the API, e.g. `https://api.gieva.org`. Unset means "no backend reachable from this
 * build" — see `fetchJson`.
 */
const API_URL = import.meta.env.GIEVA_API_URL as string | undefined;

/** True when the build has no API to talk to and every module is serving fixtures. */
export const usingFixtures = !API_URL;

/**
 * GET a JSON path on the API. `path` is the full server path including its `/api` prefix, since
 * the backend mounts each content type under a different one (`/api/public/articles`,
 * `/api/staff/all`, `/api/faqs/all` …) with no shared root beyond `/api` itself.
 *
 * Failure policy is deliberately split:
 *
 *   - **No `GIEVA_API_URL` at all** → return null and let the caller fall back to fixtures.
 *     A dev machine, and this repo's CI, have no backend; the site still has to build so the
 *     design can be reviewed and the a11y/visual gates can run against stable content.
 *   - **URL set but the request fails** → throw, failing the build. A configured build that
 *     silently shipped an empty Resources index or an empty team grid would be far worse than a
 *     red build: the pages would 200 with nothing on them and nobody would notice.
 *
 * Note the asymmetry with an empty-but-successful response: that's a content state, not a
 * transport failure, and each page decides for itself what to render for it.
 *
 * `emptyOn404` extends that same asymmetry to endpoints that signal "nothing published yet"
 * with a 404 rather than an empty body. `GET /api/gieva/history/our-history` is the one such
 * endpoint today: it serves a single singleton row and 404s when no row has `status:
 * "published"`, which is an editorial state a fresh CMS is legitimately in — not a broken
 * deployment. Callers that opt in get `null` and fall back to their fixtures, exactly as they
 * would with no `GIEVA_API_URL`. Every other status still throws, and so does a 404 for
 * callers that don't opt in — a missing `/api/staff/all` really is a broken deployment.
 */
export async function fetchJson<T>(
  path: string,
  params: Record<string, string> = {},
  { emptyOn404 = false }: { emptyOn404?: boolean } = {},
): Promise<T | null> {
  if (!API_URL) return null;

  const url = new URL(`${API_URL.replace(/\/$/, '')}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (res.status === 404 && emptyOn404) return null;
  if (!res.ok) {
    throw new Error(
      `CMS API ${res.status} ${res.statusText} for ${url.pathname}${url.search}. ` +
        `Set GIEVA_API_URL to a reachable backend, or unset it to build against fixtures.`,
    );
  }
  return (await res.json()) as T;
}

/**
 * Absolute URL for a `<form action>` that posts to the API **from the browser**, or `undefined`
 * when no backend is configured.
 *
 * The one exception to "every consumer runs at build time" above. A form submission is a live
 * user action, so it cannot be resolved when the page is built — all the build can do is bake
 * the right URL into the markup. That still keeps the zero-JS baseline: a native form POST is a
 * top-level navigation, the browser performs it with no script involved, and the API replies
 * `303 See Other` to a static page we ship. No island, no fetch, no CORS (a form post is not
 * subject to it — see docs/backend-api-requests.md #7).
 *
 * `undefined` is meaningful, not a fallback: with no `GIEVA_API_URL` the caller must render the
 * form WITHOUT an action rather than defaulting to something. A form whose action points at a
 * host that isn't there would fail in the visitor's face; one with no action reloads the page,
 * which is the honest degradation this site already shipped.
 */
export function formAction(path: string): string | undefined {
  return API_URL ? `${API_URL.replace(/\/$/, '')}${path}` : undefined;
}
