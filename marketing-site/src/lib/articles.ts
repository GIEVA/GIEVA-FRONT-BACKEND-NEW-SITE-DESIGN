/**
 * Articles — the build-time client for the CMS behind `/resources` and `/ngo/resources`.
 *
 * The article store lives in the handoff repo's Express/Sequelize backend
 * (`GIEVA/gieva-front-backend-new-site-design`, `backend/`), authored through its React admin
 * dashboard (`AdminArticles` / `CreateArticle` / `EditArticle`). This module is the only place
 * that knows the API exists; pages consume the exported types and functions.
 *
 * ## Why this runs at build time, not in the browser
 *
 * The site is `output: 'static'` with a zero-JS baseline (CLAUDE.md #3). Fetching here means
 * every article ships as real HTML: indexed by Pagefind for free (so site search covers post
 * bodies), fully server-rendered for SEO — which matters more for blog content than for any
 * other page — and readable with JS off. The cost is that publishing needs a rebuild, so the
 * admin dashboard has to fire a deploy webhook on publish. That is a deliberate trade, made
 * with the client 2026-08-11; the alternative (SSR) would have required a Node host, dropped
 * the blog out of Pagefind, and made the a11y/visual CI gates depend on live database content.
 *
 * ## The public endpoints this consumes
 *
 * Mounted at `/api/public` (`backend/routes/publicArticleRoutes.js`):
 *
 *   GET /articles                  page, limit, category, tag, search, featured → {total,
 *                                  currentPage, totalPages, articles[]}. EXCLUDES `content`.
 *   GET /articles/slug/:slug       → {article} including `content` and `author`
 *   GET /articles/featured         max 6, ordered by featuredOrder
 *   GET /articles/trending         —
 *   GET /articles/:id/related      max 4, matched on category or first tag
 *
 * ⚠ `GET /articles/slug/:slug` **increments and saves `views`** on every request. We call it
 * once per article per build, so every build inflates the view counts — and so does every
 * crawler and link prefetch, independent of us. Raised with the backend dev 2026-08-11: the
 * fix is a separate `POST /articles/:id/view`, since a GET should not mutate. Until then,
 * treat `views` as unreliable and do not surface it in the UI.
 *
 * ## Brand filtering — one pool, two sites
 *
 * Both brands draw from a single article store; each site shows its own slice. `category` is
 * NOT the discriminator, even though it looks like the obvious one: `getRelatedArticles`
 * matches on it to find related posts, so overloading it would silently turn "related
 * articles" into "articles from the same brand" and leave a real topic taxonomy nowhere to
 * live. So the brand rides on `tags` and `category` stays the topic.
 *
 * This is the one assumption in this file awaiting confirmation. `tags` is a JSON column
 * matched with `LIKE '%ngo%'`, so it is fuzzy — a tag like `ngo-partnerships` also matches
 * `ngo`. The clean fix is an explicit `site` enum column on the Article model plus a dropdown
 * in `CreateArticle.jsx`; it was requested, and if it lands, `BRAND_QUERY` below is the single
 * place that changes.
 */

/** Which site an article belongs to. Mirrors `data-brand`. */
export type Brand = 'consultancy' | 'ngo';

/**
 * How each brand's slice is selected from the shared pool. The ONLY place brand→query mapping
 * lives — swap these for `{ site: 'ngo' }` if the backend gains a real `site` column.
 */
const BRAND_QUERY: Record<Brand, Record<string, string>> = {
  consultancy: { tag: 'consultancy' },
  ngo: { tag: 'ngo' },
};

/** An article as the list endpoints return it — no `content`. */
export interface ArticleSummary {
  id: number;
  title: string;
  subtitle: string | null;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  category: string | null;
  tags: string[];
  readingTime: string | null;
  isFeatured: boolean;
  isPinned: boolean;
  publishedAt: string | null;
  author: { id: number; fullName: string | null } | null;
}

/** A single article, with its Tiptap body and SEO fields. */
export interface Article extends ArticleSummary {
  /** Tiptap-authored HTML. NEVER render this raw — see @lib/article-html. */
  content: string;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
}

