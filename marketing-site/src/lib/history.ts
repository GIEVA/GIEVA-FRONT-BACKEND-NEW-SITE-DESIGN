/**
 * History — the build-time client for the CMS behind `/about`'s "Our Story" block.
 *
 * Authored through the admin dashboard's `HistoryAdminForm` screen; served by
 * `backend/routes/history.routes.js` → `controllers/historyController.js`. Transport, base URL
 * and failure policy live in `@lib/cms`.
 *
 * ## The endpoint this consumes
 *
 *   GET /api/gieva/history/our-history  → ONE HistoryPage row (a bare object, not
 *                                         `{ history: … }`), the lowest-`id` row with
 *                                         `status: "published"`. **404s when none is
 *                                         published** — see `emptyOn404` in `@lib/cms`.
 *
 * ## Why only two of its fields are read — read this before adding a third
 *
 * `HistoryPage` does not model `/about`. It models a standalone "Our History" page, and the
 * client's own React app renders it as exactly that at `/history`
 * (`frontend/src/pages/history/History.jsx`): hero + breadcrumb, an intro column beside a
 * sidebar card, then a year-by-year timeline. Our marketing site has no such route, and no such
 * Figma frame exists — the file's only nodes named "History" belong to an unrelated design
 * sharing that workspace (checked 2026-08-15).
 *
 * Against `/about` (node 8181:8314 — photo hero, "Our Story", Vision/Mision, Core Values) the
 * model lines up like this:
 *
 *   introTitle          → "Our Story" heading                    ✅ consumed
 *   introParagraphs[]   → the story paragraphs                   ✅ consumed
 *   heroTitle           → h1, but defaults to "Our History"      ❌ see below
 *   heroBreadcrumb      → the design has no breadcrumb anywhere  ❌
 *   introEyebrow        → "Our Story" carries no eyebrow         ❌
 *   sidebar* (6 fields) → Our Story is one centred column        ❌
 *   timeline[]          → nothing on /about is a timeline        ❌
 *
 * and in the other direction the page's four stat tiles, Vision/Mision and five Core Values
 * have no source field at all, so they stay hard-coded in `about.astro`.
 *
 * `heroTitle` is the trap worth naming: it looks bindable to the h1, but it is `allowNull:
 * false, defaultValue: "Our History"`, so wiring it would silently retitle `/about`'s hero from
 * "Who We Are" to "Our History" the first time anyone saves the form. The h1 stays hard-coded.
 *
 * Consuming only the overlap was the explicit call (2026-08-15) over building the `/about/history`
 * route the model is actually shaped for. The cost is accepted, not overlooked: **the timeline's
 * six entries and the sidebar remain unpublished**, and nothing on the marketing site surfaces
 * them. If that page ever gets commissioned, this module is where the rest of the row is already
 * waiting — widen `HistoryIntro` and the interface is the whole diff.
 *
 * ## Two knock-on effects on `/about`
 *
 * 1. **Paragraph count is now editorial.** The design draws two; the CMS's current content has
 *    four. `/about` renders however many are published rather than slicing to two — truncating
 *    would silently drop copy the client wrote.
 * 2. **The bold lead run is re-applied, not stored** — see `splitLeadBold`.
 */

import { fetchJson } from '@lib/cms';

/** The slice of `HistoryPage` that `/about`'s Our Story block actually renders. */
export interface HistoryIntro {
  title: string;
  paragraphs: string[];
}

/** `history.routes.js` is mounted at this path, and declares `/our-history` beneath it. */
const BASE = '/api/gieva/history/our-history';

