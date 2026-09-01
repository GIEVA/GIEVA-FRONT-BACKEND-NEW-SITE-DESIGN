/**
 * Programs — the build-time client for the CMS behind NGO Home's 2×2 programme grid and
 * `/ngo/program`'s detail sections.
 *
 * Authored through the admin dashboard's `AdminPrograms` screen; served by
 * `backend/routes/program.routes.js` → `controllers/program.controller.js`. Transport, base URL
 * and failure policy live in `@lib/cms`.
 *
 * ## The endpoint this consumes
 *
 *   GET /api/programs/all        → Program[] — a BARE ARRAY, not `{ programs: [...] }`. Filtered
 *                                  to `status: "published"` and ordered `order ASC,
 *                                  createdAt DESC` server-side, so the response order is the
 *                                  display order and this module does not re-sort.
 *   GET /api/programs/all/:slug  → one programme. Unused: our design has no per-programme page.
 *                                  It is what a `/ngo/program/[slug]` route would call if the
 *                                  client ever commissions one — see `sections` below.
 *
 * ## The field mapping
 *
 *   title        → Home's card title, and `/ngo/program`'s section heading   ✅ consumed
 *   tagline      → Home's card blurb                                        ✅ consumed
 *   description  → `/ngo/program`'s body paragraph                          ✅ consumed
 *   slug         → the `#anchor` tying a Home card to its detail section     ✅ consumed
 *   heroImageUrl → the detail section's photo                               ✅ consumed
 *   order/status → consumed server-side (the sort and the filter), so never read here
 *   sections     → nothing in either frame renders sub-sections             ❌ see below
 *   category     → no chip, filter or grouping exists on either page        ❌
 *   heroImageCloudinaryId, createdBy → delivery/audit fields, not content   ❌
 *
 * `sections` is the one worth naming, because it is where most of the dashboard's Programs form
 * actually goes: `AdminPrograms.jsx` calls it "Sub-sections / Clubs" and stores an array of
 * `{ id, name, description, imageUrl }` (its own placeholder text suggests "STEM Club", "WASH
 * Club"). Neither NGO frame draws anything of the kind — Home's card is a title, a rule, one
 * blurb and a link (node 7403:5261), and a detail section is a photo beside a heading, one
 * paragraph and a button (node 7463:5838). So it is deliberately absent from the interfaces
 * below rather than carried unused, exactly as `bio`/`socials` are in `@lib/staff` and the
 * timeline is in `@lib/history`: exact-replica-first (CLAUDE.md #1) means the design decides what
 * renders, and a typed-but-unrendered field invites someone to "just add" a treatment nobody
 * signed off. The consequence the client should know about — sub-sections authored in the
 * dashboard surface nowhere on the marketing site — is logged in docs/backend-api-requests.md,
 * together with the per-programme page that would give them a home.
 *
 * ## Two surfaces, two fixture sets — because the design disagrees with itself
 *
 * Home draws FOUR cards (STEP · CHOICES · GVP · PARTNERSHIP PROGRAMS, node 5990:3672);
 * `/ngo/program` details THREE (STEP · HEALS · GVP, node 7447:6027). CHOICES has no section
 * anywhere, and PARTNERSHIP PROGRAMS is titled for partnerships but carries HEALS's expansion as
 * its blurb. That mismatch is the design's own, not a translation slip, and it is an open client
 * question in docs/ngo-build-plan.md.
 *
 * Wiring both surfaces to one CMS list settles it by construction: whatever the client publishes
 * is what both pages show, Home taking the first four (below) and the Programs page detailing all
 * of them. The two sets can no longer drift, and every Home card's `#slug` necessarily has a
 * section to land on.
 *
 * The fixtures cannot be unified the same way, and deliberately are not: their job is to render
 * the pre-integration pages byte-identically so the committed CI baselines stay valid, and those
 * pages carry the design's four and three. So there are two fixture sets, they disagree with each
 * other, and that disagreement is the design's — reproduced, not resolved. Once `GIEVA_API_URL`
 * points at a backend, one list feeds both.
 *
 * ## `title` does double duty, and the CMS has only one of it
 *
 * The design writes a programme's name twice, differently: the Home card shows the bare acronym
 * ("STEP") at display size, while the detail heading spells it out ("Strategic Transformative
 * Education Program (STEP)"). `Program` has one `title` column, so on the CMS path both surfaces
 * show whatever the author typed. Composing the long form from `tagline` + `title` was rejected:
 * `tagline` is the card's blurb here, and the client's own React app already treats these fields
 * this way — `ProgramDetail.jsx` and `OurPrograms.jsx` both render `title` as the heading and
 * `tagline` as a one-line secondary, which is the mapping used below.
 *
 * So `title` should be authored short ("STEP"), as `AdminPrograms.jsx`'s own placeholder
 * ("e.g. CHOICES") suggests, and the detail heading loses the parenthetical expansion the design
 * draws. That is a visible content change on the live-CMS path only, and the fix is a backend
 * one — a second `fullName` column — logged in docs/backend-api-requests.md rather than faked
 * here from a string the author never wrote.
 *
 * ## One pool, one site
 *
 * `Program` has no brand/site column, and programmes are NGO-only today, so every published
 * programme renders on the NGO pages. The same `site`-column ask is already open for `Article`
 * and `Staff`; logged in docs/backend-api-requests.md. `fetchPrograms()` below is the single
 * place a filter would go.
 */