interface ListResponse {
  total: number;
  currentPage: number;
  totalPages: number;
  articles: ArticleSummary[];
}

/**
 * Base URL of the API, e.g. `https://api.gieva.org`. Unset means "no backend reachable from
 * this build" — see `fetchJson`.
 */
const API_URL = import.meta.env.GIEVA_API_URL as string | undefined;

/** True when the build has no API to talk to and is running on fixtures. */
export const usingFixtures = !API_URL;

/**
 * `tags` and `seoKeywords` are JSON columns. Sequelize hands back a parsed array on MySQL/
 * Postgres JSON columns, but a TEXT-backed JSON column (or an older driver) yields the raw
 * string instead, and a null column yields null. Normalise all three shapes so callers can
 * rely on an array.
 */
function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((v): v is string => typeof v === 'string')
        : [];
    } catch {
      // Not JSON — treat a bare string as a single tag rather than dropping it.
      return [value];
    }
  }
  return [];
}

function normaliseSummary(raw: Record<string, unknown>): ArticleSummary {
  const author = raw.author as Record<string, unknown> | null | undefined;
  return {
    id: Number(raw.id),
    title: String(raw.title ?? ''),
    subtitle: (raw.subtitle as string) ?? null,
    slug: String(raw.slug ?? ''),
    excerpt: (raw.excerpt as string) ?? null,
    coverImageUrl: (raw.coverImageUrl as string) ?? null,
    category: (raw.category as string) ?? null,
    tags: toStringArray(raw.tags),
    readingTime: (raw.readingTime as string) ?? null,
    isFeatured: Boolean(raw.isFeatured),
    isPinned: Boolean(raw.isPinned),
    publishedAt: (raw.publishedAt as string) ?? null,
    author: author
      ? { id: Number(author.id), fullName: (author.fullName as string) ?? null }
      : null,
  };
}

function normaliseArticle(raw: Record<string, unknown>): Article {
  return {
    ...normaliseSummary(raw),
    content: String(raw.content ?? ''),
    seoTitle: (raw.seoTitle as string) ?? null,
    seoDescription: (raw.seoDescription as string) ?? null,
    seoKeywords: toStringArray(raw.seoKeywords),
  };
}

/**
 * GET a JSON path under `/api/public`.
 *
 * Failure policy is deliberately split:
 *
 *   - **No `GIEVA_API_URL` at all** → return null and let the caller fall back to fixtures.
 *     A dev machine, and this repo's CI, have no backend; the site still has to build so the
 *     design can be reviewed and the a11y/visual gates can run against stable content.
 *   - **URL set but the request fails** → throw, failing the build. A configured build that
 *     silently shipped an empty Resources index would be far worse than a red build: the
 *     pages would 200 with nothing on them and nobody would notice.
 */