/**
 * The published history intro, or the design's own copy when there is none.
 *
 * Both "no `GIEVA_API_URL`" and "configured, but nothing published yet" resolve to `FIXTURE`.
 * That collapse is deliberate: Our Story is a core section of a signed-off page, so the one
 * outcome that must never happen is `/about` rendering a heading above nothing. A fresh CMS
 * with no published row is an ordinary editorial state, not a broken build — unlike a 500 or a
 * DNS failure, which still throw and fail the build per `@lib/cms`.
 *
 * A published row with an empty `introParagraphs` array falls back too, for the same reason: an
 * editor clearing every paragraph is far more likely to be mid-edit than to mean "Our Story
 * should be a bare heading".
 */
export async function getHistoryIntro(): Promise<HistoryIntro> {
  const res = await fetchJson<Record<string, unknown>>(BASE, {}, { emptyOn404: true });
  if (!res) return FIXTURE;

  const paragraphs = Array.isArray(res.introParagraphs)
    ? res.introParagraphs.map((p) => String(p ?? '')).filter((p) => p.trim().length > 0)
    : [];
  if (paragraphs.length === 0) return FIXTURE;

  return {
    title: String(res.introTitle ?? '').trim() || FIXTURE.title,
    paragraphs,
  };
}

/**
 * The organisation's full name, bolded where it opens the story — confirmed as a real design
 * decision, not a guess: node 8183:8839's `characterStyleOverrides` marks exactly these 58
 * characters bold (see `about.astro`'s header).
 */
const LEAD_BOLD = 'Global Integrated Education Volunteers Association (GIEVA)';

/**
 * Split a paragraph into its bold lead run and the rest.
 *
 * `introParagraphs` is `DataTypes.JSON` holding plain strings — there is no rich text and no
 * per-run styling, so the design's bold opener cannot survive a round trip through the CMS.
 * Rather than lose it (a visible regression on a signed-off page) it is re-applied here, and
 * only when the paragraph genuinely starts with the organisation's name.
 *
 * The degradation is the point: an editor who rewrites that opening sentence gets plain text
 * instead of a bold run landing on the wrong words. Prefix-matching one known constant is
 * narrow enough to be predictable and wrong-in-the-safe-direction.
 *
 * The real fix is on the backend — either rich text for `introParagraphs` or an explicit
 * `introLeadBold` column — and is logged in docs/backend-api-requests.md. When it lands, this
 * function and its constant are the whole diff.
 */
export function splitLeadBold(paragraph: string): { bold: string | null; rest: string } {
  return paragraph.startsWith(LEAD_BOLD)
    ? { bold: LEAD_BOLD, rest: paragraph.slice(LEAD_BOLD.length) }
    : { bold: null, rest: paragraph };
}

/* ────────────────────────────────────────────────────────────────────────────────
 * Fixture — used when GIEVA_API_URL is unset, and when nothing is published.
 *
 * Deliberately the SAME heading and two paragraphs `/about` shipped before this integration,
 * verbatim from Figma node 8181:8314 — including the "registered in 2006" / "born in January
 * 2007" wording, which differs from the CMS's live copy ("registered … in August 2006"). The
 * design's text is what the client signed off, so it is what a fixture build renders: byte-
 * identical to the pre-integration page, existing CI visual baselines stay valid, and any diff
 * that appears is a real regression rather than a content swap.
 *
 * Paragraph 1 is stored joined, exactly as the CMS delivers it — `splitLeadBold` re-derives the
 * bold run, so the fixture path and the live path go through identical rendering code.
 * ──────────────────────────────────────────────────────────────────────────────── */

const FIXTURE: HistoryIntro = {
  title: 'Our Story',
  paragraphs: [
    `${LEAD_BOLD} was registered in 2006 as a nonprofit organization to improve access to quality education and global learning opportunities among young Nigerians. Over the years, GIEVA has grown to serve over 1,000 young Nigerians annually, with a strong focus on inclusive education, digital empowerment, and youth development.`,
    'The concept for the Global Integrated Education Volunteers Association emerged in 2005, and the organization was born in January 2007. The Birth of the organization was a result of the critical need to empower the present and future generation of global youth for sustainable development.',
  ],
};