import { fetchJson } from '@lib/cms';

/** One programme as Home's card renders it. */
export interface ProgramSummary {
  id: number;
  /** The acronym, at display size — see the `title` note above. */
  title: string;
  /** The card's one-line blurb. */
  tagline: string;
  /** Its detail section on `/ngo/program`, or that page's root — see `programHref`. */
  href: string;
}

/** One programme as `/ngo/program`'s detail section renders it. */
export interface ProgramDetail {
  id: number;
  /** Doubles as the section's `id`, i.e. the anchor Home's cards target. */
  slug: string;
  title: string;
  description: string;
  /**
   * Cloudinary URL, or null when the programme has no hero image uploaded. Remote, so
   * `astro:assets` cannot process it — see `program.astro` for how it renders and what the
   * fallback is.
   */
  imageUrl: string | null;
}

/** `program.routes.js` is mounted at this path (`index.js`: `app.use("/api/programs/all", …)`). */
const BASE = '/api/programs/all';

/**
 * The design's grid is a fixed 2×2 (node 5990:4340). Home therefore shows the first four
 * programmes rather than however many exist — the same call, for the same reason, as Home's Core
 * Team row slicing `@lib/staff` to four. "Which four" stays an editorial decision made in the
 * dashboard, since the backend orders by the `order` field the form exposes for exactly that, and
 * nothing is lost: every published programme still has its own section on `/ngo/program`, which
 * the NGO masthead links from every page.
 */
const HOME_CARDS = 4;

/** A published programme, in the shape the API delivers it, before either page's projection. */
interface Program {
  id: number;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  heroImageUrl: string | null;
}

function normalise(raw: Record<string, unknown>): Program {
  return {
    id: Number(raw.id),
    title: String(raw.title ?? ''),
    slug: String(raw.slug ?? ''),
    tagline: String(raw.tagline ?? ''),
    description: String(raw.description ?? ''),
    heroImageUrl: (raw.heroImageUrl as string) || null,
  };
}

/**
 * Every published programme, in the API's own display order, or `null` when there is no backend
 * to ask — which is what makes the two fixture sets reachable.
 *
 * Unpaginated by design: the controller returns the full published set in one response, and a
 * programme list is bounded by how many programmes the organisation runs. No page-walking loop
 * like `getArticles`, because there are no pages to walk.
 *
 * Programmes with a blank title are dropped. The title is the card's whole identity and the
 * detail section's accessible name — a nameless one renders as a rule above a blurb on Home, and
 * as an unlabelled photo-and-paragraph row on `/ngo/program`. The model marks `title`
 * `allowNull: false`, so this only fires on whitespace-only input.
 */
async function fetchPrograms(): Promise<Program[] | null> {
  const res = await fetchJson<Record<string, unknown>[]>(BASE);
  if (!res) return null;
  if (!Array.isArray(res)) return [];
  return res.map(normalise).filter((p) => p.title.trim().length > 0);
}

/**
 * Where a Home card points.
 *
 * On the CMS path a slug always resolves: Home's cards are the first four of the same list
 * `/ngo/program` details in full, so the section is always there to scroll to. The slug-less
 * branch exists for the fixtures, where two of the design's four cards (CHOICES and PARTNERSHIP
 * PROGRAMS) have no detail section at all and have always pointed at the Programs page root —
 * a real destination, just not a precise one. `slug` is `allowNull: false, unique` in the model,
 * so real content never takes that branch.
 */
function programHref(slug: string): string {
  return slug ? `/ngo/program#${slug}` : '/ngo/program';
}

