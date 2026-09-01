/**
 * FAQs — the build-time client for the CMS behind Home's FAQ accordion.
 *
 * Authored through the admin dashboard's `AdminFaq` screen; served by
 * `backend/routes/faq.routes.js` → `controllers/faqController.js`. Transport, base URL and
 * failure policy live in `@lib/cms`.
 *
 * ## The endpoint this consumes
 *
 *   GET /api/faqs/all  → Faq[] — a BARE ARRAY, not `{ faqs: [...] }`. Filtered to
 *                        `status: "published"` server-side and ordered
 *                        `category ASC, order ASC, createdAt DESC`.
 *
 * ## Why this module does not re-sort
 *
 * Tempting, because Home renders one flat ungrouped list and `category` is invisible in it —
 * so the server's category-first sort looks like it's overriding the `order` the editor set.
 * Re-sorting by `order` alone is worse: with two categories it interleaves them
 * (General·0, Payments·0, General·1, …) and scatters related questions down the list. The
 * server's ordering keeps same-category questions adjacent and `order` still decides the
 * sequence within each, which is the right reading order for a flat accordion. So the response
 * order IS the display order. If the design ever grows visible category headings, this is where
 * the grouping would happen.
 *
 * ## Fields the API returns that the design has no slot for
 *
 * `category` is a real column with a real input in the dashboard, but Figma node 5891:4663's
 * FAQ block is a flat `<details>` list with no headings, chips or filter. It is deliberately
 * absent from `Faq` below rather than carried unused — same reasoning as `@lib/staff` and
 * `bio`/`socials`: exact-replica-first (CLAUDE.md #1) means the design decides what renders,
 * and a typed-but-unrendered field invites someone to "just add" a treatment nobody signed off.
 * It still does useful work server-side as the primary sort key (above).
 *
 * ## How many render
 *
 * All of them. Unlike Home's Core Team row — which `.slice(0, 4)`s because node 5891:4663
 * draws a single fixed row of four cards and a fifth would break the grid — the accordion is a
 * vertical stack of collapsed rows that grows without any layout consequence. So "how many
 * questions Home answers" stays an editorial call made in the dashboard rather than a number
 * hard-coded here. Worth knowing it is unbounded: a very long list will outrun the sticky intro
 * column beside it, which is a design question for the client, not a reason to truncate their
 * content silently.
 */

import { fetchJson } from '@lib/cms';

/** A question exactly as Home's accordion consumes it. */
export interface Faq {
  id: number;
  question: string;
  answer: string;
}

/** `faq.routes.js` is mounted at this path (`index.js`: `app.use("/api/faqs/all", …)`). */
const BASE = '/api/faqs/all';

function normalise(raw: Record<string, unknown>): Faq {
  return {
    id: Number(raw.id),
    question: String(raw.question ?? ''),
    answer: String(raw.answer ?? ''),
  };
}

/**
 * Every published FAQ, in the API's own display order.
 *
 * Unpaginated by design — the controller returns the full published set in one response.
 *
 * Entries missing either half are dropped. A `<details>` whose `<summary>` is empty renders as
 * a bare toggle arrow with no accessible name, and one with a question but no answer opens onto
 * nothing; both are worse than the row simply not being there. The model marks both columns
 * `allowNull: false`, so this only fires on whitespace-only input.
 */
export async function getFaqs(): Promise<Faq[]> {
  const res = await fetchJson<Record<string, unknown>[]>(BASE);
  if (!res) return FIXTURES;
  if (!Array.isArray(res)) return [];
  return res
    .map(normalise)
    .filter((f) => f.question.trim().length > 0 && f.answer.trim().length > 0);
}

/* ────────────────────────────────────────────────────────────────────────────────
 * Fixtures — used ONLY when GIEVA_API_URL is unset.
 *
 * Deliberately the SAME four questions Home shipped before this integration, verbatim from
 * Figma node 5891:4663. As with `@lib/staff`, that is the point: a fixture-backed build renders
 * Home byte-identically to the pre-integration page, so the existing CI visual baselines stay
 * valid and any diff that does appear is a real regression rather than a content swap.
 * ──────────────────────────────────────────────────────────────────────────────── */

const FIXTURES: Faq[] = [
  {
    id: 9300,
    question: 'How long does the registration process take?',
    answer:
      'Most registrations are completed within 24–48 hours of your initial consultation and payment. Urgent registrations can often be processed the same day if test slots are available.',
  },
  {
    id: 9301,
    question: 'What documents do I need to bring?',
    answer:
      "You'll need a valid international passport (or national ID for some tests), your O-Level results, and proof of payment. Our counselors will confirm the exact requirements for your specific test.",
  },
  {
    id: 9302,
    question: 'Do you offer test preparation alongside registration?',
    answer:
      'Yes! Our Premium and Elite packages include access to prep materials, mock tests, and one-on-one tutoring sessions. We also partner with certified tutors for more intensive preparation.',
  },
  {
    id: 9303,
    question: 'Is my payment secure?',
    answer:
      "All payments are processed through Paystack, Nigeria's leading and most trusted payment gateway. Official receipts are issued for every transaction.",
  },
];