async function fetchJson<T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T | null> {
  if (!API_URL) return null;

  const url = new URL(`${API_URL.replace(/\/$/, '')}/api/public${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(
      `Articles API ${res.status} ${res.statusText} for ${url.pathname}${url.search}. ` +
        `Set GIEVA_API_URL to a reachable backend, or unset it to build against fixtures.`,
    );
  }
  return (await res.json()) as T;
}

/**
 * Every published article for a brand, newest first (the API's own ordering: pinned, then
 * featuredOrder, then publishedAt desc).
 *
 * Walks the paginated endpoint to completion rather than guessing a ceiling — a static build
 * needs the whole set, and a `limit=1000` would quietly truncate the day the client's archive
 * outgrows it. Capped at 50 pages purely so a misbehaving API can't loop forever.
 */
export async function getArticles(brand: Brand): Promise<ArticleSummary[]> {
  const first = await fetchJson<ListResponse>('/articles', {
    ...BRAND_QUERY[brand],
    page: '1',
    limit: '50',
  });
  if (!first) return fixtureSummaries(brand);

  const all = first.articles.map((a) =>
    normaliseSummary(a as unknown as Record<string, unknown>),
  );
  const pages = Math.min(first.totalPages ?? 1, 50);
  for (let page = 2; page <= pages; page++) {
    const next = await fetchJson<ListResponse>('/articles', {
      ...BRAND_QUERY[brand],
      page: String(page),
      limit: '50',
    });
    if (!next) break;
    all.push(
      ...next.articles.map((a) => normaliseSummary(a as unknown as Record<string, unknown>)),
    );
  }
  return all;
}

/** One article by slug, with its body. Null when the slug isn't a published article. */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const res = await fetchJson<{ article: Record<string, unknown> }>(
    `/articles/slug/${encodeURIComponent(slug)}`,
  );
  if (!res) return fixtureArticle(slug);
  return res.article ? normaliseArticle(res.article) : null;
}

/**
 * Up to `limit` other articles to read next, for the foot of an article page.
 *
 * Deliberately NOT the API's `/articles/:id/related`: that endpoint matches on category or
 * first tag with no brand constraint, so on a shared pool it will happily surface Consultancy
 * posts under an NGO article. Same-brand siblings are computed here instead, preferring a
 * category match and topping up with the newest, so the row is always full.
 */
export function relatedArticles(
  all: ArticleSummary[],
  current: ArticleSummary,
  limit = 3,
): ArticleSummary[] {
  const others = all.filter((a) => a.slug !== current.slug);
  const sameCategory = others.filter(
    (a) => a.category && current.category && a.category === current.category,
  );
  const rest = others.filter((a) => !sameCategory.includes(a));
  return [...sameCategory, ...rest].slice(0, limit);
}

/** Distinct categories present in a brand's articles, for the listing page's filter row. */
export function categoriesOf(articles: ArticleSummary[]): string[] {
  return [
    ...new Set(articles.map((a) => a.category).filter((c): c is string => Boolean(c))),
  ].sort((a, b) => a.localeCompare(b));
}

/**
 * Long-form date, e.g. "17th October 2025" — the format the design's news cards use (node
 * 5990:3672), ordinal suffix and all, which `Intl.DateTimeFormat` cannot produce on its own.
 */
export function formatArticleDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const day = d.getUTCDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? 'st'
      : day % 10 === 2 && day !== 12
        ? 'nd'
        : day % 10 === 3 && day !== 13
          ? 'rd'
          : 'th';
  const month = new Intl.DateTimeFormat('en-GB', { month: 'long', timeZone: 'UTC' }).format(d);
  return `${day}${suffix} ${month} ${d.getUTCFullYear()}`;
}

/* ────────────────────────────────────────────────────────────────────────────────
 * Fixtures — used ONLY when GIEVA_API_URL is unset.
 *
 * Not sample content for its own sake: they keep `npm run dev`, `npm run build` and the CI
 * gates working on a machine with no backend, and they give the visual-regression baselines
 * something deterministic to photograph. Two per brand is enough to exercise the listing grid,
 * the empty-ish state and the related row without pretending to be a real archive.
 * ──────────────────────────────────────────────────────────────────────────────── */

const FIXTURES: Record<Brand, Article[]> = {
  ngo: [
    {
      id: 9001,
      title: 'STEP cohort four graduates in Jos',
      subtitle: 'Ninety-two young Nigerians complete the leadership track',
      slug: 'step-cohort-four-graduates',
      excerpt:
        'The fourth Strategic Transformative Education Program cohort closed in Jos this month, with ninety-two participants completing the full leadership track.',
      coverImageUrl: null,
      category: 'Programs',
      tags: ['ngo', 'step'],
      readingTime: '4 min read',
      isFeatured: true,
      isPinned: false,
      publishedAt: '2025-10-17T09:00:00.000Z',
      author: { id: 1, fullName: 'GIEVA Communications' },
      content:
        '<p>Placeholder body for local builds. Real article content comes from the CMS.</p>' +
        '<h2>What the cohort covered</h2><p>Twelve weeks of facilitation, split between classroom sessions and community placements.</p>' +
        '<h2>What comes next</h2><p>Cohort five opens for applications in the new year.</p>',
      seoTitle: null,
      seoDescription: null,
      seoKeywords: [],
    },
    {
      id: 9002,
      title: 'Why digital access is an education problem',
      subtitle: null,
      slug: 'digital-access-is-an-education-problem',
      excerpt:
        'Connectivity is not a separate agenda from learning outcomes. A look at what the last three years of GVP placements taught us.',
      coverImageUrl: null,
      category: 'Insights',
      tags: ['ngo', 'digital'],
      readingTime: '6 min read',
      isFeatured: false,
      isPinned: false,
      publishedAt: '2025-09-02T09:00:00.000Z',
      author: { id: 1, fullName: 'GIEVA Communications' },
      content:
        '<p>Placeholder body for local builds. Real article content comes from the CMS.</p>' +
        '<h2>The pattern in the placements</h2><p>Across three years, the constraint was rarely curriculum.</p>',
      seoTitle: null,
      seoDescription: null,
      seoKeywords: [],
    },
    {
      /* Third NGO fixture exists for a layout reason, not a content one: NGO Home's news row is
         a three-card grid in the design (node 5990:3672), so a fixture-backed build needs three
         NGO articles to render that row as designed and to give it a stable visual baseline. */
      id: 9003,
      title: 'Partnership with the University of Jos enters its fourth year',
      subtitle: null,
      slug: 'unijos-partnership-fourth-year',
      excerpt:
        'The research partnership behind several of our social-impact projects renews for another year.',
      coverImageUrl: null,
      category: 'Partnerships',
      tags: ['ngo', 'partnerships'],
      readingTime: '3 min read',
      isFeatured: false,
      isPinned: false,
      publishedAt: '2025-08-19T09:00:00.000Z',
      author: { id: 1, fullName: 'GIEVA Communications' },
      content:
        '<p>Placeholder body for local builds. Real article content comes from the CMS.</p>' +
        '<h2>What the partnership covers</h2><p>Joint research capacity and student placements.</p>',
      seoTitle: null,
      seoDescription: null,
      seoKeywords: [],
    },
  ],
  consultancy: [
    {
      id: 9101,
      title: 'SAT registration: what changed this cycle',
      subtitle: 'Dates, device rules and ID requirements for the new season',
      slug: 'sat-registration-what-changed',
      excerpt:
        'A short guide to the registration changes that affect Nigerian candidates this cycle, and what to prepare before the window opens.',
      coverImageUrl: null,
      category: 'Test Prep',
      tags: ['consultancy', 'sat'],
      readingTime: '5 min read',
      isFeatured: true,
      isPinned: false,
      publishedAt: '2025-11-04T09:00:00.000Z',
      author: { id: 1, fullName: 'GIEVA Advising' },
      content:
        '<p>Placeholder body for local builds. Real article content comes from the CMS.</p>' +
        '<h2>Before the window opens</h2><p>Have your identification and device details settled early.</p>',
      seoTitle: null,
      seoDescription: null,
      seoKeywords: [],
    },
  ],
};

/**
 * Fixture articles as the list endpoint would return them — i.e. without `content` or the SEO
 * fields, so a page that forgets to fetch the body can't accidentally work on fixtures and then
 * break against the real API. Listed field by field rather than destructured-with-rest: the
 * rest-spread form needs four never-read bindings, which is a lint error, and naming the fields
 * also means adding one to `ArticleSummary` fails here until it's mapped.
 */
function fixtureSummaries(brand: Brand): ArticleSummary[] {
  return FIXTURES[brand].map((a) => ({
    id: a.id,
    title: a.title,
    subtitle: a.subtitle,
    slug: a.slug,
    excerpt: a.excerpt,
    coverImageUrl: a.coverImageUrl,
    category: a.category,
    tags: a.tags,
    readingTime: a.readingTime,
    isFeatured: a.isFeatured,
    isPinned: a.isPinned,
    publishedAt: a.publishedAt,
    author: a.author,
  }));
}

function fixtureArticle(slug: string): Article | null {
  const all = [...FIXTURES.ngo, ...FIXTURES.consultancy];
  return all.find((a) => a.slug === slug) ?? null;
}
