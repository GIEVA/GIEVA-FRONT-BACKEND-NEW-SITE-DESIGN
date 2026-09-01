/**
 * Staff — the build-time client for the CMS behind `/team`'s member grid and Home's Core Team
 * row (the same list, sliced to the design's first four).
 *
 * Authored through the admin dashboard's `AdminStaff` screen; served by
 * `backend/routes/staff.routes.js` → `controllers/staff.controller.js`. Transport, base URL and
 * failure policy live in `@lib/cms`.
 *
 * ## The endpoint this consumes
 *
 *   GET /api/staff/all      → Staff[] — a BARE ARRAY, not `{ staff: [...] }`. Filtered to
 *                             `status: "published"` and ordered `order ASC, createdAt DESC`
 *                             server-side, so the response order is the display order and this
 *                             module does not re-sort.
 *   GET /api/staff/all/:id  → one member. Unused: the design has no member detail page.
 *
 * ## Fields the API returns that the design has no slot for
 *
 * `bio` (TEXT) and `socials` (JSON — `{facebook, linkedin, x, instagram, youtube}`) are real
 * columns with real inputs in `AdminStaff.jsx`, but Figma node 8187:8979's card is a portrait
 * with a name and a role and nothing else — no bio, no icons, no link. They are deliberately
 * absent from `StaffMember` below rather than carried unused: exact-replica-first (CLAUDE.md #1)
 * means the design decides what renders, and a typed-but-unrendered field invites someone to
 * "just add" a treatment that was never signed off. If the client later wants member detail,
 * this is where the data comes from and the interface is where it goes back in.
 *
 * ## One pool, one site
 *
 * `Staff` has no brand/site column, and only Consultancy has a team page today, so every
 * published member renders on `/team`. If NGO ever gets one, the two rosters will need
 * separating — the same `site`-column ask already open for `Article`. Logged in
 * docs/backend-api-requests.md; `getStaff()` is the single place a filter would go.
 */

import { fetchJson } from '@lib/cms';

/** A team member exactly as `/team`'s card consumes them. */
export interface StaffMember {
  id: number;
  name: string;
  role: string;
  /**
   * Cloudinary URL, or null when the member has no photo uploaded. Remote, so `astro:assets`
   * cannot process it — see `TeamCard.astro` for how it renders and what the fallback is.
   */
  imageUrl: string | null;
}

/** `staff.routes.js` is mounted at this path (`index.js`: `app.use("/api/staff/all", …)`). */
const BASE = '/api/staff/all';

function normalise(raw: Record<string, unknown>): StaffMember {
  return {
    id: Number(raw.id),
    name: String(raw.name ?? ''),
    role: String(raw.role ?? ''),
    imageUrl: (raw.imageUrl as string) || null,
  };
}

/**
 * Every published staff member, in the API's own display order.
 *
 * Unpaginated by design — the endpoint returns the full published set in one response, and a
 * team roster is bounded by how many people the organisation employs. No page-walking loop like
 * `getArticles`, because there are no pages to walk.
 *
 * Members with a blank `name` are dropped: the card's entire accessible content is its name and
 * role, so a nameless one renders as an unlabelled photo. Cheaper to skip it than to ship a card
 * nobody can read.
 */
export async function getStaff(): Promise<StaffMember[]> {
  const res = await fetchJson<Record<string, unknown>[]>(BASE);
  if (!res) return FIXTURES;
  if (!Array.isArray(res)) return [];
  return res.map(normalise).filter((m) => m.name.trim().length > 0);
}

/* ────────────────────────────────────────────────────────────────────────────────
 * Fixtures — used ONLY when GIEVA_API_URL is unset.
 *
 * Deliberately the SAME ten placeholder members the page shipped before this integration:
 * "Julie Sande / Director General" ×10, no photo, matching Figma node 8187:8979's ten identical
 * cards (4 + 4 + 2). That is not laziness — it means a fixture-backed build renders `/team`
 * byte-identically to the pre-integration page, so the existing CI visual baselines stay valid
 * and any diff that does appear is a real regression rather than a content swap. Ten also covers
 * Home's Core Team for free: its `.slice(0, 4)` takes the first four, which is exactly the four
 * identical cards node 5891:4663 shows.
 * ──────────────────────────────────────────────────────────────────────────────── */

const FIXTURES: StaffMember[] = Array.from({ length: 10 }, (_, i) => ({
  id: 9200 + i,
  name: 'Julie Sande',
  role: 'Director General',
  imageUrl: null,
}));