/**
 * The programmes Home's grid shows.
 *
 * The card blurb falls back to `description` when `tagline` is empty. The card's copy box is a
 * reserved 71px (node 7403:5273) that the design fills on all four cards, so an empty one reads
 * as a broken card rather than as a deliberately terse one; the intro paragraph is the nearest
 * thing the model has to a summary. It is a fallback, not the mapping — `tagline` is the field
 * sized for this (STRING 255) and the one the dashboard's own placeholder writes a one-liner
 * into.
 */
export async function getHomePrograms(): Promise<ProgramSummary[]> {
  const programs = (await fetchPrograms()) ?? HOME_FIXTURES;
  return programs.slice(0, HOME_CARDS).map((p) => ({
    id: p.id,
    title: p.title,
    tagline: p.tagline || p.description,
    href: programHref(p.slug),
  }));
}

/** The programmes `/ngo/program` details, all of them, in the API's own order. */
export async function getProgramDetails(): Promise<ProgramDetail[]> {
  const programs = (await fetchPrograms()) ?? DETAIL_FIXTURES;
  return programs.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    imageUrl: p.heroImageUrl,
  }));
}

/* ────────────────────────────────────────────────────────────────────────────────
 * Fixtures — used ONLY when GIEVA_API_URL is unset.
 *
 * Deliberately the SAME content both pages shipped before this integration, verbatim from the
 * two Figma nodes. As with `@lib/staff` and `@lib/faqs`, that is the point: a fixture-backed
 * build renders `/ngo` and `/ngo/program` byte-identically to the pre-integration pages, so the
 * existing CI visual baselines stay valid and any diff that does appear is a real regression
 * rather than a content swap.
 *
 * They are held in the API's own row shape and projected through the same functions the live
 * data goes through, so the fixture path exercises `programHref` and both projections rather
 * than sidestepping them.
 *
 * The two sets disagree — four programmes here, three below, and STEP's title written short on
 * Home and long on the detail page. That is the design's own inconsistency, reproduced rather
 * than resolved; see the header.
 * ──────────────────────────────────────────────────────────────────────────────── */

/** Home's four cards (node 5990:3672). `slug: ''` is "no detail section exists" — see `programHref`. */
const HOME_FIXTURES: Program[] = [
  {
    id: 9400,
    title: 'STEP',
    slug: 'step',
    tagline:
      "Strategic Transformative Education Program — leadership pathways for tomorrow's changemakers.",
    description: '',
    heroImageUrl: null,
  },
  {
    id: 9401,
    title: 'CHOICES',
    slug: '',
    tagline:
      'STEM innovation club challenging young minds to create solutions for real-world problems.',
    description: '',
    heroImageUrl: null,
  },
  {
    id: 9402,
    title: 'GVP',
    slug: 'gvp',
    tagline:
      'GIEVA Volunteer Project — connecting young Nigerians with meaningful community service.',
    description: '',
    heroImageUrl: null,
  },
  {
    id: 9403,
    title: 'PARTNERSHIP PROGRAMS',
    slug: '',
    tagline:
      'Holistic Education Advising and Learning Services — personalized coaching and global opportunities.',
    description: '',
    heroImageUrl: null,
  },
];

/**
 * The placeholder paragraph all three detail sections carry verbatim in the design
 * (node 7463:5846) — one string in the frame, one constant here.
 */
const PROGRAM_BLURB =
  'Global Integrated Education Volunteers Association (GIEVA) was registered in 2006 as a nonprofit organization to improve access to quality education and global learning opportunities among young Nigerians. Over the years, GIEVA has grown to serve over 1,000 young Nigerians annually, with a strong focus on inclusive education, digital empowerment, and youth development.';

/** The three detail sections (node 7447:6027), in the frame's own order. */
const DETAIL_FIXTURES: Program[] = [
  {
    id: 9410,
    title: 'Strategic Transformative Education Program (STEP)',
    slug: 'step',
    tagline: '',
    description: PROGRAM_BLURB,
    heroImageUrl: null,
  },
  {
    id: 9411,
    title: 'Holistic Education Advising and Learning Services (HEALS)',
    slug: 'heals',
    tagline: '',
    description: PROGRAM_BLURB,
    heroImageUrl: null,
  },
  {
    id: 9412,
    title: 'The GIEVA Volunteer Project (GVP)',
    slug: 'gvp',
    tagline: '',
    description: PROGRAM_BLURB,
    heroImageUrl: null,
  },
];
